def field(name: str, type_: str, required: bool = True, allowed: list[str] | None = None):
    return {"name": name, "type": type_, "required": required, "allowed": allowed or []}

SI_NO = ["SI", "NO"]
SI_NO_SD = ["SI", "NO", "SIN DATO"]

RAW_FIELDS = [
    # ── Identificación del niño (1-10) ──
    ("TIPO DE IDENTIFICACION", "TEXT"),
    ("NO. DE IDENTIFICACION", "INT"),
    ("FECHA DE NACIMIENTO", "TEXT"),
    ("EDAD MESES AL MOMENTO APLICACION 3 DOSIS", "INT"),
    ("SEXO", "SET"),
    ("EDAD A LA APLICACION DE LA VACUNA (3ERA DOSIS)", "INT"),
    ("PRIMER APELLIDO DEL NIÑO", "TEXT"),
    ("SEGUNDO APELLIDO DEL NIÑO", "TEXT"),
    ("PRIMER NOMBRE DEL NIÑO", "TEXT"),
    ("SEGUNDO NOMBRE DEL NIÑO", "TEXT"),

    # ── Datos de la madre / responsable (11-13) ──
    ("TIPO DE IDENTIFICACION MADRE O CABEZA DE FAMILIA", "SET"),
    ("NUMERO DE IDENTIFICACION MADRE O CABEZA DE FAMILIA", "INT"),
    ("NOMBRES Y APELLIDOS DE LA MADRE O CABEZA DE FAMILIA", "TEXT"),

    # ── Afiliación / IPS (14-18) ──
    ("REGIMEN DE AFILIACION", "SET"),
    ("ASEGURADORA", "TEXT"),
    ("IPS PRIMARIA", "TEXT"),
    ("IPS ASIGNADA", "TEXT"),
    ("IPS VACUNADORA", "TEXT"),

    # ── Residencia / demográficos (19-26) ──
    ("DEPARTAMENTO", "TEXT"),
    ("MUNICIPIO DE RESIDENCIA", "INT"),
    ("AREA DE RESIDENCIA", "SET"),
    ("BARRIO / CENTRO POBLADO O VEREDA DE RESIDENCIA/RANCHERIA", "TEXT"),
    ("ETNIA", "SET"),
    ("RESGUARDO", "TEXT"),
    ("ASENTAMIENTO/RANCHERIA/COMUNIDAD", "TEXT"),
    ("SECTOR", "TEXT"),

    # ── Contacto (27-29) ──
    ("NUMERO DE TELEFONO", "INT"),
    ("GRUPO POBLACIONAL", "TEXT"),
    ("CORREO ELECTRONICO", "TEXT"),

    # ── Vacunación (30-35) ──
    ("FECHA APLICACION PRIMERAS DOSIS", "DATE"),
    ("INTERVALO ENTRE 1ERA Y 2DA DOSIS", "DECIMAL"),
    ("FECHA APLICACION SEGUNDAS DOSIS", "DATE"),
    ("INTERVALO ENTRE2DA Y 3ERA DOSIS", "DECIMAL"),
    ("FECHA APLICACION TERCERA DOSIS", "DATE"),
    ("EVIDENCIA DE ERROR DE LA VACUNA ENTRE LA EDAD Y 3ERA DOSIS (MUESTRA ERROR SI LA LA APLICACION DE LA 3ERA DOSIS FUE DESPUES DE LOS 12 MESES)", "TEXT"),

    # ── Final (36-37) ──
    ("MES DE REPORTE", "DATE"),
    ("OBSERVACION", "TEXT"),
]

ALLOWED_BY_NAME = {
    "SEXO": ["FEMENINO", "MASCULINO"],
    "TIPO DE IDENTIFICACION MADRE O CABEZA DE FAMILIA": ["ALTERADO", "NORMAL", "SIN DATO"],
    "REGIMEN DE AFILIACION": ["SUBSIDIADO", "CONTRIBUTIVO"],
    "AREA DE RESIDENCIA": ["ALTERADO", "NORMAL", "SIN DATO"],
    "ETNIA": ["WAYUU", "ARHUACO", "WIWA", "YUKPA", "KOGI", "INGA", "KANKUAMO", "CHIMILA", "ZENU", "SIN ETNIA"],
}

def allowed_for(field_name: str):
    return ALLOWED_BY_NAME.get(field_name, SI_NO)

def build_penta_template():
    template = []
    seen: dict[str, int] = {}

    for base_name, field_type in RAW_FIELDS:
        base = base_name.strip().upper()
        count = seen.get(base, 0) + 1
        seen[base] = count
        unique_name = base if count == 1 else f"{base}_{count}"

        allowed = None
        if field_type == "SET":
            allowed = allowed_for(base)

        template.append(field(unique_name, field_type, True, allowed))

    return template

def get_penta_template():
    return build_penta_template()
