from __future__ import annotations

"""Motor de alertas materno-perinatales.

Fase 1: reglas basadas en los campos de la gestante (nombres del template).
La criticidad sigue la convencion del instructivo:
  1-2 = emergencia, 3 = alto/clinico-farmaceutico, 4-5 = seguimiento/administrativo.
"""

from datetime import date
import unicodedata

try:
    from .formulas import _fecha, _num
except ImportError:
    from formulas import _fecha, _num


# key, label, criticidad
# Criticidad (semaforo estilo SIRENAGEST):
#   ROJO (1-2): morbilidad y riesgo clinico extremo.
#   AMARILLO (3): vigilancia, laboratorios y logistica.
ALERTAS = [
    # ── ROJO ── morbilidad / riesgo clinico extremo
    {"key": "mme", "label": "Morbilidad materna extrema", "criticidad": 1,
     "criterio": "Complicaciones durante el parto = SI, o UCI materna = SI."},
    {"key": "urgencias", "label": "Atenciones en urgencias", "criticidad": 1,
     "criterio": "La usuaria tiene atenciones registradas en urgencias."},
    {"key": "preeclampsia", "label": "Alto riesgo de preeclampsia", "criticidad": 2,
     "criterio": "Clasificación del riesgo de preeclampsia = Alto riesgo."},
    {"key": "preeclampsia_sin_asa", "label": "Alto riesgo de preeclampsia sin ASA", "criticidad": 2,
     "criterio": "Alto riesgo de preeclampsia y sin suministro de ASA (no suministrado / no indicado / ausente en medicamentos)."},
    {"key": "tromboembolismo", "label": "Riesgo de tromboembolismo", "criticidad": 2,
     "criterio": "Clasificación del riesgo tromboembólico = Alto riesgo."},
    {"key": "sifilis", "label": "Sífilis gestacional", "criticidad": 2,
     "criterio": "Alguna prueba treponémica rápida de sífilis = POSITIVO."},
    {"key": "menor_15", "label": "Menor de 15 años", "criticidad": 2,
     "criterio": "Edad menor de 15 años."},
    {"key": "mayor_40", "label": "Mayor de 40 años", "criticidad": 2,
     "criterio": "Edad mayor o igual a 40 años."},
    # ── AMARILLO ── vigilancia / laboratorios / logistica
    {"key": "chagas", "label": "Chagas", "criticidad": 3,
     "criterio": "Resultado de Chagas = POSITIVO."},
    {"key": "labs", "label": "Resultados de laboratorios alterados", "criticidad": 3,
     "criterio": "Algún resultado de laboratorio alterado: hemoglobina baja (<11), urocultivo positivo, glicemia/TTOG fuera de 70-140, o tamizaje positivo/alterado."},
    {"key": "sin_control_45", "label": "Sin control prenatal en los últimos 45 días", "criticidad": 3,
     "criterio": "Más de 45 días desde el último control prenatal."},
    {"key": "alto_riesgo_gestacional", "label": "Alto riesgo gestacional", "criticidad": 3,
     "criterio": "Clasificación del riesgo obstétrico = Alto riesgo."},
    {"key": "insuficiente_control", "label": "Insuficiente control prenatal", "criticidad": 3,
     "criterio": "Menos controles prenatales de los esperados para la edad gestacional (~1 cada 4 semanas)."},
    {"key": "nutricional", "label": "Alteraciones nutricionales", "criticidad": 3,
     "criterio": "Clasificación del IMC fuera de Peso normal / IMC adecuado para la edad gestacional."},
    {"key": "mayor_35", "label": "Mayor de 35 años", "criticidad": 3,
     "criterio": "Edad mayor de 35 años."},
    {"key": "puerperio_sin_control", "label": "En puerperio sin control posparto", "criticidad": 3,
     "criterio": "En puerperio (parto hace 42 días o menos) sin control posparto."},
]

ALERTAS_BY_KEY = {a["key"]: a for a in ALERTAS}


def _up(v) -> str:
    return str(v or "").strip().upper()


# Valores que significan "sin dato" en la data corregida (no son una
# clasificacion clinica real y no deben disparar alertas).
_PLACEHOLDERS = {"", "SIN DATO", "NA", "N/A", "NO APLICA", "NONE"}


def _sin_acentos(v) -> str:
    """Mayusculas sin diacriticos (para comparar nombres/ATC de medicamentos)."""
    s = str(v or "").strip().upper()
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _asa_en_medicamentos(medicamentos) -> bool:
    """True si la coleccion contiene ASA (ATC B01AC06 o nombre aspirina/acetilsalicilico)."""
    for m in medicamentos or ():
        s = _sin_acentos(m)
        if not s:
            continue
        if "B01AC06" in s or "ASPIRINA" in s or "ACETILSALICILICO" in s:
            return True
    return False


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


