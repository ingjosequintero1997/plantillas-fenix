import re
import unicodedata
from datetime import datetime
from difflib import SequenceMatcher
import pandas as pd
from dateutil import parser

MUNICIPALITY_CODE_ALIASES = {
	"RIOHACHA": 44001,
	"ALBANIA": 44035,
	"BARRANCAS": 44078,
	"DIBULLA": 44090,
	"DISTRACCION": 44098,
	"EL MOLINO": 44110,
	"FONSECA": 44279,
	"HATONUEVO": 44378,
	"LA JAGUA DEL PILAR": 44420,
	"MAICAO": 44430,
	"MANAURE": 44560,
	"SAN JUAN DEL CESAR": 44650,
	"URIBIA": 44847,
	"URUMITA": 44855,
	"VILLANUEVA": 44874,
	"VALLEDUPAR": 20001,
	"AGUACHICA": 20011,
	"AGUSTIN CODAZZI": 20013,
	"ASTREA": 20032,
	"BECERRIL": 20045,
	"BOSCONIA": 20060,
	"CHIMICHAGUA": 20175,
	"CHIRIGUANA": 20178,
	"CURUMANI": 20228,
	"EL COPEY": 20238,
	"EL PASO": 20250,
	"GAMARRA": 20295,
	"GONZALEZ": 20310,
	"LA GLORIA": 20383,
	"LA JAGUA DE IBIRICO": 20400,
	"MANAURE BALCON DEL CESAR": 20443,
	"PAILITAS": 20517,
	"PELAYA": 20550,
	"PUEBLO BELLO": 20570,
	"RIO DE ORO": 20614,
	"LA PAZ": 20621,
	"PAZ ROBLES": 20621,
	"SAN ALBERTO": 20710,
	"SAN DIEGO": 20750,
	"SAN MARTIN": 20770,
	"TAMALAMEQUE": 20787,
}

