# Base de Datos de Gestantes — Estructura y lógica para IA

## Propósito
Este documento describe la hoja **BD**, que constituye la estructura principal de la base de datos de gestantes.

La IA debe usar este documento como referencia para:
- interpretar columnas y secciones;
- mapear datos de entrada a campos;
- validar estructuras;
- identificar campos calculados;
- diseñar procesos de importación/exportación;
- construir consultas, APIs, formularios o validaciones sin perder la estructura original.

## Secciones principales
La hoja BD organiza la información en bloques funcionales:

1. **Datos personales**
2. **Adecuación sociocultural**
3. **Valoración inicial del riesgo**
4. **Actividades básicas de control prenatal**
5. **Patologías durante la gestación**
6. **Gestión del riesgo en salud — equipo departamental**
7. **Criterios de morbilidad materna extrema**
8. **Aborto**
9. **Parto / desenlace del embarazo**
10. **Datos del recién nacido**
11. **Otros campos administrativos y de seguimiento**

## Estructura de columnas

| Columna | Sección | Campo principal | Subcampo / opción |
|---:|---|---|---|
| 1 | 1. DATOS PERSONALES | Consecutivo |  |
| 2 |  | Tipo de documento de identidad |  |
| 3 |  | No. De Identificación |  |
| 4 |  | Apellido_1, |  |
| 5 |  | Apellido_2 |  |
| 6 |  | Nombre_1 |  |
| 7 |  | Nombre_2 |  |
| 8 |  | Fecha de Nacimiento |  |
| 9 |  | Edad (años) |  |
| 10 |  | Sexo |  |
| 11 |  | Regimen Afiliacion |  |
| 12 |  | Pertenecia Etnica |  |
| 13 |  | Grupo Poblacional |  |
| 14 |  | Departamento Residencia |  |
| 15 |  | Municipio de Residencia |  |
| 16 |  | zona |  |
| 17 |  | Etnia |  |
| 18 |  | Asentamiento/Rancheria/Comunidad |  |
| 19 |  | Teléfono usuaria |  |
| 20 |  | Dirección |  |
| 21 |  | Nivel Educativo |  |
| 22 |  | Discapacidad |  |
| 23 |  | Mujer cabeza de Hogar |  |
| 24 |  | Ocupación |  |
| 25 |  | Estado Civil |  |
| 26 | 2. ADECUACION SOCIOCULTURAL | Control  Tradicional |  |
| 27 |  | Gestante Renuente |  |
| 28 |  | Inasistente |  |
| 29 | 3. VALORACION INICIAL DEL RIESGO | Nombre de la IPS Primaria |  |
| 30 |  | Fecha de Ingreso al Control Prenatal |  |
| 31 |  | FUM |  |
| 32 |  | FPP |  |
| 33 |  | Dias para el parto |  |
| 34 |  | Alarma |  |
| 35 |  | Edad Gest Inicio Control |  |
| 36 |  | Trimestre inicio control |  |
| 37 |  | Fórmula obstétrica | G |
| 38 |  |  | P |
| 39 |  |  | C |
| 40 |  |  | A |
| 41 |  |  | M |
| 42 |  |  | V |
| 43 |  | Antecedentes Personales | Hipertensión arterial |
| 44 |  |  | Diabetes |
| 45 |  |  | VIH |
| 46 |  |  | Sifilis |
| 47 |  |  | Tuberculosis |
| 48 |  |  | Otras condiciones medicas graves |
| 49 |  |  | Si la respuesta anterior es SI describa la otra condición médica grave |
| 50 |  | Antecedentes de eventos obstétricos
desfavorables |  |
| 51 |  | Periodo Intergenésico |  |
| 52 |  | Peso |  |
| 53 |  | Talla (metros) |  |
| 54 |  | Indice de Masa Corporal (IMC) |  |
| 55 |  | Clasificación del IMC |  |
| 56 |  | Riesgos psicosociales | Apoyo familiar |
| 57 |  |  | Embarazo deseado |
| 58 |  |  | Hábitos de riesgo |
| 59 |  |  | Ha sido victima de violencia fisica o psicologica |
| 60 |  |  | Ha sido victima de abuso sexual |
| 61 |  |  | Se Identifican Causales Para IVE? |
| 62 |  | Clasificación del riesgo |  |
| 63 |  | Causas de Alto Riesgo |  |
| 64 |  | Remitida a especialista? |  |
| 65 |  | Describa cual(es) especialistas la han atendido |  |
| 66 | 4. ACTIVIDADES BASICAS DE CONTROL PRENATAL | Pruebas de Tamizaje (Trimestre de realización) | Asesoria Prueba VIH |
| 67 |  |  | Trimestre Asesoria VIH |
| 68 |  |  | Fecha Toma Prueba VIH Primer Tamizaje |
| 69 |  |  | Trimestre Toma Prueba VIH Primer Tamizaje |
| 70 |  |  | Fecha Toma Prueba VIH Segundo Tamizaje |
| 71 |  |  | Trimestre Toma  Prueba VIH Segundo Tamizaje |
| 72 |  |  | Fecha Toma Prueba VIH Tercer Tamizaje |
| 73 |  |  | Trimestre Toma Prueba VIH Tercer Tamizaje |
| 74 |  |  | Fecha Primera Prueba Treponemica Rapida Sifilis |
| 75 |  |  | Trimestre Primera Prueba Treponemica Rapida Sifilis |
| 76 |  |  | Fecha Segunda Prueba Treponemica Rapida Sifilis |
| 77 |  |  | Trimestre Segunda Prueba Treponemica Rapida Sifilis |
| 78 |  |  | Fecha Tercera Prueba Treponemica Rapida Sifilis |
| 79 |  |  | Trimestre Tercera Prueba Treponemica Rapida Sifilis |
| 80 |  |  | Fecha de la realizacion Antigeno Superficie Hepatitis B |
| 81 |  |  | Resultado Antigeno Superficie Hepatitis B |
| 82 |  |  | Fecha de la realización de la prueba de IGG para Rubeola, Mujeres no vacunadas previamente |
| 83 |  |  | Fecha Tamizaje Toxoplasma |
| 84 |  |  | Resultado Toxoplasma |
| 85 |  |  | Fecha de Tamizaje para CA Cuello Uterino (Citologia Cervicouterina), Según Esquema |
| 86 |  |  | Fecha de Toma de Urocultivo y Antibiograma |
| 87 |  |  | Fecha Toma Glicemia |
| 88 |  |  | Fecha Realizacion Hemograma Inicial |
| 89 |  |  | Fecha Realizacion Segundo Hemograma (Semana 28) |
| 90 |  |  | Fecha Realizacion Hemoclasificación |
| 91 |  |  | Fecha Realizacion de Prueba de Tamizaje para Estreptococo Grupo B (Semanas 35 - 37) |
| 92 |  |  | Fecha Realizacion de Prueba de Tolerancia Oral Glucosa (Semanas 24 - 28) |
| 93 |  |  | Fecha Toma de Gota Gruesa (Malaria) |
| 94 |  |  | Fecha de Realización Tamizaje Chagas |
| 95 |  | Pruebas Confirmatorias para VIH y Sífilis Gestacional | Toma Segunda Prueba VIH |
| 96 |  |  | Trimestre Toma segunda Prueba VIH |
| 97 |  |  | Prueba confirmatoria Según Algoritmo |
| 98 |  |  | Trimestre Prueba confirmatoria Según Algoritmo |
| 99 |  |  | FTA ABS |
| 100 |  |  | Trimestre FTA ABS |
| 101 |  | Vacunacion | FECHA DE APLICACIÓN INFLUENZA (Desde Semana 14) |
| 102 |  |  | FECHA DE APLICACIÓN TOXOIDE Según Antecedente Vacunal |
| 103 |  |  | FECHA DE APLICACIÓN DPT ACELULAR (Semana 26) |
| 104 |  | Ecografia obstétrica | Primera (10 - 13) |
| 105 |  |  | Segunda |
| 106 |  |  | Ecografia Obstetrica para la detección de anomalias estructurales (18 - 23) |
| 107 |  |  | Otras ecografías? |
| 108 |  | Suministro Micronutrientes | Fecha suministro Acido Folico |
| 109 |  |  | Fecha suministro Calcio (Semana 14) |
| 110 |  |  | Fecha suministro Hierro |
| 111 |  | Fecha Desparasitación Antihelmintica II y III Trimestre (Albendazo 400 Mg Dosis Unica) |  |
| 112 |  | Información en Salud |  |
| 113 |  | Fecha Consulta odontológica |  |
| 114 |  | ATENCION DEL CONTROL PRENATAL: Escriba en la primera columna la fecha del CPN y en la segunda quien realizó el CPN: Md (Médico); Enf (Enfermera); GO (Ginecoobstetra); Otro: Quién? | Fecha 1er Control |
| 115 |  |  | Quien Realizó el Control |
| 116 |  |  | Fecha 2do Control |
| 117 |  |  | Quien Realizó el Control |
| 118 |  |  | Fecha 3er Control |
| 119 |  |  | Quien Realizó el Control |
| 120 |  |  | Fecha 4to Control |
| 121 |  |  | Quien Realizó el Control |
| 122 |  |  | Fecha 5to Control |
| 123 |  |  | Quien Realizó el Control |
| 124 |  |  | Fecha 6to Control |
| 125 |  |  | Quien Realizó el Control |
| 126 |  |  | Fecha 7mo Control |
| 127 |  |  | Quien Realizó el Control |
| 128 |  |  | fecha 8vo Control |
| 129 |  |  | Quien Realizó el Control |
| 130 |  |  | Fecha 9no Control |
| 131 |  |  | Quien Realizó el Control |
| 132 |  |  | Fecha Otros Controles Prenatales |
| 133 |  |  | Quien Realizó el Control |
| 134 |  | ATENCIÓN ESPECIALIZADA: Escriba la(s) fecha(s) (DD/MM/AA) de consultas realizadas por especialistas | Fecha Primera Consulta Ginecología |
| 135 |  |  | Fecha Segunda Consulta Ginecología |
| 136 |  |  | Fecha Tercera Consulta Ginecología |
| 137 |  |  | Fecha Consulta Nutrición |
| 138 |  |  | Fecha Consulta Psicología |
| 139 |  |  | Fecha de Atención Otro Especialista |
| 140 |  |  | Quien Realizó la Consulta |
| 141 | 5. PATOLOGIAS DURANTE LA GESTACION | Hipertensión inducida por el embarazo | 1.Trim |
| 142 |  |  | 2.Trim |
| 143 |  |  | 3.Trim |
| 144 |  | Sangrado vaginal | 1. Trim |
| 145 |  |  | 2. Trim |
| 146 |  |  | 3. Trim |
| 147 |  | Infeccion urinaria | 1. Trim |
| 148 |  |  | 2. Trim |
| 149 |  |  | 3. Trim |
| 150 |  | VIH | 1. Trim |
| 151 |  |  | 2. Trim |
| 152 |  |  | 3. Trim |
| 153 |  | Sifilis | 1. Trim |
| 154 |  |  | 2. Trim |
| 155 |  |  | 3. Trim |
| 156 |  | Hepatitis B | 1. Trim |
| 157 |  |  | 2. Trim |
| 158 |  |  | 3. Trim |
| 159 |  | Otras Patologías (Descripción y Fecha) |  |
| 160 | 6. GESTIÓN DEL RIESGO EN SALUD EQUIPO DEPARTAMENTAL | Priorizada para seguimiento especial |  |
| 161 |  | Estrategias y acciones de gestión de riesgo en salud | Notificación a la IPS |
| 162 |  |  | Remisión |
| 163 |  |  | Visita domiciliara |
| 164 |  |  | Acompañamiento durante CPN, imágenes dx y examenes de laboratorio |
| 165 |  |  | Casa de Paso |
| 166 |  |  | Apoyo para transporte |
| 167 |  |  | Activación de red de apoyo comunitaria |
| 168 |  |  | Coordinación de estrategias con SDSM |
| 169 |  |  | Observaciones |
| 170 | 7. CRITERIOS DE MORBILIDAD MATERNA EXTREMA | Criterio 1,: Relacionados con signos y síntomas de enfermedad específica | Tipo de evento |
| 171 |  |  | Fecha |
| 172 |  | Criterio 2: Relacionados con falla o disfunción orgánica | Tipo de evento |
| 173 |  |  | Fecha |
| 174 |  | Criterio 3: Relacionados con el manejo instaurado a la paciente: | Tipo de evento |
| 175 |  |  | Fecha |
| 176 |  | Causa principal de la MME |  |
| 177 |  | Nombre del funcionario al que se le asignó el caso |  |
| 178 |  | Se concertó plan de mejora con la IPS |  |
| 179 |  | Evaluación y seguimiento al plan de mejora |  |
| 180 | 8. ABORTO | Tipo |  |
| 181 |  | Fecha |  |
| 182 |  | Semanas de Gestación |  |
| 183 |  | Complicaciones |  |
| 184 | 9. PARTO | Fecha de Parto |  |
| 185 |  | Caracteristicas del parto |  |
| 186 |  | Parto atendido por |  |
| 187 |  | No. Semanas de gestación |  |
| 188 |  | Complicaciones durante el parto |  |
| 189 |  | Tipo Complicación |  |
| 190 |  | UCI  Materna |  |
| 191 |  | Toma de pruebas ITS intraparto |  |
| 192 |  | Resultado POSITIVO |  |
| 193 | 10. DEFUNCION | Fecha |  |
| 194 |  | Causa de la defunción |  |
| 195 | 11. RECIÉN NACIDO | Multiplicidad del embarazo |  |
| 196 |  | Recien Nacido 1, | Registro Civil |
| 197 |  |  | Nombre |
| 198 |  |  | Sexo |
| 199 |  |  | Peso al nacer (grs) |
| 200 |  |  | Condición del Recién Nacido |
| 201 |  |  | Toma TSH |
| 202 |  |  | Toma Hemoclasificación |
| 203 |  |  | Dx. Hipotiroidismo |
| 204 |  |  | TTO Hipotiroidismo |
| 205 |  |  | Tiempo   de  lectura |
| 206 |  |  | UCI Neonatal |
| 207 |  |  | Vacunación con BCG |
| 208 |  |  | Vacunación Antihepatitis B |
| 209 |  | Recien Nacido 2 | Registro Civil |
| 210 |  |  | Nombre |
| 211 |  |  | Sexo |
| 212 |  |  | Peso al nacer |
| 213 |  |  | Condición del Recién Nacido |
| 214 |  |  | Toma TSH |
| 215 |  |  | Toma Hemoclasificación |
| 216 |  |  | Dx. Hipotiroidismo |
| 217 |  |  | Tiempo   de  lectura |
| 218 |  |  | TTO Hipotiroidismo |
| 219 |  |  | Vacunación con BCG |
| 220 |  |  | Vacunación Antihepatitis B |
| 221 | 12. PLANIFICACION FAMILIAR | TIPO |  |
| 222 |  | OBSEVACIONES |  |
| 223 |  | FECHA |  |

