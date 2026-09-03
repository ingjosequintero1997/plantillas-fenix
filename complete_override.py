#!/usr/bin/env python
"""Generate the COMPLETE CSV_TO_DB_OVERRIDE dictionary for ALL fields that
the _norm() function would fail to match automatically."""

RAW_FIELDS = [
    ("No", "INT"), ("Tipo de documento de identidad", "SET"),
    ("No. De Identificación", "INT"), ("Apellido_1,", "TEXT"),
    ("Apellido_2", "TEXT"), ("Nombre_1,", "TEXT"), ("Nombre_2", "TEXT"),
    ("Fecha de Nacimiento", "DATE"), ("Edad (años)", "FORMULA"),
    ("Sexo", "SET"), ("Regimen Afiliacion", "SET"),
    ("Pertenecia Etnica", "SET"), ("Grupo Poblacional", "TEXT"),
    ("Departamento Residencia", "TEXT"), ("Municipio de Residencia", "TEXT"),
    ("Zona", "SET"), ("Etnia", "SET"),
    ("Asentamiento/Rancheria/Comunidad", "TEXT"),
    ("Teléfono usuaria", "INT"), ("Direccion", "TEXT"),
    ("Nivel Educativo", "SET"), ("Discapacidad", "SET"),
    ("Mujer cabeza de Hogar", "SET"), ("Ocupación", "TEXT"),
    ("Estado Civil", "SET"), ("Control Tradicional", "SET"),
    ("Gestante Renuente", "SET"), ("Inasistente", "SET"),
    ("Nombre de la IPS Primaria", "TEXT"),
    ("Fecha de Diagnostico del embarazo", "DATE"),
    ("Fecha de Ingreso al Control Prenatal", "DATE"), ("FUM", "DATE"),
    ("FPP", "FORMULA"), ("Dias para el parto", "FORMULA"),
    ("Alarma", "FORMULA"), ("Edad Gest Inicio Control", "FORMULA"),
    ("Trimestre inicio control", "FORMULA"),
    ("G", "INT"), ("P", "INT"), ("C", "INT"), ("A", "INT"),
    ("M", "INT"), ("V", "INT"),
    ("Hipertension arterial", "SET"), ("Diabetes", "SET"),
    ("VIH", "SET"), ("Sifilis", "SET"), ("Tuberculosis", "SET"),
    ("Otras condiciones medicas graves", "SET"),
    ("Si la respuesta anterior es  SI describa la otra condición médica grave", "TEXT"),
    ("Antecedentes de eventos obstétricos\ndesfavorables", "SET"),
    ("Periodo Intergenésico", "SET"),
    ("Peso Inicial (kg)", "DECIMAL"), ("Talla (metros)", "DECIMAL"),
    ("Indice de Masa Corporal (IMC)", "FORMULA"),
    ("Clasificación del IMC", "FORMULA"),
    ("HISTORIA REPRODUCTVA", "TEXT"), ("EMBARAZO ACTUAL", "TEXT"),
    ("RIESGO PSICOSOCIAL", "TEXT"), ("PUNTAJE TOTAL", "TEXT"),
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
    ("Fecha Toma Glicemia", "DATE"), ("Resultado Glicemia", "INT"),
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
    ("peso actual", "DECIMAL"), ("talla actual", "DECIMAL"),
    ("IMC ACTUAL", "FORMULA"),
    ("Clasificación del IMC ACTUAL", "FORMULA"),
    ("TA ACTUAL", "TEXT"), ("ALTURA UTERINA", "DECIMAL"),
    ("FCF", "DECIMAL"),
    ("Fecha Primera Consulta Ginecología", "DATE"),
    ("Fecha Segunda Consulta Ginecología", "DATE"),
    ("Fecha Tercera Consulta Ginecología", "DATE"),
    ("Fecha Consulta Nutrición", "DATE"),
    ("Fecha Consulta Psicología", "DATE"),
    ("Fecha de Atención Otro Especialista", "DATE"),
    ("Quien Realizó la Consulta", "DATE"),
    ("Tipo", "SET"), ("Fecha de aborto", "DATE"),
    ("Semanas de Gestación", "INT"), ("Complicaciones", "SET"),
    ("Fecha de Parto", "DATE"),
    ("Caracteristicas del parto", "SET"),
    ("Parto atendido por", "SET"),
    ("No. Semanas de gestación", "INT"),
    ("Multiplicidad del embarazo", "SET"),
    ("Complicaciones durante el parto", "SET"),
    ("Tipo Complicación", "SET"), ("UCI Materna", "SET"),
    ("Toma de pruebas ITS intraparto", "SET"),
    ("Resultado POSITIVO", "SET"), ("Fecha", "DATE"),
    ("Causa de la defunción", "TEXT"), ("TIPO", "SET"),
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
    "TIPO", "OBSEVACIONES", "CASO_CERRADO",
]