FIELD_SET_ALIASES = {
	"REGIMEN DE AFILIACION": {
		"SUBSIDIADO": {"SUBSIDIADO", "SUBSIDIADA", "SUBS", "SUB", "SISBEN", "SISBENIZADO"},
		"CONTRIBUTIVO": {"CONTRIBUTIVO", "CONTRIBUTIBA", "CONTRIB", "COTIZANTE", "EPS"},
	},
	"GRUPO POBLACIONAL": {
		"CABEZA DE FAMILIA": {"CABEZA DE FAMILIA", "CABEZA FAMILIA"},
		"JOVENES VULNERABLES": {"JOVENES VULNERABLES", "JOVEN VULNERABLE", "JOVENES", "JUVENTUD VULNERABLE"},
		"POBLACION INFANTIL A CARGO DEL ICBF": {"ICBF", "POBLACION ICBF", "INFANTIL ICBF", "A CARGO DEL ICBF"},
		"MUJER CABEZA DE HOGAR": {"MUJER CABEZA DE HOGAR", "MADRE CABEZA DE HOGAR", "CABEZA DE HOGAR"},
		"DISCAPACITADOS": {"DISCAPACITADO", "DISCAPACITADOS", "DISCAPACIDAD"},
		"OTRO GRUPO POBLACIONAL": {
			"OTRO",
			"OTROS",
			"OTRO GRUPO",
			"OTRO GRUPO POBLACIONAL",
			"COMUNIDADES INDIGENAS",
			"COMUNIDAD INDIGENA",
			"VICTIMAS DEL CONFLICTO ARMADO",
			"VICTIMA DEL CONFLICTO ARMADO",
			"VICTIMAS CONFLICTO",
			"POBLACION VICTIMA",
			"DESPLAZADOS",
			"POBLACION DESPLAZADA",
			"MUJER EMBARAZADA",
			"GESTANTE",
		},
		"DESMOVILIZADOS": {"DESMOVILIZADO", "DESMOVILIZADOS"},
		"ADULTO MAYOR": {"ADULTO MAYOR", "ADULTO", "MAYOR", "TERCERA EDAD", "GERIATRICO"},
	},
	"ETNIA": {
		"WAYUU": {"WAYUU", "WAYU", "GUAJIRO"},
		"ARHUACO": {"ARHUACO", "IKU"},
		"WIWA": {"WIWA", "ARSARIO", "SANKA"},
		"YUKPA": {"YUKPA", "YUCPA"},
		"KOGI": {"KOGI", "KOGUI", "COGUI"},
		"INGA": {"INGA"},
		"KANKUAMO": {"KANKUAMO", "KANKUAM"},
		"CHIMILA": {"CHIMILA", "ETTE ENNAKA", "ETTE", "ETTEENNKA"},
		"ZENU": {"ZENU", "ZENUES"},
		"SIN ETNIA": {"NINGUNO", "NINGUNA", "NINGUNAS", "NINGUNAS DE LAS ANTERIORES", "NO TIENE", "NO APLICA", "N/A", "SIN", "NINGUN GRUPO ETNICO"},
	},
	"CLASIFICACION DEL RIESGO": {
		"CLASIFICACION DEL RIESGO ALTO": {"ALTO", "RIESGO ALTO", "ALTO RIESGO", "ALTO RIESGO OBSTETRICO", "RIESGO OBSTETRICO"},
		"CLASIFICACION DEL RIESGO BAJO": {"BAJO", "RIESGO BAJO", "BAJO RIESGO", "SIN RIESGO"},
	},
	"GESTANTE RENUENTE": {
		"SI": {"SI", "S", "GESTANTE RENUENTE"},
		"NO": {"NO", "N", "NO RENUENTE", "RENUENTE"},
	},
	"FACTOR DE RIESGO POR PA": {
		"CLASIFICACION DEL RIESGO ALTO": {"ALTO", "RIESGO ALTO", "RIESGO ELEVADO", "PA ALTA"},
		"CLASIFICACION DEL RIESGO BAJO": {"BAJO", "RIESGO BAJO", "PA BAJA"},
	},
	"TRIMESTRE INICIO CONTROL": {
		"PRIMER TRIMESTRE": {"1 TRIM", "TRIM 1", "PRIMER", "1ER", "1ER TRIM", "PRIM TRIM"},
		"SEGUNDO TRIMESTRE": {"2 TRIM", "TRIM 2", "SEGUNDO", "2DO", "2DO TRIM", "SEG TRIM"},
		"TERCER TRIMESTRE": {"3 TRIM", "TRIM 3", "TERCER", "3ER", "3ER TRIM", "TER TRIM"},
	},
	"TRIMESTRE TOMA SEGUNDA PRUEBA VIH": {
		"PRIMER TRIMESTRE": {"1 TRIM", "TRIM 1", "PRIMER", "1ER", "1ER TRIM", "PRIM TRIM", "1"},
		"SEGUNDO TRIMESTRE": {"2 TRIM", "TRIM 2", "SEGUNDO", "2DO", "2DO TRIM", "SEG TRIM", "2"},
		"TERCER TRIMESTRE": {"3 TRIM", "TRIM 3", "TERCER", "3ER", "3ER TRIM", "TER TRIM", "3"},
	},
	"CLASIFICACION DE HTA DE INGRESO": {
		"NORMAL": {"PRE HTA", "PREHIPERTENSION", "HIPOTENSION", "NORMAL"},
		"ESTADIO1": {"ESTADIO 1", "HTA 1", "HIPERTENSION 1"},
		"ESTADIO2": {"ESTADIO 2", "HTA 2", "HIPERTENSION 2"},
		"ESTADIO3": {"ESTADIO 3", "HTA 3", "HIPERTENSION 3"},
		"SIN DATO": {"NO DATO", "SIN INFORMACION", "NO REPORTA", "N/R"},
	},
	"CLASIFICACION DE HTA": {
		"ESTADIO1": {"ESTADIO 1", "HTA 1", "HIPERTENSION 1"},
		"ESTADIO2": {"ESTADIO 2", "HTA 2", "HIPERTENSION 2"},
		"HIPOTENSION": {"HIPOTENSION", "HIPO"},
		"PRE HTA": {"PRE HTA", "PREHIPERTENSION", "PREHIPER"},
		"SIN DATO": {"NO DATO", "SIN INFORMACION", "NO REPORTA", "N/R"},
	},
}

