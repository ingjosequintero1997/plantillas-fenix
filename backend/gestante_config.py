from __future__ import annotations

import unicodedata
from datetime import date, datetime, timedelta


def field(name: str, type_: str, required: bool = True, allowed: list[str] | None = None):
    return {
        "name": name.strip(),
        "type": type_,
        "required": required,
        **({"allowed": allowed} if allowed else {}),
    }


RAW_FIELDS: list[tuple[str, str]] = [
    ("No", "INT"),
    ("Tipo de documento de identidad", "SET"),
    ("No. De Identificación", "INT"),
    ("Apellido_1,", "TEXT"),
    ("Apellido_2", "TEXT"),
    ("Nombre_1,", "TEXT"),
    ("Nombre_2", "TEXT"),
    ("Fecha de Nacimiento", "DATE"),
    ("Edad (años)", "FORMULA"),
    ("Sexo", "SET"),
    ("Regimen Afiliacion", "SET"),
    ("Pertenecia Etnica", "SET"),
    ("Grupo Poblacional", "TEXT"),
    ("Departamento Residencia", "TEXT"),
    ("Municipio de Residencia", "TEXT"),
    ("Zona", "SET"),
    ("Etnia", "SET"),
    ("Asentamiento/Rancheria/Comunidad", "TEXT"),
    ("Teléfono usuaria", "INT"),
    ("Direccion", "TEXT"),
    ("Nivel Educativo", "SET"),
    ("Discapacidad", "SET"),
    ("Mujer cabeza de Hogar", "SET"),
    ("Ocupación", "TEXT"),
    ("Estado Civil", "SET"),
    ("Control Tradicional", "SET"),
    ("Gestante Renuente", "SET"),
    ("Inasistente", "SET"),
    ("Nombre de la IPS Primaria", "TEXT"),
    ("Fecha de Diagnostico del embarazo", "DATE"),
    ("Fecha de Ingreso al Control Prenatal", "DATE"),
    ("FUM", "DATE"),
    ("FPP", "FORMULA"),
    ("Dias para el parto", "FORMULA"),
    ("Alarma", "FORMULA"),
    ("Edad Gest Inicio Control", "FORMULA"),
    ("Trimestre inicio control", "FORMULA"),
    ("G", "INT"),
    ("P", "INT"),
    ("C", "INT"),
    ("A", "INT"),
    ("M", "INT"),
    ("V", "INT"),
    ("Hipertension arterial", "SET"),
    ("Diabetes", "SET"),
    ("VIH", "SET"),
    ("Sifilis", "SET"),
    ("Tuberculosis", "SET"),
    ("Otras condiciones medicas graves", "SET"),
    ("Si la respuesta anterior es  SI describa la otra condición médica grave", "TEXT"),
    ("Antecedentes de eventos obstétricos\ndesfavorables", "SET"),
    ("Periodo Intergenésico", "SET"),
    ("Peso Inicial (kg)", "DECIMAL"),
    ("Talla (metros)", "DECIMAL"),
    ("Indice de Masa Corporal (IMC)", "FORMULA"),
    ("Clasificación del IMC", "FORMULA"),
    ("HISTORIA REPRODUCTVA", "NUMERIC"),
    ("EMBARAZO ACTUAL", "NUMERIC"),
    ("RIESGO PSICOSOCIAL", "NUMERIC"),
    ("PUNTAJE TOTAL", "NUMERIC"),
    ("Solicita ive IVE?", "SET"),
    ("Clasificación del riesgo obstetrico", "SET"),
    ("Causas de Alto Riesgo obstetrico", "SET"),
    ("Clacificacion del riesgo de preeclampsia", "SET"),
    ("Causas de Alto Riesgo de preeclampsia", "SET"),
    ("Clacificacion del riesgo tromboembolico", "SET"),
    ("Causas de Alto Riesgo tromboembolico", "SET"),
    ("fecha de suministro de tratamiento", "DATE"),
    ("tratamiento Instaurado", "TEXT"),
    ("Remitida a especialista?", "SET"),
    ("Describa cual(es) especialistas la han atendido", "TEXT"),
    ("Asesoria Prueba VIH", "DATE"),
    ("Trimestre Asesoria VIH", "FORMULA"),
    ("Fecha Toma Prueba VIH Primer Tamizaje", "DATE"),
    ("Resultado Primer Tamizaje prueba de VIH", "SET"),
    ("Trimestre Toma Prueba VIH Primer Tamizaje", "FORMULA"),
    ("Fecha Toma Prueba VIH Segundo Tamizaje", "DATE"),
    ("Resultado Segundo Tamizaje Prueba de VIH", "SET"),
    ("Trimestre Toma Prueba VIH Segundo Tamizaje", "FORMULA"),
    ("Fecha Toma Prueba VIH Tercer Tamizaje", "DATE"),
    ("Resultado Tercer Tamizaje Prueba de VIH", "SET"),
    ("Trimestre Toma Prueba VIH Tercer Tamizaje", "FORMULA"),
    ("Fecha Primera Prueba Treponemica Rapida Sifilis", "DATE"),
    ("Resultado Primera Prueba Treponemica Rapida Sifilis", "SET"),
    ("Trimestre Primera Prueba Treponemica Rapida Sifilis", "FORMULA"),
    ("Fecha Segunda Prueba Treponemica Rapida Sifilis", "DATE"),
    ("Resultado Segunda Prueba Treponemica Rapida Sifilis", "SET"),
    ("Trimestre Segunda Prueba Treponemica Rapida Sifilis", "FORMULA"),
    ("Fecha Tercera Prueba Treponemica Rapida Sifilis", "DATE"),
    ("Resultado Tercera Prueba Treponemica Rapida Sifilis", "SET"),
    ("Trimestre Tercera Prueba Treponemica Rapida Sifilis", "FORMULA"),
    ("Fecha toma Segunda Prueba VIH", "DATE"),
    ("Resultado Toma Segunda Prueba VIH", "SET"),
    ("Trimestre Toma segunda Prueba VIH", "FORMULA"),
    ("Fecha prueba confirmatoria Según Algoritmo", "DATE"),
    ("Trimestre Prueba confirmatoria Según Algoritmo", "FORMULA"),
    ("Fecha de diagnóstico de sífilis", "DATE"),
    ("Tratamiento instaurado", "TEXT"),
    ("Fecha de inicio del tratamiento", "DATE"),
    ("Fecha de segunda dosis del tratamiento", "DATE"),
    ("Fecha de tercera dosis del tratamiento", "DATE"),
    ("Fecha de Toma de Urocultivo", "DATE"),
    ("Resultado Urocultivo", "SET"),
    ("Fecha Toma Glicemia", "DATE"),
    ("Resultado Glicemia", "INT"),
    ("Fecha Prueba de Tolerancia Oral Glucosa", "DATE"),
    ("Resultado Prueba de Tolerancia Oral Glucosa", "INT"),
    ("Fecha 1ra Realizacion Hemoglobina", "DATE"),
    ("Resultado 1ra Hemoglobina", "INT"),
    ("Fecha 2da Realizacion Hemoglobina", "DATE"),
    ("Resultado 2da Hemoglobina", "INT"),
    ("Fecha 3ra Realizacion Hemoglobina", "DATE"),
    ("Resultado 3ra Hemoglobina", "INT"),
    ("Resultado Realizacion Hemoclasificación (Factor RH)", "SET"),
    ("Fecha de Antigeno Superficie Hepatitis B", "DATE"),
    ("Resultado Antigeno Superficie Hepatitis B", "SET"),
    ("Fecha Tamizaje Toxoplasma", "DATE"),
    ("Resultado Toxoplasma", "SET"),
    ("Fecha Citologia Cervicouterina", "DATE"),
    ("Resultado Tamizaje de cuello uterino", "SET"),
    ("Fecha de la prueba de Rubeola", "DATE"),
    ("Resultado Rubeola", "SET"),
    ("Fecha Prueba de Tamizaje para Estreptococo Grupo B", "DATE"),
    ("Resultado Prueba de Tamizaje para Estreptococo Grupo B", "SET"),
    ("Fecha Toma de Gota Gruesa (Malaria)", "DATE"),
    ("Resultado Gota gruesa (Malaria)", "SET"),
    ("Fecha de Realización Tamizaje Chagas", "DATE"),
    ("Resultado Chagas", "SET"),
    ("FECHA DE APLICACIÓN INFLUENZA (Desde Semana 14)", "DATE"),
    ("FECHA DE APLICACIÓN TOXOIDE Según Antecedente Vacunal", "DATE"),
    ("FECHA DE APLICACIÓN DPT ACELULAR (Semana 26)", "DATE"),
    ("FECHA DE APLICACIÓN COVID-19 (1 En la Gestación)", "DATE"),
    ("FECHA DE APLICACIÓN VSR (Semana 28 - 36)", "DATE"),
    ("FECHA CONSULTA ODONTOLOGICA", "DATE"),
    ("Ecografia obstétrica con translucencia nucal (10,6 - 13,6)", "DATE"),
    ("Ecografia Obstetrica para la detección de anomalias estructurales (18 - 23)", "DATE"),
    ("Otras ecografías?", "DATE"),
    ("Fecha suministro Acido Folico", "DATE"),
    ("Fecha suministro Calcio (Semana 14)", "DATE"),
    ("Fecha suministro Hierro", "DATE"),
    ("Tipo de tratamiento suminitrado para anemia", "SET"),
    ("Relación entre Anemia vs tratamiento", "SET"),
    ("Condicion del suministro del ASA", "SET"),
    ("fecha de suministro", "DATE"),
    ("Fecha Desparasitación Antihelmintica II y III Trimestre (Albendazo 400 Mg Dosis Unica)", "DATE"),
    ("Fecha 1er Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 2do Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 3er Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 4to Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 5to Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 6to Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 7mo Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("fecha 8vo Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 9no Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Número Total de Controles Prenatales", "FORMULA"),
    ("Ultimo Control Prenatal", "FORMULA"),
    ("edad gestacional actual", "FORMULA"),
    ("peso actual", "DECIMAL"),
    ("talla actual", "DECIMAL"),
    ("IMC ACTUAL", "FORMULA"),
    ("Clasificación del IMC ACTUAL", "FORMULA"),
    ("TA ACTUAL", "TEXT"),
    ("ALTURA UTERINA", "DECIMAL"),
    ("FCF", "DECIMAL"),
    ("Fecha Primera Consulta Ginecología", "DATE"),
    ("Fecha Segunda Consulta Ginecología", "DATE"),
    ("Fecha Tercera Consulta Ginecología", "DATE"),
    ("Fecha Consulta Nutrición", "DATE"),
    ("Fecha Consulta Psicología", "DATE"),
    ("Fecha de Atención Otro Especialista", "DATE"),
    ("Quien Realizó la Consulta", "DATE"),
    ("Tipo", "SET"),
    ("Fecha de aborto", "DATE"),
    ("Semanas de Gestación", "INT"),
    ("Complicaciones", "SET"),
    ("Fecha de Parto", "DATE"),
    ("Caracteristicas del parto", "SET"),
    ("Parto atendido por", "SET"),
    ("No. Semanas de gestación", "INT"),
    ("Multiplicidad del embarazo", "SET"),
    ("Complicaciones durante el parto", "SET"),
    ("Tipo Complicación", "SET"),
    ("UCI Materna", "SET"),
    ("Toma de pruebas ITS intraparto", "SET"),
    ("Resultado POSITIVO", "SET"),
    ("Fecha", "DATE"),
    ("Causa de la defunción", "TEXT"),
    ("TIPO", "SET"),
    ("FECHA", "DATE"),
    ("RENUENTE A PLANIFICACION FAMILIAR", "SET"),
    ("OBSERVACIONES GENERALES", "TEXT"),
]


ALLOWED_BY_NAME = {
    "Tipo de documento de identidad": ["CC", "MS", "PT", "TI", "PA", "CD", "AS"],
    "Sexo": ["Femenino"],
    "Regimen Afiliacion": ["S", "C"],
    "Pertenecia Etnica": ["Indígena", "ROM (Gitano)", "Raizal del Archipielago", "Negro (a), Mulato, Afroamericano", "Mestizo", "Ningunas de las Anteriores"],
    "Zona": ["Rural", "Urbana"],
    "Etnia": ["NA", "Wayuu", "Arhuaco", "Wiwa", "Yukpa", "Kogi", "Inga", "Kankuamo", "Chimila", "Zenu"],
    "Nivel Educativo": ["Analfabeta", "Sabe Leer o Escribir", "Primaria Completa", "Primaria Incompleta", "Secundaria Completa", "Secundaria Incompleta", "Técnico", "Tecnólogo", "Profesional Universitario"],
    "Discapacidad": ["Discapacidad fisica", "Discapacidad Psiquica", "Discapacidad mental", "Ninguna", "Sin dato"],
    "Mujer cabeza de Hogar": ["Si", "No"],
    "Estado Civil": ["Soltera", "Casada", "Divorciada", "Viuda", "Unión Libre"],
    "Control Tradicional": ["Si", "No"],
    "Gestante Renuente": ["Si", "No"],
    "Inasistente": ["Si", "No"],
    "Hipertension arterial": ["Si", "No"],
    "Diabetes": ["Si", "No"],
    "VIH": ["Si", "No"],
    "Sifilis": ["Si", "No"],
    "Tuberculosis": ["Si", "No"],
    "Otras condiciones medicas graves": ["Si", "No"],
    "Antecedentes de eventos obstétricos\ndesfavorables": ["Prematurez", "Malformados", "Placenta previa", "Polihidramnios", "Muerte Fetal o neonatal", "Bajo peso al nacer", "Ninguno"],
    "Periodo Intergenésico": ["Ninguno", "<12 meses", "12 a 24 meses", "25 a 48 meses", "49 y mas"],
    "Solicita ive IVE?": ["Si", "No"],
    "Clasificación del riesgo obstetrico": ["Alto riesgo obstétrico", "Bajo riesgo obstétrico"],
    "Causas de Alto Riesgo obstetrico": ["NA", "-primigestante adolescente", "-Embarazo no Deseado", "-Gestante Añosa", "-antecedente de preeclampsia", "-Periodo Intergénesico corto", "-Incompatibilidad grupo Rh", "-enfermedad autoimune", "-embarazo multiple", "-Multíparidad", "-cesarea anterior", "-enfermedad renal", "-Antecedentes de MME", "-Antecedentes de Malformación Congénita", "-Sobrepeso, Obesidad", "-HTA Crónica", "-Hipertensión Inducida por el Embarazo", "-Diabetes", "-VIH", "-Sífilis", "-Hepatitis B", "-enfermedad de chagas", "-Tuberculosis", "-Cancer", "-LES", "-ERC", "-Enfermedad Huérfana", "-Enfermedad Mental", "-Antecedentes de aborto", "-Víctima de Violencia Física o Psicológica", "-Víctima de Violencia Sexual", "-Fumadora", "-Consumo de Alcohol", "-Consumo de SPA", "-Antecedente de mortinato"],
    "Clacificacion del riesgo de preeclampsia": ["Alto riesgo de Preeclampsia", "Moderado riesgo de preeclamsia", "Bajo riesgo de Preeclampsia"],
    "Causas de Alto Riesgo de preeclampsia": ["NA", "-primigestante adolescente", "-Embarazo no Deseado", "-Gestante Añosa", "-antecedente de preeclampsia", "-Periodo Intergénesico corto", "-Incompatibilidad grupo Rh", "-enfermedad autoimune", "-embarazo multiple", "-Multíparidad", "-cesarea anterior", "-enfermedad renal", "-Antecedentes de MME", "-Antecedentes de Malformación Congénita", "-Sobrepeso, Obesidad", "-HTA Crónica", "-Hipertensión Inducida por el Embarazo", "-Diabetes", "-VIH", "-Sífilis", "-Hepatitis B", "-enfermedad de chagas", "-Tuberculosis", "-Cancer", "-LES", "-ERC", "-Enfermedad Huérfana", "-Enfermedad Mental", "-Antecedentes de aborto", "-Víctima de Violencia Física o Psicológica", "-Víctima de Violencia Sexual", "-Fumadora", "-Consumo de Alcohol", "-Consumo de SPA", "-Antecedente de mortinato"],
    "Clacificacion del riesgo tromboembolico": ["Alto riesgo Tromboembolico", "Bajo riesgo Tromboembolico"],
    "Causas de Alto Riesgo tromboembolico": ["NA", "-primigestante adolescente", "-Embarazo no Deseado", "-Gestante Añosa", "-antecedente de preeclampsia", "-Periodo Intergénesico corto", "-Incompatibilidad grupo Rh", "-enfermedad autoimune", "-embarazo multiple", "-Multíparidad", "-cesarea anterior", "-enfermedad renal", "-Antecedentes de MME", "-Antecedentes de Malformación Congénita", "-Sobrepeso, Obesidad", "-HTA Crónica", "-Hipertensión Inducida por el Embarazo", "-Diabetes", "-VIH", "-Sífilis", "-Hepatitis B", "-enfermedad de chagas", "-Tuberculosis", "-Cancer", "-LES", "-ERC", "-Enfermedad Huérfana", "-Enfermedad Mental", "-Antecedentes de aborto", "-Víctima de Violencia Física o Psicológica", "-Víctima de Violencia Sexual", "-Fumadora", "-Consumo de Alcohol", "-Consumo de SPA", "-Antecedente de mortinato"],
    "Remitida a especialista?": ["NA", "Si", "No"],
    "Resultado Primer Tamizaje prueba de VIH": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Segundo Tamizaje Prueba de VIH": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Tercer Tamizaje Prueba de VIH": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Primera Prueba Treponemica Rapida Sifilis": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Segunda Prueba Treponemica Rapida Sifilis": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Tercera Prueba Treponemica Rapida Sifilis": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Toma Segunda Prueba VIH": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Urocultivo": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Realizacion Hemoclasificación (Factor RH)": ["NA", "O+", "O-", "A+", "A-", "AB+", "AB-", "B+", "B-"],
    "Resultado Antigeno Superficie Hepatitis B": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Toxoplasma": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Tamizaje de cuello uterino": ["NA", "ALTERADO", "NORMAL"],
    "Resultado Rubeola": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Prueba de Tamizaje para Estreptococo Grupo B": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Gota gruesa (Malaria)": ["NA", "POSITIVO", "NEGATIVO"],
    "Resultado Chagas": ["NA", "POSITIVO", "NEGATIVO"],
    "Quien Realizó el Control": ["Médico Ginecologia", "Aux de Enfermeria", "Enfermera (o)", "Control Tradicional (obligatorio)"],
    "Tipo": ["NA", "IVE", "Expontáneo", "Provocado"],
    "TIPO": ["DIU", "Inyeccion mensual", "Inyeccion trimestral", "Pildoras", "Condon", "Pomeroy", "Ninguno", "NA", "SIN DATO"],
    "Tipo de tratamiento suminitrado para anemia": ["NA", "1. Hierro oral", "2. Hierro parenteral", "3. transfusion sanguinea"],
    "Relación entre Anemia vs tratamiento": ["1. tratamiento para anemia indicado y suministrado", "2. tratamiento para anemia indicado y no suministrado", "3. tratamiento para anemia no indicada ni suministrada", "4. NO requiere tratamiento hemoglobina adecuada", "🟢 ADECUADO", "🔴 NO ADECUADO", "🟡 SIN TAMIZAJE"],
    "Complicaciones": ["NA", "Si", "No"],
    "Caracteristicas del parto": ["NA", "Parto Vaginal", "Cesarea"],
    "Parto atendido por": ["NA", "IPS baja complejidad", "IPS mediana o alta", "Partera", "Medico Tradicional", "Otro"],
    "Multiplicidad del embarazo": ["NA", "Simple", "Doble", "Triple", "Cuadruple o más"],
    "Complicaciones durante el parto": ["NA", "Si", "No"],
    "Tipo Complicación": ["NA", "Parto prematuro", "RPM", "Hemorragia", "Anomalías del cordón", "Anomalías de la placenta", "Sufrimiento fetal", "Desproporción C-P", "Otras"],
    "UCI Materna": ["NA", "Si", "No"],
    "Toma de pruebas ITS intraparto": ["NA", "No", "Sifilis", "VIH", "Sífilis y VIH"],
    "Resultado POSITIVO": ["NA", "Si", "No"],
    "RENUENTE A PLANIFICACION FAMILIAR": ["NA", "Si", "No"],
    "Condicion del suministro del ASA": ["1. ASA indicado y suministrado", "2. Asa indicado y no suministrado", "3. ASA no indicada ni suministrada", "4. ASA suministrado sin ser indicado", "5. No requiere ASA"],
}


def allowed_for(field_name: str):
    direct = ALLOWED_BY_NAME.get(field_name)
    if direct is not None:
        return direct
    try:
        from .validators import normalize_text
    except ImportError:
        from validators import normalize_text
    norm = {normalize_text(k): v for k, v in ALLOWED_BY_NAME.items()}
    cn = normalize_text(field_name)
    return norm.get(cn, ["SIN DATO"])


def normalize_field_key(name: str) -> str:
    """Normalize a template field name into the frontend UPPER_SNAKE key.

    Mirrors backend/_gen_form.py::_norm so frontend keys such as EDAD_ANOS or
    FECHA_DE_NACIMIENTO map back to their template definition
    (name -> {type, allowed}). All accent handling stays consistent here.
    """
    s = str(name if name is not None else "").strip()
    s = "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )
    s = (
        s.upper()
        .replace(" ", "_")
        .replace("\n", "_")
        .replace("(", "")
        .replace(")", "")
        .replace(",", "")
        .replace("-", "_")
        .replace("/", "_")
        .replace(".", "")
        .replace("?", "")
        .replace(":", "")
        .replace(";", "")
    )
    s = "__".join(filter(None, s.split("__")))
    return s.strip("_")


def field_meta_by_key() -> dict[str, dict]:
    """Map every normalized frontend key to its template type(s) and allowed values.

    Duplicate template names collapse into one key; their types and allowed
    values are unioned so validation never rejects a value that is valid for
    any of the fields sharing that key.
    """
    meta: dict[str, dict] = {}
    for item in get_gestante_template():
        key = normalize_field_key(item["name"])
        entry = meta.setdefault(
            key, {"types": set(), "allowed": set(), "name": item["name"]}
        )
        entry["types"].add(item["type"])
        if item.get("allowed"):
            entry["allowed"].update(item["allowed"])
    return meta


def _parse_date(value):
    """Return a date for the accepted formats, else None."""
    s = str(value if value is not None else "").strip()
    if not s:
        return None
    head = s.split("T")[0].split(" ")[0].strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(head, fmt).date()
        except ValueError:
            continue
    return None


def _parse_int(value) -> int | None:
    """Return the value as an int, else None ("" and junk count as None)."""
    s = str(value if value is not None else "").strip()
    if not s:
        return None
    try:
        return int(float(s))
    except (TypeError, ValueError):
        return None


def compute_edad(fecha_nacimiento) -> str:
    """Integer years between the birth date and today (month/day aware).

    Returns "" when the birth date is missing or unparseable.
    """
    born = _parse_date(fecha_nacimiento)
    if born is None:
        return ""
    today = date.today()
    years = today.year - born.year
    if (today.month, today.day) < (born.month, born.day):
        years -= 1
    if years < 0 or years > 130:
        return ""
    return str(years)


def _es_comodin(d) -> bool:
    """True for placeholder comodin dates (any year <= 1900, e.g. 1800/1845/1900)."""
    return d is not None and d.year <= 1900


def _es_na(valor) -> bool:
    """True when the value is "NA" (case- and space-insensitive)."""
    return " ".join(str(valor if valor is not None else "").split()).lower() == "na"


def _txt(valor) -> str:
    """Trimmed string view of a payload value (None becomes ""; 0 stays "0")."""
    return "" if valor is None else str(valor).strip()


def _sin_acentos(s: str) -> str:
    """Drop combining marks so labels can compare without accents."""
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _coincide(valor, esperado: str) -> bool:
    """Case-, space- and accent-insensitive equality for SET labels."""
    a = _sin_acentos(" ".join(str(valor if valor is not None else "").split())).lower()
    b = _sin_acentos(" ".join(str(esperado).split())).lower()
    return a == b


def _lab_result_pairs() -> list[tuple[str, str]]:
    """(fecha, resultado) template names for the lab coherence rules.

    Built from RAW_FIELDS by adjacency: every DATE column immediately
    followed by its "Resultado ..." column (VIH 1-3, VIH seguimiento,
    sifilis treponemica 1-3, urocultivo, glicemia, PTOG, hemoglobina 1-3,
    hepatitis B, toxoplasma, citologia cervicouterina, rubeola,
    estreptococo, gota gruesa/malaria y chagas).
    """
    pairs: list[tuple[str, str]] = []
    for i in range(len(RAW_FIELDS) - 1):
        (fecha, fecha_type), (resultado, _) = RAW_FIELDS[i], RAW_FIELDS[i + 1]
        if fecha_type == "DATE" and resultado.strip().startswith("Resultado"):
            pairs.append((fecha.strip(), resultado.strip()))
    return pairs


# Remaining lab/tamizaje/vacunacion dates: the RAW_FIELDS block from
# "Asesoria Prueba VIH" through "Fecha Desparasitacion ..." (the pair dates
# come from _lab_result_pairs). Control, FUM, ingreso, diagnostico,
# nacimiento, parto/aborto and planificacion dates are intentionally out of
# scope for the "lab date >= ingreso" rule.
_LAB_EXTRA_DATE_NAMES: tuple[str, ...] = (
    "Asesoria Prueba VIH",
    "Fecha prueba confirmatoria Según Algoritmo",
    "Fecha de diagnóstico de sífilis",
    "Fecha de inicio del tratamiento",
    "Fecha de segunda dosis del tratamiento",
    "Fecha de tercera dosis del tratamiento",
    "FECHA DE APLICACIÓN INFLUENZA (Desde Semana 14)",
    "FECHA DE APLICACIÓN TOXOIDE Según Antecedente Vacunal",
    "FECHA DE APLICACIÓN DPT ACELULAR (Semana 26)",
    "FECHA DE APLICACIÓN COVID-19 (1 En la Gestación)",
    "FECHA DE APLICACIÓN VSR (Semana 28 - 36)",
    "FECHA CONSULTA ODONTOLOGICA",
    "Ecografia obstétrica con translucencia nucal (10,6 - 13,6)",
    "Ecografia Obstetrica para la detección de anomalias estructurales (18 - 23)",
    "Otras ecografías?",
    "Fecha suministro Acido Folico",
    "Fecha suministro Calcio (Semana 14)",
    "Fecha suministro Hierro",
    "fecha de suministro",
    "Fecha Desparasitación Antihelmintica II y III Trimestre (Albendazo 400 Mg Dosis Unica)",
)

# Prenatal control dates in template order (mirrors RAW_FIELDS rows
# "Fecha 1er Control".."Fecha 9no Control").
_CONTROL_DATE_NAMES: tuple[str, ...] = (
    "Fecha 1er Control",
    "Fecha 2do Control",
    "Fecha 3er Control",
    "Fecha 4to Control",
    "Fecha 5to Control",
    "Fecha 6to Control",
    "Fecha 7mo Control",
    "fecha 8vo Control",
    "Fecha 9no Control",
)

# Every input formulas.py::aplicar_formulas reads. The single-record
# auto-formula pass only runs when the payload carries at least one of them,
# so empty or unrelated payloads do not sprout formula columns.
_FORMULA_INPUT_NAMES: tuple[str, ...] = (
    "No. De Identificación",
    "Fecha de Nacimiento",
    "Fecha de Ingreso al Control Prenatal",
    "FUM",
    "FPP",
    "Peso Inicial (kg)",
    "Talla (metros)",
    "peso actual",
    "talla actual",
    "Tipo de tratamiento suminitrado para anemia",
    "Asesoria Prueba VIH",
    "Fecha Toma Prueba VIH Primer Tamizaje",
    "Fecha Toma Prueba VIH Segundo Tamizaje",
    "Fecha Toma Prueba VIH Tercer Tamizaje",
    "Fecha Primera Prueba Treponemica Rapida Sifilis",
    "Fecha Segunda Prueba Treponemica Rapida Sifilis",
    "Fecha Tercera Prueba Treponemica Rapida Sifilis",
    "Fecha toma Segunda Prueba VIH",
    "Fecha prueba confirmatoria Según Algoritmo",
    "Fecha 1ra Realizacion Hemoglobina",
    "Resultado 1ra Hemoglobina",
    "Fecha 2da Realizacion Hemoglobina",
    "Resultado 2da Hemoglobina",
    "Fecha 3ra Realizacion Hemoglobina",
    "Resultado 3ra Hemoglobina",
) + _CONTROL_DATE_NAMES


def aplicar_formulas_unitario(cleaned: dict) -> dict:
    """Run formulas.py::aplicar_formulas over a single-record payload.

    The bulk path hands the formulas a dict keyed by template display names
    while this validator works with normalized frontend keys. Build the
    display-name view (first template occurrence wins on duplicated names),
    let the shared formulas fill it, then write every mapped field back as a
    string so IMC, controles, trimestres, relacion anemia, etc. match the
    bulk results (None becomes "").
    """
    name_to_key: dict[str, str] = {}
    for item in get_gestante_template():
        name = item["name"]
        if name not in name_to_key:
            name_to_key[name] = normalize_field_key(name)

    fila: dict[str, object] = {}
    for name, key in name_to_key.items():
        value = cleaned.get(key, "")
        fila[name] = "" if value is None else value

    try:
        from .formulas import aplicar_formulas
    except ImportError:
        from formulas import aplicar_formulas

    fila = aplicar_formulas(fila)

    for name, key in name_to_key.items():
        value = fila.get(name)
        cleaned[key] = "" if value is None else str(value)
    return cleaned


def validate_gestante_payload(payload: dict) -> tuple[list[str], dict]:
    """Validate a single-record gestante payload against the instructivo.

    Keys are the frontend UPPER_SNAKE keys. Returns (errors, cleaned) where
    errors names the offending field and cleaned is a copy of the payload with
    the age always recomputed from the birth date (the incoming age is never
    trusted).
    """
    meta = field_meta_by_key()
    errors: list[str] = []
    cleaned = dict(payload or {})

    for key, raw in list(cleaned.items()):
        entry = meta.get(key)
        if entry is None:
            continue
        val = "" if raw is None else str(raw).strip()
        if not val:
            continue
        label = entry.get("name") or key
        types = entry["types"]
        if "SET" in types:
            if val != "NA" and val not in entry["allowed"]:
                errors.append(f"{label}: '{val}' no es una opcion valida")
        elif "DATE" in types:
            if _parse_date(val) is None:
                errors.append(f"{label}: '{val}' no es una fecha valida (use AAAA-MM-DD)")
        elif "DECIMAL" in types:
            try:
                float(val)
            except ValueError:
                errors.append(f"{label}: '{val}' debe ser un numero")
        elif "INT" in types or "NUMERIC" in types:
            try:
                number = float(val)
            except ValueError:
                errors.append(f"{label}: '{val}' debe ser un numero")
            else:
                if "INT" in types and not number.is_integer():
                    errors.append(f"{label}: '{val}' debe ser un numero entero")

    # Conditional requirement: an "Indígena" pertenencia demands a real etnia.
    if str(cleaned.get("PERTENECIA_ETNICA", "")).strip() == "Indígena":
        etnia = str(cleaned.get("ETNIA", "")).strip()
        if not etnia or etnia == "NA":
            errors.append("Si la pertenencia étnica es Indígena, debe seleccionar una etnia")

    # Cross-field: the pregnancy diagnosis date cannot be after the prenatal-care entry date.
    f_dx = _parse_date(cleaned.get("FECHA_DE_DIAGNOSTICO_DEL_EMBARAZO"))
    f_ing = _parse_date(cleaned.get("FECHA_DE_INGRESO_AL_CONTROL_PRENATAL"))
    if f_dx and f_ing and f_dx > f_ing:
        errors.append(
            "Fecha Diagnostico Embarazo no puede ser posterior a la Fecha de Ingreso al Control Prenatal"
        )

    # Cross-field: the last menstrual period must precede both the prenatal-care
    # entry date and the pregnancy diagnosis date. The bulk validator only warns
    # about these; here the single record is blocked with an error.
    fum = _parse_date(cleaned.get("FUM"))
    if fum and f_ing and fum >= f_ing:
        errors.append("La FUM debe ser anterior a la Fecha de Ingreso al Control Prenatal")
    if fum and f_dx and fum >= f_dx:
        errors.append("La FUM debe ser anterior a la Fecha de Diagnostico del Embarazo")

    # Cross-field: obstetric counts, checked only when every involved value
    # parses as a number (G >= P+A+M, P >= C, P >= V).
    g = _parse_int(cleaned.get("G"))
    p = _parse_int(cleaned.get("P"))
    c = _parse_int(cleaned.get("C"))
    a = _parse_int(cleaned.get("A"))
    m = _parse_int(cleaned.get("M"))
    v = _parse_int(cleaned.get("V"))
    if g is not None and p is not None and a is not None and m is not None and g < p + a + m:
        errors.append(f"G({g}) debe ser >= P({p})+A({a})+M({m})={p + a + m}")
    if p is not None and c is not None and p < c:
        errors.append(f"P({p}) debe ser >= C({c})")
    if p is not None and v is not None and p < v:
        errors.append(f"P({p}) debe ser >= V({v}) (hijos vivos no puede exceder partos)")

    # R7: obstetric counts cannot be zero (0 would mean "never recorded").
    for _name, _count in (("G", g), ("P", p), ("C", c), ("A", a), ("M", m), ("V", v)):
        if _count is not None and _count < 1:
            errors.append(f"{_name}: debe ser un numero mayor o igual a 1")

    # Real prenatal-care entry date for the rules below: parsed AND not a
    # placeholder comodin (same < 1900 criterion as main._fecha_real_caso).
    ingreso = f_ing if not _es_comodin(f_ing) else None

    # R9: a high preeclampsia risk only makes sense inside a high obstetric risk.
    k_pree = normalize_field_key("Clacificacion del riesgo de preeclampsia")
    k_obs = normalize_field_key("Clasificación del riesgo obstetrico")
    if _coincide(cleaned.get(k_pree), "Alto riesgo de Preeclampsia") and not _coincide(
        cleaned.get(k_obs), "Alto riesgo obstétrico"
    ):
        errors.append(
            "Si la Clasificacion del riesgo de preeclampsia es Alto riesgo de Preeclampsia, "
            "la Clasificacion del riesgo obstetrico debe ser Alto riesgo obstétrico"
        )

    # R10: high thromboembolic risk requires an established treatment. The two
    # template names ("tratamiento Instaurado"/"Tratamiento instaurado") share
    # one normalized key, so the key is what gets validated.
    k_trombo = normalize_field_key("Clacificacion del riesgo tromboembolico")
    k_trat = normalize_field_key("tratamiento Instaurado")
    if _coincide(cleaned.get(k_trombo), "Alto riesgo Tromboembolico"):
        trat = _txt(cleaned.get(k_trat))
        if not trat or _es_na(trat):
            errors.append(
                "Si la Clasificacion del riesgo tromboembolico es Alto riesgo Tromboembolico, "
                "Tratamiento instaurado es obligatorio (no puede quedar vacio ni NA)"
            )

    # R11: with high preeclampsia risk the supply date must be a real date
    # (key "fecha de suministro", the ASA row; it does not collide with
    # "fecha de suministro de tratamiento").
    if _coincide(cleaned.get(k_pree), "Alto riesgo de Preeclampsia"):
        k_sum = normalize_field_key("fecha de suministro")
        raw_sum = _txt(cleaned.get(k_sum))
        if raw_sum and _es_comodin(_parse_date(raw_sum)):
            errors.append(
                "Si el riesgo de preeclampsia es Alto, la fecha de suministro no puede ser una fecha comodin"
            )

    # R12: a real lab date cannot pair with an "NA" result, and a comodin
    # date only makes sense with an "NA" result (empty fields are skipped).
    for fecha_name, resultado_name in _lab_result_pairs():
        k_fecha = normalize_field_key(fecha_name)
        k_res = normalize_field_key(resultado_name)
        if k_fecha not in meta or k_res not in meta:
            continue
        raw_fecha = _txt(cleaned.get(k_fecha))
        raw_res = _txt(cleaned.get(k_res))
        if not raw_fecha or not raw_res:
            continue
        fecha = _parse_date(raw_fecha)
        if fecha is None:
            # Malformed dates are already reported by the type pass above.
            continue
        if _es_comodin(fecha):
            if not _es_na(raw_res):
                errors.append(
                    f"Si {fecha_name} es una fecha comodin, {resultado_name} debe ser NA"
                )
        elif _es_na(raw_res):
            errors.append(
                f"Si {fecha_name} tiene una fecha real, {resultado_name} no puede ser NA"
            )

    # R13: lab/tamizaje/vacunacion dates cannot predate the entry date
    # (comodin/empty/unparseable dates are skipped; only real dates count).
    if ingreso is not None:
        for fecha_name in [f for f, _ in _lab_result_pairs()] + list(_LAB_EXTRA_DATE_NAMES):
            k_fecha = normalize_field_key(fecha_name)
            if k_fecha not in meta:
                continue
            fecha = _parse_date(cleaned.get(k_fecha))
            if fecha is None or _es_comodin(fecha):
                continue
            if fecha < ingreso:
                errors.append(
                    f"Si {fecha_name} ({fecha}) debe ser igual o posterior a la Fecha de Ingreso al Control Prenatal ({ingreso})"
                )

    # R15: the first control must equal the entry date, and the real control
    # dates must be strictly increasing. "Ultimo Control Prenatal" is a
    # formula (auto-computed as the max) and is deliberately not validated.
    controles = [(nombre, normalize_field_key(nombre)) for nombre in _CONTROL_DATE_NAMES]
    if ingreso is not None:
        primera = _parse_date(cleaned.get(controles[0][1]))
        if primera is not None and not _es_comodin(primera) and primera != ingreso:
            errors.append(
                "La Fecha 1er Control debe coincidir con la Fecha de Ingreso al Control Prenatal"
            )
    prev_nombre = ""
    prev_fecha = None
    for nombre, k_ctrl in controles:
        fecha = _parse_date(cleaned.get(k_ctrl))
        if fecha is None or _es_comodin(fecha):
            # Empty, malformed or comodin dates do not join the chain.
            continue
        if prev_fecha is not None and fecha <= prev_fecha:
            errors.append(
                f"Las fechas de controles prenatales deben ser estrictamente crecientes: "
                f"{nombre} ({fecha}) no es posterior a {prev_nombre} ({prev_fecha})"
            )
        prev_nombre, prev_fecha = nombre, fecha

    # R17: end-of-pregnancy and family-planning dates must postdate the entry
    # date. NOTE: the template's "Fecha" (defuncion) and "FECHA" (planificacion)
    # collapse into the same normalized key FECHA, so both share this check.
    if ingreso is not None:
        for nombre in ("Fecha de aborto", "Fecha de Parto", "FECHA"):
            fecha = _parse_date(cleaned.get(normalize_field_key(nombre)))
            if fecha is None or _es_comodin(fecha):
                continue
            if fecha <= ingreso:
                errors.append(
                    f"Si {nombre} ({fecha}) debe ser posterior a la Fecha de Ingreso al Control Prenatal ({ingreso})"
                )

    # Auto-formula pass (parity with the bulk path): IMC, clasificaciones,
    # controles, trimestres, relacion anemia, etc. Runs only when the payload
    # carries at least one input the formulas read.
    if any(
        _txt(cleaned.get(normalize_field_key(nombre)))
        for nombre in _FORMULA_INPUT_NAMES
    ):
        cleaned = aplicar_formulas_unitario(cleaned)

    # Derived fields (authoritative, always overwritten from FUM): FPP = FUM + 280
    # days, days left until the due date and the resulting alert. A missing or
    # unparseable FUM leaves FPP/DIAS_PARA_EL_PARTO/ALARMA with whatever the
    # formula pass above derived (incoming values pass through untouched).
    if fum:
        fpp = fum + timedelta(days=280)
        dias = (fpp - date.today()).days
        cleaned["FPP"] = fpp.strftime("%Y-%m-%d")
        cleaned["DIAS_PARA_EL_PARTO"] = str(dias)
        if dias < 0:
            cleaned["ALARMA"] = "NACIDO"
        elif dias <= 7:
            cleaned["ALARMA"] = "SEMANA DE PARTO"
        elif dias <= 28:
            cleaned["ALARMA"] = "MENOS 4 SEM"
        else:
            cleaned["ALARMA"] = "PENDIENTE"

    cleaned["EDAD_ANOS"] = compute_edad(cleaned.get("FECHA_DE_NACIMIENTO"))

    return errors, cleaned


def build_gestante_template():
    template = []
    seen: dict[str, int] = {}

    for base_name, field_type in RAW_FIELDS:
        base = base_name.strip()
        count = seen.get(base, 0) + 1
        seen[base] = count
        unique_name = base if count == 1 else f"{base}_{count}"

        allowed = None
        if field_type == "SET":
            allowed = allowed_for(base)

        template.append(field(unique_name, field_type, True, allowed))

    return template


def get_gestante_template():
    return build_gestante_template()
