"""
Configuración del módulo: Reporte de procedimientos o consultas pendientes
Matrices: PX/Consultas y Medicamentos
"""

# ─── MATRIZ PX Y CONSULTAS (23 variables) ───────────────────────────────
PX_CONSULTAS_FIELDS = [
    {"key": "consecutivo", "label": "Consecutivo del registro", "type": "numeric", "required": True},
    {"key": "periodo_reportado", "label": "PERIODO REPORTADO", "type": "numeric", "required": True},
    {"key": "cod_eps", "label": "Cod. EPS", "type": "alphanumeric", "required": True},
    {"key": "tipo_documento", "label": "Tipo documento", "type": "select", "required": True,
     "options": ["MS", "RC", "TI", "CC", "CE", "PA", "CD", "AS", "CN", "SC", "PE", "PT"]},
    {"key": "documento", "label": "Documento", "type": "alphanumeric", "required": True},
    {"key": "identificador_orden", "label": "Identificador de la orden de servicio", "type": "alphanumeric", "required": True},
    {"key": "cod_municipio", "label": "CÓDIGO MUNICIPIO", "type": "numeric", "required": True, "length": 5},
    {"key": "cod_diagnostico", "label": "Código del Diagnóstico Principal", "type": "alphanumeric", "required": True},
    {"key": "cups", "label": "CUPS", "type": "numeric", "required": True},
    {"key": "procedimiento_consulta", "label": "Procedimiento o consulta", "type": "alphanumeric", "required": True},
    {"key": "clase_pendiente", "label": "Clase de pendiente", "type": "numeric", "required": True, "options": [1, 2, 3]},
    {"key": "cantidad_ordenada", "label": "Cantidad ordenada", "type": "numeric", "required": True},
    {"key": "cantidad_prestacion_efectiva", "label": "Cantidad con prestación efectiva", "type": "numeric", "required": True},
    {"key": "cantidad_pendiente", "label": "Cantidad pendiente", "type": "numeric", "required": True},
    {"key": "causa_pendiente", "label": "Causa del pendiente", "type": "numeric", "required": True},
    {"key": "observacion_causa", "label": "Observación causa del pendiente", "type": "text", "required": False},
    {"key": "fecha_orden", "label": "Fecha de orden", "type": "date", "required": True},
    {"key": "fecha_pendiente", "label": "Fecha del pendiente", "type": "date", "required": True},
    {"key": "fecha_cierre", "label": "Fecha de Cierre", "type": "date", "required": False},
    {"key": "patologia", "label": "Patologia/Condición clínica", "type": "select", "required": True,
     "options": ["Asma", "Cáncer", "Diabetes", "EPOC", "HTA", "Hemofilia", "HT pulmonar",
                 "Enf. huérfana", "Salud mental", "Trasplante", "VIH", "Gestación", "OTRA"]},
    {"key": "mecanismo_financiacion", "label": "MECANISMO DE FINANCIACIÓN", "type": "select", "required": True,
     "options": ["UPC", "Pmáx", "Recobro"]},
    {"key": "tutela", "label": "Tutela", "type": "select", "required": True, "options": ["SI", "NO"]},
    {"key": "identificacion_prestador", "label": "Identificación del prestador de servicios de salud que genera el pendiente", "type": "alphanumeric", "required": True},
]

PX_CONSULTAS_EXCEL_HEADERS = [
    "Consecutivo del registro", "PERIODO REPORTADO", "Cod. EPS", "Tipo documento",
    "Documento", "Identificador de la orden de servicio", "CÓDIGO MUNICIPIO",
    "Código del Diagnóstico Principal", "CUPS", "Procedimiento o consulta",
    "Clase de pendiente", "Cantidad ordenada", "Cantidad con prestación efectiva",
    "Cantidad pendiente", "Causa del pendiente", "Observación causa del pendiente",
    "Fecha de orden", "Fecha del pendiente", "Fecha de Cierre",
    "Patologia/Condición clínica", "MECANISMO DE FINANCIACIÓN", "Tutela",
    "Identificación del prestador de servicios de salud que genera el pendiente",
]

