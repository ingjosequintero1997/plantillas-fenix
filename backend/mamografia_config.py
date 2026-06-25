def field(name: str, type_: str, required: bool = True, allowed: list[str] | None = None):
    return {"name": name, "type": type_, "required": required, "allowed": allowed or []}

SI_NO = ["SI", "NO"]
SI_NO_SD = ["SI", "NO", "SIN DATO"]

RAW_FIELDS = [
    # ── Básicos (1-6) ──
    ("TIPO DE DOCUMENTO DE IDENTIDAD", "SET"),
    ("NUMERO DE IDENTIFICACION", "INT"),
    ("PRIMER APELLIDO", "TEXT"),
    ("SEGUNDO APELLIDO", "TEXT"),
    ("PRIMER NOMBRE", "TEXT"),
    ("SEGUNDO NOMBRE", "TEXT"),

    # ── Pendiente / Objeto / Próxima mamografía (7-9) ──
    ("PENDIENTE SI/NO", "TEXT"),
    ("OBJETO", "SET"),
    ("FECHA PROXIMA MAMOGRAFIA", "DATE"),

    # ── Mamografía 1 (10-12) ──
    ("IPS QUE TOMA LA MAMOGRAFIA 2", "TEXT"),
    ("FECHA MAMOGRAFIA", "DATE"),
    ("RESULTADO", "TEXT"),

    # ── Mamografía 2 (13-15) ──
    ("IPS QUE TOMA LA MAMOGRAFIA 2", "TEXT"),
    ("FECHA MAMOGRAFIA 2", "DATE"),
    ("RESULTADO", "TEXT"),

    # ── Mamografía 3 (16-18) ──
    ("IPS QUE TOMA LA MAMOGRAFIA 3", "TEXT"),
    ("FECHA MAMOGRAFIA 3", "DATE"),
    ("RESULTADO", "TEXT"),

    # ── Datos demográficos adicionales (19-32) ──
    ("FECHA DE NACIMIENTO", "TEXT"),
    ("EDAD(AÑOS)", "INT"),
    ("GENERO", "SET"),
    ("DEPARTAMENTO", "TEXT"),
    ("MUNICIPIO", "INT"),
    ("ZONA AFILIACION", "SET"),
    ("ESTADO ACTUAL", "TEXT"),
    ("IPS PRIMARIA", "TEXT"),
    ("NIT IPS PRIMARIA", "INT"),
    ("PERTENENCIA ETNICA", "SET"),
    ("RESGUARDO", "TEXT"),
    ("ASENTAMIENTO/RANCHERIA/COMUNIDAD", "TEXT"),
    ("DIRECCION", "TEXT"),
    ("NUMERO DE TELEFONO", "INT"),

    # ── Seguimiento (33-46) ──
    ("HORA DE SEGUIMIENTO", "TEXT"),
    ("SEGUIMIENTO EFECTIVO", "SET"),
    ("FECHA DE SEGUIMIENTO", "DATE"),
    ("NUMERO DE SEGUIMIENTO", "TEXT"),
    ("DESCRIPCION DEL SEGUIMIENTO", "TEXT"),
    ("TIPO DE SEGUIMIENTO", "SET"),
    ("ASIGNACION DE VIATICOS", "SET"),
    ("SERVICIO DE CASA DEPASO", "SET"),
    ("FECHA DE AGENDAMIENTO", "DATE"),
    ("OBSERVACION DEL SEGUIMIENTO", "TEXT"),
    ("NOMBRE DE QUIEN REALIZA EL SEGUIMIENTO", "TEXT"),
    ("DIAGNOSTICOS ESPECIALES", "TEXT"),
    ("FECHA DE MUERTE", "DATE"),
    ("OBSERVACION", "TEXT"),
]

SI_NO_NA = ["SI", "NO", "NO APLICA"]

ALLOWED_BY_NAME = {
    "TIPO DE DOCUMENTO DE IDENTIDAD": [
        "CEDULA DE CIUDADANIA", "TARJETA DE IDENTIDAD", "MENOR SIN IDENTIFICACION",
        "ADULTO SIN IDENTIFICACION", "PASAPORTE", "PERMISO PROTECCION TEMPORAL",
        "CARNE DIPLOMATICO", "CEDULA DE EXTRANJERIA", "SALVOCONDUCTO",
        "PASAPORTE DE LA ONU",
    ],
    "GENERO": ["MASCULINO", "FEMENINO", "TRANSGENERO"],
    "ZONA AFILIACION": ["RURAL", "URBANA"],
    "PERTENENCIA ETNICA": ["INDIGENA", "MESTIZO", "NINGUNAS DE LAS ANTERIORES"],
    "OBJETO": SI_NO_NA,
    "SEGUIMIENTO EFECTIVO": SI_NO,
    "TIPO DE SEGUIMIENTO": ["TELEFONICO", "HISTORIAS CLINICAS", "VISITA DOMICILIARIA", "SEGUIMIENTO POR IPS"],
    "ASIGNACION DE VIATICOS": SI_NO_NA,
    "SERVICIO DE CASA DEPASO": SI_NO_NA,
}

def allowed_for(field_name: str):
    return ALLOWED_BY_NAME.get(field_name, SI_NO)

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
