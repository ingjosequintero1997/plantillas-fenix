from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd


def _val(series, idx):
    try:
        v = series.iloc[idx]
        return str(v).strip() if v is not None else ''
    except Exception:
        return ''


def _norm(v):
    if v is None:
        return ''
    return str(v).strip().upper()


def _to_num(v):
    try:
        return float(str(v).replace(',', '.').replace(' ', ''))
    except (ValueError, TypeError):
        return None


def _is_date(value):
    try:
        if value and str(value).strip() and str(value).strip().lower() not in ('sin dato', 'no aplica', 'n/a', '1900-01-01', '1845-01-01'):
            from dateutil import parser
            parser.parse(str(value).strip(), dayfirst=True)
            return True
    except Exception:
        pass
    return False


def _parse_date(value):
    try:
        if value and str(value).strip() and str(value).strip().lower() not in ('sin dato', 'no aplica', 'n/a', '1900-01-01', '1845-01-01'):
            from dateutil import parser
            return parser.parse(str(value).strip(), dayfirst=True)
    except Exception:
        return None
    return None


def _pct(num, den):
    if den <= 0:
        return None
    return round(num / den * 100, 4)


def _indicador(denominador, numerador, label, nivel=None, variable=None):
    return {
        'label': label,
        'nivel': nivel or 'DEPARTAMENTAL',
        'variable': variable or '',
        'numerador': numerador,
        'denominador': denominador,
        'coeficiente': 100,
        'resultado': _pct(numerador, denominador),
    }


def _calcular_bloque(df: pd.DataFrame, ref_date: datetime, nivel='DEPARTAMENTAL', nombre_nivel=''):
    """Calcula los indicadores PARE MM para un subconjunto (total o por municipio)."""
    n = len(df)

    def col(name):
        if name in df.columns:
            return df[name]
        return pd.Series([''] * n, index=df.index)

    total = n

    ultimo_control = col('ULTIMO CONTROL PRENATAL')
    control_45 = 0
    for i in range(n):
        d = _parse_date(_val(ultimo_control, i))
        if d and (ref_date - d).days <= 45 and (ref_date - d).days >= 0:
            control_45 += 1

    edad_gest = col('EDAD GESTACIONAL ACTUAL')
    num_controles = col('Número Total de Controles Prenatales')
    tercer_trim_4mas = 0
    gest_tercer_trim = 0
    for i in range(n):
        eg = _to_num(_val(edad_gest, i))
        nc = _to_num(_val(num_controles, i))
        if eg is not None and eg > 32:
            gest_tercer_trim += 1
            if nc is not None and nc >= 4:
                tercer_trim_4mas += 1

    vih = col('RESULTADO PRIMER TAMIZAJE PRUEBA DE VIH')
    sifilis = col('Resultado Primera Prueba Treponemica Rápida Sífilis')
    hepb = col('RESULTADO ANTIGENO SUPERFICIE HEPATITIS B')
    chagas = col('RESULTADO CHAGAS')

    def tamizadas(series):
        c = 0
        for i in range(n):
            vn = _norm(_val(series, i))
            if vn in ('POSITIVO', 'NEGATIVO'):
                c += 1
        return c

    tam_vih = tamizadas(vih)
    tam_sifilis = tamizadas(sifilis)
    tam_hepb = tamizadas(hepb)
    tam_chagas = tamizadas(chagas)

    riesgo = col('Clasificación del riesgo obstetrico')
    gineco1 = col('Fecha Primera Consulta Ginecología')
    aro_total = 0
    aro_go = 0
    for i in range(n):
        rn = _norm(_val(riesgo, i))
        es_aro = 'ALTO' in rn
        if es_aro:
            aro_total += 1
            if _is_date(_val(gineco1, i)):
                aro_go += 1

    puntaje = col('Clacificacion del riesgo de preeclampsia')
    asa = col('fecha de suministro')
    riesgo_preclamsia = 0
    asa_garantizada = 0
    for i in range(n):
        pn = _norm(_val(puntaje, i))
        es_preclamsia = bool(pn) and pn not in ('SIN DATO', 'N/A', 'NO APLICA', '0', 'BAJO')
        if es_preclamsia:
            riesgo_preclamsia += 1
            if _is_date(_val(asa, i)):
                asa_garantizada += 1

    hemoglobina = col('Resultado 1ra Hemoglobina')
    tratamiento = col('Tratamiento instaurado')
    con_anemia = 0
    anemia_tratada = 0
    for i in range(n):
        hb = _to_num(_val(hemoglobina, i))
        if hb is not None and hb < 11 and hb > 0:
            con_anemia += 1
            if _norm(_val(tratamiento, i)) and _norm(_val(tratamiento, i)) not in ('SIN DATO', 'NONE', 'NO APLICA'):
                anemia_tratada += 1

    def con_nombre(ind):
        if nombre_nivel:
            ind = dict(ind)
            ind['nivel_nombre'] = nombre_nivel
        return ind

    indicadores = [
        con_nombre(_indicador(total, total, 'Porcentaje de gestantes en la cohorte', nivel=nivel, variable='Poblacion objeto 50-69 anios')),
        con_nombre(_indicador(total, control_45, 'Porcentaje de gestantes con control prenatal en los ultimos 45 dias (Mensual)', nivel=nivel, variable='Control prenatal')),
        con_nombre(_indicador(gest_tercer_trim, tercer_trim_4mas, 'Porcentaje de Gestantes en tercer trimestre con 4 o mas prenatales', nivel=nivel, variable='>32 semanas y >=4 controles')),
        con_nombre(_indicador(total, tam_vih, 'Porcentaje de gestantes tamizadas para VIH durante la atencion para el cuidado prenatal', nivel=nivel, variable='Tamizaje VIH')),
        con_nombre(_indicador(total, tam_sifilis, 'Porcentaje de gestantes tamizadas para SIFILIS durante la atencion para el cuidado prenatal', nivel=nivel, variable='Tamizaje SIFILIS')),
        con_nombre(_indicador(total, tam_hepb, 'Porcentaje de gestantes tamizadas para HEPATITIS B durante la atencion para el cuidado prenatal', nivel=nivel, variable='Tamizaje HEPATITIS B')),
        con_nombre(_indicador(total, tam_chagas, 'Porcentaje de gestantes tamizadas para CHAGAS durante la atencion para el cuidado prenatal', nivel=nivel, variable='Tamizaje CHAGAS')),
        con_nombre(_indicador(aro_total, aro_go, 'Porcentaje de gestantes clasificadas con Alto Riesgo Obstetrico (ARO) que tienen atencion prenatal por Ginecoobstetra (GO)', nivel=nivel, variable='ARO con GO')),
        con_nombre(_indicador(riesgo_preclamsia, asa_garantizada, 'Porcentaje de gestantes con riesgo para preclamsia que se les garantiza profilaxis con acido acetil salicilico (ASA)', nivel=nivel, variable='Riesgo preclamsia con ASA')),
        con_nombre(_indicador(total, con_anemia, 'Proporcion de gestantes con anemia', nivel=nivel, variable='Hemoglobina < 11')),
        con_nombre(_indicador(con_anemia, anemia_tratada, 'Proporcion de gestantes con anemia tratada', nivel=nivel, variable='Anemia con tratamiento')),
    ]

    return {
        'total': total,
        'indicadores': indicadores,
    }


