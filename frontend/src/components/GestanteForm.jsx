import React, { useState, useEffect } from 'react'
import { fetchIps } from '../api'

const SECCIONES = [
  {
    titulo: 'Datos personales',
    icono: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    fields: [
      { key: 'NO', label: 'No.', type: 'text' },
      { key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', label: 'Tipo de documento', type: 'select', options: ['CC', 'TI', 'RC', 'PT', 'CE', 'PA', 'MS', 'AS', 'CD'] },
      { key: 'NO_DE_IDENTIFICACION', label: 'No. Identificacion', type: 'text' },
      { key: 'APELLIDO_1', label: 'Apellido 1', type: 'text' },
      { key: 'APELLIDO_2', label: 'Apellido 2', type: 'text' },
      { key: 'NOMBRE_1', label: 'Nombre 1', type: 'text' },
      { key: 'NOMBRE_2', label: 'Nombre 2', type: 'text' },
      { key: 'FECHA_DE_NACIMIENTO', label: 'Fecha Nacimiento', type: 'date' },
      { key: 'EDAD_ANOS', label: 'Edad', type: 'text' },
      { key: 'SEXO', label: 'Sexo', type: 'text' },
      { key: 'REGIMEN_AFILIACION', label: 'Regimen Afiliacion', type: 'text' },
      { key: 'PERTENECIA_ETNICA', label: 'Pertenencia Etnica', type: 'text' },
      { key: 'GRUPO_POBLACIONAL', label: 'Grupo Poblacional', type: 'text' },
      { key: 'DEPARTAMENTO_RESIDENCIA', label: 'Departamento', type: 'text' },
      { key: 'MUNICIPIO_DE_RESIDENCIA', label: 'Municipio', type: 'text' },
      { key: 'ZONA', label: 'Zona', type: 'text' },
      { key: 'ETNIA', label: 'Etnia', type: 'text' },
      { key: 'ASENTAMIENTO_RANCHERIA_COMUNIDAD', label: 'Asentamiento', type: 'text' },
      { key: 'TELEFONO_USUARIA', label: 'Telefono', type: 'text' },
      { key: 'DIRECCION', label: 'Direccion', type: 'text' },
      { key: 'NIVEL_EDUCATIVO', label: 'Nivel Educativo', type: 'text' },
      { key: 'DISCAPACIDAD', label: 'Discapacidad', type: 'text' },
      { key: 'MUJER_CABEZA_DE_HOGAR', label: 'Mujer cabeza de hogar', type: 'text' },
      { key: 'OCUPACION', label: 'Ocupacion', type: 'text' },
      { key: 'ESTADO_CIVIL', label: 'Estado Civil', type: 'text' },
    ],
  },
  {
    titulo: 'Control prenatal',
    icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    fields: [
      { key: 'CONTROL_TRADICIONAL', label: 'Control Tradicional', type: 'text' },
      { key: 'GESTANTE_RENUENTE', label: 'Gestante Renuente', type: 'text' },
      { key: 'INASISTENTE', label: 'Inasistente', type: 'text' },
      { key: 'NOMBRE_DE_LA_IPS_PRIMARIA', label: 'IPS Primaria', type: 'ips-dropdown' },
      { key: 'FECHA_DE_DIAGNOSTICO_DEL_EMBARAZO', label: 'Fecha Diagnostico Embarazo', type: 'date' },
      { key: 'FECHA_DE_INGRESO_AL_CONTROL_PRENATAL', label: 'Fecha Ingreso Control Prenatal', type: 'date' },
      { key: 'FUM', label: 'FUM', type: 'date' },
      { key: 'FPP', label: 'FPP', type: 'text' },
      { key: 'DIAS_PARA_EL_PARTO', label: 'Dias para el parto', type: 'text' },
      { key: 'ALARMA', label: 'Alarma', type: 'text' },
      { key: 'EDAD_GEST_INICIO_CONTROL', label: 'Edad Gest Inicio Control', type: 'text' },
      { key: 'TRIMESTRE_INICIO_CONTROL', label: 'Trimestre Inicio Control', type: 'text' },
    ],
  },
  {
    titulo: 'Antecedentes obstetricos',
    icono: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    fields: [
      { key: 'G', label: 'G', type: 'text' },
      { key: 'P', label: 'P', type: 'text' },
      { key: 'C', label: 'C', type: 'text' },
      { key: 'A', label: 'A', type: 'text' },
      { key: 'M', label: 'M', type: 'text' },
      { key: 'V', label: 'V', type: 'text' },
      { key: 'HIPERTENSION_ARTERIAL', label: 'Hipertension arterial', type: 'text' },
      { key: 'DIABETES', label: 'Diabetes', type: 'text' },
      { key: 'VIH', label: 'VIH', type: 'text' },
      { key: 'SIFILIS', label: 'Sifilis', type: 'text' },
      { key: 'TUBERCULOSIS', label: 'Tuberculosis', type: 'text' },
      { key: 'OTRAS_CONDICIONES_MEDICAS_GRAVES', label: 'Otras condiciones graves', type: 'text' },
      { key: 'SI_LA_RESPUESTA_ANTERIOR_ES__SI_DESCRIBA_LA_OTRA_CONDICION_MEDICA_GRAVE', label: 'Descripcion otra condicion', type: 'text' },
      { key: 'ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES', label: 'Eventos obstetricos desfavorables', type: 'text' },
      { key: 'PERIODO_INTERGENESICO', label: 'Periodo intergenesico', type: 'text' },
      { key: 'PESO_INICIAL_KG', label: 'Peso Inicial (kg)', type: 'text' },
      { key: 'TALLA_METROS', label: 'Talla (metros)', type: 'text' },
      { key: 'INDICE_DE_MASA_CORPORAL_IMC', label: 'IMC', type: 'text' },
      { key: 'CLASIFICACION_DEL_IMC', label: 'Clasificacion IMC', type: 'text' },
      { key: 'HISTORIA_REPRODUCTVA', label: 'Historia Reproductiva', type: 'text' },
      { key: 'EMBARAZO_ACTUAL', label: 'Embarazo Actual', type: 'text' },
      { key: 'RIESGO_PSICOSOCIAL', label: 'Riesgo Psicosocial', type: 'text' },
      { key: 'PUNTAJE_TOTAL', label: 'Puntaje Total', type: 'text' },
      { key: 'SOLICITA_IVE_IVE', label: 'Solicita IVE', type: 'text' },
    ],
  },
  {
    titulo: 'Clasificacion y riesgos',
    icono: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    fields: [
      { key: 'CLASIFICACION_DEL_RIESGO_OBSTETRICO', label: 'Clasificacion riesgo obstetrico', type: 'text' },
      { key: 'CAUSAS_DE_ALTO_RIESGO_OBSTETRICO', label: 'Causas alto riesgo obstetrico', type: 'text' },
      { key: 'CLACIFICACION_DEL_RIESGO_DE_PREECLAMPSIA', label: 'Clasificacion riesgo preeclampsia', type: 'text' },
      { key: 'CAUSAS_DE_ALTO_RIESGO_DE_PREECLAMPSIA', label: 'Causas alto riesgo preeclampsia', type: 'text' },
      { key: 'CLACIFICACION_DEL_RIESGO_TROMBOEMBOLICO', label: 'Clasificacion riesgo tromboembolico', type: 'text' },
      { key: 'CAUSAS_DE_ALTO_RIESGO_TROMBOEMBOLICO', label: 'Causas alto riesgo tromboembolico', type: 'text' },
      { key: 'FECHA_DE_SUMINISTRO_DE_TRATAMIENTO', label: 'Fecha suministro tratamiento', type: 'date' },
      { key: 'TRATAMIENTO_INSTAURADO', label: 'Tratamiento instaurado', type: 'text' },
      { key: 'REMITIDA_A_ESPECIALISTA', label: 'Remitida a especialista', type: 'text' },
      { key: 'DESCRIBA_CUALES_ESPECIALISTAS_LA_HAN_ATENDIDO', label: 'Especialistas que la han atendido', type: 'text' },
    ],
  },
  {
    titulo: 'Tamizajes VIH',
    icono: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    fields: [
      { key: 'ASESORIA_PRUEBA_VIH', label: 'Asesoria Prueba VIH', type: 'text' },
      { key: 'TRIMESTRE_ASESORIA_VIH', label: 'Trimestre Asesoria VIH', type: 'text' },
      { key: 'FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE', label: 'Fecha 1ra Prueba VIH', type: 'date' },
      { key: 'RESULTADO_PRIMER_TAMIZAJE_PRUEBA_DE_VIH', label: 'Resultado 1ra Prueba VIH', type: 'text' },
      { key: 'TRIMESTRE_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE', label: 'Trimestre 1ra Prueba VIH', type: 'text' },
      { key: 'FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE', label: 'Fecha 2da Prueba VIH', type: 'date' },
      { key: 'RESULTADO_SEGUNDO_TAMIZAJE_PRUEBA_DE_VIH', label: 'Resultado 2da Prueba VIH', type: 'text' },
      { key: 'TRIMESTRE_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE', label: 'Trimestre 2da Prueba VIH', type: 'text' },
      { key: 'FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE', label: 'Fecha 3ra Prueba VIH', type: 'date' },
      { key: 'RESULTADO_TERCER_TAMIZAJE_PRUEBA_DE_VIH', label: 'Resultado 3ra Prueba VIH', type: 'text' },
      { key: 'TRIMESTRE_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE', label: 'Trimestre 3ra Prueba VIH', type: 'text' },
      { key: 'FECHA_TOMA_SEGUNDA_PRUEBA_VIH', label: 'Fecha 2da Prueba VIH (seguimiento)', type: 'date' },
      { key: 'RESULTADO_TOMA_SEGUNDA_PRUEBA_VIH', label: 'Resultado 2da Prueba VIH (seguimiento)', type: 'text' },
      { key: 'TRIMESTRE_TOMA_SEGUNDA_PRUEBA_VIH', label: 'Trimestre 2da Prueba VIH (seguimiento)', type: 'text' },
      { key: 'FECHA_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO', label: 'Fecha Prueba Confirmatoria', type: 'date' },
      { key: 'TRIMESTRE_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO', label: 'Trimestre Prueba Confirmatoria', type: 'text' },
    ],
  },
  {
    titulo: 'Tamizajes Sifilis',
    icono: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    fields: [
      { key: 'FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Fecha 1ra Prueba Sifilis', type: 'date' },
      { key: 'RESULTADO_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Resultado 1ra Prueba Sifilis', type: 'text' },
      { key: 'TRIMESTRE_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Trimestre 1ra Prueba Sifilis', type: 'text' },
      { key: 'FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Fecha 2da Prueba Sifilis', type: 'date' },
      { key: 'RESULTADO_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Resultado 2da Prueba Sifilis', type: 'text' },
      { key: 'TRIMESTRE_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Trimestre 2da Prueba Sifilis', type: 'text' },
      { key: 'FECHA_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Fecha 3ra Prueba Sifilis', type: 'date' },
      { key: 'RESULTADO_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Resultado 3ra Prueba Sifilis', type: 'text' },
      { key: 'TRIMESTRE_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Trimestre 3ra Prueba Sifilis', type: 'text' },
      { key: 'FECHA_DE_DIAGNOSTICO_DE_SIFILIS', label: 'Fecha Diagnostico Sifilis', type: 'date' },
      { key: 'TRATAMIENTO_INSTAURADO', label: 'Tratamiento instaurado', type: 'text' },
      { key: 'FECHA_DE_INICIO_DEL_TRATAMIENTO', label: 'Fecha Inicio Tratamiento', type: 'date' },
      { key: 'FECHA_DE_SEGUNDA_DOSIS_DEL_TRATAMIENTO', label: 'Fecha 2da Dosis Tratamiento', type: 'date' },
      { key: 'FECHA_DE_TERCERA_DOSIS_DEL_TRATAMIENTO', label: 'Fecha 3ra Dosis Tratamiento', type: 'date' },
    ],
  },
  {
    titulo: 'Laboratorios',
    icono: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    fields: [
      { key: 'FECHA_DE_TOMA_DE_UROCULTIVO', label: 'Fecha Urocultivo', type: 'date' },
      { key: 'RESULTADO_UROCULTIVO', label: 'Resultado Urocultivo', type: 'text' },
      { key: 'FECHA_TOMA_GLICEMIA', label: 'Fecha Glicemia', type: 'date' },
      { key: 'RESULTADO_GLICEMIA', label: 'Resultado Glicemia', type: 'text' },
      { key: 'FECHA_PRUEBA_DE_TOLERANCIA_ORAL_GLUCOSA', label: 'Fecha Tolerancia Oral Glucosa', type: 'date' },
      { key: 'RESULTADO_PRUEBA_DE_TOLERANCIA_ORAL_GLUCOSA', label: 'Resultado Tolerancia Oral Glucosa', type: 'text' },
      { key: 'FECHA_1RA_REALIZACION_HEMOGLOBINA', label: 'Fecha 1ra Hemoglobina', type: 'date' },
      { key: 'RESULTADO_1RA_HEMOGLOBINA', label: 'Resultado 1ra Hemoglobina', type: 'text' },
      { key: 'FECHA_2DA_REALIZACION_HEMOGLOBINA', label: 'Fecha 2da Hemoglobina', type: 'date' },
      { key: 'RESULTADO_2DA_HEMOGLOBINA', label: 'Resultado 2da Hemoglobina', type: 'text' },
      { key: 'FECHA_3RA_REALIZACION_HEMOGLOBINA', label: 'Fecha 3ra Hemoglobina', type: 'date' },
      { key: 'RESULTADO_3RA_HEMOGLOBINA', label: 'Resultado 3ra Hemoglobina', type: 'text' },
      { key: 'RESULTADO_REALIZACION_HEMOCLASIFICACION_FACTOR_RH', label: 'Resultado Hemoclasificacion (Factor RH)', type: 'text' },
      { key: 'FECHA_DE_ANTIGENO_SUPERFICIE_HEPATITIS_B', label: 'Fecha Antigeno Hepatitis B', type: 'date' },
      { key: 'RESULTADO_ANTIGENO_SUPERFICIE_HEPATITIS_B', label: 'Resultado Antigeno Hepatitis B', type: 'text' },
      { key: 'FECHA_TAMIZAJE_TOXOPLASMA', label: 'Fecha Tamizaje Toxoplasma', type: 'date' },
      { key: 'RESULTADO_TOXOPLASMA', label: 'Resultado Toxoplasma', type: 'text' },
      { key: 'FECHA_CITOLOGIA_CERVICOUTERINA', label: 'Fecha Citologia Cervicouterina', type: 'date' },
      { key: 'RESULTADO_TAMIZAJE_DE_CUELLO_UTERINO', label: 'Resultado Tamizaje Cuello Uterino', type: 'text' },
      { key: 'FECHA_DE_LA_PRUEBA_DE_RUBEOLA', label: 'Fecha Prueba Rubeola', type: 'date' },
      { key: 'RESULTADO_RUBEOLA', label: 'Resultado Rubeola', type: 'text' },
      { key: 'FECHA_PRUEBA_DE_TAMIZAJE_PARA_ESTREPTOCOCO_GRUPO_B', label: 'Fecha Estreptococo Grupo B', type: 'date' },
      { key: 'RESULTADO_PRUEBA_DE_TAMIZAJE_PARA_ESTREPTOCOCO_GRUPO_B', label: 'Resultado Estreptococo Grupo B', type: 'text' },
      { key: 'FECHA_TOMA_DE_GOTA_GRUESA_MALARIA', label: 'Fecha Gota Gruesa (Malaria)', type: 'date' },
      { key: 'RESULTADO_GOTA_GRUESA_MALARIA', label: 'Resultado Gota Gruesa', type: 'text' },
      { key: 'FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS', label: 'Fecha Tamizaje Chagas', type: 'date' },
      { key: 'RESULTADO_CHAGAS', label: 'Resultado Chagas', type: 'text' },
    ],
  },
  {
    titulo: 'Vacunacion',
    icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    fields: [
      { key: 'FECHA_DE_APLICACION_INFLUENZA_DESDE_SEMANA_14', label: 'Fecha Influenza', type: 'date' },
      { key: 'FECHA_DE_APLICACION_TOXOIDE_SEGUN_ANTECEDENTE_VACUNAL', label: 'Fecha Toxoides', type: 'date' },
      { key: 'FECHA_DE_APLICACION_DPT_ACELULAR_SEMANA_26', label: 'Fecha DPT acelular', type: 'date' },
      { key: 'FECHA_DE_APLICACION_COVID_19_1_EN_LA_GESTACION', label: 'Fecha COVID-19', type: 'date' },
      { key: 'FECHA_DE_APLICACION_VSR_SEMANA_28___36', label: 'Fecha VSR', type: 'date' },
      { key: 'FECHA_CONSULTA_ODONTOLOGICA', label: 'Fecha Consulta Odontologica', type: 'date' },
    ],
  },
  {
    titulo: 'Ecografias',
    icono: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    fields: [
      { key: 'ECOGRAFIA_OBSTETRICA_CON_TRANSLUCENCIA_NUCAL_106___136', label: 'Ecografia translucencia nucal (10-13 sem)', type: 'date' },
      { key: 'ECOGRAFIA_OBSTETRICA_PARA_LA_DETECCION_DE_ANOMALIAS_ESTRUCTURALES_18___23', label: 'Ecografia anomalias (18-23 sem)', type: 'date' },
      { key: 'OTRAS_ECOGRAFIAS', label: 'Otras ecografias', type: 'text' },
    ],
  },
  {
    titulo: 'Suplementacion y tratamiento',
    icono: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    fields: [
      { key: 'FECHA_SUMINISTRO_ACIDO_FOLICO', label: 'Fecha Acido Folico', type: 'date' },
      { key: 'FECHA_SUMINISTRO_CALCIO_SEMANA_14', label: 'Fecha Calcio (sem 14)', type: 'date' },
      { key: 'FECHA_SUMINISTRO_HIERRO', label: 'Fecha Hierro', type: 'date' },
      { key: 'TIPO_DE_TRATAMIENTO_SUMINITRADO_PARA_ANEMIA', label: 'Tipo tratamiento anemia', type: 'text' },
      { key: 'RELACION_ENTRE_ANEMIA_VS_TRATAMIENTO', label: 'Relacion Anemia vs Tratamiento', type: 'text' },
      { key: 'CONDICION_DEL_SUMINISTRO_DEL_ASA', label: 'Condicion suministro ASA', type: 'text' },
      { key: 'FECHA_DE_SUMINISTRO', label: 'Fecha suministro', type: 'date' },
      { key: 'FECHA_DESPARASITACION_ANTIHELMINTICA_II_Y_III_TRIMESTRE_ALBENDAZO_400_MG_DOSIS_UNICA', label: 'Fecha Desparasitacion II/III Trim', type: 'date' },
    ],
  },
  {
    titulo: 'Controles prenatales',
    icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    fields: [
      { key: 'FECHA_1ER_CONTROL', label: 'Fecha 1er Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL', label: 'Quien realizo 1er Control', type: 'text' },
      { key: 'FECHA_2DO_CONTROL', label: 'Fecha 2do Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_2', label: 'Quien realizo 2do Control', type: 'text' },
      { key: 'FECHA_3ER_CONTROL', label: 'Fecha 3er Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_3', label: 'Quien realizo 3er Control', type: 'text' },
      { key: 'FECHA_4TO_CONTROL', label: 'Fecha 4to Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_4', label: 'Quien realizo 4to Control', type: 'text' },
      { key: 'FECHA_5TO_CONTROL', label: 'Fecha 5to Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_5', label: 'Quien realizo 5to Control', type: 'text' },
      { key: 'FECHA_6TO_CONTROL', label: 'Fecha 6to Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_6', label: 'Quien realizo 6to Control', type: 'text' },
      { key: 'FECHA_7MO_CONTROL', label: 'Fecha 7mo Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_7', label: 'Quien realizo 7mo Control', type: 'text' },
      { key: 'FECHA_8VO_CONTROL', label: 'Fecha 8vo Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_8', label: 'Quien realizo 8vo Control', type: 'text' },
      { key: 'FECHA_9NO_CONTROL', label: 'Fecha 9no Control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_9', label: 'Quien realizo 9no Control', type: 'text' },
      { key: 'NUMERO_TOTAL_DE_CONTROLES_PRENATALES', label: 'Num. total controles', type: 'text' },
      { key: 'ULTIMO_CONTROL_PRENATAL', label: 'Ultimo Control Prenatal', type: 'text' },
    ],
  },
  {
    titulo: 'Estado actual',
    icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    fields: [
      { key: 'EDAD_GESTACIONAL_ACTUAL', label: 'Edad gestacional actual', type: 'text' },
      { key: 'PESO_ACTUAL', label: 'Peso actual', type: 'text' },
      { key: 'TALLA_ACTUAL', label: 'Talla actual', type: 'text' },
      { key: 'IMC_ACTUAL', label: 'IMC actual', type: 'text' },
      { key: 'CLASIFICACION_DEL_IMC_ACTUAL', label: 'Clasificacion IMC actual', type: 'text' },
      { key: 'TA_ACTUAL', label: 'TA actual', type: 'text' },
      { key: 'ALTURA_UTERINA', label: 'Altura uterina', type: 'text' },
      { key: 'FCF', label: 'FCF', type: 'text' },
    ],
  },
  {
    titulo: 'Consultas especializadas',
    icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    fields: [
      { key: 'FECHA_PRIMERA_CONSULTA_GINECOLOGIA', label: 'Fecha 1ra Ginecologia', type: 'date' },
      { key: 'FECHA_SEGUNDA_CONSULTA_GINECOLOGIA', label: 'Fecha 2da Ginecologia', type: 'date' },
      { key: 'FECHA_TERCERA_CONSULTA_GINECOLOGIA', label: 'Fecha 3ra Ginecologia', type: 'date' },
      { key: 'FECHA_CONSULTA_NUTRICION', label: 'Fecha Nutricion', type: 'date' },
      { key: 'FECHA_CONSULTA_PSICOLOGIA', label: 'Fecha Psicologia', type: 'date' },
      { key: 'FECHA_DE_ATENCION_OTRO_ESPECIALISTA', label: 'Fecha Otro Especialista', type: 'date' },
      { key: 'QUIEN_REALIZO_LA_CONSULTA', label: 'Quien realizo la consulta', type: 'text' },
    ],
  },
  {
    titulo: 'Parto y complicaciones',
    icono: 'M13 10V3L4 14h7v7l9-11h-7z',
    fields: [
      { key: 'TIPO', label: 'Tipo', type: 'text' },
      { key: 'FECHA_DE_ABORTO', label: 'Fecha Aborto', type: 'date' },
      { key: 'SEMANAS_DE_GESTACION', label: 'Semanas de Gestacion', type: 'text' },
      { key: 'COMPLICACIONES', label: 'Complicaciones', type: 'text' },
      { key: 'FECHA_DE_PARTO', label: 'Fecha Parto', type: 'date' },
      { key: 'CARACTERISTICAS_DEL_PARTO', label: 'Caracteristicas del parto', type: 'text' },
      { key: 'PARTO_ATENDIDO_POR', label: 'Parto atendido por', type: 'text' },
      { key: 'NO_SEMANAS_DE_GESTACION', label: 'No. Semanas de gestacion', type: 'text' },
      { key: 'MULTIPLICIDAD_DEL_EMBARAZO', label: 'Multiplicidad del embarazo', type: 'text' },
      { key: 'COMPLICACIONES_DURANTE_EL_PARTO', label: 'Complicaciones durante parto', type: 'text' },
      { key: 'TIPO_COMPLICACION', label: 'Tipo Complicacion', type: 'text' },
      { key: 'UCI_MATERNA', label: 'UCI Materna', type: 'text' },
      { key: 'TOMA_DE_PRUEBAS_ITS_INTRAPARTO', label: 'Toma pruebas ITS intraparto', type: 'text' },
      { key: 'RESULTADO_POSITIVO', label: 'Resultado Positivo', type: 'text' },
      { key: 'FECHA', label: 'Fecha', type: 'date' },
      { key: 'CAUSA_DE_LA_DEFUNCION', label: 'Causa de la defuncion', type: 'text' },
    ],
  },
  {
    titulo: 'Planificacion y observaciones',
    icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    fields: [
      { key: 'TIPO', label: 'Tipo', type: 'text' },
      { key: 'FECHA', label: 'Fecha', type: 'date' },
      { key: 'RENUENTE_A_PLANIFICACION_FAMILIAR', label: 'Renuente Planificacion', type: 'text' },
      { key: 'OBSERVACIONES_GENERALES', label: 'Observaciones Generales', type: 'textarea' },
    ],
  },
]

export default function GestanteForm({ mode = 'create', initialData = {}, onSave, onClose, ipsList = [] }) {
  const [form, setForm] = useState({})
  const [ipsOptions, setIpsOptions] = useState(ipsList)
  const [loadingIps, setLoadingIps] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    if (mode === 'edit' && initialData && Object.keys(initialData).length > 0) {
      const cleaned = {}
      for (const [k, v] of Object.entries(initialData)) {
        if (k === '_key' || k === 'id' || k === 'created_at' || k === '_from_gestantes') continue
        let val = v
        if (val !== null && val !== undefined) {
          val = String(val).trim()
          if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(val)) val = val.split(' ')[0]
          if (val === 'None' || val === 'null') val = ''
        } else { val = '' }
        cleaned[k] = val
      }
      setForm(cleaned)
    } else {
      setForm({
        TIPO_DE_DOCUMENTO_DE_IDENTIDAD: 'CC',
        NO_DE_IDENTIFICACION: '',
        APELLIDO_1: '',
        APELLIDO_2: '',
        NOMBRE_1: '',
        NOMBRE_2: '',
        FECHA_DE_NACIMIENTO: '',
        EDAD_ANOS: '',
        SEXO: 'Femenino',
        REGIMEN_AFILIACION: '',
        PERTENECIA_ETNICA: '',
        GRUPO_POBLACIONAL: 'Mujer Embarazada',
        DEPARTAMENTO_RESIDENCIA: '',
        MUNICIPIO_DE_RESIDENCIA: '',
        ZONA: '',
        ETNIA: '',
        ASENTAMIENTO_RANCHERIA_COMUNIDAD: '',
        TELEFONO_USUARIA: '',
        DIRECCION: '',
        NIVEL_EDUCATIVO: '',
        DISCAPACIDAD: '',
        MUJER_CABEZA_DE_HOGAR: '',
        OCUPACION: '',
        ESTADO_CIVIL: '',
        CONTROL_TRADICIONAL: '',
        GESTANTE_RENUENTE: '',
        INASISTENTE: '',
        NOMBRE_DE_LA_IPS_PRIMARIA: '',
        FECHA_DE_DIAGNOSTICO_DEL_EMBARAZO: '',
        FECHA_DE_INGRESO_AL_CONTROL_PRENATAL: '',
        FUM: '',
        FPP: '',
      })
    }
  }, [mode, initialData])

  useEffect(() => {
    if (ipsList && ipsList.length > 0) {
      setIpsOptions(ipsList)
      setLoadingIps(false)
    } else {
      setLoadingIps(true)
      fetchIps()
        .then((data) => setIpsOptions(data.ips || []))
        .catch(() => {})
        .finally(() => setLoadingIps(false))
    }
  }, [ipsList])

  const handleChange = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.NO_DE_IDENTIFICACION) {
      setError('El numero de documento es obligatorio')
      return
    }
    if (!form.APELLIDO_1) {
      setError('El primer apellido es obligatorio')
      return
    }
    if (!form.NOMBRE_1) {
      setError('El primer nombre es obligatorio')
      return
    }
    if (!form.NOMBRE_DE_LA_IPS_PRIMARIA) {
      setError('La IPS Primaria es obligatoria')
      return
    }
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await onSave(form)
      setMsg(mode === 'create' ? 'Registro creado correctamente' : 'Registro actualizado correctamente')
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const sanitizeVal = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v).trim()
    if (!s) return ''
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(s)) return s.split(' ')[0]
    return s
  }

  const renderField = (fieldDef) => {
    const val = sanitizeVal(form[fieldDef.key])

    if (fieldDef.type === 'ips-dropdown') {
      return (
        <div key={fieldDef.key}>
          <label className="form-label text-xs">
            {fieldDef.label}
            {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={val}
            onChange={(e) => handleChange(fieldDef.key, e.target.value)}
            className="input text-sm"
            disabled={loadingIps}
          >
            <option value="">{loadingIps ? 'Cargando IPS...' : 'Seleccionar IPS'}</option>
            {val && !ipsOptions.includes(val) && (
              <option key={val} value={val}>{val}</option>
            )}
            {ipsOptions.map((ips) => (
              <option key={ips} value={ips}>{ips}</option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldDef.type === 'select') {
      return (
        <div key={fieldDef.key}>
          <label className="form-label text-xs">
            {fieldDef.label}
            {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={val}
            onChange={(e) => handleChange(fieldDef.key, e.target.value)}
            className="input text-sm"
          >
            <option value="">Seleccionar</option>
            {fieldDef.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldDef.type === 'textarea') {
      return (
        <div key={fieldDef.key} className="sm:col-span-2 md:col-span-3">
          <label className="form-label text-xs">
            {fieldDef.label}
            {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={val}
            onChange={(e) => handleChange(fieldDef.key, e.target.value)}
            className="input text-sm"
            rows={3}
          />
        </div>
      )
    }

    if (fieldDef.type === 'date') {
      return (
        <div key={fieldDef.key}>
          <label className="form-label text-xs">
            {fieldDef.label}
            {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            value={val}
            onChange={(e) => handleChange(fieldDef.key, e.target.value)}
            className="input text-sm"
          />
        </div>
      )
    }

    return (
      <div key={fieldDef.key}>
        <label className="form-label text-xs">
          {fieldDef.label}
          {fieldDef.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          value={val}
          onChange={(e) => handleChange(fieldDef.key, e.target.value)}
          className="input text-sm"
        />
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--green-50)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--green-500)', color: '#fff' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {mode === 'create'
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
              </svg>
            </div>
            <div>
              <div className="text-base font-semibold" style={{ color: 'var(--green-800)' }}>
                {mode === 'create' ? 'Nueva gestante' : 'Editar gestante'}
              </div>
              <div className="text-xs" style={{ color: 'var(--green-600)' }}>
                {mode === 'create'
                  ? 'Completa los campos para registrar una nueva gestante'
                  : `${form.NO_DE_IDENTIFICACION || ''} — ${form.APELLIDO_1 || ''} ${form.APELLIDO_2 || ''} ${form.NOMBRE_1 || ''} ${form.NOMBRE_2 || ''}`}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.color = '#B91C1C'; e.currentTarget.style.borderColor = '#FECACA' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Cerrar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Errores / Mensajes */}
        {error && (
          <div className="mx-5 mt-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}
        {msg && (
          <div className="mx-5 mt-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2" style={{ color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {msg}
          </div>
        )}

        {/* Navegacion de secciones */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {SECCIONES.map((sec, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSection(i)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeSection === i ? 'var(--green-500)' : 'transparent',
                  color: activeSection === i ? '#fff' : 'var(--text-secondary)',
                  border: activeSection === i ? '1px solid var(--green-500)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => { if (activeSection !== i) { e.currentTarget.style.backgroundColor = 'var(--green-50)'; e.currentTarget.style.color = 'var(--green-700)' } }}
                onMouseLeave={(e) => { if (activeSection !== i) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={sec.icono} /></svg>
                {sec.titulo}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-5 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Campos */}
        <div className="px-5 py-4" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SECCIONES[activeSection].fields.map((fieldDef) => renderField(fieldDef))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
          {/* Mensajes inline cerca del boton */}
          {error && (
            <div className="mb-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ color: '#B91C1C', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}
          {msg && (
            <div className="mb-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {msg}
            </div>
          )}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SECCIONES.map((_, i) => (
              <button key={i} type="button" onClick={() => setActiveSection(i)}
                className="rounded-full transition-all"
                style={{
                  width: activeSection === i ? '20px' : '8px', height: '8px',
                  backgroundColor: activeSection === i ? 'var(--green-500)' : 'var(--border-subtle)',
                }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              Cancelar
            </button>
            {activeSection > 0 && (
              <button type="button" onClick={() => setActiveSection(activeSection - 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: 'var(--green-700)', border: '1px solid var(--green-200)', backgroundColor: 'var(--green-50)' }}>
                &larr; Anterior
              </button>
            )}
            {activeSection < SECCIONES.length - 1 && (
              <button type="button" onClick={() => setActiveSection(activeSection + 1)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: '#fff', backgroundColor: 'var(--green-500)', border: '1px solid var(--green-500)' }}>
                Siguiente &rarr;
              </button>
            )}
            <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-semibold" disabled={saving}
              style={{ color: '#fff', backgroundColor: saving ? 'var(--text-muted)' : 'var(--green-600)', border: '1px solid var(--green-600)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {saving ? (
                <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Guardando...</>
              ) : mode === 'create' ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Guardar registro</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Actualizar registro</>
              )}
            </button>
          </div>
          </div>
        </div>
      </form>
    </div>
  )
}
