from __future__ import annotations

"""Motor de alertas materno-perinatales.

Fase 1: reglas basadas en los campos de la gestante (nombres del template).
La criticidad sigue la convencion del instructivo:
  1-2 = emergencia, 3 = alto/clinico-farmaceutico, 4-5 = seguimiento/administrativo.
"""

from datetime import date

try:
    from .formulas import _fecha, _num
except ImportError:
    from formulas import _fecha, _num


# key, label, criticidad
ALERTAS = [
    {"key": "mme", "label": "Morbilidad materna extrema", "criticidad": 1},
    {"key": "urgencias", "label": "Atenciones en urgencias", "criticidad": 1},
    {"key": "sifilis", "label": "Sífilis gestacional", "criticidad": 2},
    {"key": "preeclampsia", "label": "Alto riesgo de preeclampsia", "criticidad": 2},
    {"key": "preeclampsia_sin_asa", "label": "Alto riesgo de preeclampsia sin ASA", "criticidad": 3},
    {"key": "tromboembolismo", "label": "Riesgo de tromboembolismo", "criticidad": 3},
    {"key": "labs", "label": "Resultados de laboratorios alterados", "criticidad": 3},
    {"key": "chagas", "label": "Chagas", "criticidad": 3},
    {"key": "alto_riesgo_gestacional", "label": "Alto riesgo gestacional", "criticidad": 3},
    {"key": "sin_control_45", "label": "Sin control prenatal en los últimos 45 días", "criticidad": 4},
    {"key": "insuficiente_control", "label": "Insuficiente control prenatal", "criticidad": 4},
    {"key": "puerperio_sin_control", "label": "En puerperio sin control posparto", "criticidad": 4},
    {"key": "nutricional", "label": "Alteraciones nutricionales", "criticidad": 5},
    {"key": "menor_15", "label": "Menor de 15 años", "criticidad": 5},
    {"key": "mayor_35", "label": "Mayor de 35 años", "criticidad": 4},
    {"key": "mayor_40", "label": "Mayor de 40 años", "criticidad": 4},
]

ALERTAS_BY_KEY = {a["key"]: a for a in ALERTAS}


def _up(v) -> str:
    return str(v or "").strip().upper()


def _edad(row: dict):
    e = _num(row.get("Edad (años)"))
    if e is not None:
        return e
    fn = _fecha(row.get("Fecha de Nacimiento"))
    if not fn:
        return None
    hoy = date.today()
    return hoy.year - fn.year - ((hoy.month, hoy.day) < (fn.month, fn.day))


def campos_constantes(rows: list, min_filas: int = 30) -> set:
    """Campos con el MISMO valor no vacio en todas las filas.

    La data de prueba suele traer campos de relleno (ej. 'Si' en el 100% de las
    filas). Esos campos se tratan como 'sin dato' y no disparan alertas, para no
    saturar el semaforo mientras no haya data real."""
    if not rows or len(rows) < min_filas:
        return set()
    claves = list(rows[0].keys())
    constantes = set()
    for k in claves:
        vals = {str(r.get(k, "")).strip() for r in rows}
        if len(vals) == 1:
            v = next(iter(vals))
            if v:
                constantes.add(k)
    return constantes


