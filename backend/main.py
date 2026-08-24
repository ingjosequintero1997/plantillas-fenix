from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import re
import gzip
import base64
import json
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError
try:
	from .utils import fuzzy_map, normalize_text
	from .templates_registry import get_template_by_key, list_templates_meta
	from .validators import validate_and_correct, to_date_iso
	from .evaluator import evaluate, build_evaluation_excel
except ImportError:
	from utils import fuzzy_map, normalize_text
	from templates_registry import get_template_by_key, list_templates_meta
	from validators import validate_and_correct, to_date_iso
	from evaluator import evaluate, build_evaluation_excel

import os

API_ROOT_PATH = os.environ.get("API_ROOT_PATH", "")
app = FastAPI(title="Validador IPS", root_path=API_ROOT_PATH)

class RevalidatePayload(BaseModel):
	raw_text: str
	mapping: dict[str, str | None]
	template_key: str = "gestante"
	mode: str = "limpiador"

def template_names(template: list[dict]):
	return [t['name'] for t in template]

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth ────────────────────────────────────────────────────────────────
try:
    from .auth_utils import (
        create_token,
        get_current_user,
        hash_password,
        require_admin,
        verify_credentials,
    )
    from .database import init_db as db_init_db, SessionLocal, Prestador, User, Cargue, HistoriaClinica, PrestadorPlantilla, crear_tabla_gestantes
    from . import gcs_storage
except ImportError:
    from auth_utils import (
        create_token,
        get_current_user,
        hash_password,
        require_admin,
        verify_credentials,
    )
    from database import init_db as db_init_db, SessionLocal, Prestador, User, Cargue, HistoriaClinica, PrestadorPlantilla, crear_tabla_gestantes
    import gcs_storage

class LoginPayload(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
async def auth_login(payload: LoginPayload):
    ensure_db_ready()
    user = verify_credentials(payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_token(user)
    return {
        "token": token,
        "user": {"id": user.id, "username": user.username, "name": user.name, "role": user.role},
    }

@app.get("/auth/me")
async def auth_me(current_user: User = Depends(get_current_user)):
    prestador_id = None
    prestador_nombre = None
    try:
        db = SessionLocal()
        try:
            prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
            prestador_id = prestador.id if prestador else None
            prestador_nombre = prestador.nombre if prestador else None
        finally:
            db.close()
    except Exception:
        pass
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "name": current_user.name,
            "role": current_user.role,
            "prestador_id": prestador_id,
            "prestador_nombre": prestador_nombre,
        }
    }


def seed_admin():
    try:
        db = SessionLocal()
        try:
            existing = db.query(User).filter(User.username == "admin").first()
            if existing is None:
                db.add(
                    User(
                        username="admin",
                        password_hash=hash_password("admin123"),
                        name="Administrador",
                        role="admin",
                        active=True,
                    )
                )
                db.commit()
        finally:
            db.close()
    except Exception:
        pass  # Sin BD persistente: se usa el admin de respaldo


_db_ready = False

def ensure_db_ready():
    # Inicializa la BD de forma perezosa (solo al primer login), para no
    # bloquear el cold start de las funciones serverless con la conexión a BD.
    global _db_ready
    if _db_ready:
        return
    try:
        db_init_db()
    except Exception:
        pass
    try:
        seed_admin()
    except Exception:
        pass
    _db_ready = True

@app.get("/health")
async def health():
	return {"status": "ok"}

@app.post("/setup-gestantes")
async def setup_gestantes(current_user: User = Depends(require_admin)):
	"""Crea el esquema public y la tabla gestantes con todos los encabezados."""
	try:
		ncols = crear_tabla_gestantes()
		return {"ok": True, "tabla": "public.gestantes", "columnas": ncols}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"No se pudo crear la tabla: {e}")

@app.get("/debug-oidc")
async def debug_oidc(request: Request):
	token = request.headers.get("x-vercel-oidc-token", "")
	return {
		"oidc_header_present": bool(token),
		"oidc_header_len": len(token),
		"oidc_header_preview": token[:40],
		"all_headers": [h for h in request.headers.keys()],
	}

@app.get("/template")
async def get_template(template_key: str = Query(default="gestante")):
	meta = get_template_by_key(template_key)
	return {
		"template_key": meta["key"],
		"label": meta["label"],
		"template": meta["template"],
	}

@app.get("/templates")
async def get_templates(current_user: User = Depends(get_current_user)):
	all_templates = list_templates_meta()
	if current_user.role == "admin":
		return {"templates": all_templates}
	# Prestador: solo las plantillas que tiene asignadas
	db = SessionLocal()
	try:
		prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
		if prestador is None:
			return {"templates": []}
		assigned = [p.template_key for p in prestador.plantillas]
	except Exception:
		assigned = []
	finally:
		db.close()
	if not assigned:
		return {"templates": []}
	filtered = [t for t in all_templates if t["key"] in assigned]
	return {"templates": filtered}


# ─── Detección automática de plantilla ────────────────────────────────────
def _template_names_of(key: str) -> list[str]:
	try:
		from .templates_registry import TEMPLATE_REGISTRY
	except ImportError:
		from templates_registry import TEMPLATE_REGISTRY
	entry = TEMPLATE_REGISTRY.get(key)
	if not entry:
		return []
	return [t["name"] for t in entry["template_factory"]()]


def union_template_names() -> list[str]:
	names = set()
	for key in ("gestante", "citologia", "mamografia", "penta"):
		for name in _template_names_of(key):
			names.add(name)
	return sorted(names)


def detect_best_template(headers: list[str]) -> tuple[str | None, dict]:
	best_key = None
	best_score = -1.0
	scores: dict[str, float] = {}
	for key in ("gestante", "citologia", "mamografia", "penta"):
		names = _template_names_of(key)
		if not names:
			continue
		row_map = fuzzy_map(headers, names, score_cutoff=76)
		hits = sum(1 for value in row_map.values() if value is not None)
		coverage = hits / max(1, len(names))
		score = hits + coverage
		scores[key] = round(score, 3)
		if score > best_score:
			best_score = score
			best_key = key
	return best_key, scores

def parse_pipe_text(text: str) -> pd.DataFrame:
	return pd.read_csv(
		io.StringIO(text),
		sep='|',
		header=None,
		dtype=str,
		engine='python',
		keep_default_na=False,
	)

def parse_excel_bytes(contents: bytes) -> pd.DataFrame:
	return pd.read_excel(
		io.BytesIO(contents),
		header=None,
		dtype=str,
		engine='openpyxl',
	)

def clean_string(value) -> str:
	if value is None or pd.isna(value):
		return ""
	return str(value).strip()

def make_unique_headers(headers: list[str]) -> list[str]:
	seen = {}
	result = []
	for index, name in enumerate(headers, start=1):
		base = clean_string(name) or f"C{index}"
		if base not in seen:
			seen[base] = 1
			result.append(base)
			continue
		seen[base] += 1
		result.append(f"{base}_{seen[base]}")
	return result

