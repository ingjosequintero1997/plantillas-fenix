import React, { useState, useEffect } from 'react'
import { fetchIps } from '../api'

const SECCIONES = [
  {
    titulo: 'Datos personales',
    icono: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    fields: [
      { key: 'TIPO_DE_DOCUMENTO_DE_IDENTIDAD', label: 'Tipo de documento', type: 'select', options: ['CC', 'TI', 'RC', 'PT', 'CE', 'PA', 'MS', 'AS', 'CD'], required: true },
      { key: 'NO_DE_IDENTIFICACION', label: 'No. de identificacion', type: 'text', required: true },
      { key: 'APELLIDO_1', label: 'Primer apellido', type: 'text', required: true },
      { key: 'APELLIDO_2', label: 'Segundo apellido', type: 'text' },
      { key: 'NOMBRE_1', label: 'Primer nombre', type: 'text', required: true },
      { key: 'NOMBRE_2', label: 'Segundo nombre', type: 'text' },
      { key: 'FECHA_DE_NACIMIENTO', label: 'Fecha de nacimiento', type: 'date' },
      { key: 'EDAD', label: 'Edad', type: 'text' },
      { key: 'SEXO', label: 'Sexo', type: 'select', options: ['FEMENINO', 'MASCULINO'] },
    ],
  },
  {
    titulo: 'Afiliacion y residencia',
    icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    fields: [
      { key: 'REGIMEN_DE_AFILIACION', label: 'Regimen de afiliacion', type: 'select', options: ['S', 'C'] },
      { key: 'PERTENECIA_ETNICA', label: 'Pertenencia etnica', type: 'select', options: ['Indigena', 'ROM (Gitano)', 'Raizal del Archipielago', 'Negro (a), Mulato, Afroamericano', 'Mestizo', 'Ningunas de las Anteriores'] },
      { key: 'GRUPO_POBLACIONAL', label: 'Grupo poblacional', type: 'text' },
      { key: 'DEPARTAMENTO_DE_RESIDENCIA', label: 'Departamento', type: 'text' },
      { key: 'MUNICIPIO_DE_RESIDENCIA', label: 'Municipio', type: 'text' },
      { key: 'ZONA', label: 'Zona', type: 'select', options: ['Rural', 'Urbana'] },
      { key: 'ETNIA', label: 'Etnia', type: 'select', options: ['NA', 'Wayuu', 'Arhuaco', 'Wiwa', 'Yukpa', 'Kogi', 'Inga', 'Kankuamo', 'Chimila', 'Zenu'] },
      { key: 'ASENTAMIENTO_RANCHERIA_COMUNIDAD', label: 'Asentamiento/Rancheria/Comunidad', type: 'text' },
      { key: 'TELEFONO_USUARIA', label: 'Telefono', type: 'text' },
      { key: 'DIRECCION', label: 'Direccion', type: 'text' },
      { key: 'NIVEL_EDUCATIVO', label: 'Nivel educativo', type: 'select', options: ['Analfabeta', 'Sabe Leer o Escribir', 'Primaria Completa', 'Primaria Incompleta', 'Secundaria Completa', 'Secundaria Incompleta', 'Tecnico', 'Tecnologo', 'Profesional Universitario'] },
      { key: 'DISCAPACIDAD', label: 'Discapacidad', type: 'select', options: ['Discapacidad fisica', 'Discapacidad Psiquica', 'Discapacidad mental', 'Ninguna', 'Sin dato'] },
      { key: 'MUJER_CABEZA_DE_HOGAR', label: 'Mujer cabeza de hogar', type: 'select', options: ['Si', 'No'] },
      { key: 'OCUPACION', label: 'Ocupacion', type: 'text' },
      { key: 'ESTADO_CIVIL', label: 'Estado civil', type: 'select', options: ['Soltera', 'Casada', 'Divorciada', 'Viuda', 'Union Libre'] },
    ],
  },
  {
    titulo: 'Control prenatal',
    icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    fields: [
      { key: 'CONTROL_TRADICIONAL', label: 'Control tradicional', type: 'select', options: ['Si', 'No'] },
      { key: 'GESTANTE_RENUENTE', label: 'Gestante renuente', type: 'select', options: ['Si', 'No'] },
      { key: 'INASISTENTE', label: 'Inasistente', type: 'select', options: ['Si', 'No'] },
      { key: 'NOMBRE_DE_LA_IPS_PRIMARIA', label: 'IPS Primaria', type: 'ips-dropdown', required: true },
      { key: 'FECHA_DE_DIAGNOSTICO', label: 'Fecha diagnostico embarazo', type: 'date' },
      { key: 'FECHA_DE_INGRESO_AL_CONTROL_PRENATAL', label: 'Fecha ingreso control prenatal', type: 'date' },
      { key: 'FUM', label: 'FUM', type: 'date' },
      { key: 'FPP', label: 'FPP', type: 'text' },
      { key: 'DIAS_PARA_EL_PARTO', label: 'Dias para el parto', type: 'text' },
      { key: 'ALARMA', label: 'Alarma', type: 'text' },
      { key: 'EDAD_GEST_INICIO_CONTROL', label: 'Edad gestacional inicio control', type: 'text' },
      { key: 'TRIMESTRE_INICIO_CONTROL', label: 'Trimestre inicio control', type: 'text' },
    ],
  },
  {
    titulo: 'Antecedentes obstetricos',
    icono: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    fields: [
      { key: 'G', label: 'G (Gestaciones)', type: 'text' },
      { key: 'P', label: 'P (Partos)', type: 'text' },
      { key: 'C', label: 'C (Cesareas)', type: 'text' },
      { key: 'A', label: 'A (Abortos)', type: 'text' },
      { key: 'M', label: 'M (Hijos muertos)', type: 'text' },
      { key: 'V', label: 'V (Hijos vivos)', type: 'text' },
      { key: 'HIPERTENSION_ARTERIAL', label: 'Hipertension arterial', type: 'select', options: ['Si', 'No'] },
      { key: 'DIABETES', label: 'Diabetes', type: 'select', options: ['Si', 'No'] },
      { key: 'VIH', label: 'VIH', type: 'select', options: ['Si', 'No'] },
      { key: 'SIFILIS', label: 'Sifilis', type: 'select', options: ['Si', 'No'] },
      { key: 'TUBERCULOSIS', label: 'Tuberculosis', type: 'select', options: ['Si', 'No'] },
      { key: 'OTRAS_CONDICIONES_MEDICAS_GRAVES', label: 'Otras condiciones medicas graves', type: 'select', options: ['Si', 'No'] },
      { key: 'SI_LA_RESPUESTA_ANTERIOR_ES_SI_DESCRIBA_LA_OTRA_CONDICION_MEDICA_GRAVE', label: 'Descripcion otra condicion', type: 'text' },
      { key: 'ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES', label: 'Antecedentes eventos obstetricos desfavorables', type: 'select', options: ['Prematurez', 'Malformados', 'Placenta previa', 'Polihidramnios', 'Muerte Fetal o neonatal', 'Bajo peso al nacer', 'Ninguno'] },
      { key: 'PERIODO_INTERGENESICO', label: 'Periodo intergenesico', type: 'select', options: ['Ninguno', '<12 meses', '12 a 24 meses', '25 a 48 meses', '49 y mas'] },
      { key: 'PESO', label: 'Peso inicial (kg)', type: 'text' },
      { key: 'TALLA_METROS', label: 'Talla (metros)', type: 'text' },
      { key: 'INDICE_DE_MASA_CORPORAL_IMC', label: 'IMC', type: 'text' },
      { key: 'CLASIFICACION_DE_IMC', label: 'Clasificacion IMC', type: 'text' },
      { key: 'APOYO_FAMILIAR', label: 'Apoyo familiar', type: 'text' },
      { key: 'EMBARAZO_DESEADO', label: 'Embarazo deseado', type: 'text' },
      { key: 'HABITOS_DE_RIESGO', label: 'Habitos de riesgo', type: 'text' },
    ],
  },
  {
    titulo: 'Clasificacion y riesgos',
    icono: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    fields: [
      { key: 'CLASIFICACION_DEL_RIESGO', label: 'Clasificacion del riesgo', type: 'select', options: ['Alto riesgo obstetrico', 'Bajo riesgo obstetrico'] },
      { key: 'CAUSAS_DE_ALTO_RIESGO', label: 'Causas de alto riesgo', type: 'text' },
      { key: 'REMITIDA_A_ESPECIALISTA', label: 'Remitida a especialista', type: 'select', options: ['NA', 'Si', 'No'] },
      { key: 'DESCRIBA_CUAL_ES_ESPECIALISTAS_LA_HAN_ATENDIDO', label: 'Especialistas que la han atendido', type: 'text' },
    ],
  },
  {
    titulo: 'Tamizajes VIH/Sifilis',
    icono: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    fields: [
      { key: 'ASESORIA_PRUEBA_VIH', label: 'Fecha asesoria VIH', type: 'date' },
      { key: 'TRIMESTRE_ASESORIA_VIH', label: 'Trimestre asesoria VIH', type: 'text' },
      { key: 'FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE', label: 'Fecha 1ra prueba VIH', type: 'date' },
      { key: 'RESULTADO_PRIMER_TAMIZAJE_PRUEBA_DE_VIH', label: 'Resultado 1ra prueba VIH', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE', label: 'Fecha 2da prueba VIH', type: 'date' },
      { key: 'RESULTADO_SEGUNDO_TAMIZAJE_PRUEBA_DE_VIH', label: 'Resultado 2da prueba VIH', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE', label: 'Fecha 3ra prueba VIH', type: 'date' },
      { key: 'RESULTADO_TERCER_TAMIZAJE_PRUEBA_DE_VIH', label: 'Resultado 3ra prueba VIH', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Fecha 1ra prueba Sifilis', type: 'date' },
      { key: 'RESULTADO_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Resultado 1ra prueba Sifilis', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Fecha 2da prueba Sifilis', type: 'date' },
      { key: 'RESULTADO_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS', label: 'Resultado 2da prueba Sifilis', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_DE_DIAGNOSTICO_DE_SIFILIS', label: 'Fecha diagnostico Sifilis', type: 'date' },
      { key: 'TRATAMIENTO_INSTAURADO', label: 'Tratamiento instaurado', type: 'text' },
    ],
  },
  {
    titulo: 'Laboratorios',
    icono: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    fields: [
      { key: 'FECHA_TOMA_GLICEMIA', label: 'Fecha toma glicemia', type: 'date' },
      { key: 'RESULTADO_GLICEMIA', label: 'Resultado glicemia', type: 'text' },
      { key: 'FECHA_REALIZACION_HEMOGRAMA_INICIAL', label: 'Fecha hemograma inicial', type: 'date' },
      { key: 'RESULTADO_HEMOGRAMA_INICIAL', label: 'Resultado hemograma inicial', type: 'text' },
      { key: 'FECHA_REALIZACION_SEGUNDO_HEMOGRAMA_SEMANA_28', label: 'Fecha 2do hemograma', type: 'date' },
      { key: 'RESULTADO_SEGUNDO_HEMOGRAMA_SEMANA_28', label: 'Resultado 2do hemograma', type: 'text' },
      { key: 'FECHA_DE_TOMA_DE_UROCULTIVO_Y_ANTIBIOGRAMA', label: 'Fecha urocultivo', type: 'date' },
      { key: 'RESULTADO_UROCULTIVO', label: 'Resultado urocultivo', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_TAMIZAJE_TOXOPLASMA', label: 'Fecha tamizaje toxoplasma', type: 'date' },
      { key: 'RESULTADO_TOXOPLASMA', label: 'Resultado toxoplasma', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_DE_LA_REALIZACION_ANTIGENO_SUPERFICIE_HEPATITIS_B', label: 'Fecha antigeno Hepatitis B', type: 'date' },
      { key: 'RESULTADO_ANTIGENO_SUPERFICIE_HEPATITIS_B', label: 'Resultado antigeno Hepatitis B', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_DE_LA_REALIZACION_PRUEBA_IGG_RUBEOLA', label: 'Fecha prueba Rubeola', type: 'date' },
      { key: 'RESULTADO_RUBEOLA', label: 'Resultado Rubeola', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_TOMA_DE_GOTA_GRUESA_MALARIA', label: 'Fecha gota gruesa', type: 'date' },
      { key: 'RESULTADO_GOTA_GRUESA_MALARIA', label: 'Resultado gota gruesa', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
      { key: 'FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS', label: 'Fecha tamizaje Chagas', type: 'date' },
      { key: 'RESULTADO_CHAGAS', label: 'Resultado Chagas', type: 'select', options: ['NA', 'POSITIVO', 'NEGATIVO'] },
    ],
  },
  {
    titulo: 'Vacunacion',
    icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    fields: [
      { key: 'FECHA_DE_APLICACION_INFLUENZA_DESDE_SEMANA_14', label: 'Fecha Influenza', type: 'date' },
      { key: 'FECHA_DE_APLICACION_TOXOIDE_SEGUN_ANTECEDENTE_VACUNAL', label: 'Fecha Toxoides', type: 'date' },
      { key: 'FECHA_DE_APLICACION_DPT_ACELULAR_SEMANA_26', label: 'Fecha DPT acelular', type: 'date' },
    ],
  },
  {
    titulo: 'Controles prenatales',
    icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    fields: [
      { key: 'FECHA_1ER_CONTROL', label: 'Fecha 1er control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL', label: 'Quien realizo 1er control', type: 'select', options: ['Medico Ginecologia', 'Aux de Enfermeria', 'Enfermera (o)', 'Control Tradicional (obligatorio)'] },
      { key: 'FECHA_2DO_CONTROL', label: 'Fecha 2do control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_2', label: 'Quien realizo 2do control', type: 'select', options: ['Medico Ginecologia', 'Aux de Enfermeria', 'Enfermera (o)', 'Control Tradicional (obligatorio)'] },
      { key: 'FECHA_3ER_CONTROL', label: 'Fecha 3er control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_3', label: 'Quien realizo 3er control', type: 'select', options: ['Medico Ginecologia', 'Aux de Enfermeria', 'Enfermera (o)', 'Control Tradicional (obligatorio)'] },
      { key: 'FECHA_4TO_CONTROL', label: 'Fecha 4to control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_4', label: 'Quien realizo 4to control', type: 'select', options: ['Medico Ginecologia', 'Aux de Enfermeria', 'Enfermera (o)', 'Control Tradicional (obligatorio)'] },
      { key: 'FECHA_5TO_CONTROL', label: 'Fecha 5to control', type: 'date' },
      { key: 'QUIEN_REALIZO_EL_CONTROL_5', label: 'Quien realizo 5to control', type: 'select', options: ['Medico Ginecologia', 'Aux de Enfermeria', 'Enfermera (o)', 'Control Tradicional (obligatorio)'] },
      { key: 'NUMERO_TOTAL_DE_CONTROLES_PRENATALES', label: 'Num. total controles', type: 'text' },
      { key: 'ULTIMO_CONTROL_PRENATAL', label: 'Ultimo control prenatal', type: 'text' },
      { key: 'EDAD_GESTACIONAL_ACTUAL', label: 'Edad gestacional actual', type: 'text' },
      { key: 'PESO_ACTUAL', label: 'Peso actual', type: 'text' },
      { key: 'TALLA_ACTUAL', label: 'Talla actual', type: 'text' },
      { key: 'IMC', label: 'IMC actual', type: 'text' },
      { key: 'TA_ACTUAL', label: 'TA actual', type: 'text' },
    ],
  },
  {
    titulo: 'Consultas especializadas',
    icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    fields: [
      { key: 'FECHA_PRIMERA_CONSULTA_GINECOLOGIA', label: 'Fecha 1ra consulta ginecologia', type: 'date' },
      { key: 'FECHA_SEGUNDA_CONSULTA_GINECOLOGIA', label: 'Fecha 2da consulta ginecologia', type: 'date' },
      { key: 'FECHA_TERCERA_CONSULTA_GINECOLOGIA', label: 'Fecha 3ra consulta ginecologia', type: 'date' },
      { key: 'FECHA_CONSULTA_NUTRICION', label: 'Fecha consulta nutricion', type: 'date' },
      { key: 'FECHA_CONSULTA_PSICOLOGIA', label: 'Fecha consulta psicologia', type: 'date' },
      { key: 'FECHA_DE_ATENCION_OTRO_ESPECIALISTA', label: 'Fecha otro especialista', type: 'date' },
      { key: 'FECHA_CONSULTA_ODONTOLOGICA', label: 'Fecha consulta odontologica', type: 'date' },
    ],
  },
  {
    titulo: 'Parto y complicaciones',
    icono: 'M13 10V3L4 14h7v7l9-11h-7z',
    fields: [
      { key: 'FECHA_DE_ABORTO', label: 'Fecha de aborto', type: 'date' },
      { key: 'SEMANAS_DE_GESTACION', label: 'Semanas de gestacion', type: 'text' },
      { key: 'COMPLICACIONES', label: 'Complicaciones', type: 'select', options: ['NA', 'Si', 'No'] },
      { key: 'FECHA_DE_PARTO', label: 'Fecha de parto', type: 'date' },
      { key: 'CARACTERISTICAS_DEL_PARTO', label: 'Caracteristicas del parto', type: 'select', options: ['NA', 'Parto Vaginal', 'Cesarea'] },
      { key: 'PARTO_ATENDIDO_POR', label: 'Parto atendido por', type: 'select', options: ['NA', 'IPS baja complejidad', 'IPS mediana o alta', 'Partera', 'Medico Tradicional', 'Otro'] },
      { key: 'NO_SEMANAS_DE_GESTACION', label: 'No. semanas de gestacion', type: 'text' },
      { key: 'MULTIPLICIDAD_DEL_EMBARAZO', label: 'Multiplicidad del embarazo', type: 'select', options: ['NA', 'Simple', 'Doble', 'Triple', 'Cuadruple o mas'] },
      { key: 'COMPLICACIONES_DURANTE_EL_PARTO', label: 'Complicaciones durante parto', type: 'select', options: ['NA', 'Si', 'No'] },
      { key: 'TIPO_COMPLICACION', label: 'Tipo complicacion', type: 'select', options: ['NA', 'Parto prematuro', 'RPM', 'Hemorragia', 'Anomalias del cordon', 'Anomalias de la placenta', 'Sufrimiento fetal', 'Desproporcion C-P', 'Otras'] },
      { key: 'UCI_MATERNA', label: 'UCI Materna', type: 'select', options: ['NA', 'Si', 'No'] },
    ],
  },
  {
    titulo: 'Recien nacido',
    icono: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    fields: [
      { key: 'CONDICION_DEL_RECIEN_NACIDO', label: 'Condicion recien nacido', type: 'text' },
      { key: 'PESO_AL_NACER_GRS', label: 'Peso al nacer (g)', type: 'text' },
      { key: 'VACUNACION_CON_BCG', label: 'Vacunacion BCG', type: 'text' },
      { key: 'VACUNACION_ANTIHEPATITIS_B', label: 'Vacunacion antihepatitis B', type: 'text' },
    ],
  },
  {
    titulo: 'Planificacion y observaciones',
    icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    fields: [
      { key: 'RENUENTE_A_PLANIFICACION_FAMILIAR', label: 'Renuente a planificacion familiar', type: 'select', options: ['NA', 'Si', 'No'] },
      { key: 'CASO_CERRADO', label: 'Caso cerrado', type: 'select', options: ['TRUE', 'FALSE'] },
      { key: 'OBSERVACIONES_GENERALES', label: 'Observaciones generales', type: 'textarea' },
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
      setForm({ ...initialData })
    } else {
      setForm({
        TIPO_DE_DOCUMENTO_DE_IDENTIDAD: 'CC',
        NO_DE_IDENTIFICACION: '',
        APELLIDO_1: '',
        APELLIDO_2: '',
        NOMBRE_1: '',
        NOMBRE_2: '',
        FECHA_DE_NACIMIENTO: '',
        EDAD: '',
        SEXO: 'FEMENINO',
        NOMBRE_DE_LA_IPS_PRIMARIA: '',
        FUM: '',
      })
    }
  }, [mode, initialData])

  useEffect(() => {
    if (ipsList.length > 0) {
      setIpsOptions(ipsList)
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

  const renderField = (fieldDef) => {
    const val = form[fieldDef.key] || ''

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
    <div className="panel fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'create' ? 'Nuevo registro de gestante' : `Editar — ${form.NO_DE_IDENTIFICACION || ''}`}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'create'
                ? 'Completa el formulario para registrar una nueva gestante.'
                : `${form.APELLIDO_1 || ''} ${form.APELLIDO_2 || ''} ${form.NOMBRE_1 || ''} ${form.NOMBRE_2 || ''}`}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
        )}
        {msg && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--success, #27ae60)', backgroundColor: '#E8F8F0' }}>{msg}</div>
        )}

        <div className="flex gap-1 mb-4 overflow-x-auto">
          {SECCIONES.map((sec, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSection(i)}
              className="px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeSection === i ? 'var(--primary)' : 'var(--bg-secondary)',
                color: activeSection === i ? 'white' : 'var(--text)',
              }}
            >
              {sec.titulo}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {SECCIONES[activeSection].fields.map((fieldDef) => renderField(fieldDef))}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Seccion {activeSection + 1} de {SECCIONES.length}
          </div>
          <div className="flex gap-2">
            {activeSection > 0 && (
              <button type="button" onClick={() => setActiveSection(activeSection - 1)} className="btn-ghost text-sm">
                Anterior
              </button>
            )}
            {activeSection < SECCIONES.length - 1 && (
              <button type="button" onClick={() => setActiveSection(activeSection + 1)} className="btn-secondary text-sm">
                Siguiente
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : mode === 'create' ? 'Guardar registro' : 'Actualizar registro'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