FIELD_FUZZY_MIN_SCORE = {
	"GRUPO POBLACIONAL": 0.62,
	"ETNIA": 0.60,
}

FIELD_NUMERIC_CODE_MAP = {
	"GRUPO POBLACIONAL": [
		"CABEZA DE FAMILIA",
		"JOVENES VULNERABLES",
		"POBLACION INFANTIL A CARGO DEL ICBF",
		"MUJER CABEZA DE HOGAR",
		"DISCAPACITADOS",
		"OTRO GRUPO POBLACIONAL",
		"DESMOVILIZADOS",
		"ADULTO MAYOR",
	],
	"ETNIA": ["WAYUU", "ARHUACO", "WIWA", "YUKPA", "KOGI", "INGA", "KANKUAMO", "CHIMILA", "ZENU", "SIN ETNIA"],
}

FIELD_KEYWORD_CANONICAL = {
	"ETNIA": {
		"WAYU": "WAYUU",
		"GUAJIRO": "WAYUU",
		"ARHUAC": "ARHUACO",
		"IKU": "ARHUACO",
		"WIWA": "WIWA",
		"ARSARIO": "WIWA",
		"SANKA": "WIWA",
		"YUKPA": "YUKPA",
		"YUCPA": "YUKPA",
		"KOGUI": "KOGI",
		"COGUI": "KOGI",
		"KOGI": "KOGI",
		"INGA": "INGA",
		"KANKUAM": "KANKUAMO",
		"CHIMILA": "CHIMILA",
		"ETTE": "CHIMILA",
		"ENNAKA": "CHIMILA",
		"ZENU": "ZENU",
		"ZENUES": "ZENU",
		"SIN ETNIA": "SIN ETNIA",
		"NINGUNO": "SIN ETNIA",
		"NINGUNA": "SIN ETNIA",
		"SIN": "SIN ETNIA",
	},
}

def normalize_text(v) -> str:
	if v is None or pd.isna(v):
		return ""
	s = str(v).strip().upper()
	s = unicodedata.normalize("NFD", s)
	s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
	s = s.replace("_", " ")
	s = re.sub(r"\s+", " ", s)
	return s

def to_int_safe(v):
	if v is None or pd.isna(v):
		return None
	raw = str(v).strip()
	if raw == "":
		return None

	# Soporta entradas decimales para campos enteros (ej: 35,0 o 35.0).
	# NOTA: debe ir ANTES del compact para no concatenar dígitos de la parte decimal.
	numeric = raw.replace(" ", "")
	numeric = numeric.replace(",", ".")
	numeric = re.sub(r"[^0-9.\-+]", "", numeric)
	if re.fullmatch(r"[+-]?\d+(\.\d+)?", numeric):
		try:
			return int(float(numeric))
		except Exception:
			pass

	# Soporta teléfonos/identificaciones con separadores y texto accidental.
	# Solo aplica cuando NO hay punto decimal en el original.
	if "." not in raw:
		compact = re.sub(r"[^0-9+\-]", "", raw)
		if re.fullmatch(r"[+-]?\d+", compact):
			return int(compact)

	return None


def to_municipality_code(v):
	if v is None or pd.isna(v):
		return None
	code = to_int_safe(v)
	if code is not None:
		return code
	normalized = normalize_text(v)
	if normalized in MUNICIPALITY_CODE_ALIASES:
		return MUNICIPALITY_CODE_ALIASES[normalized]
	for alias, municipality_code in MUNICIPALITY_CODE_ALIASES.items():
		if alias in normalized or normalized in alias:
			return municipality_code
	return None