def detect_header_row(raw_df: pd.DataFrame, expected_names: list[str]) -> int | None:
	if raw_df.empty:
		return None
	max_scan = min(len(raw_df), 30)
	best_index = None
	best_hits = 0
	best_coverage = 0.0
	for ridx in range(max_scan):
		cells_raw = [clean_string(v) for v in raw_df.iloc[ridx].tolist()]
		cells = [c for c in cells_raw if normalize_text(c)]
		if not cells:
			continue

		# Mide qué tan bien la fila se parece a encabezados de la plantilla.
		row_map = fuzzy_map(cells, expected_names, score_cutoff=76)
		hits = sum(1 for value in row_map.values() if value is not None)
		coverage = hits / max(1, len(cells))

		if hits > best_hits or (hits == best_hits and coverage > best_coverage):
			best_hits = hits
			best_coverage = coverage
			best_index = ridx

	if best_index is None:
		return None

	# Para archivos con pocas columnas, el umbral fijo de 4 hits impide detectar encabezado.
	if best_hits <= 0:
		return None
	# Usa el ancho real de la fila para calcular umbral mínimo razonable.
	best_cells = [clean_string(v) for v in raw_df.iloc[best_index].tolist()]
	non_empty_cells = [value for value in best_cells if normalize_text(value)]
	cell_count = max(1, len(non_empty_cells))
	min_hits = 1 if cell_count <= 2 else (2 if cell_count <= 5 else 4)
	coverage_ok = best_coverage >= (0.50 if cell_count <= 2 else 0.40 if cell_count <= 5 else 0.20)
	return best_index if (best_hits >= min_hits and coverage_ok) else None

def normalize_source_dataframe(raw_df: pd.DataFrame, expected_names: list[str]) -> pd.DataFrame:
	raw_df = raw_df.copy()
	raw_df = raw_df.dropna(axis=0, how='all')
	if raw_df.empty:
		return raw_df

	header_idx = detect_header_row(raw_df, expected_names)
	if header_idx is not None:
		headers = make_unique_headers([clean_string(v) for v in raw_df.iloc[header_idx].tolist()])
		df = raw_df.iloc[header_idx + 1 :].reset_index(drop=True).copy()
		df.columns = headers
	else:
		df = raw_df.reset_index(drop=True).copy()
		df.columns = [f"C{i + 1}" for i in range(df.shape[1])]

	# Compatibilidad con pandas 2.x/3.x sin usar applymap.
	df = df.apply(lambda col: col.map(clean_string))

	# Descarta únicamente columnas completamente vacías al final del bloque.
	if df.shape[1] > 0:
		non_empty_cols = df.ne("").any(axis=0)
		last_idx = df.shape[1] - 1
		while last_idx >= 0 and not bool(non_empty_cols.iloc[last_idx]):
			last_idx -= 1
		if last_idx >= 0:
			df = df.iloc[:, : last_idx + 1]

	# Elimina filas completamente vacías.
	df = df[df.ne("").any(axis=1)]
	return df.reset_index(drop=True)


def headers_are_generic(headers: list[str]) -> bool:
	if not headers:
		return False
	for header in headers:
		n = normalize_text(header)
		if not re.fullmatch(r"C\s*\d+", n):
			return False
	return True

def infer_mapping(headers: list[str], active_template: list[dict]) -> dict[str, str | None]:
	active_names = template_names(active_template)
	# Solo aplica mapeo posicional cuando encabezados son genéricos (C1..Cn).
	if headers_are_generic(headers):
		mapping = {header: None for header in headers}
		# Si no se detectó encabezado real, usa posición para no perder datos al exportar.
		limit = min(len(headers), len(active_names))
		for idx in range(limit):
			mapping[headers[idx]] = active_names[idx]
		return mapping
	map_suggest = fuzzy_map(headers, active_names)
	return map_suggest


def build_mapping_stats(headers: list[str], mapping: dict[str, str | None], template_cols: int) -> dict:
	mapped_headers = [key for key, value in mapping.items() if value is not None]
	unmapped_headers = [key for key, value in mapping.items() if value is None]
	mapped_template_names = {value for value in mapping.values() if value is not None}
	header_coverage = round((len(mapped_headers) / max(1, len(headers))) * 100, 2)
	template_coverage = round((len(mapped_template_names) / max(1, template_cols)) * 100, 2)
	return {
		"mapped_headers": len(mapped_headers),
		"total_headers": len(headers),
		"coverage_percent": header_coverage,
		"template_coverage_percent": template_coverage,
		"unmapped_headers": unmapped_headers,
	}


def build_structure_validation(headers: list[str], template_cols: int, row_count: int) -> dict:
	return {
		"input_columns": len(headers),
		"template_columns": template_cols,
		"column_diff": len(headers) - template_cols,
		"row_count": row_count,
	}

def _gz_compress(text: str) -> str:
	# Comprime y codifica en base64 para reducir el tamaño de la respuesta
	# (las respuestas grandes son lentas/inestables en serverless de Vercel).
	return base64.b64encode(gzip.compress(text.encode("utf-8"))).decode("ascii")

def build_response_payload(df: pd.DataFrame, mapping: dict, raw_text: str, template_key: str, active_template: list[dict]):
	corrected_df, logs, stats = validate_and_correct(df, mapping, active_template)
	# Asegurar que no hay NaN antes de exportar
	corrected_df = corrected_df.fillna("SIN DATO").astype(str)
	# Reemplazar saltos de linea en celdas para no romper el formato pipe-delimited
	for col in corrected_df.columns:
		corrected_df[col] = corrected_df[col].str.replace(r'[\r\n]+', ' ', regex=True)
	buf = io.StringIO()
	corrected_df.to_csv(buf, sep='|', index=False, header=False, na_rep='SIN DATO')
	corrected_text = buf.getvalue()
	preview_rows = corrected_df.head(30).to_dict(orient='records')
	return {
		"success": True,
		"template_key": template_key,
		"mapping_suggested": mapping,
		"mapping": mapping,
		"summary": stats,
		"logs_sample": logs[:1000],
		"corrected_text": _gz_compress(corrected_text),
		"preview_rows": preview_rows,
		"raw_text": _gz_compress(raw_text),
		"template_names": [t['name'] for t in active_template],
		"compressed": True,
	}

