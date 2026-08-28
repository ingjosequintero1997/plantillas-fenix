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
		"SUBSIDIADO": {"SUBSIDIADO", "SUBSIDIADA", "SUBS", "SUB", "SISBEN", "SISBENIZADO", "S"},
		"CONTRIBUTIVO": {"CONTRIBUTIVO", "CONTRIBUTIBA", "CONTRIB", "COTIZANTE", "EPS", "C"},
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
		"SIN ETNIA": {"NINGUNO", "NINGUNA", "NINGUNAS", "NINGUNAS DE LAS ANTERIORES", "NO TIENE", "NO APLICA", "N/A", "SIN", "NINGUN GRUPO ETNICO", "NEGRO(A), MULATO(A), AFROCOLOMBIANO O AFRODECENDIENTE", "NEGRO(A), MULATO(A), AFROCOLOMBIANO", "AFROCOLOMBIANO", "AFROCOLOMBIANA", "NEGRO", "NEGRA", "MULATO", "MULATA", "AFRODECENDIENTE", "AFRODESCENDIENTE", "GITANO", "GITANA", "ROM", "ROOM", "PALENQUERO", "PALENQUERA", "RAIZAL"},
	},
	"CLASIFICACION DEL RIESGO": {
		"CLASIFICACION DEL RIESGO ALTO": {"ALTO", "RIESGO ALTO", "ALTO RIESGO", "ALTO RIESGO OBSTETRICO", "RIESGO OBSTETRICO", "ALTO RIESGO OBSTETRICO", "RIESGO ALTO OBSTETRICO"},
		"CLASIFICACION DEL RIESGO BAJO": {"BAJO", "RIESGO BAJO", "BAJO RIESGO", "SIN RIESGO", "BAJO RIESGO OBSTETRICO", "RIESGO BAJO OBSTETRICO"},
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
	"TOMA DE PRUEBAS ITS INTRAPARTO": {
		"NO": {"SIN DATO"},
	},
	"DISCAPACIDAD": {
		"SI": {"SI", "S", "DISCAPACIDAD", "CON DISCAPACIDAD", "DISCAPACIDAD FISICA", "DISCAPACIDAD PSIQUICA", "DISCAPACIDAD MENTAL", "DISCAPACIDAD FISICA O PSIQUICA", "DISCAPACIDAD MENTAL O PSIQUICA"},
		"NO": {"NO", "N", "NINGUNA", "NINGUNO", "SIN DISCAPACIDAD", "NO TIENE", "NO APLICA", "SIN DATO"},
	},
	"CONTROL TRADICIONAL": {
		"SABEDOR ANCESTRAL": {"SABEDOR", "SABEDORA", "SABEDOR ANCESTRAL", "SABEDORA ANCESTRAL"},
		"PARTERA (O)": {"PARTERA", "PARTERO", "PARTERA (O)"},
		"SOBANDERA (O)": {"SOBANDERA", "SOBANDERO", "SOBANDERA (O)"},
		"NO APLICA": {"NINGUNA", "NINGUNO", "NO", "N/A", "NA", "SIN CONTROL", "NO TIENE"},
	},
	"QUIEN REALIZO EL CONTROL": {
		"MEDICO GINECOLOGIA": {"MEDICO", "MEDICO GINECOLOGIA", "MEDICO GINECOLOGO", "GINECOLOGO", "GINECOLOGIA", "MEDICO OBSTETRA", "OBSTETRA", "GO", "MD", "MEDICO GENERAL"},
		"AUX DE ENFERMERIA": {"AUX DE ENFERMERIA", "AUXILIAR DE ENFERMERIA", "AUX ENFERMERIA", "AUXILIAR", "AUX ENF", "AUXILAR DE ENFERMERIA"},
		"ENFERMERA (O)": {"ENFERMERA", "ENFERMERO", "ENFERMERA (O)", "ENFERMERIA", "ENF", "ENFERMERIA (O)"},
		"CONTROL TRADICIONAL (OBLIGATORIO)": {"CONTROL TRADICIONAL", "CONTROL TRADICIONAL (OBLIGATORIO)", "TRADICIONAL", "CONTROL TRAD", "SABEDOR ANCESTRAL", "PARTERA", "SOBANDERA", "MEDICO TRADICIONAL"},
	},
	"ZONA": {
		"RURAL": {"R", "RURAL", "RURAL DISPERSO", "CABECERA MUNICIPAL", "CENTRO POBLADO"},
		"URBANA": {"U", "URBANA", "URBANO", "CABECERA"},
	},
	"SEXO": {
		"MASCULINO": {"M", "MASCULINO", "HOMBRE"},
		"FEMENINO": {"F", "FEMENINO", "MUJER"},
	},
	"REGIMEN DE AFILIACION": {
		"SUBSIDIADO": {"SUBSIDIADO", "SUBSIDIADA", "SUBS", "SUB", "SISBEN", "SISBENIZADO", "S"},
		"CONTRIBUTIVO": {"CONTRIBUTIVO", "CONTRIBUTIBA", "CONTRIB", "COTIZANTE", "EPS", "C"},
	},
	"GENERO": {
		"MASCULINO": {"M", "MASCULINO", "HOMBRE"},
		"FEMENINO": {"F", "FEMENINO", "MUJER"},
	},
	"NIVEL EDUCATIVO": {
		"ANALFABETA": {"ANALFABETA", "ANALFABETO", "NO SABE LEER", "NO LEE"},
		"SABE LEER O ESCRIBIR": {"SABE LEER", "LEER Y ESCRIBIR", "SABE LEER Y ESCRIBIR", "LEE Y ESCRIBE"},
		"PRIMARIA COMPLETA": {"PRIMARIA COMPLETA", "PRIMARIA", "PRIMARIA COMPLETADA", "BASICA PRIMARIA", "BASICA PRIMARIA COMPLETA", "PRIMARIA COMPLETO"},
		"PRIMARIA INCOMPLETA": {"PRIMARIA INCOMPLETA", "PRIMARIA INCOMPLETO", "BASICA PRIMARIA INCOMPLETA"},
		"SECUNDARIA COMPLETA": {"SECUNDARIA", "SECUNDARIA COMPLETA", "BACHILLER", "BACHILLERATO", "BACHILLER COMPLETO", "BACHILLERATO COMPLETO", "11", "GRADO 11", "SECNDARIA", "SECUNDARIA COMPLETA", "SECUNDARIA COMPLETA ", "BASICA SECUNDARIA", "BASICA SECUNDARIA COMPLETA", "SECUNDARIA COMPLETO"},
		"SECUNDARIA INCOMPLETA": {"SECUNDARIA INCOMPLETA", "SECUNDARIA INCOMPLETO", "BACHILLERATO INCOMPLETO", "BACHILLER INCOMPLETO", "SECUNDARIA INCOMPLETA "},
		"TECNICO": {"TECNICO", "TECNICA", "TECNICO LABORAL"},
		"TECNOLOGO": {"TECNOLOGO", "TECNOLOGA", "TECNOLOGIA"},
		"PROFESIONAL UNIVERSITARIO": {"PROFESIONAL", "UNIVERSITARIO", "PROFESIONAL UNIVERSITARIO", "UNIVERSIDAD", "UNIVERSITARIA", "PROFESIONAL UNIVERSITARIA"},
		"SIN DATO": {"NO DEFINIDO", "NO DEFINED", "NO DEFINIDO (NINGUNO)", "NO DEFINIDO (NINGUNA)", "OTRO", "SIN INFORMACION", "NO REPORTA", "NINGUNO", "NINGUNA"},
	},
	"ANTECEDENTES DE EVENTOS OBSTETRICOS DESFAVORABLES": {
		"NINGUNO": {"NINGUNO", "NINGUNA", "NO", "N", "NONE", "SIN ANTECEDENTES", "NO PRESENTA", "NO APLICA"},
		"PREMATUREZ": {"PREMATUREZ", "PREMATURO"},
		"PLACENTA PREVIA": {"PLACENTA PREVIA", "PLACENTA"},
		"MUERTE FETAL O NEONATAL": {"MUERTE FETAL", "MUERTE NEONATAL", "MORTINATO"},
		"BAJO PESO AL NACER": {"BAJO PESO AL NACER", "BAJO PESO"},
	},
	"HABITOS DE RIESGO": {
		"NINGUNO": {"NINGUNO", "NINGUNA", "NO", "N", "NONE", "NO FUMA", "NO CONSUME"},
		"FUMA": {"FUMA", "FUMADOR", "FUMADORA", "TABACO"},
		"TOMA ALCOHOL": {"TOMA ALCOHOL", "ALCOHOL", "BEBEDOR"},
		"CONSUMO DE DROGAS": {"CONSUMO DE DROGAS", "DROGAS", "CONSUME DROGAS"},
		"SIN DATO": {"NO DEFINIDO", "NO DEFINED", "SIN INFORMACION"},
	},
	"PERTENECIA ETNICA": {
		"INDIGENA": {"INDIGENA", "INDIGENAS"},
		"MESTIZO": {"MESTIZO", "MESTIZA"},
		"NINGUNAS DE LAS ANTERIORES": {"NINGUNAS DE LAS ANTERIORES", "NINGUNA DE LAS ANTERIORES", "OTRO", "OTRA", "NINGUNA"},
		"ROM (GITANO)": {"ROM (GITANO)", "ROM", "GITANO", "GITANA", "ROOM"},
		"RAIZAL DEL ARCHIPIELAGO": {"RAIZAL DEL ARCHIPIELAGO", "RAIZAL", "RAIZALES"},
		"NEGRO (A), MULATO, AFROAMERICANO": {"NEGRO (A), MULATO, AFROAMERICANO", "NEGRO (A)", "NEGRO(A)", "NEGRA", "NEGRO", "MULATO", "MULATA", "AFROAMERICANO", "AFROAMERICANA", "AFROCOLOMBIANO", "AFROCOLOMBIANA", "AFRODESCENDIENTE"},
	},
	"RESULTADO GOTA GRUESA (MALARIA)": {
		"POSITIVO": {"POSITIVO", "POSITIVA", "REACTIVO"},
		"NEGATIVO": {"NEGATIVO", "NEGATIVA", "NO REACTIVO", "NO REACTIVA"},
		"SIN DATO": {"NO DEFINIDO", "NO DEFINED", "SIN INFORMACION", "NO REPORTA"},
	},
	"RESULTADO TAMIZAJE DE CUELLO UTERINO": {
		"NORMAL": {"NORMAL", "NEGATIVO", "NEGATIVA", "SIN ALTERACIONES"},
		"ALTERADO": {"ALTERADO", "ALTERADA", "POSITIVO", "POSITIVA", "ANORMAL"},
		"SIN DATO": {"NO DEFINIDO", "NO DEFINED", "SIN INFORMACION", "NO REPORTA"},
	},
	"RESULTADO RUBEOLA": {
		"POSITIVO": {"POSITIVO", "POSITIVA", "REACTIVO", "12.5"},
		"NEGATIVO": {"NEGATIVO", "NEGATIVA", "NO REACTIVO"},
		"SIN DATO": {"NO DEFINIDO", "NO DEFINED", "SIN INFORMACION"},
	},
}