def to_decimal_safe(v):
	if v is None or pd.isna(v):
		return None
	s = str(v).strip().replace(" ", "")
	if s == "":
		return None

	# Heurística para miles/decimales con coma y punto mixtos.
	if "," in s and "." in s:
		if s.rfind(",") > s.rfind("."):
			s = s.replace(".", "")
			s = s.replace(",", ".")
		else:
			s = s.replace(",", "")
	elif s.count(",") == 1 and s.count(".") == 0:
		s = s.replace(",", ".")
	elif s.count(".") > 1 and s.count(",") == 0:
		s = s.replace(".", "")

	s = re.sub(r"[^0-9\.\-+]", "", s)
	try:
		return float(s)
	except Exception:
		return None

def to_date_iso(v):
	if v is None or pd.isna(v):
		return None

	# Excel serial date (1900 date system) — también cuando viene como string por dtype=str
	serial = None
	if isinstance(v, (int, float)):
		serial = int(v)
	elif isinstance(v, str):
		try:
			serial = int(v)
		except (ValueError, TypeError):
			pass
	if serial is not None and 1 <= serial <= 60000:
		try:
			base = datetime(1899, 12, 30)
			return (base + pd.to_timedelta(serial, unit="D")).strftime("%Y-%m-%d")
		except Exception:
			pass

	s = str(v).strip()
	if s == "":
		return None

	# ISO datetime con componente de hora (YYYY-MM-DD HH:MM:SS): extraer solo la fecha
	iso_match = re.match(r"^(\d{4}-\d{2}-\d{2})\s", s)
	if iso_match:
		return iso_match.group(1)

	# Formato compacto: YYYYMMDD (sin separadores) — detectar por prefijo de año
	only_digits = re.sub(r"\D", "", s)
	if len(only_digits) == 8 and only_digits[:4].isdigit() and int(only_digits[:4]) >= 1900:
		try:
			return datetime.strptime(only_digits, "%Y%m%d").strftime("%Y-%m-%d")
		except Exception:
			pass
	only_digits = re.sub(r"\D", "", s)
	if len(only_digits) == 8:
		if only_digits[:4].isdigit() and int(only_digits[:4]) >= 1900:
			candidate = f"{only_digits[:4]}-{only_digits[4:6]}-{only_digits[6:8]}"
			try:
				return datetime.strptime(candidate, "%Y-%m-%d").strftime("%Y-%m-%d")
			except Exception:
				pass
		candidate = f"{only_digits[0:2]}/{only_digits[2:4]}/{only_digits[4:8]}"
		try:
			return datetime.strptime(candidate, "%d/%m/%Y").strftime("%Y-%m-%d")
		except Exception:
			pass

	formats = ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%y", "%m/%d/%Y")
	for fmt in formats:
		try:
			return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
		except Exception:
			pass
	try:
		return parser.parse(s, dayfirst=True).strftime("%Y-%m-%d")
	except Exception:
		return None