# ─── MATRIZ MEDICAMENTOS (28 variables) ─────────────────────────────────
MEDICAMENTOS_FIELDS = [
    {"key": "consecutivo", "label": "Consecutivo del registro", "type": "numeric", "required": True},
    {"key": "periodo_reportado", "label": "Periodo reportado", "type": "numeric", "required": True},
    {"key": "cod_eps", "label": "Cod. EPS", "type": "alphanumeric", "required": True},
    {"key": "tipo_documento", "label": "Tipo documento", "type": "select", "required": True,
     "options": ["MS", "RC", "TI", "CC", "CE", "PA", "CD", "AS", "CN", "SC", "PE", "PT"]},
    {"key": "documento", "label": "Documento", "type": "alphanumeric", "required": True},
    {"key": "identificador_prescripcion", "label": "Identificador de la prescripción", "type": "alphanumeric", "required": True},
    {"key": "cod_municipio", "label": "CÓDIGO MUNICIPIO", "type": "numeric", "required": True, "length": 5},
    {"key": "cod_diagnostico", "label": "Código del Diagnóstico Principal", "type": "alphanumeric", "required": True},
    {"key": "medicamento_atc", "label": "MEDICAMENTO - ATC", "type": "alphanumeric", "required": True},
    {"key": "medicamento_concentracion", "label": "MEDICAMENTO - CONCENTRACIÓN", "type": "numeric", "required": True},
    {"key": "medicamento_unidad", "label": "MEDICAMENTO - UNIDAD DE CONCENTRACIÓN", "type": "alphanumeric", "required": True},
    {"key": "forma_farmaceutica", "label": "FORMA FARMACÉUTICA", "type": "alphanumeric", "required": True},
    {"key": "medicamento_nombre", "label": "MEDICAMENTO (Nombre comercial)", "type": "alphanumeric", "required": True},
    {"key": "mecanismo_financiacion", "label": "MECANISMO DE FINANCIACIÓN", "type": "select", "required": True,
     "options": ["UPC", "Pmáx", "Recobro"]},
    {"key": "cantidad_prescrita", "label": "Cantidad prescrita", "type": "numeric", "required": True},
    {"key": "dias_tratamiento", "label": "Días de tratamiento", "type": "numeric", "required": True},
    {"key": "cantidad_dispensada", "label": "Cantidad dispensada", "type": "numeric", "required": True},
    {"key": "cum_medicamento", "label": "CUM del medicamento dispensado", "type": "alphanumeric", "required": True},
    {"key": "cantidad_pendiente", "label": "Cantidad pendiente", "type": "numeric", "required": True},
    {"key": "causa_pendiente", "label": "Causa del pendiente", "type": "numeric", "required": True},
    {"key": "observacion_causa", "label": "Observación causa del pendiente", "type": "text", "required": False},
    {"key": "fecha_prescripcion", "label": "Fecha prescripción", "type": "date", "required": True},
    {"key": "fecha_pendiente", "label": "Fecha pendiente", "type": "date", "required": True},
    {"key": "fecha_cierre", "label": "Fecha Cierre", "type": "date", "required": False},
    {"key": "cantidad_dispensada_cierre", "label": "Cantidad dispensada para el cierre del pendiente", "type": "numeric", "required": False},
    {"key": "patologia", "label": "Patologia/Condición clínica", "type": "select", "required": True,
     "options": ["Asma", "Cáncer", "Diabetes", "EPOC", "HTA", "Hemofilia", "HT pulmonar",
                 "Enf. huérfana", "Salud mental", "Trasplante", "VIH", "Gestación", "OTRA"]},
    {"key": "identificacion_prestador", "label": "Identificación del gestor farmacéutico o prestador de servicios de salud que genera el pendiente", "type": "alphanumeric", "required": True},
    {"key": "tutela", "label": "Tutela", "type": "select", "required": True, "options": ["SI", "NO"]},
]

MEDICAMENTOS_EXCEL_HEADERS = [
    "Consecutivo del registro", "Periodo reportado", "Cod. EPS", "Tipo documento",
    "Documento", "Identificador de la prescripción", "CÓDIGO MUNICIPIO",
    "Código del Diagnóstico Principal", "MEDICAMENTO - ATC",
    "MEDICAMENTO - CONCENTRACIÓN", "MEDICAMENTO - UNIDAD DE CONCENTRACIÓN",
    "FORMA FARMACÉUTICA", "MEDICAMENTO (Nombre comercial)", "MECANISMO DE FINANCIACIÓN",
    "Cantidad prescrita", "Días de tratamiento", "Cantidad dispensada",
    "CUM del medicamento dispensado", "Cantidad pendiente", "Causa del pendiente",
    "Observación causa del pendiente", "Fecha prescripción", "Fecha pendiente",
    "Fecha Cierre", "Cantidad dispensada para el cierre del pendiente",
    "Patologia/Condición clínica",
    "Identificación del gestor farmacéutico o prestador de servicios de salud que genera el pendiente",
    "Tutela",
]