# Manual CSV -> DB mapping (complete, ordered by RAW_FIELDS)
# These are the entries where _norm() would NOT automatically match
CSV_TO_DB_OVERRIDE = {
    # --- Datos personales ---
    "No": "CONSECUTIVO",
    "Tipo de documento de identidad": "TIPO_DE_DOCUMENTO_DE_IDENTIDAD",
    "No. De Identificación": "NO_DE_IDENTIFICACION",
    "Apellido_1,": "APELLIDO_1",
    "Apellido_2": "APELLIDO_2",
    "Nombre_1,": "NOMBRE_1",
    "Nombre_2": "NOMBRE_2",
    "Fecha de Nacimiento": "FECHA_DE_NACIMIENTO",
    # Edad (años) = FORMULA -> skip
    "Sexo": "SEXO",
    "Regimen Afiliacion": "REGIMEN_DE_AFILIACION",
    "Pertenecia Etnica": "PERTENECIA_ETNICA",
    "Grupo Poblacional": "GRUPO_POBLACIONAL",
    "Departamento Residencia": "DEPARTAMENTO_DE_RESIDENCIA",
    "Municipio de Residencia": "MUNICIPIO_DE_RESIDENCIA",
    "Zona": "ZONA",
    "Etnia": "ETNIA",
    "Asentamiento/Rancheria/Comunidad": "ASENTAMIENTO_RANCHERIA_COMUNIDAD",
    "Teléfono usuaria": "TELEFONO_USUARIA",
    "Direccion": "DIRECCION",
    "Nivel Educativo": "NIVEL_EDUCATIVO",
    "Discapacidad": "DISCAPACIDAD",
    "Mujer cabeza de Hogar": "MUJER_CABEZA_DE_HOGAR",
    "Ocupación": "OCUPACION",
    "Estado Civil": "ESTADO_CIVIL",
    "Control Tradicional": "CONTROL_TRADICIONAL",
    "Gestante Renuente": "GESTANTE_RENUENTE",
    "Inasistente": "INASISTENTE",
    "Nombre de la IPS Primaria": "NOMBRE_DE_LA_IPS_PRIMARIA",
    # --- Control prenatal ---
    "Fecha de Diagnostico del embarazo": "FECHA_DE_DIAGNOSTICO_DEL_EMBARAZO",
    "Fecha de Ingreso al Control Prenatal": "FECHA_DE_INGRESO_AL_CONTROL_PRENATAL",
    "FUM": "FUM",
    # FPP, Dias para el parto, Alarma, Edad Gest Inicio Control, Trimestre inicio control = FORMULA -> skip
    "G": "G", "P": "P", "C": "C", "A": "A", "M": "M", "V": "V",
    # --- Antecedentes ---
    "Hipertension arterial": "HIPERTENSION_ARTERIAL",
    "Diabetes": "DIABETES",
    "VIH": "VIH",
    "Sifilis": "SIFILIS",
    "Tuberculosis": "TUBERCULOSIS",
    "Otras condiciones medicas graves": "OTRAS_CONDICIONES_MEDICAS_GRAVES",
    "Si la respuesta anterior es  SI describa la otra condición médica grave": "SI_LA_RESPUESTA_ANTERIOR_ES_SI_DESCRIBA_LA_OTRA_CONDICION_MEDICA_GRAVE",
    "Antecedentes de eventos obstétricos\ndesfavorables": "ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES",
    "Periodo Intergenésico": "PERIODO_INTERGENESICO",
    # --- Evaluación física ---
    "Peso Inicial (kg)": "PESO",
    "Talla (metros)": "TALLA_METROS",
    # Indice de Masa Corporal (IMC) = FORMULA -> skip
    # Clasificación del IMC = FORMULA -> skip
    # --- Historia reproductiva ---
    "HISTORIA REPRODUCTVA": "HABITOS_DE_RIESGO",
    "EMBARAZO ACTUAL": "EMBARAZO_DESEADO",
    "RIESGO PSICOSOCIAL": "APOYO_FAMILIAR",
    "PUNTAJE TOTAL": "HA_SIDO_VICTIMA_DE_VIOLENCIA_FISICA_O_PSICOLOGICA",
    "Solicita ive IVE?": "SE_IDENTIFICAN_CAUSALES_PARA_IVE",
    # --- Clasificación de riesgo ---
    "Clasificación del riesgo obstetrico": "CLASIFICACION_DEL_RIESGO",
    "Causas de Alto Riesgo obstetrico": "CAUSAS_DE_ALTO_RIESGO",
    "Clacificacion del riesgo de preeclampsia": "CLASIFICACION_DEL_RIESGO",
    "Causas de Alto Riesgo de preeclampsia": "CAUSAS_DE_ALTO_RIESGO",
    "Clacificacion del riesgo tromboembolico": "CLASIFICACION_DEL_RIESGO",
    "Causas de Alto Riesgo tromboembolico": "CAUSAS_DE_ALTO_RIESGO",
    "fecha de suministro de tratamiento": "FECHA_DE_SUMINISTRO_DE_TRATAMIENTO",
    "tratamiento Instaurado": "TRATAMIENTO_INSTAURADO",
    "Remitida a especialista?": "REMITIDA_A_ESPECIALISTA",
    "Describa cual(es) especialistas la han atendido": "DESCRIBA_CUAL_ES_ESPECIALISTAS_LA_HAN_ATENDIDO",
    # --- VIH Tamizaje ---
    "Asesoria Prueba VIH": "ASESORIA_PRUEBA_VIH",
    # Trimestre Asesoria VIH = FORMULA -> skip
    "Fecha Toma Prueba VIH Primer Tamizaje": "FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "Resultado Primer Tamizaje prueba de VIH": "RESULTADO_PRIMER_TAMIZAJE",
    # Trimestre Toma Prueba VIH Primer Tamizaje = FORMULA -> skip
    "Fecha Toma Prueba VIH Segundo Tamizaje": "FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "Resultado Segundo Tamizaje Prueba de VIH": "RESULTADO_SEGUNDO_TAMIZAJE",
    # Trimestre Toma Prueba VIH Segundo Tamizaje = FORMULA -> skip
    "Fecha Toma Prueba VIH Tercer Tamizaje": "FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "Resultado Tercer Tamizaje Prueba de VIH": "RESULTADO_TERCER_TAMIZAJE",
    # Trimestre Toma Prueba VIH Tercer Tamizaje = FORMULA -> skip
    # --- Sífilis Tamizaje ---
    "Fecha Primera Prueba Treponemica Rapida Sifilis": "FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "Resultado Primera Prueba Treponemica Rapida Sifilis": "RESULTADO_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    # Trimestre Primera Prueba Treponemica Rapida Sifilis = FORMULA -> skip
    "Fecha Segunda Prueba Treponemica Rapida Sifilis": "FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "Resultado Segunda Prueba Treponemica Rapida Sifilis": "RESULTADO_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    # Trimestre Segunda Prueba Treponemica Rapida Sifilis = FORMULA -> skip
    "Fecha Tercera Prueba Treponemica Rapida Sifilis": "FECHA_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "Resultado Tercera Prueba Treponemica Rapida Sifilis": "RESULTADO_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    # Trimestre Tercera Prueba Treponemica Rapida Sifilis = FORMULA -> skip
    # --- Segunda Prueba VIH ---
    "Fecha toma Segunda Prueba VIH": "TOMA_SEGUNDA_PRUEBA_VIH",
    "Resultado Toma Segunda Prueba VIH": "RESULTADO_TOMA_SEGUNDA_PRUEBA_VIH",
    # Trimestre Toma segunda Prueba VIH = FORMULA -> skip
    # --- Confirmatoria ---
    "Fecha prueba confirmatoria Según Algoritmo": "PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    # Trimestre Prueba confirmatoria Según Algoritmo = FORMULA -> skip
    # --- Sífilis tratamiento ---
    "Fecha de diagnóstico de sífilis": "FECHA_DE_DIAGNOSTICO_DE_SIFILIS",
    "Tratamiento instaurado": "TRATAMIENTO_INSTAURADO",
    "Fecha de inicio del tratamiento": "FECHA_DE_INICIO_DEL_TRATAMIENTO",
    "Fecha de segunda dosis del tratamiento": "FECHA_DE_SEGUNDA_DOSIS_DEL_TRATAMIENTO",
    "Fecha de tercera dosis del tratamiento": "FECHA_DE_TERCERA_DOSIS_DEL_TRATAMIENTO",
    # --- Urocultivo ---
    "Fecha de Toma de Urocultivo": "FECHA_DE_TOMA_DE_UROCULTIVO_Y_ANTIBIOGRAMA",
    "Resultado Urocultivo": "RESULTADO_UROCULTIVO",
    # --- Glicemia ---
    "Fecha Toma Glicemia": "FECHA_TOMA_GLICEMIA",
    "Resultado Glicemia": "RESULTADO_GLICEMIA",
    # --- Tolerancia Oral Glucosa ---
    "Fecha Prueba de Tolerancia Oral Glucosa": "FECHA_REALIZACION_PRUEBA_TOLERANCIA_ORAL_GLUCOSA",
    "Resultado Prueba de Tolerancia Oral Glucosa": "RESULTADO_PRUEBA_DE_TOLERANCIA_ORAL_GLUCOSA",
    # --- Hemoglobina ---
    "Fecha 1ra Realizacion Hemoglobina": "FECHA_REALIZACION_HEMOGRAMA_INICIAL",
    "Resultado 1ra Hemoglobina": "RESULTADO_1RA_HEMOGLOBINA",
    "Fecha 2da Realizacion Hemoglobina": "FECHA_REALIZACION_SEGUNDO_HEMOGRAMA_SEMANA_28",
    "Resultado 2da Hemoglobina": "RESULTADO_2DA_HEMOGLOBINA",
    "Fecha 3ra Realizacion Hemoglobina": "RESULTADO_3RA_HEMOGLOBINA",
    "Resultado 3ra Hemoglobina": "RESULTADO_3RA_HEMOGLOBINA",
    # --- Hemoclasificación ---
    "Resultado Realizacion Hemoclasificación (Factor RH)": "FECHA_REALIZACION_HEMOCLASIFICACION",
    # --- Hepatitis B ---
    "Fecha de Antigeno Superficie Hepatitis B": "FECHA_DE_LA_REALIZACION_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "Resultado Antigeno Superficie Hepatitis B": "RESULTADO_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    # --- Toxoplasma ---
    "Fecha Tamizaje Toxoplasma": "FECHA_TAMIZAJE_TOXOPLASMA",
    "Resultado Toxoplasma": "RESULTADO_TOXOPLASMA",
    # --- Citología ---
    "Fecha Citologia Cervicouterina": "FECHA_DE_TAMIZAJE_PARA_CA_CUELLO_UTERINO",
    "Resultado Tamizaje de cuello uterino": "RESULTADO_TAMIZAJE_DE_CUELLO_UTERINO",
    # --- Rubeola ---
    "Fecha de la prueba de Rubeola": "FECHA_DE_LA_REALIZACION_PRUEBA_IGG_RUBEOLA",
    "Resultado Rubeola": "RESULTADO_RUBEOLA",
    # --- Estreptococo ---
    "Fecha Prueba de Tamizaje para Estreptococo Grupo B": "FECHA_REALIZACION_PRUEBA_TAMIZAJE_ESTREPTOCOCO_GRUPO_B",
    "Resultado Prueba de Tamizaje para Estreptococo Grupo B": "RESULTADO_PRUEBA_DE_TAMIZAJE_PARA_ESTREPTOCOCO_GRUPO_B",
    # --- Malaria ---
    "Fecha Toma de Gota Gruesa (Malaria)": "FECHA_TOMA_DE_GOTA_GRUESA_MALARIA",
    "Resultado Gota gruesa (Malaria)": "RESULTADO_GOTA_GRUESA_MALARIA",
    # --- Chagas ---
    "Fecha de Realización Tamizaje Chagas": "FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS",
    "Resultado Chagas": "RESULTADO_CHAGAS",
    # --- Vacunas ---
    "FECHA DE APLICACIÓN INFLUENZA (Desde Semana 14)": "FECHA_DE_APLICACION_INFLUENZA_DESDE_SEMANA_14",
    "FECHA DE APLICACIÓN TOXOIDE Según Antecedente Vacunal": "FECHA_DE_APLICACION_TOXOIDE_SEGUN_ANTECEDENTE_VACUNAL",
    "FECHA DE APLICACIÓN DPT ACELULAR (Semana 26)": "FECHA_DE_APLICACION_DPT_ACELULAR_SEMANA_26",
    "FECHA DE APLICACIÓN COVID-19 (1 En la Gestación)": "FECHA_DE_APLICACION_COVID19_1_EN_LA_GESTACION",
    "FECHA DE APLICACIÓN VSR (Semana 28 - 36)": "FECHA_DE_APLICACION_VSR_SEMANA_28_36",
    # --- Odontología ---
    "FECHA CONSULTA ODONTOLOGICA": "FECHA_CONSULTA_ODONTOLOGICA",
    # --- Ecografías ---
    "Ecografia obstétrica con translucencia nucal (10,6 - 13,6)": "PRIMERA_ECOGRAFIA_OBSTETRICA_10_13",
    "Ecografia Obstetrica para la detección de anomalias estructurales (18 - 23)": "ECOGRAFIA_OBSTETRICA_PARA_LA_DETECCION_DE_ANOMALIAS_ESTRUCTURALES_18_23",
    "Otras ecografías?": "OTRAS_ECOGRAFIAS",
    # --- Suplementación ---
    "Fecha suministro Acido Folico": "FECHA_SUMINISTRO_ACIDO_FOLICO",
    "Fecha suministro Calcio (Semana 14)": "FECHA_SUMINISTRO_CALCIO_SEMANA_14",
    "Fecha suministro Hierro": "FECHA_SUMINISTRO_HIERRO",
    "Tipo de tratamiento suminitrado para anemia": "TIPO_DE_TRATAMIENTO_SUMINITRADO_PARA_ANEMIA",
    "Relación entre Anemia vs tratamiento": "RELACION_ENTRE_ANEMIA_VS_TRATAMIENTO",
    "Condicion del suministro del ASA": "CONDICION_DEL_SUMINISTRO_DEL_ASA",
    "fecha de suministro": "FECHA_DE_SUMINISTRO_DE_TRATAMIENTO",
    # --- Desparasitación ---
    "Fecha Desparasitación Antihelmintica II y III Trimestre (Albendazo 400 Mg Dosis Unica)": "FECHA_DESPARASITACION_ANTIHELMINTICA_II_Y_III_TRIMESTRE_ALBENDAZO_400_MG_DOSIS_UNICA",
    # --- Controles prenatales ---
    "Fecha 1er Control": "FECHA_1ER_CONTROL",
    "Quien Realizó el Control": "QUIEN_REALIZO_EL_CONTROL",
    "Fecha 2do Control": "FECHA_2DO_CONTROL",
    "Fecha 3er Control": "FECHA_3ER_CONTROL",
    "Fecha 4to Control": "FECHA_4TO_CONTROL",
    "Fecha 5to Control": "FECHA_5TO_CONTROL",
    "Fecha 6to Control": "FECHA_6TO_CONTROL",
    "Fecha 7mo Control": "FECHA_7MO_CONTROL",
    "fecha 8vo Control": "FECHA_8VO_CONTROL",
    "Fecha 9no Control": "FECHA_9NO_CONTROL",
    # Número Total de Controles Prenatales = FORMULA -> skip
    # Ultimo Control Prenatal = FORMULA -> skip
    # edad gestacional actual = FORMULA -> skip
    # --- Control actual ---
    "peso actual": "PESO",
    "talla actual": "TALLA_METROS",
    # IMC ACTUAL = FORMULA -> skip
    # Clasificación del IMC ACTUAL = FORMULA -> skip
    "TA ACTUAL": "TA_ACTUAL",
    "ALTURA UTERINA": "ALTURA_UTERINA",
    "FCF": "FCF",
    # --- Consultas especializadas ---
    "Fecha Primera Consulta Ginecología": "FECHA_PRIMERA_CONSULTA_GINECOLOGIA",
    "Fecha Segunda Consulta Ginecología": "FECHA_SEGUNDA_CONSULTA_GINECOLOGIA",
    "Fecha Tercera Consulta Ginecología": "FECHA_TERCERA_CONSULTA_GINECOLOGIA",
    "Fecha Consulta Nutrición": "FECHA_CONSULTA_NUTRICION",
    "Fecha Consulta Psicología": "FECHA_CONSULTA_PSICOLOGIA",
    "Fecha de Atención Otro Especialista": "FECHA_DE_ATENCION_OTRO_ESPECIALISTA",
    "Quien Realizó la Consulta": "QUIEN_REALIZO_LA_CONSULTA",
    # --- Aborto ---
    "Tipo": "TIPO_DE_ABORTO",
    "Fecha de aborto": "FECHA_DE_ABORTO",
    "Semanas de Gestación": "SEMANAS_DE_GESTACION",
    "Complicaciones": "COMPLICACIONES",
    # --- Parto ---
    "Fecha de Parto": "FECHA_DE_PARTO",
    "Caracteristicas del parto": "CARACTERISTICAS_DEL_PARTO",
    "Parto atendido por": "PARTO_ATENDIDO_POR",
    "No. Semanas de gestación": "NO_SEMANAS_DE_GESTACION",
    "Multiplicidad del embarazo": "MULTIPLICIDAD_DEL_EMBARAZO",
    "Complicaciones durante el parto": "COMPLICACIONES_DURANTE_EL_PARTO",
    "Tipo Complicación": "TIPO_COMPLICACION",
    "UCI Materna": "UCI_MATERNA",
    "Toma de pruebas ITS intraparto": "TOMA_DE_PRUEBAS_ITS_INTRAPARTO",
    "Resultado POSITIVO": "RESULTADO_POSITIVO",
    # --- Defunción ---
    "Fecha": "FECHA_DE_DEFUNCION",
    "Causa de la defunción": "CAUSA_DE_LA_DEFUNCION",
    "FECHA": "FECHA_DE_DEFUNCION",
    # --- Planificación ---
    "RENUENTE A PLANIFICACION FAMILIAR": "RENUENTE_A_PLANIFICACION_FAMILIAR",
    "OBSERVACIONES GENERALES": "OBSERVACIONES_GESTION_RIESGO",
}

