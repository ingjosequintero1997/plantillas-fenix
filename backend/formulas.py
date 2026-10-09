from __future__ import annotations

from datetime import datetime, date, timedelta

try:
    from .validators import to_date_iso
except ImportError:
    from validators import to_date_iso


def _fecha(valor):
    """Convierte un valor a date o None."""
    if valor is None:
        return None
    s = str(valor).strip()
    if not s or s.upper() in ('SIN DATO', 'NO APLICA', 'N/A', 'NONE', '1900-01-01', '1845-01-01'):
        return None
    iso = to_date_iso(s)
    if not iso:
        return None
    try:
        return datetime.strptime(iso, '%Y-%m-%d').date()
    except Exception:
        return None


def _num(valor):
    """Convierte a float o None."""
    if valor is None:
        return None
    s = str(valor).strip().replace(',', '.')
    if not s or s.upper() in ('SIN DATO', 'NO APLICA', 'N/A', 'NONE'):
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def _fmt_num(v):
    if v is None:
        return 'SIN DATO'
    return format(v, '.2f').rstrip('0').rstrip('.') if isinstance(v, float) else str(v)


def _fmt_int(v):
    if v is None:
        return 'SIN DATO'
    return str(int(v))


def _semanas(fecha1, fecha2):
    if not fecha1 or not fecha2:
        return None
    delta = (fecha2 - fecha1).days
    return delta / 7.0


def _clasif_imc(imc):
    if imc is None:
        return 'SIN DATO'
    if imc < 18.5:
        return 'BAJO PESO'
    if imc < 25:
        return 'PESO NORMAL'
    if imc < 30:
        return 'SOBREPESO'
    if imc < 35:
        return 'OBESIDAD GRADO 1'
    if imc < 40:
        return 'OBESIDAD GRADO 2'
    return 'OBESIDAD GRADO 3'


# Tabla de IMC para la edad gestacional (Atalah/ICBF): por semana de gestacion
# (6..42) guarda (adecuado_lo, adecuado_hi, sobrepeso_hi) en kg/m^2.
_IMC_EG_TABLE = {
    6: (20.0, 24.9, 30.0), 7: (20.1, 24.9, 30.0), 8: (20.2, 25.0, 30.1), 9: (20.2, 25.1, 30.2),
    10: (20.3, 25.2, 30.2), 11: (20.4, 25.3, 30.3), 12: (20.5, 25.4, 30.3), 13: (20.7, 25.6, 30.4),
    14: (20.8, 25.7, 30.5), 15: (20.9, 25.8, 30.6), 16: (21.1, 25.9, 30.7), 17: (21.2, 26.0, 30.8),
    18: (21.3, 26.1, 30.9), 19: (21.5, 26.2, 30.9), 20: (21.6, 26.3, 31.0), 21: (21.8, 26.4, 31.1),
    22: (21.9, 26.6, 31.2), 23: (22.1, 26.7, 31.3), 24: (22.3, 26.9, 31.5), 25: (22.5, 27.0, 31.6),
    26: (22.7, 27.2, 31.7), 27: (22.8, 27.3, 31.8), 28: (23.0, 27.5, 31.9), 29: (23.2, 27.6, 32.0),
    30: (23.4, 27.8, 32.1), 31: (23.5, 27.9, 32.2), 32: (23.7, 28.0, 32.3), 33: (23.9, 28.1, 32.4),
    34: (24.0, 28.3, 32.5), 35: (24.2, 28.4, 32.6), 36: (24.3, 28.5, 32.7), 37: (24.5, 28.7, 32.8),
    38: (24.6, 28.8, 32.9), 39: (24.8, 28.9, 33.0), 40: (25.0, 29.1, 33.1), 41: (25.1, 29.2, 33.2),
    42: (25.1, 29.2, 33.2),
}


def clasif_imc_eg(imc, semanas):
    """Clasificación del IMC para la edad gestacional (Atalah/ICBF)."""
    if imc is None or semanas is None:
        return None
    try:
        imc = float(imc)
        semanas = float(semanas)
    except (TypeError, ValueError):
        return None
    # Redondear a la semana mas cercana y acotar al rango de la tabla (6..42).
    sem = min(42, max(6, int(round(semanas))))
    adecuado_lo, adecuado_hi, sobrepeso_hi = _IMC_EG_TABLE[sem]
    if imc < adecuado_lo:
        return 'Bajo Peso para la Edad Gestacional'
    if imc <= adecuado_hi:
        return 'IMC Adecuado para la Edad Gestacional'
    if imc <= sobrepeso_hi:
        return 'Sobrepeso para la Edad Gestacional'
    return 'Obesidad para la Edad Gestacional'