# ─── CATÁLOGOS ──────────────────────────────────────────────────────────
TIPOS_DOCUMENTO = ["MS", "RC", "TI", "CC", "CE", "PA", "CD", "AS", "CN", "SC", "PE", "PT"]

TIPO_DOC_LONGITUDES = {
    "CC": 10, "CE": 6, "CD": 16, "PA": 16, "SC": 16, "PE": 15,
    "RC": 11, "TI": 11, "CN": None, "AS": 10, "MS": 12,
    "DE": 20, "PT": 20, "SI": 20,
}

CLASES_PENDIENTE = {
    1: "No direccionado y supera 3 días",
    2: "Direccionado, no programado y supera 10 días",
    3: "Programado pero no realizado",
}

CAUSAS_PENDIENTE_CONSULTAS = {
    22: "OTRA (requiere observación)",
}

CAUSAS_PENDIENTE_MEDICAMENTOS = {
    23: "OTRA (requiere observación)",
}

PATOLOGIAS = [
    "Asma", "Cáncer", "Diabetes", "EPOC", "HTA", "Hemofilia",
    "HT pulmonar", "Enf. huérfana", "Salud mental", "Trasplante",
    "VIH", "Gestación", "OTRA",
]

MECANISMOS = ["UPC", "Pmáx", "Recobro"]

TUTELA = ["SI", "NO"]

ESTADOS_REGISTRO = ["borrador", "con_errores", "validado", "modificado"]

# ─── VALIDACIÓN PX/CONSULTAS ────────────────────────────────────────────
def validate_px_consultas(data: dict) -> list:
    errors = []
    _v_common(data, PX_CONSULTAS_FIELDS, errors, matrix="consultas")

    cant_ord = _to_int(data.get("cantidad_ordenada"))
    cant_efec = _to_int(data.get("cantidad_prestacion_efectiva"))
    cant_pend = _to_int(data.get("cantidad_pendiente"))

    if cant_ord is not None and cant_efec is not None and cant_pend is not None:
        expected = cant_ord - cant_efec
        if cant_pend != expected:
            errors.append({
                "variable": "Cantidad pendiente",
                "dato": str(cant_pend),
                "error": f"no coincide con la fórmula (ordenada - efectiva = {expected})",
                "debe_ser": str(expected),
                "correccion": "Ajustar cantidad pendiente = cantidad ordenada - cantidad con prestación efectiva",
            })

    causa = _to_int(data.get("causa_pendiente"))
    obs = str(data.get("observacion_causa", "")).strip()
    if causa == 22 and not obs:
        errors.append({
            "variable": "Observación causa del pendiente",
            "dato": obs or "vacío",
            "error": "causa 22 (OTRA) requiere observación obligatoria",
            "debe_ser": "texto descriptivo de la causa",
            "correccion": "Ingrese una observación que describa la causa del pendiente",
        })

    clase = _to_int(data.get("clase_pendiente"))
    if clase and clase not in CLASES_PENDIENTE:
        errors.append({
            "variable": "Clase de pendiente",
            "dato": str(clase),
            "error": f"valor {clase} no es válido",
            "debe_ser": "1, 2 o 3",
            "correccion": "1=No direccionado (>3 días), 2=Direccionado no programado (>10 días), 3=Programado no realizado",
        })

    return errors