FIELD_FUZZY_MIN_SCORE = {
	"GRUPO POBLACIONAL": 0.62,
	"ETNIA": 0.60,
}

# Columnas calculadas automaticamente por las formulas de la plantilla.
# En el validador no se exige que esten llenas (la formula las genera al 100%).
FORMULA_COLUMNS = {
	"EDAD", "FPP", "DIAS PARA EL PARTO", "ALARMA", "EDAD GEST INICIO CONTROL",
	"TRIMESTRE INICIO CONTROL", "INDICE DE MASA CORPORAL (IMC)", "CLASIFICACION DE IMC",
	"NUMERO TOTAL DE CONTROLES PRENATALES", "ULTIMO CONTROL PRENATAL",
	"EDAD GESTACIONAL ACTUAL", "IMC",
	"TRIMESTRE ASESORIA VIH", "TRIMESTRE TOMA PRUEBA VIH PRIMER TAMIZAJE",
	"TRIMESTRE TOMA PRUEBA VIH SEGUNDO TAMIZAJE", "TRIMESTRE TOMA PRUEBA VIH TERCER TAMIZAJE",
	"TRIMESTRE PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS",
	"TRIMESTRE SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS",
	"TRIMESTRE TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS",
	"TRIMESTRE TOMA SEGUNDA PRUEBA VIH", "TRIMESTRE PRUEBA CONFIRMATORIA SEGUN ALGORITMO",
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

_ACENTOS = str.maketrans("ÁÉÍÓÚÜÑáéíóúüñ", "AEIOUUNaeiouun")


def normalize_text(v) -> str:
	if v is None or pd.isna(v):
		return ""
	s = str(v).strip().upper()
	s = s.translate(_ACENTOS)
	s = s.replace("_", " ")
	s = re.sub(r"\s+", " ", s)
	return s


def normalize_series(ser: pd.Series) -> pd.Series:
	"""Normaliza una Series de texto de forma vectorizada (sin acentos, mayusculas)."""
	out = ser.fillna("").astype(str).str.strip().str.upper()
	out = out.str.translate(_ACENTOS)
	out = out.str.replace("_", " ", regex=False)
	out = out.str.replace(r"\s+", " ", regex=True)
	return out

def to_int_safe(v):
	if v is None or pd.isna(v):
		return None
	raw = str(v).strip()
	if raw == "":
		return None

	# Eliminar guiones (separadores de teléfono) antes de parsear
	clean = raw.replace("-", "")

	# Soporta entradas decimales para campos enteros (ej: 35,0 o 35.0).
	# NOTA: debe ir ANTES del compact para no concatenar dígitos de la parte decimal.
	numeric = clean.replace(" ", "")
	numeric = numeric.replace(",", ".")
	numeric = re.sub(r"[^0-9.+]", "", numeric)
	if re.fullmatch(r"[+-]?\d+(\.\d+)?", numeric):
		try:
			return int(float(numeric))
		except Exception:
			pass

	# Soporta teléfonos/identificaciones con separadores y texto accidental.
	# Solo aplica cuando NO hay punto decimal en el original.
	if "." not in raw:
		compact = re.sub(r"[^0-9+]", "", clean)
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
	if not normalized:
		return None
	if normalized in MUNICIPALITY_CODE_ALIASES:
		return MUNICIPALITY_CODE_ALIASES[normalized]
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
		# Intentar como entero primero, luego como float (ej: "45123.0"), luego con coma decimal (ej: "45123,0")
		cleaned = v.strip().replace(",", ".")
		try:
			serial = int(cleaned)
		except (ValueError, TypeError):
			try:
				serial = int(float(cleaned))
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
	iso_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$", s)
	if iso_match:
		anio, mes, dia = iso_match.group(1), iso_match.group(2), iso_match.group(3)
		try:
			datetime(int(anio), int(mes), int(dia))
			return f"{anio}-{mes}-{dia}"
		except Exception:
			return None

	# DD/MM/YYYY o DD-MM-YYYY (con o sin hora) - camino comun
	dm_match = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T].*)?$", s)
	if dm_match:
		dia, mes, anio = int(dm_match.group(1)), int(dm_match.group(2)), int(dm_match.group(3))
		try:
			datetime(anio, mes, dia)
			return f"{anio:04d}-{mes:02d}-{dia:02d}"
		except Exception:
			return None

	# YYYY/MM/DD
	ym_match = re.match(r"^(\d{4})[/](\d{1,2})[/](\d{1,2})$", s)
	if ym_match:
		anio, mes, dia = int(ym_match.group(1)), int(ym_match.group(2)), int(ym_match.group(3))
		try:
			datetime(anio, mes, dia)
			return f"{anio:04d}-{mes:02d}-{dia:02d}"
		except Exception:
			return None

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
	# Fechas con mes en texto (español o ingles): "3-abr-2000", "10 ene 2026",
	# "3 de abril de 2000", "Enero 10 de 2026". Comun en prestadores no tecnicos.
	meses = {
		"ENERO": 1, "ENE": 1, "JANUARY": 1, "JAN": 1,
		"FEBRERO": 2, "FEB": 2, "FEBRUARY": 2,
		"MARZO": 3, "MAR": 3, "MARCH": 3,
		"ABRIL": 4, "ABR": 4, "APRIL": 4, "APR": 4,
		"MAYO": 5, "MAY": 5,
		"JUNIO": 6, "JUN": 6, "JUNE": 6,
		"JULIO": 7, "JUL": 7, "JULY": 7,
		"AGOSTO": 8, "AGO": 8, "AUGUST": 8, "AUG": 8,
		"SEPTIEMBRE": 9, "SEP": 9, "SEPT": 9, "SEPTEMBER": 9,
		"OCTUBRE": 10, "OCT": 10, "OCTOBER": 10,
		"NOVIEMBRE": 11, "NOV": 11, "NOVEMBER": 11,
		"DICIEMBRE": 12, "DIC": 12, "DECEMBER": 12, "DEC": 12,
	}
	try:
		s_mes = re.sub(r"\bde\b|\bdel\b|\bo\b|\bof\b", " ", s, flags=re.IGNORECASE)
		s_mes = re.sub(r"[^A-Za-z0-9 ]+", " ", s_mes)
		partes = [p for p in s_mes.split() if p]
		dia = None
		mes = None
		anio = None
		nums = []
		for p in partes:
			up = p.upper()
			if up in meses:
				mes = meses[up]
			elif re.fullmatch(r"\d{1,2}", p):
				nums.append(int(p))
			elif re.fullmatch(r"\d{3,4}", p):
				anio = int(p)
		if len(nums) == 1:
			dia = nums[0]
		elif len(nums) == 2:
			dia, anio = nums[0], nums[1]
			if anio < 100:
				anio += 2000 if anio < 50 else 1900
		elif len(nums) == 3:
			dia, mes_n, anio = nums[0], nums[1], nums[2]
			if mes_n > 12:
				dia, mes_n = mes_n, dia
			mes = mes or mes_n
		if dia and mes and anio:
			if anio < 100:
				anio += 2000 if anio < 50 else 1900
			return datetime(anio, mes, dia).strftime("%Y-%m-%d")
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
		"MS": {"MENOR SIN IDENTIFICACION", "MSI", "MENOR DE EDAD SIN IDENTIFICACION"},
		"AS": {"ADULTO SIN IDENTIFICACION", "ASI", "ADULTO SIN ID"},
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
		return "1845-01-01"
	if type_name == "TEXT":
		return "SIN DATO"
	return "SIN DATO"