def _trimestre(semanas):
    if semanas is None:
        return 0
    if semanas < 14:
        return 1
    if semanas < 28:
        return 2
    return 3


def _trimestre_confirmatorio(semanas):
    """Límites distintos para prueba confirmatoria (1 Trim <13, 2 Trim <=26)."""
    if semanas is None:
        return 0
    if semanas < 13:
        return 1
    if semanas <= 26:
        return 2
    return 3


def _alarma(dias):
    if dias is None:
        return 'SIN DATO'
    if dias < 0:
        return 'NACIDO'
    if dias <= 7:
        return 'SEMANA DE PARTO'
    if dias <= 28:
        return 'MENOS 4 SEM'
    return 'PENDIENTE'


def _relacion_anemia(fila: dict) -> str:
    """Semaforo de la relacion anemia vs tratamiento (formula del instructivo).

    Toma la hemoglobina de la fecha de tamizaje mas reciente y la compara con
    el tratamiento suministrado: 1=oral, 2=parenteral, 3=transfusion.
    """
    if not str(fila.get(DOCUMENTO) or '').strip():
        return ''
    # Orden invertido (hb3, hb2, hb1) para que en empates gane la mas reciente,
    # igual que la formula de Excel (td -> sd -> de).
    pares = [
        (_fecha(fila.get(FECHA_HB3)), _num(fila.get(RES_HB3))),
        (_fecha(fila.get(FECHA_HB2)), _num(fila.get(RES_HB2))),
        (_fecha(fila.get(FECHA_HB1)), _num(fila.get(RES_HB1))),
    ]
    validos = [(f, v) for (f, v) in pares if f is not None]
    if not validos:
        return '🟡 SIN TAMIZAJE'
    latest = max(f for f, _ in validos)
    hv = next((v for (f, v) in validos if f == latest), None)
    if hv is None:
        return '🟡 SIN TAMIZAJE'
    requerido = 3 if hv < 7 else (2 if hv < 10 else 1)
    trat_raw = str(fila.get(TRATAMIENTO_ANEMIA) or '').strip()
    trat = int(trat_raw[0]) if trat_raw and trat_raw[0].isdigit() else 0
    return '🟢 ADECUADO' if trat == requerido else '🔴 NO ADECUADO'


# Nombre de las columnas calculadas en la plantilla gestante
FECHA_NACIMIENTO = 'Fecha de Nacimiento'
EDAD = 'Edad (años)'
FUM = 'FUM'
FPP = 'FPP'
DIAS_PARTOS = 'Dias para el parto'
ALARMA = 'Alarma'
INGRESO = 'Fecha de Ingreso al Control Prenatal'
EDAD_GEST_INICIO = 'Edad Gest Inicio Control'
TRIMESTRE_INICIO = 'Trimestre inicio control'
PESO_INICIAL = 'Peso Inicial (kg)'
TALLA = 'Talla (metros)'
IMC = 'Indice de Masa Corporal (IMC)'
CLASIF_IMC = 'Clasificación del IMC'

CONTROL_FECHAS = ['Fecha 1er Control', 'Fecha 2do Control', 'Fecha 3er Control',
                   'Fecha 4to Control', 'Fecha 5to Control', 'Fecha 6to Control',
                   'Fecha 7mo Control', 'fecha 8vo Control', 'Fecha 9no Control']
NUM_CONTROLES = 'Número Total de Controles Prenatales'
ULTIMO_CONTROL = 'Ultimo Control Prenatal'
EDAD_GEST_ACTUAL = 'edad gestacional actual'
PESO_ACTUAL = 'peso actual'
TALLA_ACTUAL = 'talla actual'
IMC_ACTUAL = 'IMC ACTUAL'
CLASIF_IMC_ACTUAL = 'Clasificación del IMC ACTUAL'

# Anemia vs tratamiento (hemoglobinas + tratamiento suministrado)
DOCUMENTO = 'No. De Identificación'
FECHA_HB1 = 'Fecha 1ra Realizacion Hemoglobina'
RES_HB1 = 'Resultado 1ra Hemoglobina'
FECHA_HB2 = 'Fecha 2da Realizacion Hemoglobina'
RES_HB2 = 'Resultado 2da Hemoglobina'
FECHA_HB3 = 'Fecha 3ra Realizacion Hemoglobina'
RES_HB3 = 'Resultado 3ra Hemoglobina'
TRATAMIENTO_ANEMIA = 'Tipo de tratamiento suminitrado para anemia'
RELACION_ANEMIA = 'Relación entre Anemia vs tratamiento'