# ─── VALIDACIÓN MEDICAMENTOS ────────────────────────────────────────────
def validate_medicamentos(data: dict) -> list:
    errors = []
    _v_common(data, MEDICAMENTOS_FIELDS, errors, matrix="medicamentos")

    cant_pres = _to_int(data.get("cantidad_prescrita"))
    cant_disp = _to_int(data.get("cantidad_dispensada"))
    cant_pend = _to_int(data.get("cantidad_pendiente"))

    if cant_pres is not None and cant_disp is not None and cant_pend is not None:
        expected = cant_pres - cant_disp
        if cant_pend != expected:
            errors.append({
                "variable": "Cantidad pendiente",
                "dato": str(cant_pend),
                "error": f"no coincide con la fórmula (prescrita - dispensada = {expected})",
                "debe_ser": str(expected),
                "correccion": "Ajustar cantidad pendiente = cantidad prescrita - cantidad dispensada",
            })

    causa = _to_int(data.get("causa_pendiente"))
    obs = str(data.get("observacion_causa", "")).strip()
    if causa == 23 and not obs:
        errors.append({
            "variable": "Observación causa del pendiente",
            "dato": obs or "vacío",
            "error": "causa 23 (OTRA) requiere observación obligatoria",
            "debe_ser": "texto descriptivo de la causa",
            "correccion": "Ingrese una observación que describa la causa del pendiente",
        })

    cant_cierre = _to_int(data.get("cantidad_dispensada_cierre"))
    if cant_cierre is not None and cant_pend is not None:
        if cant_cierre > cant_pend:
            errors.append({
                "variable": "Cantidad dispensada para el cierre del pendiente",
                "dato": str(cant_cierre),
                "error": f"supera la cantidad pendiente ({cant_pend})",
                "debe_ser": f"menor o igual a {cant_pend}",
                "correccion": "La cantidad dispensada para cierre no puede exceder el pendiente",
            })

    return errors


# ─── VALIDACIÓN COMÚN ──────────────────────────────────────────────────
def _v_common(data: dict, fields: list, errors: list, matrix: str = ""):
    for f in fields:
        key = f["key"]
        label = f["label"]
        val = data.get(key)
        req = f.get("required", False)

        if req and (val is None or str(val).strip() == "" or str(val).strip().upper() == "SIN DATO"):
            errors.append({
                "variable": label,
                "dato": str(val) if val else "vacío",
                "error": "campo obligatorio",
                "debe_ser": f"valor válido para {label}",
                "correccion": f"Ingrese {label.lower()}",
            })
            continue

        if val is None or str(val).strip() == "":
            continue

        val_str = str(val).strip()

        if f["type"] == "numeric":
            try:
                float(val_str)
            except ValueError:
                errors.append({
                    "variable": label,
                    "dato": val_str,
                    "error": "debe ser numérico",
                    "debe_ser": "un número",
                    "correccion": f"Ingrese solo números para {label.lower()}",
                })

        elif f["type"] == "date":
            from datetime import datetime
            try:
                datetime.strptime(val_str, "%Y-%m-%d")
            except ValueError:
                errors.append({
                    "variable": label,
                    "dato": val_str,
                    "error": "formato de fecha inválido",
                    "debe_ser": "AAAA-MM-DD",
                    "correccion": f"Use formato AAAA-MM-DD para {label.lower()}",
                })

        elif f["type"] == "select" and "options" in f:
            if val_str.upper() not in [str(o).upper() for o in f["options"]]:
                errors.append({
                    "variable": label,
                    "dato": val_str,
                    "error": f"valor no está en las opciones permitidas",
                    "debe_ser": ", ".join(str(o) for o in f["options"]),
                    "correccion": f"Seleccione una opción válida de: {', '.join(str(o) for o in f['options'])}",
                })

        if "length" in f and f["length"] and len(val_str) != f["length"]:
            errors.append({
                "variable": label,
                "dato": val_str,
                "error": f"longitud {len(val_str)} no coincide",
                "debe_ser": f"{f['length']} caracteres",
                "correccion": f"El campo {label.lower()} debe tener exactamente {f['length']} caracteres",
            })

    _v_doc_length(data, errors)


def _v_doc_length(data: dict, errors: list):
    tipo = str(data.get("tipo_documento", "")).strip().upper()
    doc = str(data.get("documento", "")).strip()
    if tipo in TIPO_DOC_LONGITUDES and TIPO_DOC_LONGITUDES[tipo] and doc:
        max_len = TIPO_DOC_LONGITUDES[tipo]
        if len(doc) > max_len:
            errors.append({
                "variable": "Documento",
                "dato": doc,
                "error": f"supera la longitud máxima para {tipo}",
                "debe_ser": f"máximo {max_len} caracteres",
                "correccion": f"El documento tipo {tipo} no puede tener más de {max_len} caracteres",
            })


def _to_int(val):
    if val is None:
        return None
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return None