# Verify all keys exist in RAW_FIELDS
csv_names = {name for name, _ in RAW_FIELDS}
missing = [k for k in CSV_TO_DB_OVERRIDE if k not in csv_names]
if missing:
    print(f"WARNING: Keys not in RAW_FIELDS: {missing}")

# Verify all values exist in GESTANTE_COLUMNS
for k, v in CSV_TO_DB_OVERRIDE.items():
    if v not in GESTANTE_COLUMNS:
        print(f"WARNING: DB column '{v}' not in GESTANTE_COLUMNS (from CSV '{k}')")

# Count: skip FORMULA fields
formula_fields = [name for name, ftype in RAW_FIELDS if ftype == "FORMULA"]
non_formula = len(RAW_FIELDS) - len(formula_fields)
in_override = len(CSV_TO_DB_OVERRIDE)

# Fields that _norm() would match automatically (same name after norm)
import unicodedata
def _norm(s):
    s = str(s).strip()
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.upper()
    s = ''.join(c for c in s if c.isalnum() or c == ' ')
    s = s.strip()
    s = '_'.join(s.split())
    return s

norm_to_db = {}
for col in GESTANTE_COLUMNS:
    n = _norm(col)
    if n not in norm_to_db:
        norm_to_db[n] = col

auto_ok = 0
for csv_name, ftype in RAW_FIELDS:
    if ftype == "FORMULA":
        continue
    csv_norm = _norm(csv_name)
    if csv_norm in norm_to_db:
        db_col = norm_to_db[csv_norm]
        if csv_name == db_col:
            auto_ok += 1

print(f"FORMULA fields (skipped): {len(formula_fields)}")
print(f"Non-FORMULA fields: {non_formula}")
print(f"Auto-matched (identical names, no override needed): {auto_ok}")
print(f"Override entries: {in_override}")
print(f"Total covered: {auto_ok + in_override} / {non_formula}")
print()

# Print the dict
print("CSV_TO_DB_OVERRIDE = {")
for csv_name, db_col in CSV_TO_DB_OVERRIDE.items():
    escaped = csv_name.replace('\\', '\\\\').replace('"', '\\"')
    print(f'    "{escaped}": "{db_col}",')
print("}")