MUNICIPIO_NOMBRES = {
    44001: 'RIOHACHA', 44035: 'ALBANIA', 44078: 'BARRANCAS', 44090: 'DIBULLA',
    44098: 'DISTRACCION', 44110: 'EL MOLINO', 44279: 'FONSECA', 44378: 'HATONUEVO',
    44420: 'LA JAGUA DEL PILAR', 44430: 'MAICAO', 44560: 'MANAURE', 44650: 'SAN JUAN DEL CESAR',
    44847: 'URIBIA', 44855: 'URUMITA', 44874: 'VILLANUEVA', 20001: 'VALLEDUPAR',
    20011: 'AGUACHICA', 20013: 'AGUSTIN CODAZZI', 20032: 'ASTREA', 20045: 'BECERRIL',
    20060: 'BOSCONIA', 20175: 'CHIMICHAGUA', 20178: 'CHIRIGUANA', 20228: 'CURUMANI',
    20238: 'EL COPEY', 20250: 'EL PASO', 20295: 'GAMARRA', 20310: 'GONZALEZ',
    20383: 'LA GLORIA', 20400: 'LA JAGUA DE IBIRICO', 20443: 'MANAURE BALCON DEL CESAR',
    20517: 'PAILITAS', 20550: 'PELAYA', 20570: 'PUEBLO BELLO', 20614: 'RIO DE ORO',
    20621: 'LA PAZ', 20710: 'SAN ALBERTO', 20750: 'SAN DIEGO', 20770: 'SAN MARTIN',
    20787: 'TAMALAMEQUE',
}


def _nombre_municipio(valor):
    s = str(valor).strip() if valor is not None else ''
    if not s or s.lower() in ('sin dato', '0', 'n/a', 'none', 'nan'):
        return 'SIN MUNICIPIO'
    try:
        codigo = int(float(s))
        return MUNICIPIO_NOMBRES.get(codigo, f'CODIGO {codigo}')
    except (ValueError, TypeError):
        return s.upper()


def calcular_indicadores_gestante(df: pd.DataFrame, ref_date: datetime | None = None):
    """Calcula los indicadores PARE MM para la cohorte de gestantes.
    Retorna nivel departamental + desglose por municipio."""
    if ref_date is None:
        ref_date = datetime.now()

    departamental = _calcular_bloque(df, ref_date, nivel='DEPARTAMENTAL')

    # Desglose por municipio (campo MUNICIPIO DE RESIDENCIA codigo DANE)
    por_municipio = []
    if 'MUNICIPIO DE RESIDENCIA' in df.columns:
        agrupado = df.groupby('MUNICIPIO DE RESIDENCIA', dropna=False)
        for codigo, sub in agrupado:
            nombre = _nombre_municipio(codigo)
            bloque = _calcular_bloque(sub, ref_date, nivel='MUNICIPAL', nombre_nivel=nombre)
            por_municipio.append({
                'municipio': nombre,
                'codigo': str(codigo) if codigo is not None else '',
                'total': bloque['total'],
                'indicadores': bloque['indicadores'],
            })
        por_municipio.sort(key=lambda x: x['municipio'])

    return {
        'total_gestantes': departamental['total'],
        'fecha_referencia': ref_date.strftime('%Y-%m-%d'),
        'indicadores': departamental['indicadores'],
        'por_municipio': por_municipio,
    }