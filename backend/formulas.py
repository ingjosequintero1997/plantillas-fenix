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
    if not s or s.upper() in ('SIN DATO', 'NO APLICA', 'N/A', 'NONE', '1900-01-01'):
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
EDAD_GEST_ACTUAL = 'Edad Gestacional actual'
PESO_ACTUAL = 'Peso Actual'
TALLA_ACTUAL = 'Talla actual'
IMC_ACTUAL = 'IMC ACTUAL'

# Trimestres de tamizajes (FUM + fecha de prueba)
TRIMESTRE_ASESORIA_VIH = 'Trimestre Asesoria VIH'
TRIMESTRE_VIH_1 = 'Trimestre Toma Prueba VIH Primer Tamizaje'
TRIMESTRE_VIH_2 = 'Trimestre Toma  Prueba VIH Segundo Tamizaje'
TRIMESTRE_VIH_3 = 'Trimestre Toma Prueba VIH Tercer Tamizaje'
TRIMESTRE_SIFILIS_1 = 'Trimestre Primera Prueba Treponemica Rapida Sifilis'
TRIMESTRE_SIFILIS_2 = 'Trimestre Segunda Prueba Treponemica Rapida Sifilis'
TRIMESTRE_SIFILIS_3 = 'Trimestre Tercera Prueba Treponemica Rapida Sifilis'
TRIMESTRE_VIH_SEGUNDA = 'Trimestre Toma segunda Prueba VIH'
TRIMESTRE_CONFIRMATORIO = 'Trimestre Prueba confirmatoria Según Algoritmo'

# Fechas de cada prueba
FECHA_ASESORIA_VIH = 'Fecha Toma Prueba VIH Primer Tamizaje'
FECHA_VIH_1 = 'Fecha Toma Prueba VIH Primer Tamizaje'
FECHA_VIH_2 = 'Fecha Toma Prueba VIH Segundo Tamizaje'
FECHA_VIH_3 = 'Fecha Toma Prueba VIH Tercer Tamizaje'
FECHA_SIFILIS_1 = 'Fecha Primera Prueba Treponemica Rapida Sifilis'
FECHA_SIFILIS_2 = 'Fecha Segunda Prueba Treponemica Rapida Sifilis'
FECHA_SIFILIS_3 = 'Fecha Tercera Prueba Treponemica Rapida Sifilis'
FECHA_VIH_SEGUNDA = 'Fecha Toma Prueba VIH Segundo Tamizaje'
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

    # 5. Edad gestacional al inicio = (ingreso - FUM) en semanas
    ingreso = _fecha(fila.get(INGRESO))
    sem_ingreso = _semanas(fum, ingreso)
    if sem_ingreso is not None and not _num(fila.get(EDAD_GEST_INICIO)):
        fila[EDAD_GEST_INICIO] = _fmt_num(round(sem_ingreso, 1))
        # 6. Trimestre de inicio segun semanas
        fila[TRIMESTRE_INICIO] = _trimestre(sem_ingreso)

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
    if peso_act and talla_act and talla_act > 0 and not _num(fila.get(IMC_ACTUAL)):
        imc_act = peso_act / (talla_act * talla_act)
        fila[IMC_ACTUAL] = _fmt_num(round(imc_act, 2))

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
    _calc_trimestre(FECHA_CONFIRMATORIA, TRIMESTRE_CONFIRMATORIO, confirmatorio=True)

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