def rellenar_vacios(df: pd.DataFrame, template: list) -> pd.DataFrame:
	"""Rellena toda celda vacia con un valor por tipo segun el instructivo:
	texto -> SIN DATO, numerico -> 0, fecha -> 1845-01-01, SET -> SIN DATO.
	Nunca se deja validar un dato vacio."""
	tmap = {t["name"]: t for t in template}
	normalized_tmap = {normalize_text(t["name"]): t["name"] for t in template}
	out = df.copy()
	ausentes_upper = {"SIN DATO", "SIN DATOS", "N/A", "NONE", "NAN", "NULL", "NA"}
	for col in out.columns:
		canonical = normalized_tmap.get(normalize_text(col))
		tdef = tmap.get(canonical) if canonical else None
		if tdef is None:
			continue
		ser = out[col]
		# Vectorizado: marca celdas ausentes (None/NaN/vacio/valores comodin)
		if ser.dtype != object and not pd.api.types.is_string_dtype(ser.dtype):
			mask = pd.isna(ser)
		else:
			vals = ser.astype("string")
			es_vacio = vals.str.strip().eq("")
			es_comodin = vals.str.strip().str.upper().isin(ausentes_upper)
			mask = vals.isna() | es_vacio | es_comodin
		if mask.any():
			out[col] = ser.mask(mask, _default_para(tdef.get("type"), tdef))
	return out


