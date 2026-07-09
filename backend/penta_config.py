def field(name: str, type_: str, required: bool = True, allowed: list[str] | None = None):
    return {"name": name, "type": type_, "required": required, "allowed": allowed or []}

SI_NO = ["SI", "NO"]
SI_NO_SD = ["SI", "NO", "SIN DATO"]

RAW_FIELDS = [
    ("TIPO DE IDENTIFICACIÓN", "TEXT"),
    ("NO. DE IDENTIFICACIÓN", "INT"),
    ("PRIMER APELLIDO DEL NIÑO", "TEXT"),
    ("SEGUNDO APELLIDO DEL NIÑO", "TEXT"),
    ("PRIMER NOMBRE DEL NIÑO", "TEXT"),
    ("SEGUNDO NOMBRE DEL NIÑO", "TEXT"),
    ("FECHA DE NACIMIENTO", "DATE"),
    ("EDAD", "INT"),
    ("EDAD MESES AL MOMENTO APLICACIÓN 3 DOSIS", "INT"),
    ("SEXO", "TEXT"),
    ("TIPO DE IDENTIFICACIÓN MADRE O CABEZA DE FAMILIA", "SET"),
    ("NUMERO DE IDENTIFICACIÓN MADRE O CABEZA DE FAMILIA", "INT"),
    ("NOMBRES Y APELLIDOS DE LA MADRE O CABEZA DE FAMILIA", "TEXT"),
    ("DEPARTAMENTO", "TEXT"),
    ("MUNICIPIO DE RESIDENCIA", "INT"),
    ("ASEGURADORA", "TEXT"),
    ("IPS PRIMARIA", "TEXT"),
    ("IPS ASIGNADA", "TEXT"),
    ("IPS VACUNADORA", "TEXT"),
    ("RÉGIMEN DE AFILIACIÓN", "TEXT"),
    ("AREA", "SET"),
    ("GRUPO POBLACIONAL", "TEXT"),
    ("ETNIA", "SET"),
    ("NUMERO DE TELEFONO", "INT"),
    ("NUMERO DE TELEFONO 2", "INT"),
    ("BARRIO / CENTRO POBLADO O VEREDA DE RESIDENCIA/RANCHERIA", "TEXT"),
    ("ASENTAMIENTO", "TEXT"),
    ("ESTADO", "TEXT"),
    ("CORREO ELECTRONICO", "TEXT"),
    ("FECHA APLICACIÓN PRIMERAS DOSIS", "DATE"),
    ("INTERVALO ENTRE 1ERA Y 2DA DOSIS", "DECIMAL"),
    ("FECHA APLICACION SEGUNDAS DOSIS", "DATE"),
    ("INTERVALO ENTRE2DA Y 3ERA DOSIS", "DECIMAL"),
    ("FECHA APLICACIÓN TERCERA DOSIS", "DATE"),
    ("Mes de Reporte", "DATE"),
    ("OBSERVACION", "TEXT"),
]

ALLOWED_BY_NAME = {
    "TIPO DE IDENTIFICACIÓN MADRE O CABEZA DE FAMILIA": ["CC", "TI", "CE", "RC", "PA", "MSI", "ASI", "CD"],
    "AREA": ["RURAL", "URBANA"],
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