## Lógica calculada identificada
La hoja contiene fórmulas que calculan automáticamente información derivada. Entre ellas se encuentran:

- `I4`: `=IF(H4="","",DATEDIF(H4,TODAY(),"Y"))`
- `AF4`: `=IF(AND(AE4=""),"",AE4+280)`
- `AG4`: `=IF(AND(AF4=""),"",AF4-TODAY())`
- `AH4`: `=IF(AND(AG4=""),"",IF(AND(AG4<0),"Nacido",IF(AND(AG4>=0,AG4<=7),"Semana de parto",IF(AND(AG4>=8,AG4<=28),"Menos 4 sem",IF(AG4>=29,"Pendiente")))))`
- `AJ4`: `=IF(AND(AI4="No Asistio"),"Sin Control", IF(AND(AI4>=1,AI4<13),"1 Trim",IF(AND(AI4>=13,AI4<=26),"2 Trim",IF(AND(AI4>=27),"3 Trim",""))))`
- `BB4`: `=IF(AND(AZ4=""),"",IF(AND(BA4=""),"",AZ4/(BA4)^2))`
- `BC4`: `=IF(AND(BB4=""),"",IF(AND(BB4<18.5),"Bajo peso",IF(AND(BB4>=18.5,BB4<=24.9),"Peso normal",IF(AND(BB4>=25,BB4<=29.9),"Sobrepeso",IF(AND(BB4>=30,BB4<=34.9),"Obesidad grado 1",IF(AND(BB4>=35,BB4<=39.9),"Obesidad grado 2",IF(AND(BB4>39.9),"Obesidad grado 3")))))))`
- `BO4`: `=IF(AND((DATEDIF(AE4,BN4,"D")/7)>=1,(DATEDIF(AE4,BN4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BN4,"D")/7)>=13,(DATEDIF(AE4,BN4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BN4,"D")/7)>=27),"3 Trim","")))`
- `BQ4`: `=IF(AND((DATEDIF(AE4,BP4,"D")/7)>=1,(DATEDIF(AE4,BP4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BP4,"D")/7)>=13,(DATEDIF(AE4,BP4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BP4,"D")/7)>=27),"3 Trim","")))`
- `BS4`: `=IF(AND((DATEDIF(AE4,BR4,"D")/7)>=1,(DATEDIF(AE4,BR4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BR4,"D")/7)>=13,(DATEDIF(AE4,BR4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BR4,"D")/7)>=27),"3 Trim","")))`
- `BU4`: `=IF(AND((DATEDIF(AE4,BT4,"D")/7)>=1,(DATEDIF(AE4,BT4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BT4,"D")/7)>=13,(DATEDIF(AE4,BT4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BT4,"D")/7)>=27),"3 Trim","")))`
- `BW4`: `=IF(AND((DATEDIF(AE4,BV4,"D")/7)>=1,(DATEDIF(AE4,BV4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BV4,"D")/7)>=13,(DATEDIF(AE4,BV4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BV4,"D")/7)>=27),"3 Trim","")))`
- `BY4`: `=IF(AND((DATEDIF(AE4,BX4,"D")/7)>=1,(DATEDIF(AE4,BX4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BX4,"D")/7)>=13,(DATEDIF(AE4,BX4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BX4,"D")/7)>=27),"3 Trim","")))`
- `CA4`: `=IF(AND((DATEDIF(AE4,BZ4,"D")/7)>=1,(DATEDIF(AE4,BZ4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,BZ4,"D")/7)>=13,(DATEDIF(AE4,BZ4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,BZ4,"D")/7)>=27),"3 Trim","")))`
- `CR4`: `=IF(AND((DATEDIF(AE4,CQ4,"D")/7)>=1,(DATEDIF(AE4,CQ4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,CQ4,"D")/7)>=13,(DATEDIF(AE4,CQ4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,CQ4,"D")/7)>=27),"3 Trim","")))`
- `CT4`: `=IF(AND((DATEDIF(AE4,CS4,"D")/7)>=1,(DATEDIF(AE4,CS4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,CS4,"D")/7)>=13,(DATEDIF(AE4,CS4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,CS4,"D")/7)>=27),"3 Trim","")))`
- `CV4`: `=IF(AND((DATEDIF(AE4,CU4,"D")/7)>=1,(DATEDIF(AE4,CU4,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE4,CU4,"D")/7)>=13,(DATEDIF(AE4,CU4,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE4,CU4,"D")/7)>=27),"3 Trim","")))`
- `AF5`: `=IF(AND(AE5=""),"",AE5+280)`
- `AG5`: `=IF(AND(AF5=""),"",AF5-TODAY())`
- `AH5`: `=IF(AND(AG5=""),"",IF(AND(AG5<0),"Nacido",IF(AND(AG5>=0,AG5<=7),"Semana de parto",IF(AND(AG5>=8,AG5<=28),"Menos 4 sem",IF(AG5>=29,"Pendiente")))))`
- `AJ5`: `=IF(AND(AI5="No Asistio"),"Sin Control", IF(AND(AI5>=1,AI5<13),"1 Trim",IF(AND(AI5>=13,AI5<=26),"2 Trim",IF(AND(AI5>=27),"3 Trim",""))))`
- `BB5`: `=IF(AND(AZ5=""),"",IF(AND(BA5=""),"",AZ5/(BA5)^2))`
- `BC5`: `=IF(AND(BB5=""),"",IF(AND(BB5<18.5),"Bajo peso",IF(AND(BB5>=18.5,BB5<=24.9),"Peso normal",IF(AND(BB5>=25,BB5<=29.9),"Sobrepeso",IF(AND(BB5>=30,BB5<=34.9),"Obesidad grado 1",IF(AND(BB5>=35,BB5<=39.9),"Obesidad grado 2",IF(AND(BB5>39.9),"Obesidad grado 3")))))))`
- `BO5`: `=IF(AND((DATEDIF(AE5,BN5,"D")/7)>=1,(DATEDIF(AE5,BN5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BN5,"D")/7)>=13,(DATEDIF(AE5,BN5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BN5,"D")/7)>=27),"3 Trim","")))`
- `BQ5`: `=IF(AND((DATEDIF(AE5,BP5,"D")/7)>=1,(DATEDIF(AE5,BP5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BP5,"D")/7)>=13,(DATEDIF(AE5,BP5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BP5,"D")/7)>=27),"3 Trim","")))`
- `BS5`: `=IF(AND((DATEDIF(AE5,BR5,"D")/7)>=1,(DATEDIF(AE5,BR5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BR5,"D")/7)>=13,(DATEDIF(AE5,BR5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BR5,"D")/7)>=27),"3 Trim","")))`
- `BU5`: `=IF(AND((DATEDIF(AE5,BT5,"D")/7)>=1,(DATEDIF(AE5,BT5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BT5,"D")/7)>=13,(DATEDIF(AE5,BT5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BT5,"D")/7)>=27),"3 Trim","")))`
- `BW5`: `=IF(AND((DATEDIF(AE5,BV5,"D")/7)>=1,(DATEDIF(AE5,BV5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BV5,"D")/7)>=13,(DATEDIF(AE5,BV5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BV5,"D")/7)>=27),"3 Trim","")))`
- `BY5`: `=IF(AND((DATEDIF(AE5,BX5,"D")/7)>=1,(DATEDIF(AE5,BX5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BX5,"D")/7)>=13,(DATEDIF(AE5,BX5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BX5,"D")/7)>=27),"3 Trim","")))`
- `CA5`: `=IF(AND((DATEDIF(AE5,BZ5,"D")/7)>=1,(DATEDIF(AE5,BZ5,"D")/7)<13),"1 Trim",IF(AND((DATEDIF(AE5,BZ5,"D")/7)>=13,(DATEDIF(AE5,BZ5,"D")/7)<=26),"2 Trim",IF(AND((DATEDIF(AE5,BZ5,"D")/7)>=27),"3 Trim","")))`

