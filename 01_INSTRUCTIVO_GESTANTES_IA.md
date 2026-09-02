# Base de Datos de Gestantes — Instructivo para IA

## Propósito
Este documento describe la estructura y las reglas de diligenciamiento de la hoja **INSTRUCTIVO** del archivo `DGR-PMS-FT-11 FORMATO BASE DE DATOS GESTANTES ACTUALIZADA`.

La IA debe utilizar estas reglas para:
- interpretar correctamente los campos;
- validar datos ingresados;
- detectar valores inválidos;
- explicar al usuario cómo diligenciar cada campo;
- evitar inventar información clínica o administrativa;
- conservar los nombres de campos y opciones definidas por el formato.

## Regla general
Cuando exista una instrucción específica para un campo, esta tiene prioridad sobre inferencias de la IA. Las fechas, identificaciones, opciones cerradas y valores clínicos deben validarse según las reglas del formato.

## Campos y reglas de diligenciamiento

| Nº | Campo | Instrucción |
|---:|---|---|
| 1 | No | Se debe escribir el consecutivo comenzando por el No. 1 |
| 2 | Tipo de documento de identidad | Opciones: CC MS PT TI PA CD AS |
| 3 | No. De Identificación | Ingresar el número de identificación de la gestante |
| 4 | Apellido_1, | Primer Apellido de la Gestante |
| 5 | Apellido_2 | Segundo Apellido de la Gestante, si no cuenta con segundo Apellido  colocar NONE |
| 6 | Nombre_1, | Primer nombre de la Gestante |
| 7 | Nombre_2 | Segundo nombre de la Gestante, si no cuenta con segundo nombre colocar NONE |
| 8 | Fecha de Nacimiento | Se debe escribir la fecha de nacimiento de la siguiente forma:  año/mes/día |
| 9 | Edad (años) | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 10 | Sexo | Femenino |
| 11 | Regimen Afiliacion | Opciones: S C |
| 12 | Pertenecia Etnica | Opciones: Indígena ROM (Gitano) Raizal del Archipielago Negro (a), Mulato, Afroamericano Mestizo Ningunas de las Anteriores |
| 13 | Grupo Poblacional | Mujer Embarazada |
| 14 | Departamento Residencia | Se debe escribir el Dpto. de la Ipsi |
| 15 | Municipio de Residencia | Se debe escrbir el Municipio de la Ipsi |
| 16 | Zona | Opciones: Rural Urbana |
| 17 | Etnia | Opciones:         NA Wayuu Arhuaco Wiwa Yukpa Kogi Inga Kankuamo Chimila Zenu |
| 18 | Asentamiento/Rancheria/Comunidad | Si seleccionó zona rural debe ingresar el nombre del asentamiento |
| 19 | Teléfono usuaria | Ingresar número de telefono fijo o celular de la gestante (OBLIGATORIO) |
| 20 | Direccion | Si seleccionó zona urbana debe ingresar la direccion |
| 21 | Nivel Educativo | Opciones: Analfabeta Sabe Leer o Escribir Primaria Completa Primaria Incompleta Secundaria Completa Secundaria Incompleta Técnico Tecnólogo Profesional Universitario |
| 22 | Discapacidad | Opciones: Discapacidad fisica Discapacidad Psiquica Discapacidad mental Ninguna Sin dato |
| 23 | Mujer cabeza de Hogar | Opciones: Si No |
| 24 | Ocupación | Se debe escribir la Ocupación de la Gestante |
| 25 | Estado Civil | Opciones: Soltera Casada Divorciada Viuda Unión Libre |
| 26 | Control  Tradicional | Opciones: Si No |
| 27 | Gestante Renuente | Opciones: Si No |
| 28 | Inasistente | Opciones: Si No |
| 29 | Nombre de la IPS Primaria | Se debe ingresar el Nombre de la IPS completo sin abreviatura |
| 30 | Fecha de Diagnostico del embarazo | Fecha de diagnostico  al Control Prenatal de la siguiente forma: Año/Mes/ Día (obligatorio) debe ser igual o inferrior a la fecha de ingreso a control prenatal |
| 31 | Fecha de Ingreso al Control Prenatal | Fecha de Ingreso al Control Prenatal de la siguiente forma: Año/Mes/ Día (obligatorio) debe ser posterior a la FUM |
| 32 | FUM | Fecha de la última Mestruación de la siguiente forma: Año/Mes /Día (obligatorio) debe ser inferior a la fecha de ingreso a control prenatal y a lafecha de diagnostico de gestacion |
| 33 | FPP | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 34 | Dias para el parto | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 35 | Alarma | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 36 | Edad Gest Inicio Control | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 37 | Trimestre inicio control | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 38 | G | Se debe ingresar el número de embarazos que ha tenido la gestante contando el actual (obligatorio) NO DEBE SER CERO |
| 39 | P | Se debe ingresar el número de partos Vaginales (obligatorio) debe ser un valor inferior a la variable G |
| 40 | C | Se debe ingresar el número de cesareas (obligatorio)debe ser un valor inferior a la variable G |
| 41 | A | Se debe ingresra el número de Abortos(obligatorio)debe ser un valor inferior a la variable G |
| 42 | M | Se debe ingresar el número de Mortinatos (obligatorio)debe ser un valor inferior a la variable G |
| 43 | V | Se debe ingresar la cantidad de hijos vivos(obligatorio)debe ser un valor inferior a la variable G |
| 44 | Hipertension arterial | Opciones: Si No |
| 45 | Diabetes | Opciones: Si No |
| 46 | VIH | Opciones: Si No |
| 47 | Sifilis | Opciones: Si No |
| 48 | Tuberculosis | Opciones: Si No |
| 49 | Otras condiciones medicas graves | Opciones: Si No |
| 50 | Si la respuesta anterior es  SI describa la otra condición médica grave | Si la respuesta  del campo otras condiciones medicas graves es  SI describa la otra condición médica grave |
| 51 | Antecedentes de eventos obstétricos
desfavorables | Opciones:  Prematurez Malformados Placenta previa Polihidramnios Muerte Fetal o neonatal Bajo peso al nacer Ninguno |
| 52 | Periodo Intergenésico | Opciones:  Ninguno <12 meses 12 a 24 meses 25 a 48 meses 49 y mas |
| 53 | Peso Inicial (kg) | Se debe ingresar el peso inicial de la gestante (obligatorio) |
| 54 | Talla (metros) | Se debe ingresar la talla en metros separado por un punto ejemplo 1.57(obligatorio) |
| 55 | Indice de Masa Corporal (IMC) | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 56 | Clasificación del IMC | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 57 | HISTORIA REPRODUCTVA | Opciones:  debe colocar el valor de la sumatoria del criterio |
| 58 | EMBARAZO ACTUAL | Opciones:  debe colocar el valor de la sumatoria del criterio |
| 59 | RIESGO PSICOSOCIAL | Opciones:  debe colocar el valor de la sumatoria del criterio |
| 60 | PUNTAJE TOTAL | Opciones:  debe colocar el valor de la sumatoria del criterio |
| 61 | Solicita ive IVE? | Opciones: Si No |
| 62 | Clasificación del riesgo obstetrico | Opciones: Alto riesgo obstétrico Bajo riesgo obstétrico |
| 63 | Causas de Alto  Riesgo obstetrico | Opciones:          NA -primigestante adolescente -Embarazo no Deseado -Gestante Añosa -antecedente de preeclampsia -Periodo Intergénesico corto -Incompatibilidad grupo Rh -enfermedad autoimune -embarazo multiple -Multíparidad                                                                                                                                                                                                                                                                                                                                                  -cesarea anterior -enfermedad renal -Antecedentes  de MME -Antecedentes de Malformación Congénita -Sobrepeso, Obesidad -HTA Crónica -Hipertensión Inducida por el Embarazo -Diabetes -VIH -Sífilis -Hepatitis B -enfermedad de chagas -Tuberculosis -Cancer -LES -ERC -Enfermedad Huérfana -Enfermedad Mental -Antecedentes de aborto  -Víctima de Violencia Física o Psicológica -Víctima de Violencia Sexual -Fumadora -Consumo de Alcohol -Consumo de SPA -Antecedente de mortinato |
| 64 | Clacificacion del riesgo de preeclampsia | Opciones: Alto riesgo de Preeclampsia                                                                                                                                                                                                                                                                                                                     Moderado riesgo de preeclamsia Bajo riesgo de Preeclampsia |
| 65 | Causas de Alto  Riesgo de preeclampsia | Opciones:          NA -primigestante adolescente -Embarazo no Deseado -Gestante Añosa -antecedente de preeclampsia -Periodo Intergénesico corto -Incompatibilidad grupo Rh -enfermedad autoimune -embarazo multiple -Multíparidad                                                                                                                                                                                                                                                                                                                                                  -cesarea anterior -enfermedad renal -Antecedentes  de MME -Antecedentes de Malformación Congénita -Sobrepeso, Obesidad -HTA Crónica -Hipertensión Inducida por el Embarazo -Diabetes -VIH -Sífilis -Hepatitis B -enfermedad de chagas -Tuberculosis -Cancer -LES -ERC -Enfermedad Huérfana -Enfermedad Mental -Antecedentes de aborto  -Víctima de Violencia Física o Psicológica -Víctima de Violencia Sexual -Fumadora -Consumo de Alcohol -Consumo de SPA -Antecedente de mortinato |
| 66 | Clacificacion del riesgo tromboembolico | Opciones: Alto riesgo Tromboembolico Bajo riesgo Tromboembolico |
| 67 | Causas de Alto  Riesgo tromboembolico | Opciones:          NA -primigestante adolescente -Embarazo no Deseado -Gestante Añosa -antecedente de preeclampsia -Periodo Intergénesico corto -Incompatibilidad grupo Rh -enfermedad autoimune -embarazo multiple -Multíparidad                                                                                                                                                                                                                                                                                                                                                  -cesarea anterior -enfermedad renal -Antecedentes  de MME -Antecedentes de Malformación Congénita -Sobrepeso, Obesidad -HTA Crónica -Hipertensión Inducida por el Embarazo -Diabetes -VIH -Sífilis -Hepatitis B -enfermedad de chagas -Tuberculosis -Cancer -LES -ERC -Enfermedad Huérfana -Enfermedad Mental -Antecedentes de aborto  -Víctima de Violencia Física o Psicológica -Víctima de Violencia Sexual -Fumadora -Consumo de Alcohol -Consumo de SPA -Antecedente de mortinato |
| 68 | fecha de suministro de tratamiento | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día- de no aplicar ingresar comodin 1800-01-01 |
| 69 | tratamiento Instaurado | NA ingrese el tipo de tratamiento instaurado:                                                                                                                                                                                                                                                                       Medicamentosa (el nombre del medicamento), medias compresivas. |
| 70 | Remitida a especialista? | Opciones:         NA  Si No |
| 71 | Describa cual(es) especialistas la han atendido | NA Ingresar la Especilialidad Médica a la cual fue remitido |
| 72 | Asesoria Prueba VIH | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día de no aplicar ingresar comodin 1800-01-01 |
| 73 | Trimestre Asesoria VIH | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 74 | Fecha Toma Prueba VIH Primer Tamizaje | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 75 | Resultado Primer Tamizaje prueba de VIH | Opciones: NA -Positivo -Negativo |
| 76 | Trimestre Toma Prueba VIH Primer Tamizaje | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 77 | Fecha Toma Prueba VIH Segundo Tamizaje | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 78 | Resultado Segundo Tamizaje Prueba de VIH | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 79 | Trimestre Toma  Prueba VIH Segundo Tamizaje | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 80 | Fecha Toma Prueba VIH Tercer Tamizaje | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 81 | Resultado Tercer Tamizaje Prueba de VIH | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 82 | Trimestre Toma Prueba VIH Tercer Tamizaje | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 83 | Fecha Primera Prueba Treponemica Rapida Sifilis | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 84 | Resultado Primera Prueba Treponemica Rápida Sífilis | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 85 | Trimestre Primera Prueba Treponemica Rapida Sifilis | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 86 | Fecha Segunda Prueba Treponemica Rapida Sifilis | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 87 | Resultado Segunda Prueba Treponemica Rápida Sífilis | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 88 | Trimestre Segunda Prueba Treponemica Rapida Sifilis | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 89 | Fecha Tercera Prueba Treponemica Rapida Sifilis | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 90 | Resultado Tercera Prueba Treponemica Rápida Sífilis | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 91 | Trimestre Tercera Prueba Treponemica Rapida Sifilis | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 92 | Fecha toma Segunda Prueba VIH | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 93 | Resultado Toma Segunda Prueba VIH | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 94 | Trimestre Toma segunda Prueba VIH | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 95 | Fecha prueba confirmatoria Según Algoritmo | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 96 | Trimestre Prueba confirmatoria Según Algoritmo | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 97 | Fecha de diagnóstico de sífilis | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 98 | Tratamiento instaurado | NA                      ingrese el nombre del tratamiento instaurado                                                                                                                                                                                                                                                                                 - |
| 99 | Fecha de inicio del tratamiento | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 100 | Fecha de segunda dosis del tratamiento | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 101 | Fecha de tercera dosis del tratamiento | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 102 | Fecha de Toma de Urocultivo | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día de no aplicar ingresar comodin 1800-01-01 |
| 103 | Resultado Urocultivo | Opciones:                                                                                                                                                                                                                                                                                                                                                        -NA -Positivo -Negativo |
| 104 | Fecha Toma Glicemia | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día de no aplicar ingresar comodin 1800-01-01 |
| 105 | Resultado Glicemia | Opciones:NA- numero entero ejemplo 70,80 |
| 106 | Fecha Prueba de Tolerancia Oral Glucosa | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 107 | Resultado Prueba de Tolerancia Oral Glucosa | Opciones:NA- numero entero ejemplo 70,80 |
| 108 | Fecha 1ra Realizacion Hemoglobina | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 109 | Resultado 1ra Hemoglobina | Opciones:NA- numero entero ejemplo 70,80 |
| 110 | Fecha 2da Realizacion Hemoglobina | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 111 | Resultado 2da Hemoglobina | Opciones:NA- numero entero ejemplo 70,80 |
| 112 | Fecha 3ra Realizacion Hemoglobina | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 113 | Resultado 3ra Hemoglobina | Opciones:NA- numero entero ejemplo 70,80 |
| 114 | Resultado Realizacion Hemoclasificación (Factor RH) | Opciones:NA O+ O- A+ A- AB+ AB- B+ B- |
| 115 | Fecha de Antigeno Superficie  Hepatitis B | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 116 | Resultado Antigeno Superficie Hepatitis B | Opciones:NA -Positivo -Negativo |
| 117 | Fecha Tamizaje Toxoplasma | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 118 | Resultado Toxoplasma | Opciones:NA -Positivo -Negativo |
| 119 | Fecha Citologia Cervicouterina | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 120 | Resultado Tamizaje de cuello uterino | Opciones:                                                                                                                                                                                                                                                                                                                                                          -NA -Positivo -Negativo |
| 121 | Fecha de la prueba de Rubeola | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 122 | Resultado Rubeola | Opciones:NA -Positivo -Negativo |
| 123 | Fecha Prueba de Tamizaje para Estreptococo Grupo B | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 124 | Resultado Prueba de Tamizaje para Estreptococo Grupo B | Opciones:NA -Positivo -Negativo |
| 125 | Fecha Toma de Gota Gruesa (Malaria) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 126 | Resultado Gota gruesa (Malaria) | Opciones:NA -Positivo -Negativo |
| 127 | Fecha de Realización Tamizaje Chagas | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 128 | Resultado Chagas | Opciones:NA -Positivo -Negativo |
| 129 | FECHA DE APLICACIÓN INFLUENZA (Desde Semana 14) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 130 | FECHA DE APLICACIÓN TOXOIDE Según Antecedente Vacunal | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 131 | FECHA DE APLICACIÓN DPT ACELULAR (Semana 26) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 132 | FECHA DE APLICACIÓN COVID-19     (1 En la Gestación) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 133 | FECHA DE APLICACIÓN VSR (Semana 28 - 36) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 134 | FECHA CONSULTA ODONTOLOGICA | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 135 | Ecografia obstétrica con translucencia nucal (10,6 - 13,6) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 136 | Ecografia Obstetrica para la detección de anomalias estructurales (18 - 23) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 137 | Otras ecografías? | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 138 | Fecha suministro Acido Folico | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 139 | Fecha suministro Calcio (Semana 14) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 140 | Fecha suministro Hierro | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 141 | Tipo de tratamiento suminitrado para anemia | opciones : NA                                                                                                                                                                                                                                                                                                                                       1. Hierro oral                                                                                                                                                                                                                                                                                                                                            2.Hierro parenteral                                                                                                                                                                                                                                                                                                                             3. transfusion sanguinea |
| 142 | Relación entre Anemia vs tratamiento | 1. tratamiento para anemia indicado y suministrado.                                                                                                                                                                                                                                                          2. tratamiento para anemia indicado y no suministrado.                                                                                                                                                                                                                                                     3. tratamiento para anemia no indicada ni suministrada.                                                                                                                                                                                                                                                     4. NO requiere tratamiento hemoglobina adecuada |
| 143 | Condicion del suministro del ASA | 1. ASA indicado y suministrado.                                                                                                                                                                                                                                                                                                      2. Asa indicado y no suministrado.                                                                                                                                                                                                                                                                                                 3. ASA no indicada ni suministrada.                                                                                                                                                                                                                                                                                                    4. ASA suministrado sin ser indicado.                                                                                                                                                                                                                                                                                                    5. No requiere ASA |
| 144 | fecha de suministro | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 145 | Fecha Desparasitación Antihelmintica II y III Trimestre (Albendazo 400 Mg Dosis Unica) | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 146 | Fecha 1er Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día- (OBLIGATORIO) |
| 147 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 148 | Fecha 2do Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 149 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 150 | Fecha 3er Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 151 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 152 | Fecha 4to Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 153 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 154 | Fecha 5to Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 155 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 156 | Fecha 6to Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 157 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 158 | Fecha 7mo Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 159 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 160 | fecha 8vo Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 161 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 162 | Fecha 9no Control | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 163 | Quien Realizó el Control | Opciones: Médico                                                                                                                                                                                                                                                                                                                                                  Ginecologia Aux de Enfermeria Enfermera (o) Control Tradicional (obligatorio) |
| 164 | Número Total de Controles Prenatales | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 165 | Ultimo Control Prenatal | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 166 | edad gestacional actual | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 167 | peso actual | Se debe ingresar el peso de la gestante enel ultimo control prenatal  (obligatorio) |
| 168 | talla actual | Se debe ingresar la talla en metros del ultimo control prenatal separado por un punto ejemplo 1.57 (obligatorio) |
| 169 | IMC ACTUAL | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 170 | Clasificación del IMC ACTUAL | Este campo es calculado automaticamente, no se debe modificar la Fómula |
| 171 | TA ACTUAL | Se debe ingresar el valor de la TA del ultimo control prenatal (obligatorio) |
| 172 | ALTURA UTERINA | NA                    Se debe ingresar el valor de la altura uterina del ultimo control prenatal (obligatorio) si es inferior a 12 semanas colocar |
| 173 | FCF | NA                   Se debe ingresar el valor de la FCF del ultimo control prenatal (obligatorio) si es inferior a 12 semanas colocar |
| 174 | Fecha Primera Consulta Ginecología | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 175 | Fecha Segunda Consulta Ginecología | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 176 | Fecha Tercera Consulta Ginecología | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 177 | Fecha Consulta Nutrición | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 178 | Fecha Consulta Psicología | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 179 | Fecha de Atención Otro Especialista | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 180 | Quien Realizó la Consulta | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 181 | Tipo | Opciones:         NA IVE Expontáneo Provocado |
| 182 | Fecha de aborto | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 183 | Semanas de Gestación | NA   Ingrese el número de semanas al momento del aborto de lo contrario colocar |
| 184 | Complicaciones | Opciones:       NA Si No |
| 185 | Fecha de Parto | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 186 | Caracteristicas del parto | Opciones:         NA  Parto Vaginal Cesarea |
| 187 | Parto atendido por | Opciones:                           NA  IPS baja complejidad IPS mediana o alta Partera Medico Tradicional Otro |
| 188 | No. Semanas de gestación | NA                 Digite el número de semanas de gestación |
| 189 | Multiplicidad del embarazo | Opciones:         NA  Simple Doble Triple Cuadruple o más |
| 190 | Complicaciones durante el parto | Opciones:              NA Si No |
| 191 | Tipo Complicación | Opciones:         NA Parto prematuro RPM Hemorragia Anomalías del cordón Anomalías de la placenta Sufrimiento fetal Desproporción C-P Otras |
| 192 | UCI  Materna | Opciones:         NA  Si No |
| 193 | Toma de pruebas ITS intraparto | Opciones:         NA No Sifilis VIH Sífilis y VIH |
| 194 | Resultado POSITIVO | Opciones:         NA Si No |
| 195 | Fecha | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 196 | Causa de la defunción | NA   Ingresa la causa de la defunción |
| 197 | TIPO | Opciones: DIU Inyeccion mensual  Inyeccion trimestral Pildoras  Condon  Pomeroy  Ninguno |
| 198 | FECHA | Ingrese la Fecha de la siguiente Forma: Año/Mes/Día-de no aplicar ingresar comodin 1800-01-01 |
| 199 | RENUENTE A PLANIFICACION FAMILIAR | Opciones:         NA Si No |
| 200 | observaciones generales | Escriba las observaciones |

## Reglas para la IA
1. No modificar el significado de los campos.
2. No crear categorías que no estén contempladas en el archivo.
3. Para campos con opciones cerradas, validar contra las opciones definidas.
4. Para fechas, respetar el formato indicado por el instructivo.
5. Si falta información obligatoria, señalar el campo y explicar qué dato hace falta.
6. Si un dato parece inconsistente, marcarlo como posible inconsistencia; no corregirlo automáticamente sin autorización.
7. Tratar la información como datos sensibles: no exponer innecesariamente información personal de las gestantes.
8. Cuando se solicite una transformación de datos, conservar la correspondencia entre columna, valor y registro.
9. Las fórmulas existentes en el Excel deben considerarse parte de la lógica del sistema cuando se analice la hoja de datos.
10. Si una instrucción del archivo resulta ambigua, pedir confirmación antes de asumir una regla clínica.

## Contexto
La hoja contiene aproximadamente 200 columnas y funciona como guía de diligenciamiento de la base de seguimiento de gestantes, incluyendo identificación, antecedentes, valoración del riesgo, controles prenatales, pruebas, vacunación, patologías, gestión del riesgo, parto y datos del recién nacido.