@app.post("/upload")
async def upload_file(
	file: UploadFile = File(...),
	template_key: str = Form(default="auto"),
	strict_mode: bool = Form(default=False),
	min_template_coverage: float = Form(default=95.0),
	require_exact_columns: bool = Form(default=True),
	mode: str = Form(default="limpiador"),
):
	filename = (file.filename or '').lower()
	if not (filename.endswith('.txt') or filename.endswith('.xlsx') or filename.endswith('.xls')):
		raise HTTPException(status_code=400, detail="Solo se permiten .txt, .xlsx o .xls")

	try:
		contents = await file.read()
		# Detectar y descomprimir gzip (enviado desde frontend para archivos > 1 MB)
		if len(contents) >= 2 and contents[:2] == b'\x1f\x8b':
			try:
				contents = gzip.decompress(contents)
			except Exception:
				pass

		raw_df = parse_pipe_text(contents.decode(errors='replace')) if filename.endswith('.txt') else parse_excel_bytes(contents)

		# Detección automática de plantilla a partir de la fila de encabezados
		union = union_template_names()
		header_idx = detect_header_row(raw_df, union)
		if header_idx is not None:
			detect_headers = make_unique_headers([clean_string(v) for v in raw_df.iloc[header_idx].tolist()])
		else:
			detect_headers = [f"C{i + 1}" for i in range(raw_df.shape[1])]

		if not template_key or template_key == "auto":
			detected_key, detect_scores = detect_best_template(detect_headers)
			best_score = detect_scores.get(detected_key, 0) if detected_key else 0
			if detected_key is None or best_score < 2:
				raise HTTPException(status_code=400, detail="No se pudo identificar la plantilla del archivo. Asegúrate de usar la plantilla descargada de la aplicación.")
			template_key = detected_key

		meta = get_template_by_key(template_key)
		active_template = meta["template"]
		active_names = template_names(active_template)
		template_key = meta["key"]

		df = normalize_source_dataframe(raw_df, active_names)

		if len(df) == 0:
			raise HTTPException(status_code=400, detail="Archivo vacío")

		orig_headers = list(df.columns)
		map_suggest = infer_mapping(orig_headers, active_template)
		mapping_stats = build_mapping_stats(orig_headers, map_suggest, len(active_names))
		structure_validation = build_structure_validation(orig_headers, len(active_names), len(df))
		strict_validation = {
			"strict_mode": bool(strict_mode),
			"min_template_coverage": float(min_template_coverage),
			"require_exact_columns": bool(require_exact_columns),
		}
		strict_reasons = []

		if strict_mode:
			reasons = []
			if mapping_stats["template_coverage_percent"] < float(min_template_coverage):
				reasons.append(
					f"Cobertura de plantilla insuficiente ({mapping_stats['template_coverage_percent']}% < {float(min_template_coverage)}%)."
				)
			if require_exact_columns and structure_validation["input_columns"] != structure_validation["template_columns"]:
				reasons.append(
					f"Estructura invalida: columnas de archivo ({structure_validation['input_columns']}) distintas a columnas de plantilla ({structure_validation['template_columns']})."
				)
			if mapping_stats["unmapped_headers"]:
				reasons.append(
					f"Existen encabezados no mapeados: {', '.join(mapping_stats['unmapped_headers'][:20])}"
				)
			strict_reasons = reasons

		strict_validation["status"] = "warning" if strict_reasons else "ok"
		strict_validation["reasons"] = strict_reasons
		if strict_mode and strict_reasons:
			raise HTTPException(status_code=400, detail={
				"message": "El archivo no cumple con los requisitos del modo estricto",
				"reasons": strict_reasons,
			})

		canonical_raw_text = df.to_csv(sep='|', index=False, header=True)

		if mode == "validador":
			try:
				from .validators import validate_only
			except ImportError:
				from validators import validate_only
			validation_result = validate_only(df, map_suggest, active_template)
			# En modo validador la data va SIN encabezado (solo filas en orden
			# de plantilla) para que sea consistente con la tabla editable.
			canonical_raw_text = df.to_csv(sep='|', index=False, header=False)
			raw_text_compressed = _gz_compress(canonical_raw_text)
			return JSONResponse({
				"success": True,
				"template_key": template_key,
				"mode": "validador",
				"mapping_suggested": map_suggest,
				"mapping": map_suggest,
				"summary": validation_result["stats"],
				"logs_sample": validation_result["logs"],
				"corrected_text": raw_text_compressed,
				"raw_text": raw_text_compressed,
				"preview_rows": df.head(30).to_dict(orient='records'),
				"template_names": template_names(active_template),
				"mapping_stats": mapping_stats,
				"structure_validation": structure_validation,
				"strict_validation": strict_validation,
				"compressed": True,
			})

		payload = build_response_payload(df, map_suggest, canonical_raw_text, template_key, active_template)
		return JSONResponse({
			**payload,
			"original_headers": orig_headers,
			"template_names": template_names(active_template),
			"mapping_stats": mapping_stats,
			"structure_validation": structure_validation,
			"strict_validation": strict_validation,
		})
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

import tempfile
import os as _os

@app.post("/upload-chunk")
async def upload_chunk(
	chunk: UploadFile = File(...),
	upload_id: str = Form(...),
	chunk_index: int = Form(...),
	total_chunks: int = Form(...),
	original_name: str = Form(...),
	template_key: str = Form(default="gestante"),
	strict_mode: bool = Form(default=False),
	min_template_coverage: float = Form(default=95.0),
	require_exact_columns: bool = Form(default=True),
):
	tmp_dir = tempfile.gettempdir()
	chunk_path = _os.path.join(tmp_dir, f"fenix_{upload_id}_{chunk_index}")
	data = await chunk.read()
	with open(chunk_path, "wb") as f:
		f.write(data)

	# Si no es el último chunk, responder "done: false"
	if chunk_index < total_chunks - 1:
		return {"done": False}

	# Último chunk: reensamblar y procesar
	try:
		parts = []
		for i in range(total_chunks):
			p = _os.path.join(tmp_dir, f"fenix_{upload_id}_{i}")
			with open(p, "rb") as f:
				parts.append(f.read())
		contents = b"".join(parts)

		# Limpiar chunks temporales
		for i in range(total_chunks):
			p = _os.path.join(tmp_dir, f"fenix_{upload_id}_{i}")
			try:
				_os.remove(p)
			except Exception:
				pass

		# Procesar como upload normal
		meta = get_template_by_key(template_key)
		active_template = meta["template"]
		active_names = template_names(active_template)
		template_key = meta["key"]
		filename = original_name.lower()

		if not (filename.endswith('.txt') or filename.endswith('.xlsx') or filename.endswith('.xls')):
			raise HTTPException(status_code=400, detail="Solo se permiten .txt, .xlsx o .xls")

		if len(contents) >= 2 and contents[:2] == b'\x1f\x8b':
			try:
				contents = gzip.decompress(contents)
			except Exception:
				pass

		if filename.endswith('.txt'):
			text = contents.decode(errors='replace')
			df = parse_pipe_text(text)
			df = normalize_source_dataframe(df, active_names)
		else:
			df = parse_excel_bytes(contents)
			df = normalize_source_dataframe(df, active_names)

		if len(df) == 0:
			raise HTTPException(status_code=400, detail="Archivo vacío")

		orig_headers = list(df.columns)
		map_suggest = infer_mapping(orig_headers, active_template)
		mapping_stats = build_mapping_stats(orig_headers, map_suggest, len(active_names))
		structure_validation = build_structure_validation(orig_headers, len(active_names), len(df))
		strict_validation = {
			"strict_mode": bool(strict_mode),
			"min_template_coverage": float(min_template_coverage),
			"require_exact_columns": bool(require_exact_columns),
		}
		strict_reasons = []

		if strict_mode:
			reasons = []
			if mapping_stats["template_coverage_percent"] < float(min_template_coverage):
				reasons.append(f"Cobertura de plantilla insuficiente ({mapping_stats['template_coverage_percent']}% < {float(min_template_coverage)}%).")
			if require_exact_columns and structure_validation["input_columns"] != structure_validation["template_columns"]:
				reasons.append(f"Estructura invalida: columnas de archivo ({structure_validation['input_columns']}) distintas a columnas de plantilla ({structure_validation['template_columns']}).")
			if mapping_stats["unmapped_headers"]:
				reasons.append(f"Existen encabezados no mapeados: {', '.join(mapping_stats['unmapped_headers'][:20])}")
			strict_reasons = reasons

		strict_validation["status"] = "warning" if strict_reasons else "ok"
		strict_validation["reasons"] = strict_reasons
		if strict_mode and strict_reasons:
			raise HTTPException(status_code=400, detail={
				"message": "El archivo no cumple con los requisitos del modo estricto",
				"reasons": strict_reasons,
			})

		canonical_raw_text = df.to_csv(sep='|', index=False, header=True)
		payload = build_response_payload(df, map_suggest, canonical_raw_text, template_key, active_template)
		return {"done": True, **payload, **{
			"original_headers": orig_headers,
			"template_names": template_names(active_template),
			"mapping_stats": mapping_stats,
			"structure_validation": structure_validation,
			"strict_validation": strict_validation,
		}}
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.post("/revalidate")
async def revalidate(payload: RevalidatePayload):
	try:
		meta = get_template_by_key(payload.template_key)
		active_template = meta["template"]
		template_key = meta["key"]
		# En modo validador la data llega sin fila de encabezado (solo datos en
		# orden de plantilla). En limpiador llega con encabezado.
		if payload.mode == "validador":
			df = pd.read_csv(io.StringIO(payload.raw_text), sep='|', dtype=str, engine='python', header=None, keep_default_na=False)
			df = df.fillna('').astype(str)
			if len(df) == 0:
				raise HTTPException(status_code=400, detail="Archivo vacío")
			try:
				from .validators import validate_only
			except ImportError:
				from validators import validate_only
			validation_result = validate_only(df, payload.mapping, active_template)
			raw_text_compressed = _gz_compress(payload.raw_text)
			return JSONResponse({
				"success": True,
				"template_key": template_key,
				"mode": "validador",
				"mapping_suggested": payload.mapping,
				"mapping": payload.mapping,
				"summary": validation_result["stats"],
				"logs_sample": validation_result["logs"],
				"corrected_text": raw_text_compressed,
				"raw_text": raw_text_compressed,
				"template_names": [t['name'] for t in active_template],
				"compressed": True,
			})

		df = pd.read_csv(io.StringIO(payload.raw_text), sep='|', dtype=str, engine='python', keep_default_na=False)
		df = df.fillna('').astype(str)
		if len(df) == 0:
			raise HTTPException(status_code=400, detail="Archivo vacío")
		return JSONResponse(build_response_payload(df, payload.mapping, payload.raw_text, template_key, active_template))
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.post("/export")
async def export_file(payload: dict):
	ct = payload.get('corrected_text')
	if not ct:
		raise HTTPException(status_code=400, detail="Se requiere corrected_text")
	filename = payload.get('filename','export_corrigido.txt')
	# Normalizar line endings a Windows y codificar sin BOM
	ct_normalized = ct.replace('\r\n', '\n').replace('\n', '\r\n')
	return StreamingResponse(
		io.BytesIO(ct_normalized.encode('utf-8')),
		media_type='text/plain; charset=utf-8',
		headers={"Content-Disposition": f"attachment; filename={filename}"}
	)