def _default_para(tipo: str, tdef: dict):
	if tipo == "INT":
		return "0"
	if tipo == "DECIMAL":
		return "0"
	if tipo == "DATE":
		return "1845-01-01"
	if tipo == "TEXT":
		return "SIN DATO"
	if tipo == "SET":
		return "SIN DATO"
	return "SIN DATO"

FIELD_SET_ALIASES_NORM = {normalize_text(k): v for k, v in FIELD_SET_ALIASES.items()}


def field_aliases_for(col: str) -> dict:
	"""Alias SET del campo, buscando por nombre normalizado (sin acentos, mayusculas).
	Resuelve los nombres del template nuevo contra las claves del instructivo original."""
	cn = normalize_text(col)
	# Coincidencia exacta normalizada primero
	if cn in FIELD_SET_ALIASES_NORM:
		return FIELD_SET_ALIASES_NORM[cn]
	# Fallback: compartir al menos 2 palabras significativas
	cn_words = {w for w in cn.split() if len(w) >= 3 and w not in ("DE", "DEL", "LA", "EL", "LOS", "LAS")}
	best_key = None
	best_count = 0
	for key, aliases in FIELD_SET_ALIASES_NORM.items():
		key_words = {w for w in key.split() if len(w) >= 3 and w not in ("DE", "DEL", "LA", "EL", "LOS", "LAS")}
		common = len(cn_words & key_words)
		if common > best_count:
			best_count = common
			best_key = key
	if best_key is not None and best_count >= 2:
		return FIELD_SET_ALIASES_NORM[best_key]
	return {}


def _mensaje_esperado(tipo: str, tdef: dict, col: str, val_str: str):
	"""Mensaje didactico de como corregir segun el tipo de variable."""
	if tipo == "SET":
		allowed = [str(a).strip() for a in tdef.get("allowed", [])]
		return "Debe ser uno de: " + ", ".join(allowed) if allowed else "SIN DATO"
	if tipo == "INT":
		if not val_str:
			return "Complete con un numero entero"
		return "Entero valido"
	if tipo == "DECIMAL":
		if not val_str:
			return "Complete con un numero"
		return "Decimal valido"
	if tipo == "DATE":
		if not val_str:
			return "Complete con una fecha (ej: 03/04/2000)"
		return "Fecha valida (ej: 03/04/2000)"
	if tipo == "TEXT":
		return "Escriba el dato en texto"
	return "SIN DATO"


def _en_orden_plantilla(df: pd.DataFrame, template: list) -> bool:
	"""True si las columnas del archivo estan en el mismo orden que la plantilla.
	Compara encabezado a encabezado de forma normalizada. Requiere >=95% de acierto
	para evitar corrimientos cuando el archivo tiene las columnas en otro orden."""
	if df.shape[1] != len(template):
		return False
	cols = list(df.columns)
	coinciden = 0
	for i, tdef in enumerate(template):
		if i >= len(cols):
			break
		if normalize_text(cols[i]) == normalize_text(tdef["name"]):
			coinciden += 1
		elif normalize_text(cols[i]).replace(" ", "") == normalize_text(tdef["name"]).replace(" ", ""):
			coinciden += 1
	return coinciden / max(1, len(template)) >= 0.95


def limpiar_celdas_export(df: pd.DataFrame) -> pd.DataFrame:
	"""Limpia todas las celdas de caracteres que rompen el formato pipe-delimited:
	pipes, saltos de linea, tabulaciones, _x000D_ (carriage return de Excel),
	_x000B_ (vertical tab). Garantiza que el TXT/Excel salga sin filas corridas."""
	out = df.copy()
	for col in out.columns:
		ser = out[col]
		if ser.dtype == object:
			out[col] = ser.map(_limpiar_valor)
		else:
			out[col] = ser.map(lambda v: _limpiar_valor(v))
	return out


def _limpiar_valor(v):
	if v is None or pd.isna(v):
		return v
	s = str(v)
	s = s.replace("|", " ").replace("\r", " ").replace("\n", " ").replace("\t", " ")
	s = s.replace("_x000D_", " ").replace("_x000B_", " ")
	s = re.sub(r"\s+", " ", s).strip()
	return s


