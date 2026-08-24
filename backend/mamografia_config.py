def field(name: str, type_: str, required: bool = True, allowed: list[str] | None = None):
    return {"name": name, "type": type_, "required": required, "allowed": allowed or []}

SI_NO = ["SI", "NO"]

BIRADS = [
    "BIRADS 0",
    "BIRADS 1",
    "BIRADS 2",
    "BIRADS 3",
    "BIRADS 4",
    "BIRADS 5",
    "BIRADS 6",
]

TIPO_DOCUMENTO = [
    "RC",
    "TI",
    "CC",
    "CE",
    "PA",
    "MS",
    "AS",
    "CD",
    "SC",
    "PE",
]

GENERO = ["FEMENINO"]

ZONA = ["RURAL", "URBANA"]

ESTADO_USUARIO = ["ACTIVO", "PROTECCION LABORAL", "INACTIVO"]

PERTENENCIA_ETNICA = [
    "ARHUACO",
    "KANKUAMO",
    "WIWA",
    "WAYUU",
    "YUKPA",
    "KOGI",
    "INGA",
    "CHIMILA",
    "ZENU",
    "SIN ETNIA",
]

TIPO_SEGUIMIENTO = ["1", "2", "3", "4"]

DIAGNOSTICOS_ESPECIALES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]

RAW_FIELDS = [
    # ── 1-10 Básicos y programación ──
    ("CONSECUTIVO", "INT"),
    ("TIPO IDENTIFICACION DEL PACIENTE", "SET"),
    ("NUMERO DE IDENTIFICACION DEL PACIENTE", "TEXT"),
    ("PRIMER APELLIDO", "TEXT"),
    ("SEGUNDO APELLIDO", "TEXT"),
    ("PRIMER NOMBRE", "TEXT"),
    ("SEGUNDO NOMBRE", "TEXT"),
    ("PENDIENTE SI/NO", "SET"),
    ("OBJETO 2025", "INT"),
    ("FECHA PROXIMA MAMOGRAFIA", "DATE"),

    # ── Mamografía 1 ──
    ("IPS QUE TOMA LA MAMOGRAFIA 1", "TEXT"),
    ("FECHA MAMOGRAFIA 1", "DATE"),
    ("RESULTADO 1", "SET"),

    # ── Mamografía 2 ──
    ("IPS QUE TOMA LA MAMOGRAFIA 2", "TEXT"),
    ("FECHA MAMOGRAFIA 2", "DATE"),
    ("RESULTADO 2", "SET"),

    # ── Mamografía 3 ──
    ("IPS QUE TOMA LA MAMOGRAFIA 3", "TEXT"),
    ("FECHA MAMOGRAFIA 3", "DATE"),
    ("RESULTADO 3", "SET"),

    # ── Datos demográficos ──
    ("FECHA DE NACIMIENTO", "DATE"),
    ("EDAD", "INT"),
    ("GENERO", "SET"),
    ("DEPARTAMENTO", "TEXT"),
    ("MUNICIPIO", "TEXT"),
    ("ZONA", "SET"),
    ("ESTADO DEL USUARIO", "SET"),
    ("IPS PRIMARIA", "TEXT"),
    ("NIT DE LA IPS PRIMARIA", "INT"),
    ("PERTENENCIA ETNICA", "SET"),
    ("RESGUARDO", "TEXT"),
    ("ASENTAMIENTO/COMUNIDAD O RANCHERIA", "TEXT"),
    ("DIRECCION DE RESIDENCIA DEL PACIENTE", "TEXT"),
    ("NUMERO TELEFONICO DEL PACIENTE", "INT"),

    # ── Seguimiento ──
    ("HORA DE SEGUIMIENTO", "TEXT"),
    ("SEGUIMIENTO EFECTIVO", "SET"),
    ("FECHA DE SEGUIMIENTO", "DATE"),
    ("NUMERO DE SEGUIMIENTO", "INT"),
    ("DESCRIPCION DEL SEGUIMIENTO", "TEXT"),
    ("TIPO DE SEGUIMIENTO", "SET"),
    ("ASIGNACION DE VIATICO SI/NO", "SET"),
    ("SERVICIO DE CASA DE PASO SI/NO", "SET"),
    ("FECHA DE AGENDAMIENTO", "DATE"),
    ("OBSERVACIONES DEL SEGUIMIENTO", "TEXT"),
    ("NOMBRE DE QUIEN REALIZA EL SEGUIMIENTO", "TEXT"),
    ("DIAGNOSTICOS ESPECIALES", "SET"),
    ("FECHA DE MUERTE", "DATE"),
    ("OBSERVACION", "TEXT"),
]

ALLOWED_BY_NAME = {
    "TIPO IDENTIFICACION DEL PACIENTE": TIPO_DOCUMENTO,
    "PENDIENTE SI/NO": SI_NO,
    "RESULTADO 1": BIRADS,
    "RESULTADO 2": BIRADS,
    "RESULTADO 3": BIRADS,
    "GENERO": GENERO,
    "ZONA": ZONA,
    "ESTADO DEL USUARIO": ESTADO_USUARIO,
    "PERTENENCIA ETNICA": PERTENENCIA_ETNICA,
    "SEGUIMIENTO EFECTIVO": SI_NO,
    "TIPO DE SEGUIMIENTO": TIPO_SEGUIMIENTO,
    "ASIGNACION DE VIATICO SI/NO": SI_NO,
    "SERVICIO DE CASA DE PASO SI/NO": SI_NO,
    "DIAGNOSTICOS ESPECIALES": DIAGNOSTICOS_ESPECIALES,
}

def allowed_for(field_name: str):
    return ALLOWED_BY_NAME.get(field_name, [])

def build_mamografia_template():
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

def get_mamografia_template():
    return build_mamografia_template()