@app.post("/export-excel")
async def export_excel(payload: dict):
	try:
		from .excel_export import build_data_excel
	except ImportError:
		from excel_export import build_data_excel
	ct = payload.get('corrected_text')
	template_key = payload.get('template_key', 'gestante')
	if not ct:
		raise HTTPException(status_code=400, detail="Se requiere corrected_text")
	meta = get_template_by_key(template_key)
	buf = build_data_excel(ct, meta["template"])
	filename = payload.get('filename', f'data_corregida_{template_key}.xlsx')
	return StreamingResponse(
		buf,
		media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		headers={"Content-Disposition": f"attachment; filename={filename}"},
	)

# ─── Cargues (historial mensual) ──────────────────────────────────────────

class CarguePayload(BaseModel):
	corrected_text: str = ""
	raw_text: str = ""
	template_key: str = "gestante"
	filename: str = "cargue.xlsx"
	mes: str = ""
	compressed: bool = False
	summary: dict | None = None
	logs: list | None = None
	row_count: int = 0
	errors_count: int = 0
	corrected_count: int = 0
	quality_percent: float = 0.0


def _current_month() -> str:
	now = datetime.utcnow()
	return now.strftime("%Y-%m")


@app.post("/cargues")
async def create_cargue(payload: CarguePayload, current_user: User = Depends(get_current_user)):
	ensure_db_ready()
	db = SessionLocal()
	try:
		prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
		cargue = Cargue(
			prestador_id=prestador.id if prestador else None,
			user_id=current_user.id,
			template_key=payload.template_key,
			mes=payload.mes or _current_month(),
			original_filename=payload.filename,
			raw_text=payload.raw_text,
			corrected_text=payload.corrected_text,
			compressed=bool(payload.compressed),
			summary_json=json.dumps(payload.summary) if payload.summary else None,
			logs_json=json.dumps(payload.logs) if payload.logs else None,
			row_count=payload.row_count,
			errors_count=payload.errors_count,
			corrected_count=payload.corrected_count,
			quality_percent=payload.quality_percent,
			status="validado",
		)
		db.add(cargue)
		db.commit()
		db.refresh(cargue)
		return {"id": cargue.id, "mes": cargue.mes, "template_key": cargue.template_key}
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos para guardar el cargue. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


@app.get("/cargues")
async def list_cargues(
    template_key: str = Query(""),
    current_user: User = Depends(get_current_user),
):
	ensure_db_ready()
	db = SessionLocal()
	try:
		q = db.query(Cargue)
		if current_user.role == "prestador":
			q = q.filter(Cargue.user_id == current_user.id)
		elif current_user.role == "lider":
			# El líder ve todos los cargues de su plantilla asignada
			prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
			assigned = [p.template_key for p in (prestador.plantillas if prestador else [])]
			if assigned:
				q = q.filter(Cargue.template_key.in_(assigned))
			else:
				q = q.filter(Cargue.id == -1)
		if template_key:
			q = q.filter(Cargue.template_key == template_key)
		q = q.order_by(Cargue.created_at.desc())
		items = q.limit(100).all()
		result = []
		for c in items:
			summary = {}
			try:
				summary = json.loads(c.summary_json) if c.summary_json else {}
			except Exception:
				pass
			result.append({
				"id": c.id,
				"template_key": c.template_key,
				"mes": c.mes,
				"original_filename": c.original_filename,
				"prestador": (c.prestador.nombre if c.prestador else None) or (c.user.name if c.user else None),
				"row_count": c.row_count,
				"errors_count": c.errors_count,
				"corrected_count": c.corrected_count,
				"quality_percent": c.quality_percent,
				"status": c.status,
				"created_at": c.created_at.isoformat() if c.created_at else None,
				"summary": summary,
			})
		return {"cargues": result}
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos para consultar el historial. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


@app.get("/cargues/{cargue_id}")
async def get_cargue(cargue_id: int, current_user: User = Depends(get_current_user)):
	ensure_db_ready()
	db = SessionLocal()
	try:
		cargue = db.get(Cargue, cargue_id)
		if cargue is None:
			raise HTTPException(status_code=404, detail="Cargue no encontrado")
		if current_user.role == "prestador" and cargue.user_id != current_user.id:
			raise HTTPException(status_code=403, detail="No autorizado")
		if current_user.role == "lider":
			_prest = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
			_assigned = [p.template_key for p in (_prest.plantillas if _prest else [])]
			if cargue.template_key not in _assigned:
				raise HTTPException(status_code=403, detail="No autorizado")
		def _parse_json(value):
			try:
				return json.loads(value) if value else {}
			except Exception:
				return {}
		return {
			"id": cargue.id,
			"template_key": cargue.template_key,
			"mes": cargue.mes,
			"original_filename": cargue.original_filename,
			"corrected_text": cargue.corrected_text,
			"raw_text": cargue.raw_text,
			"compressed": cargue.compressed,
			"row_count": cargue.row_count,
			"errors_count": cargue.errors_count,
			"corrected_count": cargue.corrected_count,
			"quality_percent": cargue.quality_percent,
			"summary": _parse_json(cargue.summary_json),
			"logs_sample": _parse_json(cargue.logs_json),
			"created_at": cargue.created_at.isoformat() if cargue.created_at else None,
		}
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


def _decompress_cargue(cargue) -> str:
	ct = cargue.corrected_text or ""
	if cargue.compressed and ct:
		try:
			return gzip.decompress(base64.b64decode(ct)).decode("utf-8")
		except Exception:
			return ct
	return ct