def normalizar_fechas_df(df: pd.DataFrame, template: list) -> pd.DataFrame:
	"""Convierte todas las celdas de columnas tipo DATE a formato AAAA-MM-DD.
	Garantiza que el texto exportado (TXT/Excel) siempre tenga fechas ISO."""
	tmap = {t["name"]: t for t in template}
	normalized_tmap = {normalize_text(t["name"]): t["name"] for t in template}
	out = df.copy()
	for col in out.columns:
		canonical = normalized_tmap.get(normalize_text(col))
		tdef = tmap.get(canonical) if canonical else None
		if tdef is None or tdef.get("type") != "DATE":
			continue
		ser = out[col]
		if ser.dtype == object:
			out[col] = ser.map(lambda v: to_date_iso(v) if v is not None and str(v).strip() and str(v).strip().upper() not in ("SIN DATO", "SIN DATOS", "N/A", "NONE", "NAN", "NULL", "NA") else v)
		else:
			out[col] = ser.map(lambda v: to_date_iso(v))
	return out


def reordenar_a_template(df: pd.DataFrame, mapping: dict, template: list) -> pd.DataFrame:
	"""Reordena las columnas del df al orden del template usando el mapping.
	Evita corrimientos cuando el archivo trae las columnas en otro orden."""
	template_cols = [t["name"] for t in template]
	# Si ya esta en orden exacto de plantilla, no reordenar (rapido)
	if list(df.columns) == template_cols:
		return df
	normalized_tmap = {normalize_text(t["name"]): t["name"] for t in template}
	inverse = {}
	for orig, templ in (mapping or {}).items():
		if not templ:
			continue
		canonical = normalized_tmap.get(normalize_text(templ))
		if canonical:
			inverse[canonical] = orig
	# Construir df en orden de template usando las columnas fuente mapeadas
	col_src = []
	for col in template_cols:
		src = inverse.get(col)
		if src and src in df.columns:
			col_src.append(df[src])
		else:
			# Sin fuente: columna vacia (el relleno pone SIN DATO/0/fecha)
			col_src.append(pd.Series([None] * len(df)))
	out = pd.concat(col_src, axis=1)
	out.columns = template_cols
	return out