### Cálculos relevantes
- **Edad:** se calcula a partir de la fecha de nacimiento.
- **Fecha probable de parto:** se obtiene sumando aproximadamente 280 días a la FUM.
- **Días restantes para parto:** se calcula comparando la fecha probable de parto con la fecha actual.
- **Estado de proximidad al parto:** clasifica registros como nacido, semana de parto, menos de 4 semanas o pendiente.
- **Trimestre de gestación:** se clasifica según las semanas de gestación.
- **IMC:** se calcula utilizando peso y talla.
- **Clasificación nutricional:** bajo peso, peso normal, sobrepeso y grados de obesidad.
- **Riesgo obstétrico:** el formato contempla categorías como bajo riesgo y alto riesgo obstétrico.
- **Trimestre de pruebas/actividades:** varias columnas calculan el trimestre a partir de la fecha de realización y la FUM.

## Reglas para la IA
1. Mantener exactamente la relación entre nombre de columna y dato.
2. No desplazar datos entre columnas.
3. Diferenciar campos de entrada manual de campos calculados por fórmula.
4. No sobrescribir campos calculados salvo que el usuario lo solicite explícitamente.
5. Al importar información, validar tipos de datos, especialmente fechas, números, opciones cerradas y valores booleanos.
6. Los campos de identificación deben conservarse sin alteraciones.
7. Los campos clínicos no deben interpretarse como diagnóstico médico adicional: la IA debe limitarse a los datos registrados y a las reglas explícitas del formato.
8. Si una columna contiene opciones como Sí/No, usar únicamente las opciones admitidas por el formato cuando estén definidas.
9. Para análisis estadístico, excluir campos calculados duplicados o auxiliares cuando corresponda.
10. Si se construye una base SQL/API a partir de esta hoja, conservar trazabilidad entre el nombre original de Excel y el nombre técnico utilizado en la aplicación.
11. La información de gestantes y recién nacidos debe manejarse como información sensible y con controles de acceso apropiados.
12. Antes de eliminar, combinar o transformar registros, identificar claramente qué columnas y registros serán afectados.

## Nota técnica
La hoja BD tiene una estructura horizontal muy amplia, con más de 200 columnas. Para una aplicación de software, conviene considerar una estructura relacional normalizada y utilizar la hoja Excel como formato de interoperabilidad/importación, manteniendo un diccionario de datos que permita reconstruir el formato original cuando sea necesario.