def evaluar(row: dict, constantes=frozenset(), medicamentos=None, urgencias=False, motivos=None) -> set:
    """Devuelve el conjunto de keys de alertas que aplican a la fila.

    `constantes`: campos con valor de relleno (mismo valor en todas las filas);
    las reglas que dependen de ellos se omiten.
    `medicamentos`: coleccion de ATC/nombres de medicamentos del documento (o None
    si no hay data de medicamentos para esa gestante).
    `urgencias`: True si el documento tiene atenciones de urgencias (lo calcula el
    llamador desde reporte_consultas; no viene en la fila del cargue).
    `motivos`: dict opcional que, si se pasa, se rellena con key -> justificacion
    legible (por que la usuaria entra en esa alerta)."""
    out = set()

    def _skip(*fields):
        return any(f in constantes for f in fields)

    def _add(key, reason):
        out.add(key)
        if motivos is not None:
            prev = motivos.get(key)
            motivos[key] = f"{prev}; {reason}" if prev else reason

    # Urgencias (evidencia cross-table derivada por el llamador)
    if urgencias:
        _add("urgencias", "Atención(es) registrada(s) en urgencias")

    # Edad (menor de 15, mayor de 35, mayor/igual de 40)
    edad = _edad(row)
    if edad is not None and not _skip("Fecha de Nacimiento", "Edad (años)"):
        if edad < 15:
            _add("menor_15", f"Edad {int(edad)} años (< 15)")
        if edad > 35:
            _add("mayor_35", f"Edad {int(edad)} años (> 35)")
        if edad >= 40:
            _add("mayor_40", f"Edad {int(edad)} años (>= 40)")

    # Preeclampsia (la data real usa "Alto riesgo de preeclampsia")
    pre = _up(row.get("Clacificacion del riesgo de preeclampsia"))
    es_alto_pre = pre.startswith("ALTO RIESGO") and not _skip("Clacificacion del riesgo de preeclampsia")
    if es_alto_pre:
        _add("preeclampsia", f"Riesgo de preeclampsia = {pre}")
    asa = _up(row.get("Condicion del suministro del ASA"))
    asa_vacia = asa in _PLACEHOLDERS
    if es_alto_pre and not _skip("Condicion del suministro del ASA") and ("NO SUMINISTRAD" in asa or "NO INDICADA" in asa):
        # Sin ASA en la data de medicamentos del documento: cuenta como no
        # suministrado aunque el campo del cargue sea relleno/vacio. El guard
        # _skip aplica solo al campo; esta evidencia cross-table es real.
        _add("preeclampsia_sin_asa", f"Alto riesgo de preeclampsia y ASA = {asa}")
    elif es_alto_pre and medicamentos is not None and asa_vacia and not _asa_en_medicamentos(medicamentos):
        _add("preeclampsia_sin_asa", "Alto riesgo de preeclampsia y sin ASA en los medicamentos del documento")

    # Tromboembolico (la data real usa "Alto riesgo")
    _trombo = _up(row.get("Clacificacion del riesgo tromboembolico"))
    if not _skip("Clacificacion del riesgo tromboembolico") and _trombo.startswith("ALTO RIESGO"):
        _add("tromboembolismo", f"Riesgo tromboembólico = {_trombo}")

    # Riesgo obstetrico (la data real usa "Alto riesgo")
    _obs = _up(row.get("Clasificación del riesgo obstetrico"))
    if not _skip("Clasificación del riesgo obstetrico") and _obs.startswith("ALTO RIESGO"):
        _add("alto_riesgo_gestacional", f"Riesgo obstétrico = {_obs}")

    # Sifilis gestacional (cualquier treponemica positiva)
    _sif = (
        "Resultado Primera Prueba Treponemica Rapida Sifilis",
        "Resultado Segunda Prueba Treponemica Rapida Sifilis",
        "Resultado Tercera Prueba Treponemica Rapida Sifilis",
    )
    if not _skip(*_sif):
        for k in _sif:
            if _up(row.get(k)) == "POSITIVO":
                _add("sifilis", f"{k} = POSITIVO")
                break

    # Chagas
    if not _skip("Resultado Chagas") and _up(row.get("Resultado Chagas")) == "POSITIVO":
        _add("chagas", "Resultado Chagas = POSITIVO")

    # Laboratorios alterados (excluye VIH y Sifilis, que tienen alerta propia).
    # Anemia: hemoglobina baja.
    _hb = ("Resultado 1ra Hemoglobina", "Resultado 2da Hemoglobina", "Resultado 3ra Hemoglobina")
    if not _skip(*_hb):
        for k in _hb:
            h = _num(row.get(k))
            if h is not None and 0 < h < 11:  # 0 = sin dato
                _add("labs", f"{k} = {h} (< 11)")

    # Urocultivo positivo.
    if not _skip("Resultado Urocultivo") and _up(row.get("Resultado Urocultivo")) == "POSITIVO":
        _add("labs", "Resultado Urocultivo = POSITIVO")

    # Glicemia / tolerancia oral a la glucosa fuera de 70-140 (solo valor real > 0).
    _gluc = ("Resultado Glicemia", "Resultado Prueba de Tolerancia Oral Glucosa")
    if not _skip(*_gluc):
        for k in _gluc:
            g = _num(row.get(k))
            if g is not None and g > 0 and (g < 70 or g > 140):
                _add("labs", f"{k} = {g} (fuera de 70-140)")

    # Tamizajes con resultado alterado. El tamizaje de cuello uterino usa el
    # nuevo catalogo (ALTERADO/NORMAL) y mantiene el legado POSITIVO; el resto
    # de tamizajes sigue disparando solo con POSITIVO.
    _positivos = (
        "Resultado Toxoplasma",
        "Resultado Antigeno Superficie Hepatitis B",
        "Resultado Tamizaje de cuello uterino",
        "Resultado Rubeola",
        "Resultado Prueba de Tamizaje para Estreptococo Grupo B",
        "Resultado Gota gruesa (Malaria)",
    )
    if not _skip(*_positivos):
        for k in _positivos:
            valor = _up(row.get(k))
            if k == "Resultado Tamizaje de cuello uterino":
                if valor in {"ALTERADO", "POSITIVO"}:
                    _add("labs", f"{k} = {valor}")
            elif valor == "POSITIVO":
                _add("labs", f"{k} = POSITIVO")

    # Morbilidad materna extrema (proxies disponibles)
    if not _skip("Complicaciones durante el parto", "UCI Materna"):
        if _up(row.get("Complicaciones durante el parto")) == "SI":
            _add("mme", "Complicaciones durante el parto = SI")
        if _up(row.get("UCI Materna")) == "SI":
            _add("mme", "UCI materna = SI")

    # Nutricional (Atalah IMC): normal incluye PESO NORMAL (corte adulto) y
    # "IMC Adecuado para la Edad Gestacional"; alerta ante cualquier otra
    # clasificacion real (bajo peso, sobrepeso u obesidad).
    _imc = ("Clasificación del IMC ACTUAL", "Clasificación del IMC")
    _imc_normal = {"PESO NORMAL", "IMC ADECUADO PARA LA EDAD GESTACIONAL"}
    if not _skip(*_imc):
        clasif = _up(row.get("Clasificación del IMC ACTUAL")) or _up(row.get("Clasificación del IMC"))
        if clasif and clasif not in _PLACEHOLDERS and clasif not in _imc_normal:
            _add("nutricional", f"Clasificación IMC = {clasif}")

    # Sin control en los ultimos 45 dias
    if not _skip("Ultimo Control Prenatal"):
        uc = _fecha(row.get("Ultimo Control Prenatal"))
        if uc and (date.today() - uc).days > 45:
            _add("sin_control_45", f"Último control {uc.isoformat()} ({(date.today() - uc).days} días sin control)")

    # Insuficiente control prenatal (~1 control cada 4 semanas)
    if not _skip("Número Total de Controles Prenatales", "edad gestacional actual"):
        nc = _num(row.get("Número Total de Controles Prenatales"))
        eg = _num(row.get("edad gestacional actual"))
        if nc is not None and eg is not None and eg > 0 and nc < int(eg // 4):
            _add("insuficiente_control", f"{int(nc)} controles para {int(eg)} semanas de gestación (esperado >= {int(eg // 4)})")

    # Puerperio sin control posparto (Fecha de parto dentro de los 42 dias)
    if not _skip("Fecha de Parto"):
        fp = _fecha(row.get("Fecha de Parto"))
        if fp:
            dias = (date.today() - fp).days
            if 0 <= dias <= 42:
                _add("puerperio_sin_control", f"Parto {fp.isoformat()} ({dias} días) sin control posparto")

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


def semaforo(row: dict, seguimientos=None, constantes=frozenset(), medicamentos=None, urgencias=False):
    """Devuelve dict {color, motivo, alertas} para una gestante."""
    alerts = evaluar(row, constantes, medicamentos, urgencias)
    dsc = dias_sin_control(row)

    # SIRENAGEST: inasistencia critica (>15 dias sin control) -> rojo;
    # retraso temprano (1-15 dias) -> amarillo (requiere llamada preventiva).
    rojo = {k for k in alerts if _crit(k) <= 2}
    if dsc is not None and dsc > 15:
        rojo.add("sin_control")
    amarillo = {k for k in alerts if _crit(k) == 3}
    if dsc is not None and 1 <= dsc <= 15:
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