def validate_only(df: pd.DataFrame, mapping: dict, template: list):
	"""Valida la data sin corregirla. Retorna los errores encontrados."""
	tmap = {t["name"]: t for t in template}
	normalized_tmap = {normalize_text(t["name"]): t["name"] for t in template}
	template_cols = [t["name"] for t in template]
	# Reordenar al orden del template (evita corrimientos si el archivo viene en otro orden)
	df = reordenar_a_template(df, mapping, template)
	# NOTA: NO se rellenan vacios aqui. En el modo VALIDADOR los campos vacios
	# y los tipos incorrectos se marcan como ERROR (el prestador debe corregir).
	inverse = {}
	for orig, templ in (mapping or {}).items():
		if not templ:
			continue
		canonical = normalized_tmap.get(normalize_text(templ))
		if canonical:
			inverse[canonical] = orig

	n = int(len(df))
	stats = {"total": n, "errors": 0, "corrected": 0, "ok": 0}
	filas_error = set()

	# Tras reordenar, el df ya tiene las columnas en orden de plantilla.
	src_values = [df[col].tolist() for col in template_cols]

	logs = []
	MAX_LOGS = 50000

	# Precomputar nombres normalizados de columnas de formula (una sola vez)
	formula_set = {normalize_text(c) for c in FORMULA_COLUMNS}

	# Precomputar alias SET globales y por campo
	alias_genericos = {
		"SI": {"S", "1", "YES", "Y", "SI"},
		"NO": {"N", "0", "FALSE", "F", "NO"},
		"MASCULINO": {"M"},
		"FEMENINO": {"F"},
		"CC": {"CEDULA", "C.C.", "C.C"},
		"TI": {"TARJETA IDENTIDAD", "T.I."},
		"CE": {"CEDULA DE EXTRANJERIA", "C.E."},
		"RC": {"REGISTRO CIVIL", "R.C."},
		"PA": {"PASAPORTE"},
		"MS": {"MENOR SIN IDENTIFICACION", "MSI", "MENOR DE EDAD SIN IDENTIFICACION"},
		"AS": {"ADULTO SIN IDENTIFICACION", "ASI", "ADULTO SIN ID"},
		"CD": {"CARNE DIPLOMATICO", "C.D."},
	}
	alias_genericos_norm = {canon: {normalize_text(a) for a in syn} for canon, syn in alias_genericos.items()}

	# Campos donde el instructivo permite el comodin NA (no aplica)
	NA_FIELDS = {
		"ALTURA UTERINA", "FCF",
		"SEMANAS DE GESTACION",
	}

	for ci, col in enumerate(template_cols):
		tdef = tmap[col]
		values = src_values[ci]
		if values is None:
			continue

		col_norm = normalize_text(col)
		es_formula = col_norm in formula_set
		tipo = tdef.get("type")
		allowed = [str(a).strip() for a in tdef.get("allowed", [])]
		norm_allowed = [normalize_text(a) for a in allowed]
		norm_allowed_set = set(norm_allowed)

		# Vectorizar: convertir toda la columna a Series de strings normalizados
		ser_raw = pd.Series(values, dtype=object).fillna("").astype(str).str.strip()
		ser_norm = normalize_series(ser_raw)

		vacio_mask = ser_raw.eq("") | ser_raw.str.upper().isin(["SIN DATO", "SIN DATOS", "N/A", "NONE", "NAN", "NULL", "NA"])

		# Comodin NA permitido en campos numericos segun el instructivo
		NA_FIELDS_COL_SERIES = pd.Series(col_norm in NA_FIELDS, index=ser_raw.index)

		if tipo == "SET":
			norm_allowed_set = set(norm_allowed)
			# Campos de causas de riesgo: el instructivo lista con guion inicial
			# ("-primigestante adolescente") pero la data puede venir sin el guion.
			if "CAUSAS DE" in col_norm or "CAUSA DE" in col_norm:
				norm_allowed_set |= {normalize_text(a).replace("-", " ").strip() for a in allowed}
			field_aliases = field_aliases_for(col)
			alias_map = {}
			for canonical, synonyms in field_aliases.items():
				cn_canon = normalize_text(canonical)
				# Alias a SIN DATO siempre se incluyen (comodin universal)
				if cn_canon in norm_allowed_set or cn_canon == "SIN DATO":
					alias_map[canonical] = {normalize_text(a) for a in synonyms}
				else:
					# Fallback: el canonical es una variante sin sufijo de una opcion
					# (ej: "SUBSIDIADO" vs "SUBSIDIADO: S"). Se valida contra cada opcion.
					for opc in norm_allowed:
						if cn_canon in opc or opc in cn_canon:
							alias_map[canonical] = {normalize_text(a) for a in synonyms}
							break
			# Fusionar alias genericos con los del campo (no sobrescribir)
			for canon, syns in alias_genericos_norm.items():
				if normalize_text(canon) in norm_allowed_set:
					if canon in alias_map:
						alias_map[canon] = alias_map[canon] | syns
					else:
						alias_map[canon] = set(syns)
			alias_union = set().union(*alias_map.values()) if alias_map else set()

			# Error: no vacio, no en allowed, no es SIN DATO, no es alias
			en_allowed = ser_norm.isin(norm_allowed_set)
			es_alias = ser_norm.isin(alias_union)
			error_mask = (~en_allowed) & (~es_alias)

		elif tipo == "INT":
			# Estricto: solo enteros validos (con .0 de Excel aceptado).
			# Para campos especiales (trimestre de formula, glicemia, tolerancia,
			# municipio) se usan reglas especificas.
			es_trimestre = any(k in col_norm for k in ("TRIMESTRE", "TRIM"))
			es_medicion = ("GLICEMIA" in col_norm) or ("TOLERANCIA" in col_norm)
			es_municipio = (col_norm == "MUNICIPIO DE RESIDENCIA")

			clean = ser_raw.str.replace(" ", "", regex=False).str.replace("-", "", regex=False)
			# Entero valido (acepta 25 y 25.0 que produce Excel)
			es_entero = ser_raw.str.fullmatch(r"[+-]?\d+").fillna(False) | ser_raw.str.fullmatch(r"[+-]?\d+\.0+").fillna(False)

			# Trimestre de formula: acepta "1", "2", "3", "1 Trim", "2Trim", "1er Trim"
			es_trim = ser_raw.str.upper().str.replace(" ", "", regex=False).str.replace(".", "", regex=False).str.replace("ER", "", regex=False).str.replace("TRIM", "", regex=False).str.fullmatch(r"[123]").fillna(False)

			# Glicemia/tolerancia: acepta decimales (80.2, 78,4) y multiples con "/"
			es_dec = False
			if es_medicion:
				es_dec = ser_raw.str.replace(",", ".", regex=False).str.fullmatch(r"[+-]?\d+(\.\d+)?([/][+-]?\d+(\.\d+)?)*").fillna(False)

			# Municipio: solo codigo numerico valido
			es_muni = False
			if es_municipio:
				es_muni = ser_raw.str.fullmatch(r"[+-]?\d+").fillna(False)

			error_mask = (~es_entero) & (~es_trim) & (~es_dec) & (~es_muni)

		elif tipo == "DECIMAL":
			s = ser_raw.str.replace(" ", "", regex=False).str.replace(",", ".", regex=False)
			es_decimal = s.str.fullmatch(r"[+-]?\d+(\.\d+)?").fillna(False)
			# El instructivo permite el comodin NA solo en campos especificos:
			# ALTURA UTERINA y FCF ("si es inferior a 12 semanas colocar NA"),
			# Semanas de Gestacion ("de lo contrario colocar NA").
			es_na = ser_raw.str.upper().isin(["NA", "N/A", "N.A."]) & NA_FIELDS_COL_SERIES
			error_mask = (~es_decimal) & (~es_na)

		elif tipo == "DATE":
			# Vectorizado: solo las celdas con formato de fecha (regex) se parsean.
			# Evita dateutil/mixed que es lento con datos no-fecha.
			# Los vacios y "SIN DATO" son ERROR en fechas (no se admiten).
			no_vacio = ~vacio_mask
			# Patron de fecha comun: separadores -, / o espacios + anio de 4 digitos,
			# o serial de Excel (5 digitos), o mes en texto (letras + numeros).
			tiene_patron = no_vacio & ser_raw.str.contains(r"\d{4}", regex=True) & ser_raw.str.contains(r"[0-9]", regex=True)
			parsed = pd.to_datetime(ser_raw.where(tiene_patron, pd.NaT), errors="coerce", dayfirst=True, format="mixed")
			ok_fast = parsed.notna()
			# Celdas con patron que pd.to_datetime no pudo parsear: intentar to_date_iso
			pendientes = tiene_patron & (~ok_fast)
			pend_idx = pendientes[pendientes].index.tolist()
			ok_lento = pd.Series(False, index=ser_raw.index)
			for ridx in pend_idx:
				if to_date_iso(ser_raw.iloc[ridx]) is not None:
					ok_lento.iloc[ridx] = True
			es_fecha = ok_fast | ok_lento
			# Vacio o SIN DATO = error; fecha valida = ok
			error_mask = (~es_fecha) | vacio_mask | ser_raw.str.upper().isin(["SIN DATO", "SIN DATOS", "N/A", "NONE", "NAN", "NULL", "NA"])

		elif tipo == "TEXT":
			campo_numerico = any(k in normalize_text(col) for k in ("IDENTIFICACION", "TELEFONO", "NIT", "CODIGO", "NUMERO", "CONSECUTIVO", "PESO AL NACER"))
			# Puntaje de escala de Herrera y Hurtado: acepta valores numericos (es una escala)
			if "HERRERA" in normalize_text(col) or "ESCALA" in normalize_text(col):
				error_mask = pd.Series(False, index=ser_raw.index)
			elif campo_numerico:
				error_mask = pd.Series(False, index=ser_raw.index)
			else:
				es_numero = ser_raw.str.replace(",", ".", regex=False).str.fullmatch(r"[+-]?\d+(\.\d+)?").fillna(False)
				# Detectar fechas de forma vectorizada (solo valores con patron de fecha)
				patron_fecha = ser_raw.str.contains(r"\d{4}", regex=True) & ser_raw.str.contains(r"[0-9]", regex=True)
				parsed_fecha = pd.to_datetime(ser_raw.where(patron_fecha, pd.NaT), errors="coerce", dayfirst=True, format="mixed")
				es_fecha = parsed_fecha.notna()
				# Texto: vacio (solo "") = error, numero o fecha = error.
				# "SIN DATO" es VALIDO en texto (cuando no hay dato de la gestante).
				es_sin_dato = ser_raw.str.upper().isin(["SIN DATO", "SIN DATOS", "N/A", "NONE", "NAN", "NULL", "NA"])
				es_vacio_real = ser_raw.eq("")
				error_mask = es_vacio_real | ((es_numero | es_fecha) & (~es_sin_dato))

		else:
			error_mask = pd.Series(False, index=ser_raw.index)

		# Registrar errores (solo las celdas marcadas, no todo el rango)
		idx_error = error_mask[error_mask].index.tolist()
		for ridx in idx_error:
			# Columnas calculadas por formula: solo se ignoran si estan VACIAS
			# (la formula las recalcula). Si tienen un valor erroneo escrito,
			# si se marca como error.
			if es_formula and vacio_mask.iloc[ridx]:
				continue
			val_str = ser_raw.iloc[ridx]
			filas_error.add(ridx + 1)
			if len(logs) < MAX_LOGS:
				logs.append({
					"row": ridx + 1,
					"column": col,
					"original": val_str,
					"corrected": _mensaje_esperado(tipo, tdef, col, val_str),
					"status": "error",
				})
			stats["errors"] += 1

	stats["rows_with_errors"] = len(filas_error)
	stats["rows_ok"] = max(0, stats["total"] - len(filas_error))
	stats["error_cells"] = stats["errors"]
	# Calidad basada en FILAS sin errores (todo o nada por fila), no en celdas.
	stats["quality_percent"] = round(100 * stats["rows_ok"] / max(1, stats["total"]), 2)
	return {"stats": stats, "logs": logs}

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
		return x
	
	# Reordenar al orden del template (evita corrimientos si el archivo viene en otro orden)
	df = reordenar_a_template(df, mapping, template)
	# Usar map() en lugar de applymap() (pandas 2.1+)
	try:
		df = df.map(clean_malformed)
	except AttributeError:
		df = df.applymap(clean_malformed)
	# Rellenar vacios con el valor por tipo (nunca se valida un dato vacio).
	df = rellenar_vacios(df, template)

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

	n = int(len(df))
	stats = {"total": n, "errors": 0, "corrected": 0, "ok": 0}

	# Tras reordenar, el df ya tiene las columnas en orden de plantilla.
	src_values = [df[col].tolist() for col in template_cols]

	corrected_cols = []  # (col, valores, estados, originales)

	for ci, col in enumerate(template_cols):
		tdef = tmap[col]
		values = src_values[ci]

		# Columna de plantilla SIN fuente en el archivo: se rellena con "SIN DATO"
		# como correccion (el limpiador completa la data segun el instructivo).
		if values is None:
			out_vals = ["SIN DATO"] * n
			statuses = ["corrected"] * n
			origins = [None] * n
			stats["corrected"] += n
			corrected_cols.append((col, out_vals, statuses, origins))
			continue

		out_vals = [None] * n
		statuses = [None] * n
		origins = [None] * n

		# Precomputar (fuera del loop por fila) lo que no cambia por celda
		campo_numerico_col = any(k in normalize_text(col) for k in ("IDENTIFICACION", "TELEFONO", "NIT", "CODIGO", "NUMERO", "CONSECUTIVO", "PESO AL NACER"))
		if tdef["type"] == "SET":
			allowed_col = [str(a).strip() for a in tdef.get("allowed", [])]
			norm_allowed_col = [normalize_text(a) for a in allowed_col]
			alias_map_col = {}
			for alias_canonical, alias_synonyms in {
				"SI": {"S", "1", "YES", "Y", "SI"},
				"NO": {"N", "0", "FALSE", "F", "NO"},
				"MASCULINO": {"M"},
				"FEMENINO": {"F"},
				"CC": {"CEDULA", "C.C.", "C.C"},
				"TI": {"TARJETA IDENTIDAD", "T.I."},
				"CE": {"CEDULA DE EXTRANJERIA", "C.E."},
			}.items():
				if normalize_text(alias_canonical) in norm_allowed_col:
					alias_map_col[alias_canonical] = {normalize_text(a) for a in alias_synonyms}
			field_aliases_col = field_aliases_for(col)
			if field_aliases_col:
				for canonical, synonyms in field_aliases_col.items():
					if normalize_text(canonical) in norm_allowed_col:
						alias_map_col[canonical] = {normalize_text(a) for a in synonyms}

		for ridx in range(n):
			val = values[ridx] if values is not None else None
			orig_val = None if val is None or pd.isna(val) else str(val)
			val_str = str(orig_val).strip() if orig_val else ""
			status = "ok"
			corrected = None

			# Valor vacio o "SIN DATO": el limpiador rellena con "SIN DATO" (correccion),
			es_ausente = (not val_str) or val_str.upper() in ("SIN DATO", "SIN DATOS", "N/A", "NONE", "NAN", "NULL")
			if es_ausente:
				if campo_numerico_col and not val_str:
					# Campos numericos obligatorios: sin dato se asigna 0
					status = "corrected"
					corrected = "0"
				else:
					status = "corrected"
					corrected = "SIN DATO"

			elif tdef["type"] == "TEXT":
				corrected = re.sub(r" \d{2}:\d{2}:\d{2}(\.\d+)?$", "", val_str)
				if not campo_numerico_col and re.fullmatch(r'[+-]?\d+(\.\d+)?', corrected.replace(",", ".")):
					# El limpiador ajusta: dato numerico en campo de texto -> SIN DATO
					status = "corrected"
					corrected = "SIN DATO"
				elif not campo_numerico_col and to_date_iso(corrected) is not None:
					status = "corrected"
					corrected = "SIN DATO"
				elif corrected != val_str:
					status = "corrected"

			elif tdef["type"] == "INT":
				corrected_int = to_municipality_code(val) if normalize_text(col) == "MUNICIPIO DE RESIDENCIA" else to_int_safe(val)
				if corrected_int is None:
					campo_numerico_oblig = any(k in normalize_text(col) for k in ("IDENTIFICACION", "TELEFONO", "NIT", "CODIGO", "NUMERO", "CONSECUTIVO"))
					if campo_numerico_oblig:
						# Campos numericos obligatorios: se asigna 0
						status = "corrected"
						corrected = "0"
					else:
						# El limpiador ajusta: texto en campo numerico -> SIN DATO
						status = "corrected"
						corrected = "SIN DATO"
				else:
					corrected = str(corrected_int)
					if orig_val is not None and (to_int_safe(orig_val) is None or corrected_int != to_int_safe(orig_val)):
						status = "corrected"

			elif tdef["type"] == "DECIMAL":
				corrected_dec = correct_decimal_by_field(col, val)
				if corrected_dec is None:
					# El limpiador ajusta: texto en campo decimal -> SIN DATO
					status = "corrected"
					corrected = "SIN DATO"
				else:
					corrected = format_decimal(corrected_dec)
					if orig_val is not None:
						orig_dec = to_decimal_safe(orig_val)
						if orig_dec is None or abs(corrected_dec - orig_dec) >= 0.0001:
							status = "corrected"

			elif tdef["type"] == "DATE":
				corrected_date = to_date_iso(val)
				if corrected_date is None:
					# El limpiador ajusta: texto en campo de fecha -> SIN DATO
					status = "corrected"
					corrected = "SIN DATO"
				else:
					corrected = corrected_date
					if orig_val is not None and corrected != orig_val.strip():
						status = "corrected"

			elif tdef["type"] == "SET":
				# SOLO ajustar con alias veraz del instructivo o coincidencia exacta.
				# NUNCA usar fuzzy ni subcadena que puedan dañar el dato.
				sn = normalize_text(val_str)
				corregido = None
				if sn in norm_allowed_col:
					corregido = allowed_col[norm_allowed_col.index(sn)]
				else:
					# Alias precomputados (genericos + del instructivo)
					for alias_canonical, alias_synonyms in alias_map_col.items():
						if sn in alias_synonyms:
							corregido = alias_canonical
							break
				if corregido is not None:
					corrected = corregido
					if normalize_text(val_str) != normalize_text(corregido):
						status = "corrected"
				else:
					# Respaldo fuzzy para errores de digitacion (ej: secndaria -> SECUNDARIA).
					# Solo se aplica si la mejor coincidencia supera el umbral minimo.
					fuzzy_match = normalize_set(val, allowed_col, normalize_text(col))
					if fuzzy_match is not None:
						corrected = fuzzy_match
						status = "corrected"
					else:
						# Sin mapeo veraz: el limpiador ajusta a SIN DATO (correccion),
						# nunca deja la fila bloqueada por un valor no reconocido.
						corrected = "SIN DATO"
						status = "corrected"

			out_vals[ridx] = corrected
			statuses[ridx] = status
			origins[ridx] = orig_val
			if status == "error":
				stats["errors"] += 1
			elif status == "corrected":
				stats["corrected"] += 1
			else:
				stats["ok"] += 1

		corrected_cols.append((col, out_vals, statuses, origins))

	# Reconstruir el DataFrame por columnas (más rápido que por filas)
	data = {col: vals for col, vals, _, _ in corrected_cols}
	out_df = pd.DataFrame(data, columns=template_cols)
	# Rellenar NaN residual con el valor original si existe, si no con vacio.
	# NUNCA inventar valores: si la celda quedo sin valor, se deja vacia.
	out_df = out_df.fillna("")

	# Bitácora en orden fila-mayor (igual que antes), limitada a 1000 registros
	logs = []
	MAX_LOGS = 1000
	for ridx in range(n):
		for ci, col in enumerate(template_cols):
			status = corrected_cols[ci][2][ridx]
			if status != "ok":
				logs.append({
					"row": ridx + 1,
					"column": col,
					"original": corrected_cols[ci][3][ridx],
					"corrected": corrected_cols[ci][1][ridx],
					"status": status,
				})
				if len(logs) >= MAX_LOGS:
					break
		if len(logs) >= MAX_LOGS:
			break

	# Filas que tienen al menos un error REAL (no correcciones automaticas).
	# Se usa corrected_cols (sin limite de MAX_LOGS) para no perder filas.
	filas_error = set()
	for ridx in range(n):
		for col, out_vals, statuses, origins in corrected_cols:
			if statuses[ridx] == "error":
				filas_error.add(ridx + 1)
				break
	stats["rows_with_errors"] = len(filas_error)
	stats["rows_ok"] = max(0, stats["total"] - len(filas_error))
	stats["error_cells"] = stats["errors"]
	# Calidad basada en FILAS sin errores (todo o nada por fila), no en celdas.
	stats["quality_percent"] = round(100 * stats["rows_ok"] / max(1, stats["total"]), 2)

	# Aplicar formulas SOLO cuando la data quedo 100% limpia (sin errores).
	# Orden correcto: primero limpiar segun instructivo, luego aplicar formulas.
	if len(filas_error) == 0:
		try:
			from .formulas import aplicar_formulas
		except ImportError:
			from formulas import aplicar_formulas
		rows_calc = []
		for _, row in out_df.iterrows():
			rows_calc.append(aplicar_formulas(row.to_dict()))
		if rows_calc:
			out_df = pd.DataFrame(rows_calc, columns=template_cols)

	return out_df, logs, stats