def evaluar(row: dict, constantes=frozenset()) -> set:
    """Devuelve el conjunto de keys de alertas que aplican a la fila.

    `constantes`: campos con valor de relleno (mismo valor en todas las filas);
    las reglas que dependen de ellos se omiten."""
    out = set()

    def _skip(*fields):
        return any(f in constantes for f in fields)

    # Edad
    edad = _edad(row)
    if edad is not None and not _skip("Fecha de Nacimiento", "Edad (años)"):
        if edad < 15:
            out.add("menor_15")
        if edad > 35:
            out.add("mayor_35")
        if edad > 40:
            out.add("mayor_40")

    # Preeclampsia (la data real usa "Alto riesgo de preeclampsia")
    pre = _up(row.get("Clacificacion del riesgo de preeclampsia"))
    es_alto_pre = pre.startswith("ALTO RIESGO") and not _skip("Clacificacion del riesgo de preeclampsia")
    if es_alto_pre:
        out.add("preeclampsia")
    asa = _up(row.get("Condicion del suministro del ASA"))
    if es_alto_pre and not _skip("Condicion del suministro del ASA") and ("NO SUMINISTRAD" in asa or "NO INDICADA" in asa):
        out.add("preeclampsia_sin_asa")

    # Tromboembolico (la data real usa "Alto riesgo")
    if not _skip("Clacificacion del riesgo tromboembolico") and _up(row.get("Clacificacion del riesgo tromboembolico")).startswith("ALTO RIESGO"):
        out.add("tromboembolismo")

    # Riesgo obstetrico (la data real usa "Alto riesgo")
    if not _skip("Clasificación del riesgo obstetrico") and _up(row.get("Clasificación del riesgo obstetrico")).startswith("ALTO RIESGO"):
        out.add("alto_riesgo_gestacional")

    # Sifilis gestacional (cualquier treponemica positiva)
    _sif = (
        "Resultado Primera Prueba Treponemica Rapida Sifilis",
        "Resultado Segunda Prueba Treponemica Rapida Sifilis",
        "Resultado Tercera Prueba Treponemica Rapida Sifilis",
    )
    if not _skip(*_sif):
        for k in _sif:
            if _up(row.get(k)) == "POSITIVO":
                out.add("sifilis")
                break

    # Chagas
    if not _skip("Resultado Chagas") and _up(row.get("Resultado Chagas")) == "POSITIVO":
        out.add("chagas")

    # Laboratorios alterados (hemoglobina baja = anemia)
    _hb = ("Resultado 1ra Hemoglobina", "Resultado 2da Hemoglobina", "Resultado 3ra Hemoglobina")
    if not _skip(*_hb):
        hbs = [h for h in (_num(row.get(k)) for k in _hb) if h is not None]
        if any(0 < h < 11 for h in hbs):  # 0 = sin dato
            out.add("labs")

    # Morbilidad materna extrema (proxies disponibles)
    if not _skip("Complicaciones durante el parto", "UCI Materna"):
        if _up(row.get("Complicaciones durante el parto")) == "SI" or _up(row.get("UCI Materna")) == "SI":
            out.add("mme")

    # Nutricional
    _imc = ("Clasificación del IMC ACTUAL", "Clasificación del IMC")
    if not _skip(*_imc):
        clasif = _up(row.get("Clasificación del IMC ACTUAL")) or _up(row.get("Clasificación del IMC"))
        if clasif and clasif != "PESO NORMAL":
            out.add("nutricional")

    # Sin control en los ultimos 45 dias
    if not _skip("Ultimo Control Prenatal"):
        uc = _fecha(row.get("Ultimo Control Prenatal"))
        if uc and (date.today() - uc).days > 45:
            out.add("sin_control_45")

    # Insuficiente control prenatal (~1 control cada 4 semanas)
    if not _skip("Número Total de Controles Prenatales", "edad gestacional actual"):
        nc = _num(row.get("Número Total de Controles Prenatales"))
        eg = _num(row.get("edad gestacional actual"))
        if nc is not None and eg is not None and eg > 0 and nc < int(eg // 4):
            out.add("insuficiente_control")

    # Puerperio sin control posparto (Fecha de parto dentro de los 42 dias)
    if not _skip("Fecha de Parto"):
        fp = _fecha(row.get("Fecha de Parto"))
        if fp:
            dias = (date.today() - fp).days
            if 0 <= dias <= 42:
                out.add("puerperio_sin_control")

    return out


# ─── Semaforo (estilo SIRENAGEST) ────────────────────────────────────────
# rojo = riesgo severo o perdida del sistema; amarillo = seguimiento/control
# proximo; verde = al dia. Un seguimiento EFECTIVO reciente "apaga" la alerta.
def _crit(key):
    return ALERTAS_BY_KEY.get(key, {}).get("criticidad", 5)


def dias_sin_control(row: dict):
    uc = _fecha(row.get("Ultimo Control Prenatal"))
    if not uc:
        return None
    return (date.today() - uc).days


def semaforo(row: dict, seguimientos=None, constantes=frozenset()):
    """Devuelve dict {color, motivo, alertas} para una gestante."""
    alerts = evaluar(row, constantes)
    dsc = dias_sin_control(row)

    rojo = {k for k in alerts if _crit(k) <= 2}
    if dsc is not None and dsc > 45:
        rojo.add("sin_control")
    amarillo = {k for k in alerts if _crit(k) == 3}
    if dsc is not None and 21 < dsc <= 45:
        amarillo.add("control_vencido")

    # Un seguimiento efectivo reciente apaga la alerta (rojo -> amarillo -> verde).
    segs = list(seguimientos or [])
    tiene_efectivo = any(
        str(s.get("resultado", "")).strip().lower().startswith("efectiv") for s in segs
    )

    if rojo:
        if tiene_efectivo:
            return {"color": "amarillo", "motivo": "Alerta con seguimiento efectivo registrado", "alertas": sorted(rojo)}
        return {"color": "rojo", "motivo": "Riesgo severo o pérdida del sistema", "alertas": sorted(rojo)}
    if amarillo:
        if tiene_efectivo:
            return {"color": "verde", "motivo": "Al día", "alertas": []}
        return {"color": "amarillo", "motivo": "Requiere seguimiento o control próximo", "alertas": sorted(amarillo)}
    return {"color": "verde", "motivo": "Al día con sus controles", "alertas": []}


SEMAFORO_ORDEN = {"rojo": 0, "amarillo": 1, "verde": 2}
