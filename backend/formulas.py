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
        return 'SIN DATO'
    if semanas < 14:
        return 'PRIMER TRIMESTRE'
    if semanas < 28:
        return 'SEGUNDO TRIMESTRE'
    return 'TERCER TRIMESTRE'


def _trimestre_confirmatorio(semanas):
    """Límites distintos para prueba confirmatoria (1 Trim <13, 2 Trim <=26)."""
    if semanas is None:
        return 'SIN DATO'
    if semanas < 13:
        return 'PRIMER TRIMESTRE'
    if semanas <= 26:
        return 'SEGUNDO TRIMESTRE'
    return 'TERCER TRIMESTRE'


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
FECHA_NACIMIENTO = 'FECHA DE NACIMIENTO'
EDAD = 'EDAD'
FUM = 'FUM'
FPP = 'FPP'
DIAS_PARTOS = 'DIAS PARA EL PARTO'
ALARMA = 'ALARMA'
INGRESO = 'FECHA DE INGRESO AL CONTROL PRENATAL'
EDAD_GEST_INICIO = 'EDAD GEST INICIO CONTROL'
TRIMESTRE_INICIO = 'TRIMESTRE INICIO CONTROL'
PESO_INICIAL = 'PESO INICIAL (KG)'
TALLA = 'TALLA (METROS)'
IMC = 'INDICE DE MASA CORPORAL (IMC)'
CLASIF_IMC = 'CLASIFICACION DE IMC'

CONTROL_FECHAS = ['FECHA 1ER CONTROL', 'FECHA 2DO CONTROL', 'FECHA 3ER CONTROL',
                   'FECHA 4TO CONTROL', 'FECHA 5TO CONTROL', 'FECHA 6TO CONTROL',
                   'FECHA 7MO CONTROL', 'FECHA 8VO CONTROL', 'FECHA 9NO CONTROL']
NUM_CONTROLES = 'NUMERO TOTAL DE CONTROLES PRENATALES'
ULTIMO_CONTROL = 'ULTIMO CONTROL PRENATAL'
EDAD_GEST_ACTUAL = 'EDAD GESTACIONAL ACTUAL'
PESO_ACTUAL = 'PESO ACTUAL'
TALLA_ACTUAL = 'TALLA ACTUAL'
IMC_ACTUAL = 'IMC'

# Trimestres de tamizajes (FUM + fecha de prueba)
TRIMESTRE_ASESORIA_VIH = 'TRIMESTRE ASESORIA VIH'
TRIMESTRE_VIH_1 = 'TRIMESTRE TOMA PRUEBA VIH PRIMER TAMIZAJE'
TRIMESTRE_VIH_2 = 'TRIMESTRE TOMA PRUEBA VIH SEGUNDO TAMIZAJE'
TRIMESTRE_VIH_3 = 'TRIMESTRE TOMA PRUEBA VIH TERCER TAMIZAJE'
TRIMESTRE_SIFILIS_1 = 'TRIMESTRE PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS'
TRIMESTRE_SIFILIS_2 = 'TRIMESTRE SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS'
TRIMESTRE_SIFILIS_3 = 'TRIMESTRE TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS'
TRIMESTRE_VIH_SEGUNDA = 'TRIMESTRE TOMA SEGUNDA PRUEBA VIH'
TRIMESTRE_CONFIRMATORIO = 'TRIMESTRE PRUEBA CONFIRMATORIA SEGUN ALGORITMO'

# Fechas de cada prueba
FECHA_ASESORIA_VIH = 'ASESORIA PRUEBA VIH'
FECHA_VIH_1 = 'FECHA TOMA PRUEBA VIH PRIMER TAMIZAJE'
FECHA_VIH_2 = 'FECHA TOMA PRUEBA VIH SEGUNDO TAMIZAJE'
FECHA_VIH_3 = 'FECHA TOMA PRUEBA VIH TERCER TAMIZAJE'
FECHA_SIFILIS_1 = 'FECHA PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS'
FECHA_SIFILIS_2 = 'FECHA SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS'
FECHA_SIFILIS_3 = 'FECHA TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS'
FECHA_VIH_SEGUNDA = 'FECHA TOMA SEGUNDA PRUEBA VIH'
FECHA_CONFIRMATORIA = 'FECHA PRUEBA CONFIRMATORIA SEGUN ALGORITMO'


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
    #     (1 Trim <14, 2 Trim <28, 3 Trim). Solo si la fecha de la prueba existe.
    def _calc_trimestre(fecha_prueba, col_trimestre, confirmatorio=False):
        fp = _fecha(fila.get(fecha_prueba))
        if fp and (not fila.get(col_trimestre) or str(fila.get(col_trimestre)).strip() in ('', 'SIN DATO', '0')):
            sem = _semanas(fum, fp)
            fila[col_trimestre] = _trimestre_confirmatorio(sem) if confirmatorio else _trimestre(sem)

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