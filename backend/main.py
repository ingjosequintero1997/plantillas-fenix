from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pandas as pd
import io
import re
import hashlib
import hmac
import json
import base64
from datetime import datetime, timedelta
from pydantic import BaseModel
try:
	from .utils import fuzzy_map, normalize_text
	from .templates_registry import get_template_by_key, list_templates_meta
	from .validators import validate_and_correct
	from .evaluator import evaluate, build_evaluation_excel
except ImportError:
	from utils import fuzzy_map, normalize_text
	from templates_registry import get_template_by_key, list_templates_meta
	from validators import validate_and_correct
	from evaluator import evaluate, build_evaluation_excel

import os

API_ROOT_PATH = os.environ.get("API_ROOT_PATH", "")
app = FastAPI(title="Validador IPS", root_path=API_ROOT_PATH)

class RevalidatePayload(BaseModel):
	raw_text: str
	mapping: dict[str, str | None]
	template_key: str = "rcv"

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
TOKEN_SECRET = os.environ.get("TOKEN_SECRET", "fenix-secret-change-in-production")

USERS = {
    "admin": {"password": "admin123", "name": "Administrador", "role": "admin"},
}

security = HTTPBearer(auto_error=False)

class LoginPayload(BaseModel):
    username: str
    password: str

def create_token(username: str) -> str:
    payload = json.dumps({"sub": username, "exp": (datetime.utcnow() + timedelta(hours=8)).isoformat()})
    b64 = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    sig = hmac.new(TOKEN_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"

def verify_token(token: str) -> str | None:
    try:
        b64, sig = token.split(".")
        expected = hmac.new(TOKEN_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        padded = b64 + "=" * (4 - len(b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        exp = datetime.fromisoformat(payload["exp"])
        if datetime.utcnow() > exp:
            return None
        return payload["sub"]
    except Exception:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="No autorizado")
    username = verify_token(credentials.credentials)
    if username is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = USERS.get(username)
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

@app.post("/auth/login")
async def auth_login(payload: LoginPayload):
    user = USERS.get(payload.username)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_token(payload.username)
    return {"token": token, "user": {"username": payload.username, "name": user["name"], "role": user["role"]}}

@app.get("/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    return {"user": {"username": current_user["name"], "name": current_user["name"], "role": current_user["role"]}}

@app.get("/health")
async def health():
	return {"status": "ok"}

@app.get("/template")
async def get_template(template_key: str = Query(default="rcv")):
	meta = get_template_by_key(template_key)
	return {
		"template_key": meta["key"],
		"label": meta["label"],
		"template": meta["template"],
	}

@app.get("/templates")
async def get_templates():
	return {"templates": list_templates_meta()}

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
		last_non_empty = -1
		for col_idx in range(df.shape[1]):
			if any(df.iloc[:, col_idx].astype(str).str.strip() != ""):
				last_non_empty = col_idx
		if last_non_empty >= 0:
			df = df.iloc[:, : last_non_empty + 1]
	df = df[df.apply(lambda row: any(cell != "" for cell in row), axis=1)]
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
		"corrected_text": corrected_text,
		"preview_rows": preview_rows,
		"raw_text": raw_text,
		"template_names": [t['name'] for t in active_template],
	}

@app.post("/upload")
async def upload_file(
	file: UploadFile = File(...),
	template_key: str = Form(default="rcv"),
	strict_mode: bool = Form(default=False),
	min_template_coverage: float = Form(default=95.0),
	require_exact_columns: bool = Form(default=True),
):
	meta = get_template_by_key(template_key)
	active_template = meta["template"]
	active_names = template_names(active_template)
	template_key = meta["key"]
	filename = (file.filename or '').lower()
	if not (filename.endswith('.txt') or filename.endswith('.xlsx') or filename.endswith('.xls')):
		raise HTTPException(status_code=400, detail="Solo se permiten .txt, .xlsx o .xls")
	
	try:
		contents = await file.read()
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

@app.post("/revalidate")
async def revalidate(payload: RevalidatePayload):
	try:
		meta = get_template_by_key(payload.template_key)
		active_template = meta["template"]
		template_key = meta["key"]
		df = pd.read_csv(io.StringIO(payload.raw_text), sep='|', dtype=str, engine='python')
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

@app.post("/evaluate")
async def evaluate_endpoint(payload: dict, format: str = Query(default="json")):
	ct = payload.get('corrected_text', '')
	template_names = payload.get('template_names', [])
	template_key = payload.get('template_key', 'rcv')
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

        cell2 = ws.cell(row=2, column=col_idx)
        cell2.fill = type_fills.get(f['type'], PatternFill())
        cell2.border = thin_border
        cell2.alignment = Alignment(vertical="center")

        if f['type'] == 'DATE':
            cell2.number_format = 'yyyy-mm-dd'
            # Aplicar formato de fecha a 100 filas para que al pegar datos Excel reconozca seriales como fechas
            for r in range(3, 102):
                c = ws.cell(row=r, column=col_idx)
                c.number_format = 'yyyy-mm-dd'
                c.border = thin_border

        allowed = f.get('allowed', [])
        if allowed:
            formula = register_list(allowed)
            dv = DataValidation(type="list", formula1=formula, allow_blank=True)
            dv.error = f"Valor no permitido. Use uno de: {', '.join(allowed)}"
            dv.errorTitle = "Valor inválido"
            ws.add_data_validation(dv)
            dv.add(cell2)

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

if __name__ == "__main__":
	import uvicorn
	uvicorn.run(app, host="0.0.0.0", port=8000)