@app.get("/cargues/{cargue_id}/download-txt")
async def download_cargue_txt(cargue_id: int, current_user: User = Depends(get_current_user)):
	ensure_db_ready()
	db = SessionLocal()
	try:
		cargue = db.get(Cargue, cargue_id)
		if cargue is None:
			raise HTTPException(status_code=404, detail="Cargue no encontrado")
		if current_user.role == "prestador" and cargue.user_id != current_user.id:
			raise HTTPException(status_code=403, detail="No autorizado")
		if current_user.role == "lider":
			_prest = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
			_assigned = [p.template_key for p in (_prest.plantillas if _prest else [])]
			if cargue.template_key not in _assigned:
				raise HTTPException(status_code=403, detail="No autorizado")
		text = _decompress_cargue(cargue)
		filename = cargue.original_filename.replace(".xlsx", "_corregido.txt").replace(".xls", "_corregido.txt")
		text_normalized = text.replace('\r\n', '\n').replace('\n', '\r\n')
		return StreamingResponse(
			io.BytesIO(text_normalized.encode('utf-8')),
			media_type='text/plain; charset=utf-8',
			headers={"Content-Disposition": f"attachment; filename={filename}"},
		)
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


@app.get("/cargues/{cargue_id}/download-excel")
async def download_cargue_excel(cargue_id: int, current_user: User = Depends(get_current_user)):
	try:
		from .excel_export import build_data_excel
	except ImportError:
		from excel_export import build_data_excel
	ensure_db_ready()
	db = SessionLocal()
	try:
		cargue = db.get(Cargue, cargue_id)
		if cargue is None:
			raise HTTPException(status_code=404, detail="Cargue no encontrado")
		if current_user.role == "prestador" and cargue.user_id != current_user.id:
			raise HTTPException(status_code=403, detail="No autorizado")
		if current_user.role == "lider":
			_prest = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
			_assigned = [p.template_key for p in (_prest.plantillas if _prest else [])]
			if cargue.template_key not in _assigned:
				raise HTTPException(status_code=403, detail="No autorizado")
		text = _decompress_cargue(cargue)
		meta = get_template_by_key(cargue.template_key)
		buf = build_data_excel(text, meta["template"])
		filename = cargue.original_filename.replace(".xlsx", "_ajustada.xlsx").replace(".xls", "_ajustada.xlsx")
		return StreamingResponse(
			buf,
			media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers={"Content-Disposition": f"attachment; filename={filename}"},
		)
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


# ─── Historias clínicas (PDF) ─────────────────────────────────────────────

MAX_PDF_MB = 20


@app.post("/historias")
async def upload_historia(
    request: Request,
    file: UploadFile = File(...),
    paciente_documento: str = Form(""),
    paciente_nombre: str = Form(""),
    template_key: str = Form("gestante"),
    current_user: User = Depends(get_current_user),
):
    ensure_db_ready()
    filename = (file.filename or "historia.pdf").strip()
    content = file.file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF.")
    if len(content) > MAX_PDF_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"El archivo supera {MAX_PDF_MB} MB. En el entorno desplegado el límite de subida es de ~4.5 MB; divide la historia en partes menores.",
        )
    oidc_token = request.headers.get("x-vercel-oidc-token", "")
    db = SessionLocal()
    try:
        prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
        historia = HistoriaClinica(
            prestador_id=prestador.id if prestador else None,
            user_id=current_user.id,
            template_key=template_key.strip() or "gestante",
            paciente_documento=paciente_documento.strip(),
            paciente_nombre=paciente_nombre.strip(),
            filename=filename,
            content_type=file.content_type or "application/pdf",
            file_size=len(content),
        )
        db.add(historia)
        db.flush()  # genera el id
        if gcs_storage.gcs_enabled():
            safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
            blob_path = f"historias/{historia.id}/{safe_name}"
            gcs_storage.upload_pdf(oidc_token, blob_path, content, historia.content_type)
            historia.pdf_path = blob_path
        else:
            historia.pdf_data = content
        db.commit()
        db.refresh(historia)
        storage_used = "gcs" if historia.pdf_path else "db"
        return {
            "id": historia.id,
            "filename": historia.filename,
            "paciente_nombre": historia.paciente_nombre,
            "storage": storage_used,
        }
    except OperationalError:
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos para guardar la historia clínica. Verifica la conexión al servidor PostgreSQL.")
    except Exception as exc:
        db.rollback()
        detail = "No se pudo guardar el PDF en el almacenamiento. Verifica la configuración de Google Cloud Storage."
        if os.environ.get("DEBUG_GCS", ""):
            detail += f" Detalle: {exc} | oidc_len={len(oidc_token)}"
        raise HTTPException(status_code=500, detail=detail)
    finally:
        db.close()


@app.get("/historias")
async def list_historias(
    q: str = Query(""),
    template_key: str = Query(""),
    current_user: User = Depends(get_current_user),
):
    ensure_db_ready()
    db = SessionLocal()
    try:
        query = db.query(HistoriaClinica)
        if current_user.role == "prestador":
            query = query.filter(HistoriaClinica.user_id == current_user.id)
        elif current_user.role == "lider":
            prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
            assigned = [p.template_key for p in (prestador.plantillas if prestador else [])]
            if assigned:
                query = query.filter(HistoriaClinica.template_key.in_(assigned))
            else:
                query = query.filter(HistoriaClinica.id == -1)
        if template_key:
            query = query.filter(HistoriaClinica.template_key == template_key)
        query = query.order_by(HistoriaClinica.created_at.desc())
        items = query.limit(500).all()
        term = q.strip().lower()
        result = []
        for h in items:
            if term and term not in f"{h.filename} {h.paciente_nombre or ''} {h.paciente_documento or ''}".lower():
                continue
            result.append({
                "id": h.id,
                "template_key": h.template_key or "gestante",
                "prestador": (h.prestador.nombre if h.prestador else None) or (h.user.name if h.user else None),
                "paciente_nombre": h.paciente_nombre,
                "paciente_documento": h.paciente_documento,
                "filename": h.filename,
                "file_size": h.file_size,
                "created_at": h.created_at.isoformat() if h.created_at else None,
            })
        return {"historias": result}
    except OperationalError:
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos para consultar las historias clínicas. Verifica la conexión al servidor PostgreSQL.")
    finally:
        db.close()


@app.get("/historias/{historia_id}")
async def get_historia(request: Request, historia_id: int, current_user: User = Depends(get_current_user)):
    ensure_db_ready()
    db = SessionLocal()
    try:
        h = db.get(HistoriaClinica, historia_id)
        if h is None:
            raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
        if current_user.role == "prestador" and h.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="No autorizado")
        if current_user.role == "lider":
            _prest = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
            _assigned = [p.template_key for p in (_prest.plantillas if _prest else [])]
            if (h.template_key or "gestante") not in _assigned:
                raise HTTPException(status_code=403, detail="No autorizado")
        filename = h.filename or f"historia_{h.id}.pdf"
        if h.pdf_path:
            oidc_token = request.headers.get("x-vercel-oidc-token", "")
            try:
                data = gcs_storage.download_pdf(oidc_token, h.pdf_path)
            except Exception:
                raise HTTPException(status_code=502, detail="No se pudo leer el PDF desde el almacenamiento. Verifica la configuración de Google Cloud Storage.")
        elif h.pdf_data:
            data = bytes(h.pdf_data)
        else:
            raise HTTPException(status_code=404, detail="El archivo PDF no está disponible")
        return StreamingResponse(
            io.BytesIO(data),
            media_type=h.content_type or "application/pdf",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    except OperationalError:
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
    finally:
        db.close()


@app.delete("/historias/{historia_id}")
async def delete_historia(request: Request, historia_id: int, current_user: User = Depends(get_current_user)):
    ensure_db_ready()
    db = SessionLocal()
    try:
        h = db.get(HistoriaClinica, historia_id)
        if h is None:
            raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
        if current_user.role == "prestador" and h.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="No autorizado")
        if current_user.role == "lider":
            _prest = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
            _assigned = [p.template_key for p in (_prest.plantillas if _prest else [])]
            if (h.template_key or "gestante") not in _assigned:
                raise HTTPException(status_code=403, detail="No autorizado")
        if h.pdf_path:
            try:
                oidc_token = request.headers.get("x-vercel-oidc-token", "")
                gcs_storage.delete_pdf(oidc_token, h.pdf_path)
            except Exception:
                pass  # no bloquear el borrado si el objeto no existe
        db.delete(h)
        db.commit()
        return {"ok": True}
    except OperationalError:
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
    finally:
        db.close()


