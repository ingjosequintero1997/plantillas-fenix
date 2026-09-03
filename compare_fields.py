#!/usr/bin/env python
"""Compare RAW_FIELDS CSV headers against GESTANTE_COLUMNS DB columns
using _norm() to find all mismatches and extras."""

import unicodedata

RAW_FIELDS = [
    ("No", "INT"),
    ("Tipo de documento de identidad", "SET"),
    ("No. De Identificación", "INT"),
    ("Apellido_1,", "TEXT"),
    ("Apellido_2", "TEXT"),
    ("Nombre_1,", "TEXT"),
    ("Nombre_2", "TEXT"),
    ("Fecha de Nacimiento", "DATE"),
    ("Edad (años)", "FORMULA"),
    ("Sexo", "SET"),
    ("Regimen Afiliacion", "SET"),
    ("Pertenecia Etnica", "SET"),
    ("Grupo Poblacional", "TEXT"),
    ("Departamento Residencia", "TEXT"),
    ("Municipio de Residencia", "TEXT"),
    ("Zona", "SET"),
    ("Etnia", "SET"),
    ("Asentamiento/Rancheria/Comunidad", "TEXT"),
    ("Teléfono usuaria", "INT"),
    ("Direccion", "TEXT"),
    ("Nivel Educativo", "SET"),
    ("Discapacidad", "SET"),
    ("Mujer cabeza de Hogar", "SET"),
    ("Ocupación", "TEXT"),
    ("Estado Civil", "SET"),
    ("Control Tradicional", "SET"),
    ("Gestante Renuente", "SET"),
    ("Inasistente", "SET"),
    ("Nombre de la IPS Primaria", "TEXT"),
    ("Fecha de Diagnostico del embarazo", "DATE"),
    ("Fecha de Ingreso al Control Prenatal", "DATE"),
    ("FUM", "DATE"),
    ("FPP", "FORMULA"),
    ("Dias para el parto", "FORMULA"),
    ("Alarma", "FORMULA"),
    ("Edad Gest Inicio Control", "FORMULA"),
    ("Trimestre inicio control", "FORMULA"),
    ("G", "INT"),
    ("P", "INT"),
    ("C", "INT"),
    ("A", "INT"),
    ("M", "INT"),
    ("V", "INT"),
    ("Hipertension arterial", "SET"),
    ("Diabetes", "SET"),
    ("VIH", "SET"),
    ("Sifilis", "SET"),
    ("Tuberculosis", "SET"),
    ("Otras condiciones medicas graves", "SET"),
    ("Si la respuesta anterior es  SI describa la otra condición médica grave", "TEXT"),
    ("Antecedentes de eventos obstétricos\ndesfavorables", "SET"),
    ("Periodo Intergenésico", "SET"),
    ("Peso Inicial (kg)", "DECIMAL"),
    ("Talla (metros)", "DECIMAL"),
    ("Indice de Masa Corporal (IMC)", "FORMULA"),
    ("Clasificación del IMC", "FORMULA"),
    ("HISTORIA REPRODUCTVA", "TEXT"),
    ("EMBARAZO ACTUAL", "TEXT"),
    ("RIESGO PSICOSOCIAL", "TEXT"),
    ("PUNTAJE TOTAL", "TEXT"),
    ("Solicita ive IVE?", "SET"),
    ("Clasificación del riesgo obstetrico", "SET"),
    ("Causas de Alto Riesgo obstetrico", "SET"),
    ("Clacificacion del riesgo de preeclampsia", "SET"),
    ("Causas de Alto Riesgo de preeclampsia", "SET"),
    ("Clacificacion del riesgo tromboembolico", "SET"),
    ("Causas de Alto Riesgo tromboembolico", "SET"),
    ("fecha de suministro de tratamiento", "DATE"),
    ("tratamiento Instaurado", "TEXT"),
    ("Remitida a especialista?", "SET"),
    ("Describa cual(es) especialistas la han atendido", "TEXT"),
    ("Asesoria Prueba VIH", "DATE"),
    ("Trimestre Asesoria VIH", "FORMULA"),
    ("Fecha Toma Prueba VIH Primer Tamizaje", "DATE"),
    ("Resultado Primer Tamizaje prueba de VIH", "SET"),
    ("Trimestre Toma Prueba VIH Primer Tamizaje", "FORMULA"),
    ("Fecha Toma Prueba VIH Segundo Tamizaje", "DATE"),
    ("Resultado Segundo Tamizaje Prueba de VIH", "SET"),
    ("Trimestre Toma Prueba VIH Segundo Tamizaje", "FORMULA"),
    ("Fecha Toma Prueba VIH Tercer Tamizaje", "DATE"),
    ("Resultado Tercer Tamizaje Prueba de VIH", "SET"),
    ("Trimestre Toma Prueba VIH Tercer Tamizaje", "FORMULA"),
    ("Fecha Primera Prueba Treponemica Rapida Sifilis", "DATE"),
    ("Resultado Primera Prueba Treponemica Rapida Sifilis", "SET"),
    ("Trimestre Primera Prueba Treponemica Rapida Sifilis", "FORMULA"),
    ("Fecha Segunda Prueba Treponemica Rapida Sifilis", "DATE"),
    ("Resultado Segunda Prueba Treponemica Rapida Sifilis", "SET"),
    ("Trimestre Segunda Prueba Treponemica Rapida Sifilis", "FORMULA"),
    ("Fecha Tercera Prueba Treponemica Rapida Sifilis", "DATE"),
    ("Resultado Tercera Prueba Treponemica Rapida Sifilis", "SET"),
    ("Trimestre Tercera Prueba Treponemica Rapida Sifilis", "FORMULA"),
    ("Fecha toma Segunda Prueba VIH", "DATE"),
    ("Resultado Toma Segunda Prueba VIH", "SET"),
    ("Trimestre Toma segunda Prueba VIH", "FORMULA"),
    ("Fecha prueba confirmatoria Según Algoritmo", "DATE"),
    ("Trimestre Prueba confirmatoria Según Algoritmo", "FORMULA"),
    ("Fecha de diagnóstico de sífilis", "DATE"),
    ("Tratamiento instaurado", "TEXT"),
    ("Fecha de inicio del tratamiento", "DATE"),
    ("Fecha de segunda dosis del tratamiento", "DATE"),
    ("Fecha de tercera dosis del tratamiento", "DATE"),
    ("Fecha de Toma de Urocultivo", "DATE"),
    ("Resultado Urocultivo", "SET"),
    ("Fecha Toma Glicemia", "DATE"),
    ("Resultado Glicemia", "INT"),
    ("Fecha Prueba de Tolerancia Oral Glucosa", "DATE"),
    ("Resultado Prueba de Tolerancia Oral Glucosa", "INT"),
    ("Fecha 1ra Realizacion Hemoglobina", "DATE"),
    ("Resultado 1ra Hemoglobina", "INT"),
    ("Fecha 2da Realizacion Hemoglobina", "DATE"),
    ("Resultado 2da Hemoglobina", "INT"),
    ("Fecha 3ra Realizacion Hemoglobina", "DATE"),
    ("Resultado 3ra Hemoglobina", "INT"),
    ("Resultado Realizacion Hemoclasificación (Factor RH)", "SET"),
    ("Fecha de Antigeno Superficie Hepatitis B", "DATE"),
    ("Resultado Antigeno Superficie Hepatitis B", "SET"),
    ("Fecha Tamizaje Toxoplasma", "DATE"),
    ("Resultado Toxoplasma", "SET"),
    ("Fecha Citologia Cervicouterina", "DATE"),
    ("Resultado Tamizaje de cuello uterino", "SET"),
    ("Fecha de la prueba de Rubeola", "DATE"),
    ("Resultado Rubeola", "SET"),
    ("Fecha Prueba de Tamizaje para Estreptococo Grupo B", "DATE"),
    ("Resultado Prueba de Tamizaje para Estreptococo Grupo B", "SET"),
    ("Fecha Toma de Gota Gruesa (Malaria)", "DATE"),
    ("Resultado Gota gruesa (Malaria)", "SET"),
    ("Fecha de Realización Tamizaje Chagas", "DATE"),
    ("Resultado Chagas", "SET"),
    ("FECHA DE APLICACIÓN INFLUENZA (Desde Semana 14)", "DATE"),
    ("FECHA DE APLICACIÓN TOXOIDE Según Antecedente Vacunal", "DATE"),
    ("FECHA DE APLICACIÓN DPT ACELULAR (Semana 26)", "DATE"),
    ("FECHA DE APLICACIÓN COVID-19 (1 En la Gestación)", "DATE"),
    ("FECHA DE APLICACIÓN VSR (Semana 28 - 36)", "DATE"),
    ("FECHA CONSULTA ODONTOLOGICA", "DATE"),
    ("Ecografia obstétrica con translucencia nucal (10,6 - 13,6)", "DATE"),
    ("Ecografia Obstetrica para la detección de anomalias estructurales (18 - 23)", "DATE"),
    ("Otras ecografías?", "DATE"),
    ("Fecha suministro Acido Folico", "DATE"),
    ("Fecha suministro Calcio (Semana 14)", "DATE"),
    ("Fecha suministro Hierro", "DATE"),
    ("Tipo de tratamiento suminitrado para anemia", "SET"),
    ("Relación entre Anemia vs tratamiento", "SET"),
    ("Condicion del suministro del ASA", "TEXT"),
    ("fecha de suministro", "DATE"),
    ("Fecha Desparasitación Antihelmintica II y III Trimestre (Albendazo 400 Mg Dosis Unica)", "DATE"),
    ("Fecha 1er Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 2do Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 3er Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 4to Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 5to Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 6to Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 7mo Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("fecha 8vo Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Fecha 9no Control", "DATE"),
    ("Quien Realizó el Control", "SET"),
    ("Número Total de Controles Prenatales", "FORMULA"),
    ("Ultimo Control Prenatal", "FORMULA"),
    ("edad gestacional actual", "FORMULA"),
    ("peso actual", "DECIMAL"),
    ("talla actual", "DECIMAL"),
    ("IMC ACTUAL", "FORMULA"),
    ("Clasificación del IMC ACTUAL", "FORMULA"),
    ("TA ACTUAL", "TEXT"),
    ("ALTURA UTERINA", "DECIMAL"),
    ("FCF", "DECIMAL"),
    ("Fecha Primera Consulta Ginecología", "DATE"),
    ("Fecha Segunda Consulta Ginecología", "DATE"),
    ("Fecha Tercera Consulta Ginecología", "DATE"),
    ("Fecha Consulta Nutrición", "DATE"),
    ("Fecha Consulta Psicología", "DATE"),
    ("Fecha de Atención Otro Especialista", "DATE"),
    ("Quien Realizó la Consulta", "DATE"),
    ("Tipo", "SET"),
    ("Fecha de aborto", "DATE"),
    ("Semanas de Gestación", "INT"),
    ("Complicaciones", "SET"),
    ("Fecha de Parto", "DATE"),
    ("Caracteristicas del parto", "SET"),
    ("Parto atendido por", "SET"),
    ("No. Semanas de gestación", "INT"),
    ("Multiplicidad del embarazo", "SET"),
    ("Complicaciones durante el parto", "SET"),
    ("Tipo Complicación", "SET"),
    ("UCI Materna", "SET"),
    ("Toma de pruebas ITS intraparto", "SET"),
    ("Resultado POSITIVO", "SET"),
    ("Fecha", "DATE"),
    ("Causa de la defunción", "TEXT"),
    ("TIPO", "SET"),
    ("FECHA", "DATE"),
    ("RENUENTE A PLANIFICACION FAMILIAR", "SET"),
    ("OBSERVACIONES GENERALES", "TEXT"),
]

GESTANTE_COLUMNS = [
    "CONSECUTIVO", "TIPO_DE_DOCUMENTO_DE_IDENTIDAD", "NO_DE_IDENTIFICACION",
    "APELLIDO_1", "APELLIDO_2", "NOMBRE_1", "NOMBRE_2", "FECHA_DE_NACIMIENTO",
    "EDAD", "SEXO", "REGIMEN_DE_AFILIACION", "PERTENECIA_ETNICA",
    "GRUPO_POBLACIONAL", "DEPARTAMENTO_DE_RESIDENCIA", "MUNICIPIO_DE_RESIDENCIA",
    "ZONA", "ETNIA", "ASENTAMIENTO_RANCHERIA_COMUNIDAD", "TELEFONO_USUARIA",
    "DIRECCION", "NIVEL_EDUCATIVO", "DISCAPACIDAD", "MUJER_CABEZA_DE_HOGAR",
    "OCUPACION", "ESTADO_CIVIL", "CONTROL_TRADICIONAL", "GESTANTE_RENUENTE",
    "INASISTENTE", "NOMBRE_DE_LA_IPS_PRIMARIA",
    "FECHA_DE_INGRESO_AL_CONTROL_PRENATAL", "FUM", "FPP", "DIAS_PARA_EL_PARTO",
    "ALARMA", "EDAD_GEST_INICIO_CONTROL", "TRIMESTRE_INICIO_CONTROL", "G",
    "P", "C", "A", "M", "V", "HIPERTENSION_ARTERIAL", "DIABETES", "VIH",
    "SIFILIS", "TUBERCULOSIS", "OTRAS_CONDICIONES_MEDICAS_GRAVES",
    "SI_LA_RESPUESTA_ANTERIOR_ES_SI_DESCRIBA_LA_OTRA_CONDICION_MEDICA_GRAVE",
    "ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES", "PERIODO_INTERGENESICO",
    "PESO", "TALLA_METROS", "INDICE_DE_MASA_CORPORAL_IMC",
    "CLASIFICACION_DE_IMC", "APOYO_FAMILIAR", "EMBARAZO_DESEADO",
    "HABITOS_DE_RIESGO", "HA_SIDO_VICTIMA_DE_VIOLENCIA_FISICA_O_PSICOLOGICA",
    "HA_SIDO_VICTIMA_DE_ABUSO_SEXUAL", "SE_IDENTIFICAN_CAUSALES_PARA_IVE",
    "CLASIFICACION_DEL_RIESGO", "CAUSAS_DE_ALTO_RIESGO",
    "REMITIDA_A_ESPECIALISTA", "DESCRIBA_CUAL_ES_ESPECIALISTAS_LA_HAN_ATENDIDO",
    "ASESORIA_PRUEBA_VIH", "TRIMESTRE_ASESORIA_VIH",
    "FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "TRIMESTRE_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "TRIMESTRE_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "TRIMESTRE_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_DE_LA_REALIZACION_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "RESULTADO_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "FECHA_DE_LA_REALIZACION_PRUEBA_IGG_RUBEOLA",
    "FECHA_TAMIZAJE_TOXOPLASMA", "RESULTADO_TOXOPLASMA",
    "FECHA_DE_TAMIZAJE_PARA_CA_CUELLO_UTERINO",
    "FECHA_DE_TOMA_DE_UROCULTIVO_Y_ANTIBIOGRAMA",
    "FECHA_TOMA_GLICEMIA",
    "FECHA_REALIZACION_HEMOGRAMA_INICIAL",
    "FECHA_REALIZACION_SEGUNDO_HEMOGRAMA_SEMANA_28",
    "FECHA_REALIZACION_HEMOCLASIFICACION",
    "FECHA_REALIZACION_PRUEBA_TAMIZAJE_ESTREPTOCOCO_GRUPO_B",
    "FECHA_REALIZACION_PRUEBA_TOLERANCIA_ORAL_GLUCOSA",
    "FECHA_TOMA_DE_GOTA_GRUESA_MALARIA",
    "FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS",
    "TOMA_SEGUNDA_PRUEBA_VIH", "TRIMESTRE_TOMA_SEGUNDA_PRUEBA_VIH",
    "PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "TRIMESTRE_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "FTA_ABS", "TRIMESTRE_FTA_ABS",
    "FECHA_DE_APLICACION_INFLUENZA_DESDE_SEMANA_14",
    "FECHA_DE_APLICACION_TOXOIDE_SEGUN_ANTECEDENTE_VACUNAL",
    "FECHA_DE_APLICACION_DPT_ACELULAR_SEMANA_26",
    "PRIMERA_ECOGRAFIA_OBSTETRICA_10_13",
    "SEGUNDA_ECOGRAFIA",
    "ECOGRAFIA_OBSTETRICA_PARA_LA_DETECCION_DE_ANOMALIAS_ESTRUCTURALES_18_23",
    "OTRAS_ECOGRAFIAS", "FECHA_SUMINISTRO_ACIDO_FOLICO",
    "FECHA_SUMINISTRO_CALCIO_SEMANA_14", "FECHA_SUMINISTRO_HIERRO",
    "FECHA_DESPARASITACION_ANTIHELMINTICA_II_Y_III_TRIMESTRE_ALBENDAZO_400_MG_DOSIS_UNICA",
    "INFORMACION_EN_SALUD", "FECHA_CONSULTA_ODONTOLOGICA",
    "FECHA_1ER_CONTROL", "QUIEN_REALIZO_EL_CONTROL", "FECHA_2DO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_2", "FECHA_3ER_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_3", "FECHA_4TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_4", "FECHA_5TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_5", "FECHA_6TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_6", "FECHA_7MO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_7", "FECHA_8VO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_8", "FECHA_9NO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_9", "FECHA_OTROS_CONTROLES_PRENATALES",
    "QUIEN_REALIZO_EL_CONTROL_10",
    "FECHA_PRIMERA_CONSULTA_GINECOLOGIA",
    "FECHA_SEGUNDA_CONSULTA_GINECOLOGIA", "FECHA_TERCERA_CONSULTA_GINECOLOGIA",
    "FECHA_CONSULTA_NUTRICION", "FECHA_CONSULTA_PSICOLOGIA",
    "FECHA_DE_ATENCION_OTRO_ESPECIALISTA", "QUIEN_REALIZO_LA_CONSULTA",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_1_TRIM",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_2_TRIM",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_3_TRIM",
    "SANGRADO_VAGINAL_1_TRIM", "SANGRADO_VAGINAL_2_TRIM",
    "SANGRADO_VAGINAL_3_TRIM", "INFECCION_URINARIA_1_TRIM",
    "INFECCION_URINARIA_2_TRIM", "INFECCION_URINARIA_3_TRIM",
    "VIH_1_TRIM", "VIH_2_TRIM", "VIH_3_TRIM",
    "SIFILIS_1_TRIM", "SIFILIS_2_TRIM", "SIFILIS_3_TRIM",
    "HEPATITIS_B_1_TRIM", "HEPATITIS_B_2_TRIM", "HEPATITIS_B_3_TRIM",
    "OTRAS_PATOLOGIAS_DESCRIPCION_Y_FECHA",
    "PRIORIZADA_PARA_SEGUIMIENTO_ESPECIAL",
    "NOTIFICACION_A_LA_IPS", "REMISION", "VISITA_DOMICILIARA",
    "ACOMPAÑAMIENTO_DURANTE_CPN_IMAGENES_DX_Y_EXAMENES_DE_LABORATORIO",
    "CASA_DE_PASO", "APOYO_PARA_TRANSPORTE",
    "ACTIVACION_DE_RED_DE_APOYO_COMUNITARIA",
    "COORDINACION_DE_ESTRATEGIAS_CON_SDSM", "OBSERVACIONES_GESTION_RIESGO",
    "TIPO_DE_EVENTO_CRITERIO_1", "FECHA_CRITERIO_1",
    "TIPO_DE_EVENTO_CRITERIO_2", "FECHA_CRITERIO_2",
    "TIPO_DE_EVENTO_CRITERIO_3", "FECHA_CRITERIO_3",
    "CAUSA_PRINCIPAL_DE_LA_MME",
    "NOMBRE_DEL_FUNCIONARIO_AL_QUE_SE_LE_ASIGNO_EL_CASO",
    "SE_CONCERTO_PLAN_DE_MEJORA_CON_LA_IPS",
    "EVALUACION_Y_SEGUIMIENTO_AL_PLAN_DE_MEJORA",
    "TIPO_DE_ABORTO", "FECHA_DE_ABORTO", "SEMANAS_DE_GESTACION",
    "COMPLICACIONES", "FECHA_DE_PARTO", "CARACTERISTICAS_DEL_PARTO",
    "PARTO_ATENDIDO_POR", "NO_SEMANAS_DE_GESTACION",
    "COMPLICACIONES_DURANTE_EL_PARTO", "TIPO_COMPLICACION", "UCI_MATERNA",
    "TOMA_DE_PRUEBAS_ITS_INTRAPARTO", "RESULTADO_POSITIVO",
    "FECHA_DE_DEFUNCION", "CAUSA_DE_LA_DEFUNCION",
    "MULTIPLICIDAD_DEL_EMBARAZO", "REGISTRO_CIVIL_RECIEN_NACIDO_1",
    "NOMBRE_RECIEN_NACIDO_1", "SEXO_RECIEN_NACIDO_1", "PESO_AL_NACER_GRS",
    "CONDICION_DEL_RECIEN_NACIDO", "TOMA_TSH_RECIEN_NACIDO_1",
    "TOMA_HEMOCLASIFICACION_RECIEN_NACIDO_1",
    "DX_HIPOTIROIDISMO", "TTO_HIPOTIROIDISMO", "TIEMPO_DE_LECTURA",
    "UCI_NEONATAL_RECIEN_NACIDO_1", "VACUNACION_CON_BCG",
    "VACUNACION_ANTIHEPATITIS_B", "REGISTRO_CIVIL_RECIEN_NACIDO_2",
    "NOMBRE_RECIEN_NACIDO_2", "SEXO_RECIEN_NACIDO_2",
    "PESO_AL_NACER_RECIEN_NACIDO_2", "CONDICION_DEL_RECIEN_NACIDO_2",
    "TOMA_TSH_RECIEN_NACIDO_2", "TOMA_HEMOCLASIFICACION_RECIEN_NACIDO_2",
    "DX_HIPOTIROIDISMO_2", "TIEMPO_DE_LECTURA_RECIEN_NACIDO_2",
    "TTO_HIPOTIROIDISMO_RECIEN_NACIDO_2", "UCI_NEONATAL_RECIEN_NACIDO_2",
    "VACUNACION_CON_BCG_2", "VACUNACION_ANTIHEPATITIS_B_2",
    "TIPO", "OBSEVACIONES",
    "CASO_CERRADO",
]


def _norm(s):
    """Normalizar nombre de columna: mayúsculas, sin tildes, alfanuméricos, unir con _"""
    s = str(s).strip()
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.upper()
    s = ''.join(c for c in s if c.isalnum() or c == ' ')
    s = s.strip()
    s = '_'.join(s.split())
    return s


# Build normalized -> DB col map
norm_to_db = {}
for col in GESTANTE_COLUMNS:
    n = _norm(col)
    norm_to_db[n] = col

print("=" * 100)
print("ALL NORMALIZED DB COLUMNS:")
print("=" * 100)
for col in GESTANTE_COLUMNS:
    print(f"  {col:70s} -> {_norm(col)}")

print("\n" + "=" * 100)
print("FIELD-BY-FIELD COMPARISON:")
print("=" * 100)

mismatches = {}
extras = []
auto_matched = []

for csv_name, field_type in RAW_FIELDS:
    csv_norm = _norm(csv_name)

    if field_type == "FORMULA":
        continue

    if csv_norm in norm_to_db:
        db_col = norm_to_db[csv_norm]
        if csv_name != db_col:  # same normalized but different raw name
            mismatches[csv_name] = db_col
            print(f"  MATCH (norm): CSV={csv_name!r:60s} -> norm={csv_norm!r:50s} -> DB={db_col}")
        else:
            auto_matched.append(csv_name)
    else:
        extras.append((csv_name, csv_norm, field_type))
        print(f"  MISMATCH:     CSV={csv_name!r:60s} -> norm={csv_norm!r:50s} -> NO DB MATCH")

print("\n" + "=" * 100)
print("MISMATCHES (norm match but names differ):")
print("=" * 100)
for csv_name, db_col in sorted(mismatches.items()):
    print(f"  {csv_name!r:60s} -> {db_col}")

print("\n" + "=" * 100)
print("EXTRAS (no DB match at all):")
print("=" * 100)
for csv_name, csv_norm, ftype in extras:
    print(f"  CSV={csv_name!r:60s} norm={csv_norm!r:50s} type={ftype}")
    # Search for closest DB col
    for db_col in GESTANTE_COLUMNS:
        db_norm = _norm(db_col)
        # Check substring relationships
        if csv_norm in db_norm or db_norm in csv_norm:
            print(f"    CANDIDATE: {db_col} (norm={db_norm})")

print("\n" + "=" * 100)
print("ALL UNIQUE NORMALIZED CSV HEADERS (non-FORMULA):")
print("=" * 100)
csv_norms = {}
for csv_name, ftype in RAW_FIELDS:
    if ftype == "FORMULA":
        continue
    n = _norm(csv_name)
    if n in csv_norms:
        csv_norms[n].append(csv_name)
    else:
        csv_norms[n] = [csv_name]

for norm_key in sorted(csv_norms.keys()):
    names = csv_norms[norm_key]
    db_match = norm_to_db.get(norm_key, "???")
    marker = "OK" if db_match != "???" else "MISSING"
    print(f"  [{marker:7s}] {norm_key:60s} -> DB={db_match}")
    for name in names:
        print(f"            CSV: {name}")