# Trimestres de tamizajes (FUM + fecha de prueba)
TRIMESTRE_ASESORIA_VIH = 'Trimestre Asesoria VIH'
TRIMESTRE_VIH_1 = 'Trimestre Toma Prueba VIH Primer Tamizaje'
TRIMESTRE_VIH_2 = 'Trimestre Toma Prueba VIH Segundo Tamizaje'
TRIMESTRE_VIH_3 = 'Trimestre Toma Prueba VIH Tercer Tamizaje'
TRIMESTRE_SIFILIS_1 = 'Trimestre Primera Prueba Treponemica Rapida Sifilis'
TRIMESTRE_SIFILIS_2 = 'Trimestre Segunda Prueba Treponemica Rapida Sifilis'
TRIMESTRE_SIFILIS_3 = 'Trimestre Tercera Prueba Treponemica Rapida Sifilis'
TRIMESTRE_VIH_SEGUNDA = 'Trimestre Toma segunda Prueba VIH'
TRIMESTRE_CONFIRMATORIO = 'Trimestre Prueba confirmatoria Según Algoritmo'

# Fechas de cada prueba
FECHA_ASESORIA_VIH = 'Asesoria Prueba VIH'
FECHA_VIH_1 = 'Fecha Toma Prueba VIH Primer Tamizaje'
FECHA_VIH_2 = 'Fecha Toma Prueba VIH Segundo Tamizaje'
FECHA_VIH_3 = 'Fecha Toma Prueba VIH Tercer Tamizaje'
FECHA_SIFILIS_1 = 'Fecha Primera Prueba Treponemica Rapida Sifilis'
FECHA_SIFILIS_2 = 'Fecha Segunda Prueba Treponemica Rapida Sifilis'
FECHA_SIFILIS_3 = 'Fecha Tercera Prueba Treponemica Rapida Sifilis'
FECHA_VIH_SEGUNDA = 'Fecha toma Segunda Prueba VIH'
FECHA_CONFIRMATORIA = 'Fecha prueba confirmatoria Según Algoritmo'