def normalize_set(v, allowed, field_name=None):
	if v is None or pd.isna(v):
		return None
	original_allowed = [str(a).strip() for a in allowed]
	normalized_allowed = [normalize_text(a) for a in original_allowed]
	s = str(v).strip()
	sn = normalize_text(s)
	field_name = normalize_text(field_name)

	# Direct match (case-sensitive) — preserva capitalización
	if s in original_allowed:
		return s

	# Case-insensitive match — retorna el valor original con su capitalización
	if sn in normalized_allowed:
		return original_allowed[normalized_allowed.index(sn)]

	if field_name and "CONTROL REALIZADO POR" in field_name:
		if "INTERNISTA" in sn:
			return "INTERNISTA" if normalize_text("INTERNISTA") in normalized_allowed else None
		if "MEDICO" in sn:
			return "MEDICO GENERAL" if normalize_text("MEDICO GENERAL") in normalized_allowed else None
		if "NUTRI" in sn:
			return "NUTRICIONISTA" if normalize_text("NUTRICIONISTA") in normalized_allowed else None
		if "ENFERMER" in sn:
			return "ENFERMERIA" if normalize_text("ENFERMERIA") in normalized_allowed else None

	# Mapeo por código numérico cuando el archivo trae catálogos codificados.
	if re.fullmatch(r"\d+", sn):
		code_values = FIELD_NUMERIC_CODE_MAP.get(field_name)
		if code_values:
			idx = int(sn) - 1
			if 0 <= idx < len(code_values):
				candidate = code_values[idx]
				if normalize_text(candidate) in normalized_allowed:
					return candidate

		# También acepta códigos embebidos en texto (ej: "1-WAYUU", "COD 3").
	code_values = FIELD_NUMERIC_CODE_MAP.get(field_name)
	if code_values:
		digit_match = re.search(r"\b(\d{1,2})\b", sn)
		if digit_match:
			idx = int(digit_match.group(1)) - 1
			if 0 <= idx < len(code_values):
				candidate = code_values[idx]
				if normalize_text(candidate) in normalized_allowed:
					return candidate

	if not sn:
		return None

	aliases = {
		"SI": {"S", "1", "YES", "Y", "TRUE", "T"},
		"NO": {"N", "0", "FALSE", "F"},
		"MASCULINO": {"M"},
		"FEMENINO": {"F"},
		"CC": {"CEDULA", "CEDULA DE CIUDADANIA", "C.C.", "C.C"},
		"TI": {"TARJETA IDENTIDAD", "TARJETA DE IDENTIDAD", "T.I."},
		"CE": {"CEDULA DE EXTRANJERIA", "C.E."},
		"RC": {"REGISTRO CIVIL", "R.C."},
		"PA": {"PASAPORTE"},
		"MSI": {"MENOR SIN IDENTIFICACION", "MS"},
		"ASI": {"ADULTO SIN IDENTIFICACION", "AS"},
		"CD": {"CARNE DIPLOMATICO", "C.D."},
	}
	# Aliases generales (CC -> CEDULA, TI -> TARJETA IDENTIDAD, etc.)
	for alias_canonical, alias_synonyms in aliases.items():
		norm_canonical = normalize_text(alias_canonical)
		norm_synonyms = {normalize_text(a) for a in alias_synonyms}
		if sn in norm_synonyms and norm_canonical in normalized_allowed:
			return original_allowed[normalized_allowed.index(norm_canonical)]

	field_aliases = FIELD_SET_ALIASES.get(field_name, {})
	keyword_map = FIELD_KEYWORD_CANONICAL.get(field_name, {})
	for keyword, canonical in keyword_map.items():
		if keyword in sn and normalize_text(canonical) in normalized_allowed:
			return canonical

	for canonical, alias_values in field_aliases.items():
		alias_normalized = {normalize_text(item) for item in alias_values}
		if sn in alias_normalized:
			return canonical
		for alias_value in alias_normalized:
			if alias_value and (alias_value in sn or sn in alias_value):
				return canonical

	# match por normalización compacta
	compact = sn.replace(" ", "")
	for i, orig in enumerate(original_allowed):
		if compact == normalized_allowed[i].replace(" ", ""):
			return orig
	for canonical, alias_values in field_aliases.items():
		for alias_value in alias_values:
			if compact == normalize_text(alias_value).replace(" ", ""):
				return canonical

	# Match por subcadena/prefijo: si el input normalizado es prefijo de
	# exactamente un valor permitido, es match de alta confianza sin alterar
	# la coherencia del dato (ej: "SOBREPESO" → "SOBREPESO (25.0-29.9)").
	contained = []
	for i, orig in enumerate(original_allowed):
		norm = normalized_allowed[i].replace(" ", "")
		if len(compact) >= 3 and (norm.startswith(compact) or compact.startswith(norm)):
			contained.append(orig)
	if len(contained) == 1:
		return contained[0]
	if len(contained) > 1:
		contained.sort(key=lambda x: -len(x))
		return contained[0]

	# Fuzzy para errores de digitación leves (ej: CONTRIBUTIBO -> CONTRIBUTIVO).
	best = None
	best_score = 0.0
	for i, orig in enumerate(original_allowed):
		norm = normalized_allowed[i]
		score = SequenceMatcher(None, compact, norm.replace(" ", "")).ratio()
		if score > best_score:
			best_score = score
			best = orig
	for canonical, alias_values in field_aliases.items():
		for alias_value in alias_values:
			score = SequenceMatcher(None, compact, normalize_text(alias_value).replace(" ", "")).ratio()
			if score > best_score:
				best_score = score
				best = canonical
	min_score = FIELD_FUZZY_MIN_SCORE.get(field_name, 0.78)
	if best is not None and best_score >= min_score:
		return best

	# ETNIA: si hay texto no vacío, intenta mejor coincidencia aún más tolerante.
	if field_name == "ETNIA" and compact:
		best = None
		best_score = 0.0
		for i, orig in enumerate(original_allowed):
			norm = normalized_allowed[i]
			score = SequenceMatcher(None, compact, norm.replace(" ", "")).ratio()
			if score > best_score:
				best_score = score
				best = orig
		if best is not None and best_score >= 0.45:
			return best

	return None