# ─── Gestión de prestadores (admin / EPS) ─────────────────────────────────

class PrestadorPayload(BaseModel):
	nombre: str
	nit: str = ""
	municipio: str = ""
	username: str
	password: str
	template_key: str = "gestante"
	role: str = "prestador"  # "prestador" | "lider"


@app.post("/admin/prestadores")
async def create_prestador(payload: PrestadorPayload, admin: User = Depends(require_admin)):
	ensure_db_ready()
	db = SessionLocal()
	try:
		exists = db.query(User).filter(User.username == payload.username.strip()).first()
		if exists:
			raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
		role = payload.role if payload.role in ("prestador", "lider") else "prestador"
		user = User(
			username=payload.username.strip(),
			password_hash=hash_password(payload.password),
			name=payload.nombre,
			role=role,
			active=True,
		)
		db.add(user)
		db.flush()
		prestador = Prestador(
			user_id=user.id,
			nombre=payload.nombre,
			nit=payload.nit,
			municipio=payload.municipio,
		)
		db.add(prestador)
		db.flush()
		# Asignar la plantilla del prestador
		pp = PrestadorPlantilla(prestador_id=prestador.id, template_key=payload.template_key)
		db.add(pp)
		db.commit()
		return {"id": prestador.id, "username": user.username, "nombre": prestador.nombre, "template_key": payload.template_key, "role": role}
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


@app.get("/admin/prestadores")
async def list_prestadores(admin: User = Depends(require_admin)):
	ensure_db_ready()
	db = SessionLocal()
	try:
		items = db.query(Prestador).order_by(Prestador.nombre.asc()).all()
		result = []
		for p in items:
			cargues_count = db.query(Cargue).filter(Cargue.prestador_id == p.id).count()
			plantillas = [pp.template_key for pp in p.plantillas]
			result.append({
				"id": p.id,
				"nombre": p.nombre,
				"nit": p.nit,
			"municipio": p.municipio,
			"username": p.user.username if p.user else None,
			"cargues_count": cargues_count,
			"template_key": plantillas[0] if plantillas else "gestante",
			"role": p.user.role if p.user else "prestador",
		})
		return {"prestadores": result}
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


# ─── Consolidación de cargues (admin / EPS) ───────────────────────────────

@app.post("/consolidate")
async def consolidate_cargues(payload: dict, current_user: User = Depends(get_current_user)):
	if current_user.role not in ("admin", "lider"):
		raise HTTPException(status_code=403, detail="Solo el EPS o el líder del programa puede consolidar la data")
	try:
		from .excel_export import build_data_excel
	except ImportError:
		from excel_export import build_data_excel
	template_key = payload.get("template_key", "gestante")
	mes = payload.get("mes", "")
	ensure_db_ready()
	db = SessionLocal()
	try:
		# El líder solo puede consolidar su plantilla asignada
		if current_user.role == "lider":
			prestador = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
			assigned = [p.template_key for p in (prestador.plantillas if prestador else [])]
			if template_key not in assigned:
				raise HTTPException(status_code=403, detail="No tienes acceso a esta plantilla")
		q = db.query(Cargue).filter(Cargue.template_key == template_key)
		if mes:
			q = q.filter(Cargue.mes == mes)
		q = q.order_by(Cargue.created_at.asc())
		cargues = q.all()
		if not cargues:
			raise HTTPException(status_code=404, detail="No hay cargues para consolidar")
		all_rows = []
		total = 0
		errores = 0
		for c in cargues:
			text = _decompress_cargue(c)
			for line in text.replace("\r\n", "\n").split("\n"):
				if line.strip():
					all_rows.append(line)
			total += c.row_count or 0
			errores += c.errors_count or 0
		corrected_text = "\n".join(all_rows)
		meta = get_template_by_key(template_key)
		buf = build_data_excel(corrected_text, meta["template"])
		filename = f"consolidada_{template_key}{'_'+mes if mes else ''}.xlsx"
		return StreamingResponse(
			buf,
			media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers={"Content-Disposition": f"attachment; filename={filename}"},
		)
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexión al servidor PostgreSQL.")
	finally:
		db.close()


@app.post("/evaluate")
async def evaluate_endpoint(payload: dict, format: str = Query(default="json")):
	ct = payload.get('corrected_text', '')
	template_names = payload.get('template_names', [])
	template_key = payload.get('template_key', 'gestante')
	if not ct or not ct.strip():
		raise HTTPException(
			status_code=400,
			detail="No hay datos corregidos para evaluar. Primero carga y valida un archivo."
		)

	try:
		from io import StringIO
		df = pd.read_csv(StringIO(ct), sep='|', header=None, dtype=str, engine='python', keep_default_na=False)
		df = df.fillna('').astype(str)
	except Exception as e:
		raise HTTPException(status_code=400, detail=f"Error al parsear datos: {e}")

	if df.empty:
		raise HTTPException(status_code=400, detail="No hay datos para evaluar")

	# Asignar nombres de columna según template
	if template_names and len(df.columns) == len(template_names):
		df.columns = template_names
	else:
		meta = get_template_by_key(template_key)
		tmpl_names = [t['name'] for t in meta['template']]
		if len(df.columns) == len(tmpl_names):
			df.columns = tmpl_names

	indicators, patients = evaluate(df, template_key)

	if format == "xlsx":
		filename = payload.get('filename', f'evaluacion_{template_key}_{datetime.now().strftime("%Y%m%d")}.xlsx')
		buf = build_evaluation_excel(indicators, patients)
		return StreamingResponse(
			buf,
			media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers={"Content-Disposition": f"attachment; filename={filename}"},
		)

	# JSON response for dashboard
	eval_cols = [c for c in patients.columns if c.startswith("_")]
	data_cols = [c for c in patients.columns if not c.startswith("_")]

	return {
		"indicators": indicators.replace({pd.NA: None}).to_dict(orient="records"),
		"patients": patients.replace({pd.NA: None}).to_dict(orient="records"),
		"eval_columns": eval_cols,
		"data_columns": data_cols,
		"total_patients": len(patients),
		"template_key": template_key,
	}