def aplicar_formulas(fila: dict) -> dict:
    """Calcula y rellena las formulas de la plantilla gestante para una fila."""
    fila = dict(fila)
    hoy = datetime.now().date()

    # 1. EDAD = fecha de nacimiento vs HOY
    fnac = _fecha(fila.get(FECHA_NACIMIENTO))
    if fnac and not _num(fila.get(EDAD)):
        edad = hoy.year - fnac.year - ((hoy.month, hoy.day) < (fnac.month, fnac.day))
        fila[EDAD] = _fmt_int(edad)

    # 2. FPP = FUM + 280 dias
    fum = _fecha(fila.get(FUM))
    if fum and not _fecha(fila.get(FPP)):
        fila[FPP] = (fum + timedelta(days=280)).strftime('%Y-%m-%d')

    # 3. Dias para el parto = FPP - HOY
    fpp = _fecha(fila.get(FPP))
    if fpp:
        fila[DIAS_PARTOS] = _fmt_int((fpp - hoy).days)
        # 4. Alarma segun dias
        fila[ALARMA] = _alarma((fpp - hoy).days)

    # 5. Edad gestacional al inicio del control = (ingreso - FUM) en semanas,
    #    con su trimestre (<14 -> 1, <28 -> 2, >=28 -> 3). Solo se calcula
    #    cuando FUM e ingreso son fechas reales; si falta alguna se respeta el
    #    valor entrante (no se borra).
    ingreso = _fecha(fila.get(INGRESO))
    sem_inicio = _semanas(fum, ingreso)
    if sem_inicio is not None:
        fila[EDAD_GEST_INICIO] = _fmt_num(round(sem_inicio, 1))
        fila[TRIMESTRE_INICIO] = str(_trimestre(sem_inicio))

    # 7. IMC inicial = peso / talla^2
    peso = _num(fila.get(PESO_INICIAL))
    talla = _num(fila.get(TALLA))
    if peso and talla and talla > 0:
        imc = peso / (talla * talla)
        fila[IMC] = _fmt_num(round(imc, 2))
        fila[CLASIF_IMC] = _clasif_imc(imc)

    # 8. Numero total de controles y ultimo control
    fechas_control = [_fecha(fila.get(c)) for c in CONTROL_FECHAS]
    fechas_validas = [f for f in fechas_control if f]
    if fechas_validas and not _num(fila.get(NUM_CONTROLES)):
        fila[NUM_CONTROLES] = _fmt_int(len(fechas_validas))
    if fechas_validas and not _fecha(fila.get(ULTIMO_CONTROL)):
        fila[ULTIMO_CONTROL] = max(fechas_validas).strftime('%Y-%m-%d')

    # 9. Edad gestacional actual = (ultimo control - FUM) en semanas
    ultimo = _fecha(fila.get(ULTIMO_CONTROL))
    sem_actual = _semanas(fum, ultimo)
    if sem_actual is not None and not _num(fila.get(EDAD_GEST_ACTUAL)):
        fila[EDAD_GEST_ACTUAL] = _fmt_int(round(sem_actual))

    # 10. IMC actual = peso actual / talla actual^2
    peso_act = _num(fila.get(PESO_ACTUAL))
    talla_act = _num(fila.get(TALLA_ACTUAL))
    if peso_act and talla_act and talla_act > 0:
        imc_act = peso_act / (talla_act * talla_act)
        fila[IMC_ACTUAL] = _fmt_num(round(imc_act, 2))
        # Clasificacion Atalah/ICBF: edad gestacional al ultimo control cuando
        # exista, si no la edad gestacional a hoy; sin FUM cae al corte adulto.
        semanas_actual = sem_actual if sem_actual is not None else _semanas(fum, hoy)
        fila[CLASIF_IMC_ACTUAL] = clasif_imc_eg(imc_act, semanas_actual) or _clasif_imc(imc_act)

    # 11. Trimestres de tamizajes VIH / Sifilis: FUM + fecha de la prueba
    #     (1 <14 sem, 2 <28 sem, 3 >=28). Numerico obligatorio: si no hay
    #     fecha para calcular se asigna 0.
    def _calc_trimestre(fecha_prueba, col_trimestre, confirmatorio=False):
        fp = _fecha(fila.get(fecha_prueba))
        if fp:
            sem = _semanas(fum, fp)
            fila[col_trimestre] = _trimestre_confirmatorio(sem) if confirmatorio else _trimestre(sem)
        else:
            fila[col_trimestre] = 0

    _calc_trimestre(FECHA_ASESORIA_VIH, TRIMESTRE_ASESORIA_VIH)
    _calc_trimestre(FECHA_VIH_1, TRIMESTRE_VIH_1)
    _calc_trimestre(FECHA_VIH_2, TRIMESTRE_VIH_2)
    _calc_trimestre(FECHA_VIH_3, TRIMESTRE_VIH_3)
    _calc_trimestre(FECHA_SIFILIS_1, TRIMESTRE_SIFILIS_1)
    _calc_trimestre(FECHA_SIFILIS_2, TRIMESTRE_SIFILIS_2)
    _calc_trimestre(FECHA_SIFILIS_3, TRIMESTRE_SIFILIS_3)
    _calc_trimestre(FECHA_VIH_SEGUNDA, TRIMESTRE_VIH_SEGUNDA)
    # Confirmatoria: base = fecha de INGRESO (AE en el Excel), con limites propios:
    # 1 Trim [0.1, 13), 2 Trim [13, 26.1), 3 Trim >= 26.1. Si no hay fecha -> 0.
    _sem_conf = _semanas(_fecha(fila.get(INGRESO)), _fecha(fila.get(FECHA_CONFIRMATORIA)))
    if _sem_conf is None:
        fila[TRIMESTRE_CONFIRMATORIO] = 0
    elif _sem_conf >= 26.1:
        fila[TRIMESTRE_CONFIRMATORIO] = 3
    elif _sem_conf >= 13:
        fila[TRIMESTRE_CONFIRMATORIO] = 2
    elif _sem_conf >= 0.1:
        fila[TRIMESTRE_CONFIRMATORIO] = 1
    else:
        fila[TRIMESTRE_CONFIRMATORIO] = 0

    # 12. Relacion Anemia vs tratamiento (semaforo)
    fila[RELACION_ANEMIA] = _relacion_anemia(fila)

    return fila


def aplicar_formulas_df(df):
    """Aplica todas las formulas de la plantilla gestante a un DataFrame."""
    import pandas as pd
    rows = []
    for _, row in df.iterrows():
        rows.append(aplicar_formulas(row.to_dict()))
    if rows:
        return pd.DataFrame(rows, columns=df.columns)
    return df