def format_decimal(value: float) -> str:
	# Redondea a máximo 2 decimales, evita notación científica
	rounded = round(float(value), 2)
	text = f"{rounded:.2f}".rstrip("0").rstrip(".")
	return text if text else "0"


def correct_decimal_by_field(field_name, value):
	norm_field = normalize_text(field_name)
	if "REPORTE DE HEMOGLOBINA GLICOSILADA" in norm_field and "USUARIOS CON DX DE DM" in norm_field:
		if value is None or pd.isna(value):
			return None
		raw = str(value).strip().upper()
		if raw in {"NO APLICA", "N/A", "NA", "SIN DATO", "PENDIENTE"}:
			return 0.0
	return to_decimal_safe(value)


def preserve_original_if_present(value):
	if value is None or pd.isna(value):
		return None
	text = str(value).strip()
	return text if text != "" else None


def safe_default_for_required(tdef: dict):
	type_name = tdef.get("type")
	original_allowed = [str(item).strip() for item in tdef.get("allowed", [])]
	allowed_upper = [a.upper() for a in original_allowed]
	if type_name == "SET":
		if "SIN DATO" in allowed_upper:
			return "SIN DATO"
		if "NO APLICA" in allowed_upper:
			return "NO APLICA"
		if "NO" in allowed_upper:
			return "NO"
		for a in original_allowed:
			if a.upper().startswith("SIN "):
				return a
		if original_allowed:
			return original_allowed[0]
		return "SIN DATO"
	if type_name == "INT":
		return "0"
	if type_name == "DECIMAL":
		return "0"
	if type_name == "DATE":
		return "1900-01-01"
	if type_name == "TEXT":
		return "SIN DATO"
	return "SIN DATO"