@app.get("/download-template/{template_key}")
async def download_template(template_key: str):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.worksheet.datavalidation import DataValidation

    meta = get_template_by_key(template_key)
    tmpl = meta["template"]
    headers = [t['name'] for t in tmpl]

    wb = Workbook()
    ws = wb.active
    ws.title = meta["label"]

    # Hidden sheet for long dropdown lists
    helper = wb.create_sheet(title="_Listas")
    helper.sheet_state = "hidden"

    type_fills = {
        "SET":    PatternFill("solid", fgColor="FFF3E0"),
        "INT":    PatternFill("solid", fgColor="E3F2FD"),
        "DECIMAL": PatternFill("solid", fgColor="E8F5E9"),
        "DATE":   PatternFill("solid", fgColor="F3E5F5"),
        "TEXT":   PatternFill("solid", fgColor="F5F5F5"),
    }
    header_fill = PatternFill("solid", fgColor="1B5E20")
    header_font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
    thin_border = Border(
        left=Side(style="thin", color="BDBDBD"),
        right=Side(style="thin", color="BDBDBD"),
        top=Side(style="thin", color="BDBDBD"),
        bottom=Side(style="thin", color="BDBDBD"),
    )

    # Register unique allowed lists on helper sheet
    list_registry: dict[str, str] = {}
    helper_col = 0

    def _col_letter(n: int) -> str:
        result = ""
        while n > 0:
            n, r = divmod(n - 1, 26)
            result = chr(65 + r) + result
        return result

    def register_list(allowed: list[str]) -> str:
        nonlocal helper_col
        key = ",".join(allowed)
        if key in list_registry:
            return list_registry[key]
        helper_col += 1
        col_letter = _col_letter(helper_col)
        for row_idx, val in enumerate(allowed, start=1):
            helper.cell(row=row_idx, column=helper_col, value=val)
        ref = f"='_Listas'!${col_letter}$1:${col_letter}${len(allowed)}"
        list_registry[key] = ref
        return ref

    for col_idx, f in enumerate(tmpl, start=1):
        col_letter = ws.cell(row=1, column=col_idx).column_letter

        cell = ws.cell(row=1, column=col_idx, value=f['name'])
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = thin_border

        # Fila 2: leyenda del tipo de dato (coloreada), también sirve de área de datos
        cell2 = ws.cell(row=2, column=col_idx)
        cell2.fill = type_fills.get(f['type'], PatternFill())
        cell2.border = thin_border
        cell2.alignment = Alignment(vertical="center")

        # Formato por tipo aplicado a toda el área de datos (filas 2-102)
        if f['type'] == 'DATE':
            for r in range(2, 102):
                c = ws.cell(row=r, column=col_idx)
                c.number_format = 'yyyy-mm-dd'
                c.border = thin_border
        elif f['type'] == 'INT':
            for r in range(2, 102):
                c = ws.cell(row=r, column=col_idx)
                c.number_format = '0'
                c.border = thin_border
        elif f['type'] == 'DECIMAL':
            for r in range(2, 102):
                c = ws.cell(row=r, column=col_idx)
                c.number_format = '0.00'
                c.border = thin_border
        else:
            for r in range(2, 102):
                c = ws.cell(row=r, column=col_idx)
                c.border = thin_border

        # Lista desplegable con los valores permitidos, aplicada al área de datos
        allowed = f.get('allowed', [])
        if allowed:
            formula = register_list(allowed)
            dv = DataValidation(type="list", formula1=formula, allow_blank=True)
            dv.error = f"Valor no permitido. Use uno de: {', '.join(allowed)}"
            dv.errorTitle = "Valor inválido"
            ws.add_data_validation(dv)
            dv.add(f"{col_letter}2:{col_letter}101")

    # Column widths
    ws.column_dimensions['A'].width = 4
    for col_idx in range(1, len(headers) + 1):
        col_letter = ws.cell(row=1, column=col_idx).column_letter
        max_len = max(len(str(headers[col_idx - 1])), 12)
        ws.column_dimensions[col_letter].width = min(max_len + 3, 55)

    ws.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=plantilla_{template_key}.xlsx"},
    )

# ─── Eliminar cargue ─────────────────────────────────────────────────────

@app.delete("/cargues/{cargue_id}")
async def delete_cargue(cargue_id: int, current_user: User = Depends(get_current_user)):
	ensure_db_ready()
	db = SessionLocal()
	try:
		cargue = db.get(Cargue, cargue_id)
		if cargue is None:
			raise HTTPException(status_code=404, detail="Cargue no encontrado")
		if current_user.role == "prestador" and cargue.user_id != current_user.id:
			raise HTTPException(status_code=403, detail="No autorizado")
		if current_user.role == "lider":
			_prest = db.query(Prestador).filter(Prestador.user_id == current_user.id).first()
			_assigned = [p.template_key for p in (_prest.plantillas if _prest else [])]
			if cargue.template_key not in _assigned:
				raise HTTPException(status_code=403, detail="No autorizado")
		db.delete(cargue)
		db.commit()
		return {"ok": True, "id": cargue_id}
	except OperationalError:
		raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos. Verifica la conexion al servidor PostgreSQL.")
	finally:
		db.close()


# ─── Validacion sin correccion (validador estricto) ──────────────────────

@app.post("/validate-data")
async def validate_data(payload: dict):
	template_key = payload.get("template_key", "gestante")
	corrected_text = payload.get("corrected_text", "")
	template_names_list = payload.get("template_names", [])

	if not corrected_text or not corrected_text.strip():
		raise HTTPException(status_code=400, detail="No hay datos para validar")

	try:
		df = pd.read_csv(io.StringIO(corrected_text), sep='|', header=None, dtype=str, engine='python', keep_default_na=False)
		df = df.fillna('').astype(str)
	except Exception as e:
		raise HTTPException(status_code=400, detail=f"Error al parsear datos: {e}")

	if df.empty:
		raise HTTPException(status_code=400, detail="No hay datos para validar")

	meta = get_template_by_key(template_key)
	tmpl = meta["template"]

	if template_names_list and len(df.columns) == len(template_names_list):
		df.columns = template_names_list
	else:
		tmpl_names = [t['name'] for t in tmpl]
		if len(df.columns) == len(tmpl_names):
			df.columns = tmpl_names

	tmap = {t["name"]: t for t in tmpl}
	template_cols = [t["name"] for t in tmpl]
	n = len(df)

	# Errores por fila: {row_idx: ["col: msg", ...]}
	row_errors: dict[int, list[str]] = {}
	stats = {"total": n, "rows_with_errors": 0, "total_error_cells": 0, "by_column": {}}

	for ci, col_name in enumerate(template_cols):
		if ci >= len(df.columns):
			break
		tdef = tmap.get(col_name)
		if not tdef:
			continue

		values = df.iloc[:, ci].tolist()
		col_errors = 0

		for ridx, val in enumerate(values):
			val_str = str(val).strip() if val else ""
			err_msg = None

			if tdef["type"] == "SET":
				allowed = [str(a).strip() for a in tdef.get("allowed", [])]
				normalized_allowed = [normalize_text(a) for a in allowed]
				if val_str:
					sn = normalize_text(val_str)
					if sn not in normalized_allowed:
						alias_match = False
						for alias_canonical, alias_synonyms in {
							"SI": {"S", "1", "YES", "Y"},
							"NO": {"N", "0", "FALSE", "F"},
							"MASCULINO": {"M"},
							"FEMENINO": {"F"},
							"CC": {"CEDULA", "C.C.", "C.C"},
							"TI": {"TARJETA IDENTIDAD", "T.I."},
							"CE": {"CEDULA DE EXTRANJERIA", "C.E."},
						}.items():
							if sn in {normalize_text(a) for a in alias_synonyms} and normalize_text(alias_canonical) in normalized_allowed:
								alias_match = True
								break
						if not alias_match:
							allowed_str = ", ".join(allowed[:8])
							err_msg = f"[{col_name}] Valor '{val_str}' no permitido. Opciones: {allowed_str}"
							col_errors += 1

			elif tdef["type"] == "INT":
				if val_str and val_str not in ("SIN DATO", ""):
					clean = val_str.replace("-", "").replace(" ", "")
					if not re.fullmatch(r'[+-]?\d+', clean):
						err_msg = f"[{col_name}] Se esperaba entero, se encontro '{val_str}'"
						col_errors += 1

			elif tdef["type"] == "DECIMAL":
				if val_str and val_str not in ("SIN DATO", ""):
					s = val_str.replace(" ", "").replace(",", ".")
					if not re.fullmatch(r'[+-]?\d+(\.\d+)?', s):
						err_msg = f"[{col_name}] Se esperaba decimal, se encontro '{val_str}'"
						col_errors += 1

			elif tdef["type"] == "DATE":
				if val_str and val_str not in ("SIN DATO", "NO APLICA", "No Aplica", "N/A", "1900-01-01", ""):
					if to_date_iso(val_str) is None:
						err_msg = f"[{col_name}] Fecha invalida: '{val_str}' (formato: AAAA-MM-DD)"
						col_errors += 1

			if err_msg:
				if ridx not in row_errors:
					row_errors[ridx] = []
				row_errors[ridx].append(err_msg)
				stats["total_error_cells"] += 1

		stats["by_column"][col_name] = {"type": tdef["type"], "errors": col_errors}

	stats["rows_with_errors"] = len(row_errors)

	# Construir el TXT con errores: misma estructura pipe-delimited + columna ERRORES
	header_line = "|".join(template_cols) + "|ERRORES"
	output_lines = [header_line]
	for ridx in range(n):
		row_vals = [str(df.iloc[ridx, ci]) if ci < len(df.columns) else "" for ci in range(len(template_cols))]
		errs = row_errors.get(ridx, [])
		err_col = "; ".join(errs) if errs else "OK"
		output_lines.append("|".join(row_vals) + "|" + err_col)

	report_text = "\r\n".join(output_lines)

	return {
		"valid": stats["rows_with_errors"] == 0,
		"stats": {
			"total_rows": n,
			"rows_with_errors": stats["rows_with_errors"],
			"rows_ok": n - stats["rows_with_errors"],
			"total_error_cells": stats["total_error_cells"],
			"by_column": stats["by_column"],
		},
		"row_errors": {str(k): v for k, v in row_errors.items()},
		"report_text": base64.b64encode(report_text.encode("utf-8")).decode("ascii"),
		"template_key": template_key,
	}