def validate_and_correct(df: pd.DataFrame, mapping: dict, template: list):
	# Limpieza de emergencia: reemplaza valores malformados
	def clean_malformed(x):
		if x is None or pd.isna(x):
			return None
		s = str(x).strip().upper()
		s_clean = re.sub(r"\s+", "", s)
		# Normaliza cualquier variación de "SIN DATO" / "SIN DATOS"
		if s_clean in ("SINDATO", "SINDATOS", "S/D", "SIN", "SD"):
			return "SIN DATO"
		if s in ("AC",):
			return "SIN DATO"
		return x
	
	# Usar map() en lugar de applymap() (pandas 2.1+)
	try:
		df = df.map(clean_malformed)
	except AttributeError:
		df = df.applymap(clean_malformed)
	
	tmap = {t["name"]: t for t in template}
	normalized_tmap = {normalize_text(t["name"]): t["name"] for t in template}
	template_cols = [t["name"] for t in template]
	inverse = {}
	for orig, templ in (mapping or {}).items():
		if not templ:
			continue
		canonical = normalized_tmap.get(normalize_text(templ))
		if canonical:
			inverse[canonical] = orig
	rows = []
	logs = []
	stats = {"total": int(len(df)), "errors": 0, "corrected": 0, "ok": 0}

	for ridx, row in df.iterrows():
		out = {}
		for col in template_cols:
			tdef = tmap[col]
			src = inverse.get(col)
			val = row.get(src) if src in df.columns else None
			orig_val = None if val is None or pd.isna(val) else str(val)
			status = "ok"
			corrected = None

			if tdef["type"] == "TEXT":
				raw_val = None if val is None or pd.isna(val) else str(val).strip()
				if raw_val in (None, "None", "", "nan", "NAN"):
					corrected = "SIN DATO"
					status = "corrected"
				elif re.match(r"^\d+$", raw_val.replace(" ", "")):
					corrected = "SIN DATO"
					status = "corrected"
				else:
					corrected = re.sub(r" \d{2}:\d{2}:\d{2}(\.\d+)?$", "", raw_val)
					if orig_val is not None and corrected != orig_val.strip():
						status = "corrected"

			elif tdef["type"] == "INT":
				corrected_int = to_municipality_code(val) if normalize_text(col) == "MUNICIPIO DE RESIDENCIA" else to_int_safe(val)
				if corrected_int is None:
					status = "corrected"
					corrected = safe_default_for_required(tdef)
				else:
					corrected = str(corrected_int)
					if orig_val is not None and corrected != orig_val.strip():
						status = "corrected"

			elif tdef["type"] == "DECIMAL":
				corrected_dec = correct_decimal_by_field(col, val)
				if corrected_dec is None:
					status = "corrected"
					corrected = safe_default_for_required(tdef)
				else:
					corrected = format_decimal(corrected_dec)
					if orig_val is not None and corrected != orig_val.strip():
						status = "corrected"

			elif tdef["type"] == "DATE":
				corrected_date = to_date_iso(val)
				if corrected_date is None:
					status = "corrected"
					corrected = safe_default_for_required(tdef)
				else:
					corrected = corrected_date
					if orig_val is not None and corrected != orig_val.strip():
						status = "corrected"

			elif tdef["type"] == "SET":
				corrected_set = normalize_set(val, tdef.get("allowed", []), col)
				if corrected_set is None:
					status = "corrected"
					corrected = safe_default_for_required(tdef)
				else:
					corrected = corrected_set
					if orig_val is not None and normalize_text(orig_val) != normalize_text(corrected):
						status = "corrected"

			out[col] = corrected
			if status == "error":
				stats["errors"] += 1
				logs.append({"row": int(ridx) + 1, "column": col, "original": orig_val, "corrected": corrected, "status": "error"})
			elif status == "corrected":
				stats["corrected"] += 1
				logs.append({"row": int(ridx) + 1, "column": col, "original": orig_val, "corrected": corrected, "status": "corrected"})
			else:
				stats["ok"] += 1

		rows.append(out)

	out_df = pd.DataFrame(rows, columns=template_cols)
	# Rellenar cualquier NaN residual para evitar campos vacíos en exportación
	out_df = out_df.fillna("SIN DATO").astype(str)
	total_cells = max(1, stats["total"] * len(template_cols))
	stats["quality_percent"] = round(100 * (1 - stats["errors"] / total_cells), 2)
	return out_df, logs, stats