@app.post("/indicadores")
async def indicadores_endpoint(payload: dict):
	template_key = payload.get("template_key", "gestante")
	corrected_text = payload.get("corrected_text", "")

	if not corrected_text or not corrected_text.strip():
		raise HTTPException(status_code=400, detail="No hay datos para generar indicadores")

	try:
		df = pd.read_csv(io.StringIO(corrected_text), sep='|', header=None, dtype=str, engine='python', keep_default_na=False)
		df = df.fillna('').astype(str)
	except Exception as e:
		raise HTTPException(status_code=400, detail=f"Error al parsear datos: {e}")

	if df.empty:
		raise HTTPException(status_code=400, detail="No hay datos")

	meta = get_template_by_key(template_key)
	tmpl = meta["template"]
	tmpl_names = [t['name'] for t in tmpl]

	if len(df.columns) == len(tmpl_names):
		df.columns = tmpl_names

	tmap = {t["name"]: t for t in tmpl}

	def safe_col(name):
		if name in df.columns:
			return df[name]
		return pd.Series([""] * len(df), index=df.index)

	def count_values(series, allowed_map=None):
		counts = {}
		for v in series:
			vn = normalize_text(str(v).strip()) if v else ""
			if not vn or vn in ("SIN DATO", "NONE", "NAN", ""):
				continue
			if allowed_map and vn in allowed_map:
				vn = allowed_map[vn]
			counts[vn] = counts.get(vn, 0) + 1
		return counts

	def pct(part, total):
		return round(part / max(total, 1) * 100, 1)

	totalregistros = len(df)
	registrosok = 0
	registrosconerror = 0

	# Stats base
	result = {
		"template_key": template_key,
		"total_registros": totalregistros,
		"indicadores": {},
	}

	if template_key == "gestante":
		try:
			from .indicadores_pare import calcular_indicadores_gestante
		except ImportError:
			from indicadores_pare import calcular_indicadores_gestante
		pare = calcular_indicadores_gestante(df)
		# Descriptivos complementarios (conteos)
		sexo = count_values(safe_col("SEXO"))
		regimen = count_values(safe_col("REGIMEN DE AFILIACION"))
		etnia = count_values(safe_col("ETNIA"))
		zona = count_values(safe_col("ZONA"))
		riesgo = count_values(safe_col("CLASIFICACION DEL RIESGO"))
		vih = count_values(safe_col("RESULTADO PRIMER TAMIZAJE PRUEBA DE VIH"))
		sifilis = count_values(safe_col("RESULTADO PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS"))
		hipertension = count_values(safe_col("HIPERTENSION ARTERIAL"))
		diabetes = count_values(safe_col("DIABETES"))
		trimestre = count_values(safe_col("TRIMESTRE INICIO CONTROL"))
		parto = count_values(safe_col("CARACTERISTICAS DEL PARTO"))
		condicion_rn = count_values(safe_col("CONDICION DEL RECIEN NACIDO"))
		vacuna_bcg = count_values(safe_col("VACUNACION CON BCG"))
		vacuna_hepb = count_values(safe_col("VACUNACION ANTIHEPATITIS B"))

		result["indicadores"] = {
			"pare_mm": {
				"label": "Indicadores PARE MM (Cohorte de Gestantes)",
				"type": "pare",
				"total_gestantes": pare["total_gestantes"],
				"fecha_referencia": pare["fecha_referencia"],
				"lista": pare["indicadores"],
			},
			"descriptivos": {
				"label": "Distribucion de la cohorte",
				"type": "descriptivos",
				"data": {
					"sexo": sexo,
					"regimen": regimen,
					"etnia": etnia,
					"zona": zona,
					"riesgo": riesgo,
					"vih": vih,
					"sifilis": sifilis,
					"hipertension": hipertension,
					"diabetes": diabetes,
					"trimestre": trimestre,
					"tipo_parto": parto,
					"condicion_rn": condicion_rn,
					"vacuna_bcg": vacuna_bcg,
					"vacuna_hepb": vacuna_hepb,
				},
			},
		}

	elif template_key == "citologia":
		resultado_citologia = count_values(safe_col("RESULTADO CITOLOGIA CERVICOUTERINA"))
		tipo_doc = count_values(safe_col("TIPO DE DOCUMENTO DE IDENTIDAD"))
		result["indicadores"] = {
			"resultado_citologia": {"label": "Resultado citologia", "data": resultado_citologia, "total": totalregistros},
			"tipo_documento": {"label": "Tipo de documento", "data": tipo_doc, "total": totalregistros},
		}

	elif template_key == "mamografia":
		resultado_mamo = count_values(safe_col("RESULTADO MAMOGRAFIA"))
		result["indicadores"] = {
			"resultado_mamografia": {"label": "Resultado mamografia", "data": resultado_mamo, "total": totalregistros},
		}

	elif template_key == "penta":
		vacuna_penta = count_values(safe_col("VACUNACION PENTAVALENTE"))
		result["indicadores"] = {
			"vacuna_penta": {"label": "Vacunacion pentavalente", "data": vacuna_penta, "total": totalregistros},
		}

	else:
		result["indicadores"] = {}

	return result


if __name__ == "__main__":
	import uvicorn
	uvicorn.run(app, host="0.0.0.0", port=8000)
