# Contexto completo de la aplicación

## 1. Propósito general
Esta aplicación es un validador institucional para cargue masivo de archivos de salud. Su objetivo es recibir archivos TXT delimitados por `|` o archivos Excel (`.xlsx` / `.xls`), mapear sus columnas contra una plantilla oficial, validar cada dato por tipo, autocorregir lo recuperable, registrar la auditoría de cambios y exportar un TXT limpio listo para ser cargado en otro sistema.

La aplicación soporta dos módulos funcionales:

- `rcv`: plantilla de riesgo cardiovascular y seguimiento crónico.
- `gestante`: plantilla de ruta materno perinatal y controles prenatales.

La lógica está pensada para proteger la calidad del dato. Cuando un valor no puede convertirse, el sistema intenta corregirlo. Si no puede, asigna un valor seguro para evitar exportaciones con campos vacíos que rompan sistemas externos.

## 2. Stack tecnológico

### Backend
- FastAPI
- Uvicorn
- Pandas
- OpenPyXL
- Python Dateutil
- RapidFuzz con fallback a Difflib

### Frontend
- React 18
- Vite
- Tailwind CSS
- Fetch/XMLHttpRequest para comunicación con la API

## 3. Estructura real del proyecto

### Raíz
- `README.md`: guía básica de ejecución.
- `test_export.txt`: archivo de prueba usado durante depuración.
- `backend/`: API y lógica de validación.
- `frontend/`: interfaz web.

### Backend
- `backend/main.py`: API FastAPI, carga, normalización inicial, mapeo, revalidación y exportación.
- `backend/validators.py`: núcleo de validación y autocorrección por tipo de dato.
- `backend/utils.py`: normalización de encabezados y fuzzy mapping.
- `backend/template_config.py`: definición de la plantilla RCV.
- `backend/gestante_config.py`: definición de la plantilla Gestante.
- `backend/templates_registry.py`: registro central de plantillas.
- `backend/schema.py`: alias de compatibilidad hacia la plantilla RCV.
- `backend/requirements.txt`: dependencias.
- `backend/__init__.py`: paquete Python.

### Frontend
- `frontend/index.html`: punto de entrada HTML.
- `frontend/package.json`: scripts y dependencias del frontend.
- `frontend/src/main.jsx`: bootstrap de React.
- `frontend/src/App.jsx`: flujo principal de la interfaz.
- `frontend/src/api.js`: llamadas al backend.
- `frontend/src/index.css`: estilos globales.
- `frontend/src/template_list.js`: lista estática antigua de nombres RCV.
- `frontend/src/components/DragDrop.jsx`: carga de archivos.
- `frontend/src/components/MappingEditor.jsx`: editor manual de mapeo.
- `frontend/src/components/DataGridTable.jsx`: vista previa detallada del resultado.
- `frontend/src/components/StatsCard.jsx`: tarjetas de resumen.

## 4. Flujo funcional completo

### 4.1 Selección de módulo
El usuario selecciona una plantilla:
- Plantilla RCV
- Plantilla Gestante

Cada plantilla define:
- orden exacto de columnas,
- nombre de cada variable,
- tipo de dato,
- obligatoriedad,
- catálogo permitido cuando el tipo es `SET`.

### 4.2 Carga de archivo
La UI permite cargar:
- `.txt`
- `.xlsx`
- `.xls`

El componente `DragDrop` acepta carga individual o múltiple.

### 4.3 Envío al backend
El frontend hace `POST /upload` y envía:
- archivo,
- `template_key`,
- `strict_mode`,
- `min_template_coverage`,
- `require_exact_columns`.

### 4.4 Lectura del archivo
En backend:
- Si es TXT, se usa `pd.read_csv(..., sep='|', header=None, dtype=str, keep_default_na=False)`.
- Si es Excel, se usa `pd.read_excel(..., header=None, dtype=str, engine='openpyxl')`.

### 4.5 Detección de encabezado
`detect_header_row()` revisa hasta 30 filas iniciales y calcula qué tan parecida es cada fila a los nombres esperados de la plantilla.

Reglas:
- archivos de 1 o 2 columnas: umbral mínimo de 1 hit,
- archivos de 3 a 5 columnas: umbral de 2 hits,
- archivos más anchos: umbral de 4 hits,
- además valida cobertura mínima según ancho real de la fila.

Si encuentra encabezado válido:
- toma esa fila como headers,
- construye nombres únicos,
- procesa el resto como datos.

Si no encuentra encabezado:
- genera columnas sintéticas `C1`, `C2`, `C3`, etc.

### 4.6 Normalización del DataFrame fuente
`normalize_source_dataframe()` hace:
- copia del DataFrame,
- eliminación de filas completamente vacías,
- preservación de columnas vacías para no desplazar posiciones,
- limpieza de strings por columna,
- recorte de columnas vacías al final,
- eliminación de filas vacías.

### 4.7 Inferencia de mapeo
`infer_mapping()` usa dos rutas:

#### Encabezados genéricos
Si los headers son `C1..Cn`, aplica mapeo posicional directo por índice.

#### Encabezados reales
Usa `fuzzy_map()`.

`fuzzy_map()` hace:
1. normalización textual,
2. coincidencia exacta/canónica primero,
3. fuzzy matching después,
4. asignación uno-a-uno evitando cruces entre columnas.

Esto reduce desplazamientos de variables cuando los encabezados son ambiguos.

### 4.8 Reglas de modo estricto
El backend calcula:
- cobertura de encabezados mapeados,
- cobertura de nombres de plantilla cubiertos,
- cantidad de columnas del archivo frente a plantilla,
- lista de encabezados no mapeados.

Si `strict_mode` está activo, el backend genera advertencias cuando:
- la cobertura de plantilla es inferior al mínimo configurado,
- el número de columnas del archivo no coincide con la plantilla,
- existen encabezados no mapeados.

En el estado actual, estas validaciones quedan como `warning` y no bloquean el procesamiento.

### 4.9 Validación y corrección por fila
`validate_and_correct()` recorre cada fila y cada columna de la plantilla destino.

Para cada variable:
- identifica la columna origen por el mapeo,
- toma el valor original,
- lo convierte según el tipo de dato,
- registra si quedó `ok` o `corrected`.

### 4.10 Exportación
El backend arma un DataFrame corregido con columnas exactamente en el orden de la plantilla y exporta con:
- separador `|`,
- sin encabezados,
- sin índices,
- con relleno de valores vacíos por `SIN DATO` en exportación.

`POST /export` devuelve un `StreamingResponse` con el TXT final.

## 5. Endpoints del backend

### `GET /health`
Devuelve `{"status": "ok"}`.

### `GET /template`
Parámetro: `template_key`.
Devuelve la definición completa de una plantilla.

### `GET /templates`
Devuelve el listado de plantillas con:
- clave,
- etiqueta,
- descripción,
- número de variables.

### `POST /upload`
Recibe archivo y configuración de validación.
Devuelve:
- `mapping_suggested`,
- `mapping`,
- `summary`,
- `logs_sample`,
- `corrected_text`,
- `preview_rows`,
- `raw_text`,
- `template_names`,
- `original_headers`,
- `mapping_stats`,
- `structure_validation`,
- `strict_validation`.

### `POST /revalidate`
Recibe:
- `raw_text`,
- `mapping`,
- `template_key`.

Vuelve a validar usando el mapeo ajustado manualmente en la UI.

### `POST /export`
Recibe:
- `corrected_text`,
- `filename`.

Devuelve el archivo TXT descargable.

## 6. Reglas de normalización y mapeo

### 6.1 Normalización textual
Se hace en dos módulos:
- `backend/utils.py`
- `backend/validators.py`

Operaciones principales:
- trim,
- mayúsculas,
- eliminación de tildes,
- reemplazo de guiones, slashes y signos por espacios,
- compresión de espacios múltiples,
- estandarización de abreviaturas como `1ER`, `2DO`, `NRO`, `NUM.`.

### 6.2 Alias de encabezados
El sistema reconoce variantes de encabezados para campos sensibles, por ejemplo:
- `REGIMEN DE AFILIACION`
- `GRUPO POBLACIONAL`
- `ETNIA`
- `MUNICIPIO DE RESIDENCIA`
- `FACTOR DE RIESGO POR PA`
- `REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM)`

### 6.3 Protección contra cruces de columnas
Primero se intenta coincidencia exacta/canónica. Solo después se aplica fuzzy matching. Esto evita que una columna se asigne a otra parecida pero incorrecta.

## 7. Motor de validación y autocorrección

## 7.1 Tipos de dato soportados
- `TEXT`
- `INT`
- `DECIMAL`
- `DATE`
- `SET`

## 7.2 Reglas por tipo

### TEXT
- Si trae valor: se deja `str(value).strip()`.
- Si está vacío y es requerido: `SIN DATO`.

### INT
Conversión con `to_int_safe()`:
- acepta dígitos simples,
- limpia separadores y texto accidental,
- acepta enteros escritos como decimal (`35.0`, `35,0`),
- en `MUNICIPIO DE RESIDENCIA` usa una conversión especial por alias de municipios.

Si no puede convertir:
- ahora siempre cae en valor seguro: `0`.

### DECIMAL
Conversión con `to_decimal_safe()`:
- soporta coma decimal,
- soporta punto decimal,
- soporta mezcla de miles y decimales,
- limpia caracteres no numéricos.

Si no puede convertir:
- usa `0`.

El formateo final usa `format_decimal()`:
- redondea a máximo 2 decimales,
- elimina ceros sobrantes,
- evita notación científica.

Ejemplos:
- `47.7790880503` -> `47.78`
- `47.70` -> `47.7`
- `47.00` -> `47`

### DATE
Conversión con `to_date_iso()`:
- acepta seriales de Excel,
- acepta `YYYY-MM-DD`,
- acepta `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY/MM/DD`, `MM/DD/YYYY`,
- acepta formatos compactos `ddmmyyyy` y `yyyymmdd`,
- usa parser flexible como último recurso.

Si no puede convertir:
- usa `1900-01-01`.

### SET
Conversión con `normalize_set()`:
- compara contra catálogo permitido,
- acepta alias genéricos `SI/NO/M/F`,
- acepta alias específicos por campo,
- acepta códigos numéricos cuando el catálogo está codificado,
- extrae especialidades para campos `CONTROL REALIZADO POR ...`,
- aplica fuzzy matching cuando es necesario.

Si no puede convertir:
- usa un valor seguro del catálogo, priorizando:
  - `SIN DATO`
  - `NO APLICA`
  - `NORMAL`
  - `NO`
  - o el primer valor permitido

## 7.3 Correcciones específicas implementadas

### Municipios
Hay alias para municipios como:
- RIOHACHA -> 44001
- MAICAO -> 44430
- URIBIA -> 44847
- VALLEDUPAR -> 20001
- y varios más de La Guajira y Cesar.

### Régimen de afiliación
Alias soportados:
- `SUBS`, `SUB`, `SISBEN`, `SISBENIZADO` -> `SUBSIDIADO`
- `CONTRIB`, `COTIZANTE`, `EPS` -> `CONTRIBUTIVO`

### Grupo poblacional
Ejemplos:
- `COMUNIDADES INDIGENAS` -> `OTRO GRUPO POBLACIONAL`
- `VICTIMAS DEL CONFLICTO ARMADO` -> `OTRO GRUPO POBLACIONAL`
- `CABEZA FAMILIA` -> `CABEZA DE FAMILIA`

### Etnia
Ejemplos:
- `WAYU`, `GUAJIRO` -> `WAYUU`
- `IKU` -> `ARHUACO`
- `ARSARIO`, `SANKA` -> `WIWA`
- `KOGUI`, `COGUI` -> `KOGI`
- `ETTE`, `ETTE ENNAKA` -> `CHIMILA`

### Clasificación de HTA
Ejemplos:
- `PRE HTA` -> `NORMAL`
- `PREHIPERTENSION` -> `NORMAL`
- `HIPOTENSION` -> `NORMAL`
- `HTA 1` -> `ESTADIO1`
- `HTA 2` -> `ESTADIO2`
- `HTA 3` -> `ESTADIO3`

### Factor de riesgo por PA
Ejemplos:
- `ALTO`, `RIESGO ALTO`, `PA ALTA` -> `CLASIFICACION DEL RIESGO ALTO`
- `BAJO`, `RIESGO BAJO`, `PA BAJA` -> `CLASIFICACION DEL RIESGO BAJO`

### Control realizado por mes
Para campos `CONTROL REALIZADO POR ENERO`, `... FEBRERO`, etc.:
- si contiene `INTERNISTA` -> `INTERNISTA`
- si contiene `MEDICO` -> `MEDICO GENERAL`
- si contiene `NUTRI` -> `NUTRICIONISTA`
- si contiene `ENFERMER` -> `ENFERMERIA`

### Hemoglobina glicosilada
Para `REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM)`:
- `NO APLICA`, `N/A`, `NA`, `SIN DATO`, `PENDIENTE` -> `0`

## 7.4 Limpieza de valores malformados
Antes de validar se aplica una limpieza de emergencia para convertir valores como:
- `SINDATO` -> `SIN DATO`
- `SINDATOS` -> `SIN DATO`
- `AC` -> `SIN DATO`

## 7.5 Política de valores seguros
La función `safe_default_for_required()` actualmente devuelve:
- `SET` -> `SIN DATO`, `NO APLICA`, `NORMAL`, `NO` o primer valor permitido
- `INT` -> `0`
- `DECIMAL` -> `0`
- `DATE` -> `1900-01-01`
- `TEXT` -> `SIN DATO`

Aunque nació para requeridos, la lógica actual la usa también como fallback general para que el TXT no salga con huecos.

## 8. Auditoría y trazabilidad
Cada cambio se registra en `logs` con:
- fila,
- variable,
- valor original,
- valor corregido,
- estado.

Estados visibles:
- `corrected`
- `error` (aunque en la lógica actual la mayor parte de los casos recuperables terminan corregidos)

La UI permite:
- buscar en auditoría,
- filtrar por estado,
- revisar registro por registro,
- revisar celda por celda.

## 9. Frontend: comportamiento completo

## 9.1 `App.jsx`
Controla todo el estado de la aplicación:
- mapeo actual,
- resumen de calidad,
- logs,
- TXT corregido,
- texto fuente,
- archivo seleccionado,
- resultados de procesamiento masivo,
- plantillas disponibles,
- plantilla activa,
- columnas de plantilla,
- estados de carga y reproceso,
- progreso,
- errores,
- filtros de auditoría,
- métricas de mapeo y estructura,
- modo estricto.

## 9.2 Flujo UI
1. Selección de módulo.
2. Carga de archivo.
3. Revisión de mapeo.
4. Revalidación manual.
5. Vista previa validada.
6. Auditoría de cambios.
7. Exportación TXT final.

## 9.3 Componentes

### `DragDrop.jsx`
- acepta archivos TXT y Excel,
- permite arrastrar o seleccionar,
- soporta carga múltiple.

### `MappingEditor.jsx`
- lista columnas origen,
- permite asignarlas a columnas destino,
- permite dejar columnas sin mapear,
- soporta búsqueda.

### `DataGridTable.jsx`
- parsea `corrected_text`,
- muestra lista de registros,
- muestra detalle campo por campo,
- colorea celdas según estado.

### `StatsCard.jsx`
Muestra:
- total registros,
- errores,
- corregidos,
- porcentaje de calidad.

## 10. Dependencias declaradas

### Backend
- fastapi
- uvicorn[standard]
- pandas
- python-multipart
- rapidfuzz
- python-dateutil
- numpy
- openpyxl

### Frontend
Dependencias:
- react
- react-dom

DevDependencies:
- vite
- @vitejs/plugin-react
- tailwindcss
- postcss
- autoprefixer

## 11. Cómo construí este contexto
Este documento no fue inferido de memoria. Lo reconstruí leyendo el código real del proyecto y extrayendo las plantillas desde Python.

### Fuentes revisadas
Backend:
- `backend/main.py`
- `backend/validators.py`
- `backend/utils.py`
- `backend/template_config.py`
- `backend/gestante_config.py`
- `backend/templates_registry.py`
- `backend/schema.py`
- `backend/requirements.txt`

Frontend:
- `frontend/src/App.jsx`
- `frontend/src/api.js`
- `frontend/src/components/DragDrop.jsx`
- `frontend/src/components/MappingEditor.jsx`
- `frontend/src/components/DataGridTable.jsx`
- `frontend/src/components/StatsCard.jsx`
- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/index.html`
- `frontend/package.json`

### Método de extracción de variables
Además de leer los archivos de configuración, ejecuté una extracción directa desde `templates_registry.py` para obtener el inventario exacto de ambas plantillas, incluyendo:
- posición,
- nombre,
- tipo,
- obligatoriedad,
- catálogo permitido.

Eso evita omisiones y asegura que el listado siguiente coincida con lo que la aplicación realmente usa.

## 12. Resumen cuantitativo de plantillas

### Plantilla RCV
- Total variables: 118
- TEXT: 18
- INT: 12
- DATE: 34
- SET: 36
- DECIMAL: 18
- Todos los campos están marcados como requeridos.

### Plantilla Gestante
- Total variables: 207
- TEXT: 41
- INT: 31
- DATE: 60
- SET: 68
- DECIMAL: 7
- Todos los campos están marcados como requeridos.

## 13. Inventario completo de variables: plantilla RCV
Formato: `# | Variable | Tipo | Requerido | Valores permitidos si aplica`

1 | NOMBRE_1 | TEXT | True |
2 | NOMBRE_2 | TEXT | True |
3 | APELLIDO_1 | TEXT | True |
4 | APELLIDO_2 | TEXT | True |
5 | TIPO DE IDENTIFICACIÓN | TEXT | True |
6 | NUMERO DE IDENTIFICACIÓN | INT | True |
7 | FECHA DE NACIMIENTO | DATE | True |
8 | 60 Y MAS AÑOS ? | SET | True | SI, NO
9 | EDAD | INT | True |
10 | SEXO | SET | True | MASCULINO, FEMENINO
11 | REGIMEN DE AFILIACION | SET | True | SUBSIDIADO, CONTRIBUTIVO
12 | PERTENECIA ETNICA | SET | True | INDIGENA, MESTIZO, NINGUNAS DE LAS ANTERIORES
13 | GRUPO POBLACIONAL | SET | True | CABEZA DE FAMILIA, JOVENES VULNERABLES, POBLACION INFANTIL A CARGO DEL ICBF, MUJER CABEZA DE HOGAR, DISCAPACITADOS, OTRO GRUPO POBLACIONAL, DESMOVILIZADOS, ADULTO MAYOR
14 | ETNIA | SET | True | WAYUU, ARHUACO, WIWA, YUKPA, KOGI, INGA, KANKUAMO, CHIMILA
15 | DEPARTAMENTO DE RESIDENCIA | TEXT | True |
16 | MUNICIPIO DE RESIDENCIA | INT | True |
17 | NUMERO DE TELEFONO | INT | True |
18 | ZONA DE UBICACION DE LA VIVIENDA | SET | True | RURAL, URBANA
19 | DIRECCION | TEXT | True |
20 | ASENTAMIENTO/RANCHERIA/COMUNIDAD | TEXT | True |
21 | CODIGO DE LA IPS QUE HACE SEGUIMIENTO | INT | True |
22 | NOMBRE DE LA IPS QUE HACE SEGUIMIENTO | TEXT | True |
23 | FECHA INSCRIPCION PROGRAMA DE HTA - DM | DATE | True |
24 | FUMA | SET | True | SI, NO
25 | CONSUMO DE ALCOHOL | SET | True | SI, NO
26 | DX CONFIRMADO HTA | TEXT | True |
27 | FECHA DX HTA | DATE | True |
28 | DX CONFIRMADO DM | TEXT | True |
29 | FECHA DX DM | DATE | True |
30 | TIPO DE DM | SET | True | TIPO 1 INSULINODEPENDIENTE, TIPO 2 NO INSULINODEPENDIENTE, NO APLICA
31 | ETIOLOGIA DE LA ERC | SET | True | HTA O DM, AUTOINMUNE, NEFROPATIA OBSTRUCTIVA, ENFERMEDAD POLIQUISTICA, NO TIENE ERC, OTRAS
32 | TENSION ARTERIAL SISTOLICA AL INGRESO A BASE | INT | True |
33 | TENSION ARTERIAL DIASTOLICA AL INGRESO A BASE | INT | True |
34 | CLASIFICACION DE HTA | SET | True | ESTADIO1, ESTADIO2, ESTADIO3, NORMAL, SIN DATO
35 | HTA CONTROLADA | SET | True | SI, NO, SIN DATO
36 | ULTIMO PESO | INT | True |
37 | TALLA | DECIMAL | True |
38 | IMC | DECIMAL | True |
39 | CLASIFICACION DE IMC | TEXT | True |
40 | ULTIMA MEDICION DE PERIMETRO ABDOMINAL | DECIMAL | True |
41 | FACTOR DE RIESGO POR PA | SET | True | CLASIFICACION DEL RIESGO ALTO, CLASIFICACION DEL RIESGO BAJO
42 | CLASIFICACION DEL RCV ACTUAL AL INGRESO A BASE | SET | True | RIESGO ALTO, RIESGO BAJO, RIESGO MODERADO, NO SE CLASIFICO
43 | FECHA DE CLASIFICACION DE RCV AL INGRESO A BASE | DATE | True |
44 | CLASIFICACION DEL RCV ACTUAL | SET | True | RIESGO ALTO, RIESGO BAJO, RIESGO MODERADO, NO SE CLASIFICO
45 | FECHA DE CLASIFICACION DE RCV | DATE | True |
46 | HEMOGRAMA | DECIMAL | True |
47 | FECHA DEL HEMOGRAMA | DATE | True |
48 | GLICEMIA BASAL | DECIMAL | True |
49 | FECHA DE GLICEMIA BASAL | DATE | True |
50 | PARCIAL DE ORINA | SET | True | NORMAL, PROTEINURA, HEMATURIA, OTRA, SIN DATO
51 | FECHA PARCIAL DE ORINA | DATE | True |
52 | CREATININA SANGRE (mg/dl) | DECIMAL | True |
53 | FECHA CREATININA SANGRE | DATE | True |
54 | COLESTEROL TOTAL | DECIMAL | True |
55 | HDL | DECIMAL | True |
56 | LDL | DECIMAL | True |
57 | TRIGLICERIDOS | DECIMAL | True |
58 | FECHA PERFIL LIPIDICO | DATE | True |
59 | FECHA DE SOLICITUD DE HEMOGLOBINA GLICOSILADA | DATE | True |
60 | REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM) | DECIMAL | True |
61 | FECHA DE REPORTE DE HEMOGLOBINA GLICOSILADA | DATE | True |
62 | DM CONTROLADA | SET | True | SI, NO, NO APLICA
63 | ALBUMINURIA | INT | True |
64 | FECHA ALBUMINURIA | DATE | True |
65 | REPORTE DE EKG | SET | True | NORMAL, ANORMAL, SIN DATO
66 | FECHA DE EKG | DATE | True |
67 | ECOCARDIOGRAMA | INT | True |
68 | FECHA DE REPORTE DEL ECOCARDIOGRAMA | DATE | True |
69 | AJUSTE TFG POR GENERO | DECIMAL | True |
70 | TFG AJUSTADA POR GENERO FORMULA COCKCROFT AND GAULT | DECIMAL | True |
71 | TFG FORMULA COCKCROFT AND GAULT ACTUAL | DECIMAL | True |
72 | TFG FORMULA COCKCROFT AND GAULT ANTERIOR | DECIMAL | True |
73 | VARIABILIDAD | DECIMAL | True |
74 | FECHA DE CREATININA ACTUAL | DATE | True |
75 | CREATININA ACTUAL | DECIMAL | True |
76 | FECHA CREATINNINA ANTERIOR | DATE | True |
77 | CREATININA ANTERIOR | DECIMAL | True |
78 | ESTADIO SEGUN TFG | SET | True | ESTADIO1, ESTADIO2, ESTADIO3, ESTADIO4, ESTADIO5, SIN DATO
79 | DESCRIPCION DEL DANO RENAL | TEXT | True |
80 | ENERO FECHA | DATE | True |
81 | CONTROL REALIZADO POR ENERO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
82 | FEBRERO FECHA | DATE | True |
83 | CONTROL REALIZADO POR FEBRERO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
84 | MARZO FECHA | DATE | True |
85 | CONTROL REALIZADO POR MARZO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
86 | ABRIL FECHA | DATE | True |
87 | CONTROL REALIZADO POR ABRIL | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
88 | MAYO FECHA | DATE | True |
89 | CONTROL REALIZADO POR MAYO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
90 | JUNIO FECHA | DATE | True |
91 | CONTROL REALIZADO POR JUNIO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
92 | JULIO FECHA | DATE | True |
93 | CONTROL REALIZADO POR JULIO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
94 | AGOSTO FECHA | DATE | True |
95 | CONTROL REALIZADO POR AGOSTO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
96 | SEPTIEMBRE FECHA | DATE | True |
97 | CONTROL REALIZADO POR SEPTIEMBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
98 | OCTUBRE FECHA | DATE | True |
99 | CONTROL REALIZADO POR OCTUBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
100 | NOVIEMBRE FECHA | DATE | True |
101 | CONTROL REALIZADO POR NOVIEMBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
102 | DICIEMBRE FECHA | DATE | True |
103 | CONTROL REALIZADO POR DICIEMBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
104 | FECHA DE PROXIMO CONTROL | DATE | True |
105 | ULTIMA TENSION ARTERIAL SISTOLICA | INT | True |
106 | ULTIMA TENSION ARTERIAL DIASTOLICA | INT | True |
107 | CLASIFICACION DE HTA ULTIMA | SET | True | ESTADIO1, ESTADIO2, ESTADIO3, ESTADIO4, ESTADIO5, SIN DATO, NORMAL
108 | FECHA DE LA ULTIMA TOMA DE PRESION ARTERIAL REPORTADO EN HISTORIA CLINICA | DATE | True |
109 | HTA CONTROLADA ULTIMA | SET | True | SI, NO, SIN DATO
110 | TRATAMIENTO ANTIHIPERTENSIVO Y/O DIABETES MELLITUS | TEXT | True |
111 | ADHERENCIA AL TRATAMIENTO FARMACOLOGICO (TEST DE MORISKY GREEN) | SET | True | SI, NO, SIN DATO
112 | REMITIDO A | TEXT | True |
113 | FECHA DE REMISION | DATE | True |
114 | COMPLICACIONES | TEXT | True |
115 | NOVEDADES | SET | True | FALLECIDO, NUEVO, RETIRADO, ACTIVO, SIN DATO
116 | CAUSA DE MUERTE | TEXT | True |
117 | FECHA DE MUERTE | DATE | True |
118 | OBSERVACIONES | TEXT | True |

## 14. Inventario completo de variables: plantilla Gestante
Formato: `# | Variable | Tipo | Requerido | Valores permitidos si aplica`

1 | TIPO DE DOCUMENTO DE IDENTIDAD | SET | True | MENOR SIN IDENTIFICACION, TARJETA IDENTIDAD, CEDULA, ADULTO SIN IDENTIFICACION, REGISTRO CIVIL, CARNE DIPLOMATICO, CEDULA DE EXTRANJERIA, PASAPORTE
2 | NO. DE IDENTIFICACION | INT | True |
3 | APELLIDO_1 | TEXT | True |
4 | APELLIDO_2 | TEXT | True |
5 | NOMBRE_1 | TEXT | True |
6 | NOMBRE_2 | TEXT | True |
7 | FECHA DE NACIMIENTO | DATE | True |
8 | EDAD | INT | True |
9 | SEXO | SET | True | FEMENINO, MASCULINO
10 | REGIMEN DE AFILIACION | SET | True | SUBSIDIADO, CONTRIBUTIVO
11 | PERTENECIA ETNICA | SET | True | INDIGENA, MESTIZO, NINGUNAS DE LAS ANTERIORES
12 | GRUPO POBLACIONAL | SET | True | CABEZA DE FAMILIA, JOVENES VULNERABLES, POBLACION INFANTIL A CARGO DEL ICBF, MUJER CABEZA DE HOGAR, DISCAPACITADOS, OTRO GRUPO POBLACIONAL, DESMOVILIZADOS, ADULTO MAYOR
13 | DEPARTAMENTO DE RESIDENCIA | TEXT | True |
14 | MUNICIPIO DE RESIDENCIA | INT | True |
15 | ZONA | SET | True | RURAL, URBANA
16 | ETNIA | SET | True | WAYUU, ARHUACO, WIWA, YUKPA, KOGI, INGA, KANKUAMO, CHIMILA
17 | ASENTAMIENTO/RANCHERIA/COMUNIDAD | TEXT | True |
18 | TELEFONO USUARIA | INT | True |
19 | DIRECCION | TEXT | True |
20 | NIVEL EDUCATIVO | TEXT | True |
21 | DISCAPACIDAD | SET | True | SI, NO
22 | MUJER CABEZA DE HOGAR | SET | True | SI, NO, NO APLICA
23 | OCUPACION | TEXT | True |
24 | ESTADO CIVIL | TEXT | True |
25 | CONTROL TRADICIONAL | SET | True | SABEDOR ANCESTRAL, PARTERA (O), SOBANDERA (O), NO APLICA
26 | GESTANTE RENUENTE | SET | True | GESTANTE RENUENTE
27 | INASISTENTE | TEXT | True |
28 | NOMBRE DE LA IPS PRIMARIA | TEXT | True |
29 | FECHA DE DIAGNOSTICO | DATE | True |
30 | FECHA DE INGRESO AL CONTROL PRENATAL | DATE | True |
31 | FUM | DATE | True |
32 | FPP | DATE | True |
33 | DIAS PARA EL PARTO | INT | True |
34 | ALARMA | TEXT | True |
35 | EDAD GEST INICIO CONTROL | DECIMAL | True |
36 | TRIMESTRE INICIO CONTROL | SET | True | PRIMER TRIMESTRE, SEGUNDO TRIMESTRE, TERCER TRIMESTRE
37 | G | INT | True |
38 | P | INT | True |
39 | C | INT | True |
40 | A | INT | True |
41 | M | INT | True |
42 | V | INT | True |
43 | HIPERTENSION ARTERIAL | SET | True | SI, NO
44 | DIABETES | SET | True | SI, NO
45 | VIH | SET | True | SI, NO
46 | SIFILIS | SET | True | SI, NO
47 | TUBERCULOSIS | SET | True | SI, NO
48 | OTRAS CONDICIONES MEDICAS GRAVES | SET | True | SI, NO
49 | SI LA RESPUESTA ANTERIOR ES SI DESCRIBA LA OTRA CONDICION MEDICA GRAVE | TEXT | True |
50 | ANTECEDENTES DE EVENTOS OBSTETRICOS DESFAVORABLES | SET | True | SI, NO
51 | PERIODO INTERGENESICO | INT | True |
52 | PESO INICIAL (KG) | DECIMAL | True |
53 | TALLA (METROS) | DECIMAL | True |
54 | INDICE DE MASA CORPORAL (IMC) | DECIMAL | True |
55 | CLASIFICACION DE IMC | TEXT | True |
56 | APOYO FAMILIAR | SET | True | SI, NO
57 | EMBARAZO DESEADO | SET | True | SI, NO
58 | HABITOS DE RIESGO | SET | True | SI, NO
59 | HA SIDO VICTIMA DE VIOLENCIA FISICA O PSICOLOGICA | SET | True | SI, NO
60 | HA SIDO VICTIMA DE ABUSO SEXUAL | SET | True | SI, NO
61 | SE IDENTIFICAN CAUSALES PARA IVE? | SET | True | SI, NO
62 | CLASIFICACION DEL RIESGO | SET | True | CLASIFICACION DEL RIESGO ALTO, CLASIFICACION DEL RIESGO BAJO
63 | CAUSAS DE ALTO RIESGO | TEXT | True |
64 | PUNTAJE DE CLASIFICACION SEGUN ESCALA DE HERRERA Y HURTADO | TEXT | True |
65 | REMITIDA A ESPECIALISTA? | SET | True | SI, NO, SIN DATO
66 | DESCRIBA CUAL(ES) ESPECIALISTAS LA HAN ATENDIDO | TEXT | True |
67 | ASESORIA PRUEBA VIH | DATE | True |
68 | TRIMESTRE ASESORIA VIH | INT | True |
69 | FECHA TOMA PRUEBA VIH PRIMER TAMIZAJE | DATE | True |
70 | RESULTADO PRIMER TAMIZAJE PRUEBA DE VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
71 | TRIMESTRE TOMA PRUEBA VIH PRIMER TAMIZAJE | INT | True |
72 | FECHA TOMA PRUEBA VIH SEGUNDO TAMIZAJE | DATE | True |
73 | RESULTADO SEGUNDO TAMIZAJE PRUEBA DE VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
74 | TRIMESTRE TOMA PRUEBA VIH SEGUNDO TAMIZAJE | INT | True |
75 | FECHA TOMA PRUEBA VIH TERCER TAMIZAJE | DATE | True |
76 | RESULTADO TERCER TAMIZAJE PRUEBA DE VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
77 | TRIMESTRE TOMA PRUEBA VIH TERCER TAMIZAJE | INT | True |
78 | FECHA PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS | DATE | True |
79 | RESULTADO PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS | SET | True | POSITIVO, NEGATIVO, SIN DATO
80 | TRIMESTRE PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS | INT | True |
81 | FECHA SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS | DATE | True |
82 | RESULTADO SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS | SET | True | POSITIVO, NEGATIVO, SIN DATO
83 | TRIMESTRE SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS | INT | True |
84 | FECHA TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS | DATE | True |
85 | RESULTADO TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS | SET | True | POSITIVO, NEGATIVO, SIN DATO
86 | TRIMESTRE TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS | INT | True |
87 | FECHA TOMA SEGUNDA PRUEBA VIH | TEXT | True |
88 | RESULTADO TOMA SEGUNDA PRUEBA VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
89 | TRIMESTRE TOMA SEGUNDA PRUEBA VIH | SET | True | PRIMER TRIMESTRE, SEGUNDO TRIMESTRE, TERCER TRIMESTRE, SIN DATO
90 | FECHA PRUEBA CONFIRMATORIA SEGUN ALGORITMO | DATE | True |
91 | TRIMESTRE PRUEBA CONFIRMATORIA SEGUN ALGORITMO | INT | True |
92 | FECHA DE DIAGNOSTICO DE SIFILIS | DATE | True |
93 | TRATAMIENTO INSTAURADO | TEXT | True |
94 | FECHA DE INICIO DEL TRATAMIENTO | DATE | True |
95 | FECHA DE SEGUNDA DOSIS DEL TRATAMIENTO | DATE | True |
96 | FECHA DE TERCERA DOSIS DEL TRATAMIENTO | DATE | True |
97 | FECHA DE TOMA DE UROCULTIVO | DATE | True |
98 | RESULTADO UROCULTIVO | SET | True | POSITIVO, NEGATIVO, SIN DATO
99 | FECHA TOMA GLICEMIA | DATE | True |
100 | RESULTADO GLICEMIA | INT | True |
101 | FECHA PRUEBA DE TOLERANCIA ORAL GLUCOSA | DATE | True |
102 | RESULTADO PRUEBA DE TOLERANCIA ORAL GLUCOSA | INT | True |
103 | FECHA REALIZACION HEMOGLOBINA | DATE | True |
104 | RESULTADO HEMOGLOBINA | DECIMAL | True |
105 | RESULTADO REALIZACION HEMOCLASIFICACION (FACTOR RH) | TEXT | True |
106 | FECHA DE ANTIGENO SUPERFICIE HEPATITIS B | DATE | True |
107 | RESULTADO ANTIGENO SUPERFICIE HEPATITIS B | SET | True | POSITIVO, NEGATIVO, SIN DATO
108 | FECHA TAMIZAJE TOXOPLASMA | DATE | True |
109 | RESULTADO TOXOPLASMA | SET | True | POSITIVO, NEGATIVO, SIN DATO
110 | FECHA DE LA PRUEBA DE RUBEOLA | DATE | True |
111 | RESULTADO RUBEOLA | SET | True | POSITIVO, NEGATIVO, SIN DATO
112 | FECHA CITOLOGIA CERVICOUTERINA | DATE | True |
113 | RESULTADO TAMIZAJE DE CUELLO UTERINO | SET | True | POSITIVO, NEGATIVO, SIN DATO
114 | FECHA PRUEBA DE TAMIZAJE PARA ESTREPTOCOCO GRUPO B | DATE | True |
115 | RESULTADO PRUEBA DE TAMIZAJE PARA ESTREPTOCOCO GRUPO B | SET | True | POSITIVO, NEGATIVO, SIN DATO
116 | FECHA TOMA DE GOTA GRUESA (MALARIA) | DATE | True |
117 | RESULTADO GOTA GRUESA (MALARIA) | SET | True | POSITIVO, NEGATIVO, SIN DATO
118 | FECHA DE REALIZACION TAMIZAJE CHAGAS | DATE | True |
119 | RESULTADO CHAGAS | SET | True | POSITIVO, NEGATIVO, SIN DATO
120 | FECHA DE APLICACION INFLUENZA (DESDE SEMANA 14) | DATE | True |
121 | FECHA DE APLICACION TOXOIDE SEGUN ANTECEDENTE VACUNAL | DATE | True |
122 | FECHA DE APLICACION DPT ACELULAR (SEMANA 26) | DATE | True |
123 | FECHA CONSULTA ODONTOLOGICA | DATE | True |
124 | ECOGRAFIA OBSTETRICA CON TRANSLUCENCIA NUCAL (10,6 - 13,6) | DATE | True |
125 | ECOGRAFIA OBSTETRICA PARA LA DETECCION DE ANOMALIAS ESTRUCTURALES (18 - 23) | DATE | True |
126 | OTRAS ECOGRAFIAS? | DATE | True |
127 | FECHA SUMINISTRO ACIDO FOLICO | DATE | True |
128 | FECHA SUMINISTRO CALCIO (SEMANA 14) | DATE | True |
129 | FECHA SUMINISTRO HIERRO | DATE | True |
130 | FECHA SUMINISTRO ASA | DATE | True |
131 | FECHA DESPARASITACION ANTIHELMINTICA II Y III TRIMESTRE (ALBENDAZO 400 MG DOSIS UNICA) | DATE | True |
132 | FECHA 1ER CONTROL | DATE | True |
133 | QUIEN REALIZO EL CONTROL | TEXT | True |
134 | FECHA 2DO CONTROL | DATE | True |
135 | QUIEN REALIZO EL CONTROL_2 | TEXT | True |
136 | FECHA 3ER CONTROL | DATE | True |
137 | QUIEN REALIZO EL CONTROL_3 | TEXT | True |
138 | FECHA 4TO CONTROL | DATE | True |
139 | QUIEN REALIZO EL CONTROL_4 | TEXT | True |
140 | FECHA 5TO CONTROL | DATE | True |
141 | QUIEN REALIZO EL CONTROL_5 | TEXT | True |
142 | FECHA 6TO CONTROL | DATE | True |
143 | QUIEN REALIZO EL CONTROL_6 | TEXT | True |
144 | FECHA 7MO CONTROL | DATE | True |
145 | QUIEN REALIZO EL CONTROL_7 | TEXT | True |
146 | FECHA 8VO CONTROL | DATE | True |
147 | QUIEN REALIZO EL CONTROL_8 | TEXT | True |
148 | FECHA 9NO CONTROL | DATE | True |
149 | QUIEN REALIZO EL CONTROL_9 | TEXT | True |
150 | NUMERO TOTAL DE CONTROLES PRENATALES | INT | True |
151 | ULTIMO CONTROL PRENATAL | DATE | True |
152 | EDAD GESTACIONAL ACTUAL | INT | True |
153 | PESO ACTUAL | INT | True |
154 | TALLA ACTUAL | DECIMAL | True |
155 | IMC | DECIMAL | True |
156 | TA ACTUAL | INT | True |
157 | FECHA PRIMERA CONSULTA GINECOLOGIA | DATE | True |
158 | FECHA SEGUNDA CONSULTA GINECOLOGIA | DATE | True |
159 | FECHA TERCERA CONSULTA GINECOLOGIA | DATE | True |
160 | FECHA CONSULTA NUTRICION | DATE | True |
161 | FECHA CONSULTA PSICOLOGIA | DATE | True |
162 | FECHA DE ATENCION OTRO ESPECIALISTA | DATE | True |
163 | QUIEN REALIZO LA CONSULTA | TEXT | True |
164 | TIPO DE ABORTO | SET | True | ESPONTANEO, INDUCIDO, SIN DATO
165 | FECHA | DATE | True |
166 | SEMANAS DE GESTACION | INT | True |
167 | COMPLICACIONES | TEXT | True |
168 | FECHA DE PARTO | DATE | True |
169 | CARACTERISTICAS DEL PARTO | SET | True | PARTO VAGINAL, CESAREA, TRADICIONAL, SIN DATO
170 | PARTO ATENDIDO POR | SET | True | IPS BAJA COMPLEJIDAD, IPS MEDIANA O ALTA, PARTERA, MEDICO TRADICIONAL, SIN DATO
171 | NO.SEMANAS DE GESTACION | INT | True |
172 | COMPLICACIONES DURANTE EL PARTO | SET | True | SI, NO, SIN DATO
173 | TIPO COMPLICACION | TEXT | True |
174 | UCI MATERNA | SET | True | SI, NO, SIN DATO
175 | TOMA DE PRUEBAS ITS INTRAPARTO | SET | True | SI, NO, SIN DATO
176 | RESULTADO POSITIVO | SET | True | SI, NO, SIN DATO
177 | FECHA DE DEFUNCION | DATE | True |
178 | CAUSA DE LA DEFUNCION | TEXT | True |
179 | MULTIPLICIDAD DEL EMBARAZO | SET | True | SIMPLE, DOBLE, TRIPLE, CUADRUPLE O MAS, SIN DATO
180 | REGISTRO CIVIL RECIEN NACIDO 1 | TEXT | True |
181 | NOMBRE RECIEN NACIDO 1 | TEXT | True |
182 | SEXO RECIEN NACIDO 1 | SET | True | FEMENINO, MASCULINO, SIN DATO
183 | PESO AL NACER (GRS) | INT | True |
184 | CONDICION DEL RECIEN NACIDO | SET | True | VIVO, MUERTO, SIN DATO
185 | TOMA TSH RECIEN NACIDO 1 | SET | True | SI, NO, SIN DATO
186 | DX HIPOTIROIDISMO | SET | True | SI, NO, SIN DATO
187 | TTO HIPOTIROIDISMO | SET | True | SI, NO, SIN DATO
188 | TIEMPO DE LECTURA | TEXT | True |
189 | UCI NEONATAL RECIEN NACIDO 1 | SET | True | SI, NO, SIN DATO
190 | VACUNACION CON BCG | SET | True | SI, NO, SIN DATO
191 | VACUNACION ANTIHEPATITIS B | SET | True | SI, NO, SIN DATO
192 | REGISTRO CIVIL RECIEN NACIDO 2 | INT | True |
193 | NOMBRE RECIEN NACIDO 2 | TEXT | True |
194 | SEXO RECIEN NACIDO 2 | SET | True | FEMENINO, MASCULINO, SIN DATO
195 | PESO AL NACER RECIEN NACIDO 2 (GRS) | INT | True |
196 | CONDICION DEL RECIEN NACIDO_2 | SET | True | VIVO, MUERTO, SIN DATO
197 | TOMA TSH RECIEN NACIDO 2 | SET | True | SI, NO, SIN DATO
198 | DX HIPOTIROIDISMO_2 | SET | True | SI, NO, SIN DATO
199 | TIEMPO DE LECTURA RECIEN NACIDO 2 | TEXT | True |
200 | UCI NEONATAL RECIEN NACIDO 2 | SET | True | SI, NO, SIN DATO
201 | TTO HIPOTIROIDISMO RECIEN NACIDO 2 | SET | True | SI, NO, SIN DATO
202 | VACUNACION CON BCG_2 | SET | True | SI, NO, SIN DATO
203 | VACUNACION ANTIHEPATITIS B_2 | SET | True | SI, NO, SIN DATO
204 | TIPO | SET | True | DIU, INYECCION MENSUAL, INYECCION TRIMESTRAL, PILDORAS, CONDON, POMEROY, RENUENTE, SIN DATO
205 | OBSEVACION | TEXT | True |
206 | FECHA_2 | DATE | True |
207 | OBSERVACIONES GENERALES | TEXT | True |

## 15. Conclusiones operativas
1. La app está diseñada como un validador y corrector, no solo como un verificador pasivo.
2. La plantilla es el contrato central: orden, nombres, tipos y catálogos dependen de ella.
3. El backend ya contiene reglas para rescatar muchos errores frecuentes de digitación, codificación y formato.
4. La exportación final está pensada para no dejar campos vacíos, porque sistemas externos tienden a fallar con nulos o strings mal formados.
5. El mayor punto crítico de calidad no es solo el valor de una celda, sino también el mapeo correcto entre columnas fuente y columnas destino.

## 16. Riesgos y observaciones técnicas actuales
1. Hay campos de texto donde la política de fallback usa `SIN DATO`; eso protege el cargue, pero puede ocultar ausencia de información real si no se revisa la auditoría.
2. La plantilla Gestante tiene nombres duplicados resueltos con sufijos automáticos como `_2`, `_3`, etc. Eso es correcto técnicamente, pero es importante conocerlo al mapear manualmente.
3. Algunas decisiones actuales favorecen recuperabilidad sobre rigidez. Eso es útil para cargue operativo, pero debe complementarse con revisión funcional si el proceso exige exactitud clínica máxima.
4. La UI muestra `strict mode` como bloqueo conceptual, pero hoy el backend lo maneja como advertencia y sigue procesando.
5. `frontend/src/template_list.js` conserva una lista estática RCV, pero la app activa obtiene las plantillas reales desde el backend.
# Contexto Completo De La Aplicacion

## 1. Resumen ejecutivo

Esta aplicacion es un validador institucional para cargue de plantillas IPS. Su objetivo es recibir archivos de entrada en formato TXT delimitado por `|` o en Excel, identificar a que variables institucionales corresponde cada columna, corregir valores recuperables, registrar auditoria de cambios y exportar un TXT final listo para cargue.

La solucion tiene dos modulos funcionales principales:

- Backend en FastAPI para parsing, deteccion de encabezados, auto-mapeo, validacion, autocorreccion, auditoria y exportacion.
- Frontend en React + Vite + Tailwind para seleccion de plantilla, carga de archivos, revision de mapeo, vista previa validada, auditoria y exportacion.

La aplicacion trabaja con dos plantillas:

- `rcv`: Riesgo cardiovascular y seguimiento cronico.
- `gestante`: Ruta materno perinatal y controles prenatales.

## 2. Objetivo operativo

El sistema busca resolver cuatro problemas tipicos del cargue institucional:

1. Los archivos llegan con encabezados distintos a la plantilla oficial.
2. Los datos llegan con errores de digitacion, abreviaturas, acentos, nombres en vez de codigos o formatos inconsistentes.
3. Los archivos pueden venir incompletos o con estructura parcial.
4. Los sistemas externos pueden fallar si el TXT exportado contiene vacios, `null`, `NaN` o valores fuera de catalogo.

Por eso la aplicacion no se limita a validar: tambien corrige lo recuperable y fuerza valores seguros cuando no puede reconstruir el dato original.

## 3. Stack tecnologico

### Backend

- Python
- FastAPI
- Uvicorn
- pandas
- openpyxl
- python-dateutil
- rapidfuzz
- numpy
- python-multipart

Dependencias declaradas en [backend/requirements.txt](backend/requirements.txt).

### Frontend

- React 18
- Vite
- Tailwind CSS
- PostCSS
- Autoprefixer

Dependencias declaradas en [frontend/package.json](frontend/package.json).

## 4. Estructura del proyecto

### Raiz

- [README.md](README.md): resumen funcional y comandos basicos.
- [backend](backend): API y logica de negocio.
- [frontend](frontend): interfaz de usuario.

### Backend

- [backend/main.py](backend/main.py): API FastAPI, endpoints, parsing de archivos, deteccion de encabezados, mapeo, respuesta de validacion y exportacion.
- [backend/validators.py](backend/validators.py): motor principal de conversion, autocorreccion y asignacion de defaults seguros.
- [backend/utils.py](backend/utils.py): normalizacion y fuzzy matching de encabezados.
- [backend/template_config.py](backend/template_config.py): definicion completa de la plantilla RCV.
- [backend/gestante_config.py](backend/gestante_config.py): definicion completa de la plantilla Gestante.
- [backend/templates_registry.py](backend/templates_registry.py): registro central de plantillas activas.
- [backend/schema.py](backend/schema.py): alias de compatibilidad que expone la plantilla RCV como `TEMPLATE`.
- [backend/__init__.py](backend/__init__.py): inicializacion de paquete.

### Frontend

- [frontend/src/App.jsx](frontend/src/App.jsx): pantalla principal y orquestacion del flujo completo.
- [frontend/src/api.js](frontend/src/api.js): cliente HTTP hacia el backend.
- [frontend/src/components/DragDrop.jsx](frontend/src/components/DragDrop.jsx): carga por arrastre o seleccion.
- [frontend/src/components/MappingEditor.jsx](frontend/src/components/MappingEditor.jsx): editor manual de mapeo.
- [frontend/src/components/DataGridTable.jsx](frontend/src/components/DataGridTable.jsx): vista previa validada por fila y columna.
- [frontend/src/components/StatsCard.jsx](frontend/src/components/StatsCard.jsx): resumen numerico.
- [frontend/src/template_list.js](frontend/src/template_list.js): lista historica de nombres de la plantilla RCV en frontend.
- [frontend/src/index.css](frontend/src/index.css): identidad visual institucional.
- [frontend/src/main.jsx](frontend/src/main.jsx): bootstrap de React.
- [frontend/index.html](frontend/index.html): contenedor HTML.

## 5. Flujo funcional completo

### Paso 1. Seleccion de plantilla

El usuario selecciona una de las dos plantillas cargadas desde `GET /templates`.

Cada plantilla define:

- nombre tecnico
- etiqueta visual
- descripcion
- numero total de campos

### Paso 2. Carga de archivo

El frontend permite cargar:

- `.txt`
- `.xlsx`
- `.xls`

La carga se hace mediante `POST /upload`.

### Paso 3. Parsing inicial

En backend:

- Si el archivo es TXT, se lee con separador `|`.
- Si es Excel, se lee con `openpyxl`.
- Todo se carga inicialmente como texto para evitar perdidas tempranas de formato.

### Paso 4. Normalizacion del dataframe fuente

`normalize_source_dataframe()` ejecuta estas tareas:

- elimina filas completamente vacias
- intenta detectar si existe una fila real de encabezados
- si encuentra encabezados, los asigna
- si no encuentra encabezados, genera `C1`, `C2`, `C3`, etc.
- limpia espacios en cada celda
- conserva vacios posicionales para no desplazar columnas
- elimina columnas vacias al final
- elimina filas completamente vacias

### Paso 5. Deteccion de fila encabezado

`detect_header_row()` examina hasta 30 filas iniciales y calcula:

- coincidencias con nombres esperados de plantilla
- cobertura sobre el ancho real de la fila

La logica es flexible:

- para archivos angostos de 1 o 2 columnas permite umbral minimo muy bajo
- para archivos medianos y anchos exige mas hits

Esto evita que archivos pequenos queden sin encabezado detectado.

### Paso 6. Auto-mapeo de columnas

`infer_mapping()` hace dos cosas segun el archivo:

- si los encabezados son genericos `C1..Cn`, usa mapeo posicional
- si hay nombres reales, usa `fuzzy_map()`

`fuzzy_map()` aplica:

1. coincidencia exacta canonica
2. coincidencia por alias de encabezado
3. fuzzy matching global con asignacion uno a uno por mejor score

Esto evita el problema de cruce de columnas cuando dos encabezados son parecidos.

### Paso 7. Validacion y correccion

`validate_and_correct()` recorre fila por fila y columna por columna segun la plantilla activa.

Para cada variable:

- busca la columna origen en el mapeo
- toma el valor
- aplica conversion segun el tipo de dato
- si puede corregirlo, lo corrige
- si no puede y el dato queda invalido, fuerza un valor seguro
- registra en la auditoria si el valor fue corregido

### Paso 8. Construccion de salida

`build_response_payload()` devuelve:

- `summary`
- `logs_sample`
- `corrected_text`
- `preview_rows`
- `mapping`
- `template_names`

Antes de exportar, el backend rellena cualquier posible `NaN` con `SIN DATO` y convierte todo a string.

### Paso 9. Revalidacion manual

El usuario puede ajustar el mapeo en frontend y pulsar reproceso.

Esto llama `POST /revalidate`, que vuelve a correr el motor con el `raw_text` canonico y el mapeo ajustado manualmente.

### Paso 10. Exportacion

`POST /export` recibe `corrected_text` y responde un TXT descargable sin encabezados.

## 6. Endpoints del backend

### `GET /health`

Retorna estado simple de salud del backend.

### `GET /template`

Retorna la definicion completa de una plantilla especifica.

Parametros:

- `template_key`, por defecto `rcv`

### `GET /templates`

Retorna metadata de todas las plantillas registradas.

### `POST /upload`

Carga archivo y ejecuta validacion inicial.

Parametros principales:

- `file`
- `template_key`
- `strict_mode`
- `min_template_coverage`
- `require_exact_columns`

### `POST /revalidate`

Reprocesa el contenido usando mapeo ajustado por usuario.

Body:

- `raw_text`
- `mapping`
- `template_key`

### `POST /export`

Recibe `corrected_text` y retorna un archivo plano descargable.

## 7. Modo estricto y modo flexible

La UI expone un checkbox llamado `Bloquear archivos incompletos`.

### Modo flexible

- procesa el archivo aunque haya cobertura incompleta
- intenta recuperar y corregir todo lo posible
- reporta advertencias y errores residuales

### Modo estricto

Calcula razones de advertencia si ocurre cualquiera de estas condiciones:

- cobertura de plantilla por debajo del minimo
- numero de columnas distinto al numero esperado
- existencia de encabezados no mapeados

En el estado actual del backend, ese resultado queda reportado como `warning` u `ok` dentro de `strict_validation`; no devuelve rechazo duro si logra construir la respuesta.

## 8. Logica de mapeo de encabezados

El archivo [backend/utils.py](backend/utils.py) implementa la logica central.

### Normalizacion de encabezados

`normalize_text()` hace:

- trim
- mayusculas
- elimina acentos
- expande abreviaturas frecuentes como `1ER`, `2DO`, `NRO`, `NUM.`
- reemplaza signos por espacios
- colapsa espacios repetidos

### Alias de encabezado soportados

Actualmente hay alias explicitos para campos sensibles como:

- `REGIMEN DE AFILIACION`
- `GRUPO POBLACIONAL`
- `ETNIA`
- `MUNICIPIO DE RESIDENCIA`
- `FACTOR DE RIESGO POR PA`
- `REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM)`

### Estrategia de matching

1. Exacto/canonico.
2. Alias canonicos.
3. Fuzzy score usando `rapidfuzz` si esta instalado.
4. Fallback local con `difflib` si `rapidfuzz` no esta disponible.

## 9. Tipos de dato soportados

El sistema trabaja con cinco tipos base.

### `TEXT`

- se preserva como texto limpio
- si queda vacio, se usa `SIN DATO`

### `INT`

- soporta numeros enteros puros
- soporta texto con separadores mezclados
- soporta decimales convertibles a entero
- si la variable es `MUNICIPIO DE RESIDENCIA`, intenta mapear nombres de municipios a codigo DANE
- si falla, usa `0`

### `DECIMAL`

- soporta coma o punto decimal
- soporta mezcla de separadores de miles y decimales
- exporta redondeado a maximo 2 decimales
- si falla, usa `0`

### `DATE`

- soporta ISO `YYYY-MM-DD`
- soporta `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY/MM/DD`, `MM/DD/YYYY`
- soporta fechas compactas `ddmmyyyy` o `yyyymmdd`
- soporta seriales de fecha de Excel
- si falla, usa `1900-01-01`

### `SET`

- valida contra un catalogo permitido
- soporta alias de campo
- soporta codigos numericos en ciertos catalogos
- soporta busqueda fuzzy para errores de digitacion
- si falla, usa un valor neutro del catalogo: `SIN DATO`, `NO APLICA`, `NORMAL`, `NO` o el primer permitido

## 10. Reglas de autocorreccion activas

Las reglas activas viven principalmente en [backend/validators.py](backend/validators.py).

### 10.1 Limpieza de valores malformados

Antes de validar, `clean_malformed()` corrige valores anormales como:

- `SINDATO` -> `SIN DATO`
- `SINDATOS` -> `SIN DATO`
- `AC` -> `SIN DATO`

### 10.2 Alias de municipios

Existe un mapa de nombres de municipio a codigo, entre ellos:

- RIOHACHA -> 44001
- MAICAO -> 44430
- URIBIA -> 44847
- VALLEDUPAR -> 20001
- SAN DIEGO -> 20750

Tambien soporta coincidencia parcial contra alias conocidos.

### 10.3 Alias de conjuntos categoricos

Campos con reglas especiales:

- `REGIMEN DE AFILIACION`
- `GRUPO POBLACIONAL`
- `ETNIA`
- `FACTOR DE RIESGO POR PA`
- `CLASIFICACION DE HTA`
- `CLASIFICACION DE HTA ULTIMA`

Ejemplos activos:

- `SUBS`, `SUBSIDIADA`, `SISBEN` -> `SUBSIDIADO`
- `CONTRIB`, `COTIZANTE`, `EPS` -> `CONTRIBUTIVO`
- `COMUNIDADES INDIGENAS` -> `OTRO GRUPO POBLACIONAL`
- `VICTIMAS DEL CONFLICTO ARMADO` -> `OTRO GRUPO POBLACIONAL`
- `GUAJIRO` -> `WAYUU`
- `ETTE`, `ENNAKA` -> `CHIMILA`
- `PRE HTA`, `PREHIPERTENSION`, `HIPOTENSION` -> `NORMAL`

### 10.4 Campos con codigos numericos embebidos

Para ciertos `SET` el sistema entiende valores numericos como catalogos enumerados.

Se usa en:

- `GRUPO POBLACIONAL`
- `ETNIA`

Ademas reconoce codigos dentro de textos como `1-WAYUU` o `COD 3`.

### 10.5 Fuzzy matching por campo

Umbrales especiales:

- `GRUPO POBLACIONAL`: 0.62
- `ETNIA`: 0.60
- `ETNIA` tiene ademas fallback tolerante a 0.45

### 10.6 Campos de control mensual en RCV

Si el campo empieza por `CONTROL REALIZADO POR ...`, el motor interpreta textos como:

- contiene `INTERNISTA` -> `INTERNISTA`
- contiene `MEDICO` -> `MEDICO GENERAL`
- contiene `NUTRI` -> `NUTRICIONISTA`
- contiene `ENFERMER` -> `ENFERMERIA`

### 10.7 Regla especial para hemoglobina glicosilada

En `REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM)`:

- `NO APLICA`
- `N/A`
- `NA`
- `SIN DATO`
- `PENDIENTE`

se convierten a `0`.

### 10.8 Redondeo decimal

La exportacion decimal usa `format_decimal()`:

- redondea a maximo 2 decimales
- elimina ceros innecesarios al final

Ejemplos:

- `47.7790880503` -> `47.78`
- `47.70` -> `47.7`
- `47.00` -> `47`

## 11. Defaults seguros de exportacion

La funcion `safe_default_for_required()` define el fallback base.

### Para `SET`

Busca en este orden:

- `SIN DATO`
- `NO APLICA`
- `NORMAL`
- `NO`
- si nada aplica, usa el primer valor permitido

### Para `INT`

- `0`

### Para `DECIMAL`

- `0`

### Para `DATE`

- `1900-01-01`

### Para `TEXT`

- `SIN DATO`

Actualmente esos defaults se usan para evitar vacios no solo en campos requeridos, sino practicamente en toda la salida cuando la conversion no produce un valor util.

## 12. Auditoria y metricas

El backend devuelve:

- `total`: numero de registros procesados
- `errors`: celdas que terminaron en estado error
- `corrected`: celdas modificadas por el motor
- `ok`: celdas que no necesitaron cambio
- `quality_percent`: porcentaje derivado de errores sobre total de celdas

`logs_sample` incluye por cada cambio:

- fila
- columna
- valor original
- valor corregido
- estado

En frontend esto se visualiza tanto a nivel de tabla como de auditoria textual.

## 13. Frontend: comportamiento por componente

### [frontend/src/App.jsx](frontend/src/App.jsx)

Responsabilidades:

- carga lista de plantillas
- mantiene estado global de carga, mapeo, resumen y auditoria
- procesa uno o varios archivos
- ejecuta revalidacion
- lanza exportacion
- muestra modo estricto o flexible
- presenta estadisticas, estructura, mapeo, vista previa y logs

Estados principales:

- `mapping`
- `summary`
- `logs`
- `correctedText`
- `rawText`
- `selectedFileName`
- `batchResults`
- `templates`
- `selectedTemplate`
- `templateNames`
- `currentTemplateLabel`
- `loading`
- `reprocessing`
- `progress`
- `error`
- `auditQuery`
- `auditStatus`
- `mappingStats`
- `structureValidation`
- `strictMode`
- `minTemplateCoverage`

### [frontend/src/api.js](frontend/src/api.js)

Funciones:

- `fetchTemplates()`
- `uploadFile()`
- `revalidateData()`
- `exportFile()`

Base URL configurable mediante `VITE_API_BASE`, por defecto `http://localhost:8000`.

### [frontend/src/components/DragDrop.jsx](frontend/src/components/DragDrop.jsx)

- filtra extensiones permitidas
- soporta uno o varios archivos
- emite un archivo unico o un arreglo de archivos

### [frontend/src/components/MappingEditor.jsx](frontend/src/components/MappingEditor.jsx)

- permite buscar encabezado origen o destino
- permite reasignar manualmente cada columna origen a una variable de plantilla
- muestra si un encabezado esta asignado o vacio

### [frontend/src/components/DataGridTable.jsx](frontend/src/components/DataGridTable.jsx)

- parsea `corrected_text`
- muestra registros filtrables
- detalla cada columna segun el orden de la plantilla
- marca cada celda como `Ok`, `Corregido` o `Error`

### [frontend/src/components/StatsCard.jsx](frontend/src/components/StatsCard.jsx)

- visualiza metricas resumen

### [frontend/src/index.css](frontend/src/index.css)

Direccion visual:

- tipografias `Manrope` y `Sora`
- fondo con gradientes suaves verdes
- tarjetas translucidas estilo glass
- identidad de color centrada en verde institucional

## 14. Plantilla RCV

### Resumen

- Clave: `rcv`
- Etiqueta: `Plantilla RCV`
- Descripcion: riesgo cardiovascular y seguimiento cronico
- Total variables: 118
- Distribucion por tipo:
  - `TEXT`: 18
  - `INT`: 12
  - `DATE`: 34
  - `SET`: 36
  - `DECIMAL`: 18

### Inventario completo de variables RCV

Formato: `Indice. Nombre | Tipo | Requerido | Permitidos si aplica`

1. NOMBRE_1 | TEXT | True
2. NOMBRE_2 | TEXT | True
3. APELLIDO_1 | TEXT | True
4. APELLIDO_2 | TEXT | True
5. TIPO DE IDENTIFICACIÓN | TEXT | True
6. NUMERO DE IDENTIFICACIÓN | INT | True
7. FECHA DE NACIMIENTO | DATE | True
8. 60 Y MAS AÑOS ? | SET | True | SI, NO
9. EDAD | INT | True
10. SEXO | SET | True | MASCULINO, FEMENINO
11. REGIMEN DE AFILIACION | SET | True | SUBSIDIADO, CONTRIBUTIVO
12. PERTENECIA ETNICA | SET | True | INDIGENA, MESTIZO, NINGUNAS DE LAS ANTERIORES
13. GRUPO POBLACIONAL | SET | True | CABEZA DE FAMILIA, JOVENES VULNERABLES, POBLACION INFANTIL A CARGO DEL ICBF, MUJER CABEZA DE HOGAR, DISCAPACITADOS, OTRO GRUPO POBLACIONAL, DESMOVILIZADOS, ADULTO MAYOR
14. ETNIA | SET | True | WAYUU, ARHUACO, WIWA, YUKPA, KOGI, INGA, KANKUAMO, CHIMILA
15. DEPARTAMENTO DE RESIDENCIA | TEXT | True
16. MUNICIPIO DE RESIDENCIA | INT | True
17. NUMERO DE TELEFONO | INT | True
18. ZONA DE UBICACION DE LA VIVIENDA | SET | True | RURAL, URBANA
19. DIRECCION | TEXT | True
20. ASENTAMIENTO/RANCHERIA/COMUNIDAD | TEXT | True
21. CODIGO DE LA IPS QUE HACE SEGUIMIENTO | INT | True
22. NOMBRE DE LA IPS QUE HACE SEGUIMIENTO | TEXT | True
23. FECHA INSCRIPCION PROGRAMA DE HTA - DM | DATE | True
24. FUMA | SET | True | SI, NO
25. CONSUMO DE ALCOHOL | SET | True | SI, NO
26. DX CONFIRMADO HTA | TEXT | True
27. FECHA DX HTA | DATE | True
28. DX CONFIRMADO DM | TEXT | True
29. FECHA DX DM | DATE | True
30. TIPO DE DM | SET | True | TIPO 1 INSULINODEPENDIENTE, TIPO 2 NO INSULINODEPENDIENTE, NO APLICA
31. ETIOLOGIA DE LA ERC | SET | True | HTA O DM, AUTOINMUNE, NEFROPATIA OBSTRUCTIVA, ENFERMEDAD POLIQUISTICA, NO TIENE ERC, OTRAS
32. TENSION ARTERIAL SISTOLICA AL INGRESO A BASE | INT | True
33. TENSION ARTERIAL DIASTOLICA AL INGRESO A BASE | INT | True
34. CLASIFICACION DE HTA | SET | True | ESTADIO1, ESTADIO2, ESTADIO3, NORMAL, SIN DATO
35. HTA CONTROLADA | SET | True | SI, NO, SIN DATO
36. ULTIMO PESO | INT | True
37. TALLA | DECIMAL | True
38. IMC | DECIMAL | True
39. CLASIFICACION DE IMC | TEXT | True
40. ULTIMA MEDICION DE PERIMETRO ABDOMINAL | DECIMAL | True
41. FACTOR DE RIESGO POR PA | SET | True | CLASIFICACION DEL RIESGO ALTO, CLASIFICACION DEL RIESGO BAJO
42. CLASIFICACION DEL RCV ACTUAL AL INGRESO A BASE | SET | True | RIESGO ALTO, RIESGO BAJO, RIESGO MODERADO, NO SE CLASIFICO
43. FECHA DE CLASIFICACION DE RCV AL INGRESO A BASE | DATE | True
44. CLASIFICACION DEL RCV ACTUAL | SET | True | RIESGO ALTO, RIESGO BAJO, RIESGO MODERADO, NO SE CLASIFICO
45. FECHA DE CLASIFICACION DE RCV | DATE | True
46. HEMOGRAMA | DECIMAL | True
47. FECHA DEL HEMOGRAMA | DATE | True
48. GLICEMIA BASAL | DECIMAL | True
49. FECHA DE GLICEMIA BASAL | DATE | True
50. PARCIAL DE ORINA | SET | True | NORMAL, PROTEINURA, HEMATURIA, OTRA, SIN DATO
51. FECHA PARCIAL DE ORINA | DATE | True
52. CREATININA SANGRE (mg/dl) | DECIMAL | True
53. FECHA CREATININA SANGRE | DATE | True
54. COLESTEROL TOTAL | DECIMAL | True
55. HDL | DECIMAL | True
56. LDL | DECIMAL | True
57. TRIGLICERIDOS | DECIMAL | True
58. FECHA PERFIL LIPIDICO | DATE | True
59. FECHA DE SOLICITUD DE HEMOGLOBINA GLICOSILADA | DATE | True
60. REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM) | DECIMAL | True
61. FECHA DE REPORTE DE HEMOGLOBINA GLICOSILADA | DATE | True
62. DM CONTROLADA | SET | True | SI, NO, NO APLICA
63. ALBUMINURIA | INT | True
64. FECHA ALBUMINURIA | DATE | True
65. REPORTE DE EKG | SET | True | NORMAL, ANORMAL, SIN DATO
66. FECHA DE EKG | DATE | True
67. ECOCARDIOGRAMA | INT | True
68. FECHA DE REPORTE DEL ECOCARDIOGRAMA | DATE | True
69. AJUSTE TFG POR GENERO | DECIMAL | True
70. TFG AJUSTADA POR GENERO FORMULA COCKCROFT AND GAULT | DECIMAL | True
71. TFG FORMULA COCKCROFT AND GAULT ACTUAL | DECIMAL | True
72. TFG FORMULA COCKCROFT AND GAULT ANTERIOR | DECIMAL | True
73. VARIABILIDAD | DECIMAL | True
74. FECHA DE CREATININA ACTUAL | DATE | True
75. CREATININA ACTUAL | DECIMAL | True
76. FECHA CREATINNINA ANTERIOR | DATE | True
77. CREATININA ANTERIOR | DECIMAL | True
78. ESTADIO SEGUN TFG | SET | True | ESTADIO1, ESTADIO2, ESTADIO3, ESTADIO4, ESTADIO5, SIN DATO
79. DESCRIPCION DEL DANO RENAL | TEXT | True
80. ENERO FECHA | DATE | True
81. CONTROL REALIZADO POR ENERO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
82. FEBRERO FECHA | DATE | True
83. CONTROL REALIZADO POR FEBRERO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
84. MARZO FECHA | DATE | True
85. CONTROL REALIZADO POR MARZO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
86. ABRIL FECHA | DATE | True
87. CONTROL REALIZADO POR ABRIL | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
88. MAYO FECHA | DATE | True
89. CONTROL REALIZADO POR MAYO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
90. JUNIO FECHA | DATE | True
91. CONTROL REALIZADO POR JUNIO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
92. JULIO FECHA | DATE | True
93. CONTROL REALIZADO POR JULIO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
94. AGOSTO FECHA | DATE | True
95. CONTROL REALIZADO POR AGOSTO | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
96. SEPTIEMBRE FECHA | DATE | True
97. CONTROL REALIZADO POR SEPTIEMBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
98. OCTUBRE FECHA | DATE | True
99. CONTROL REALIZADO POR OCTUBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
100. NOVIEMBRE FECHA | DATE | True
101. CONTROL REALIZADO POR NOVIEMBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
102. DICIEMBRE FECHA | DATE | True
103. CONTROL REALIZADO POR DICIEMBRE | SET | True | INTERNISTA, MEDICO GENERAL, NUTRICIONISTA, ENFERMERIA, SIN DATO
104. FECHA DE PROXIMO CONTROL | DATE | True
105. ULTIMA TENSION ARTERIAL SISTOLICA | INT | True
106. ULTIMA TENSION ARTERIAL DIASTOLICA | INT | True
107. CLASIFICACION DE HTA ULTIMA | SET | True | ESTADIO1, ESTADIO2, ESTADIO3, ESTADIO4, ESTADIO5, SIN DATO, NORMAL
108. FECHA DE LA ULTIMA TOMA DE PRESION ARTERIAL REPORTADO EN HISTORIA CLINICA | DATE | True
109. HTA CONTROLADA ULTIMA | SET | True | SI, NO, SIN DATO
110. TRATAMIENTO ANTIHIPERTENSIVO Y/O DIABETES MELLITUS | TEXT | True
111. ADHERENCIA AL TRATAMIENTO FARMACOLOGICO (TEST DE MORISKY GREEN) | SET | True | SI, NO, SIN DATO
112. REMITIDO A | TEXT | True
113. FECHA DE REMISION | DATE | True
114. COMPLICACIONES | TEXT | True
115. NOVEDADES | SET | True | FALLECIDO, NUEVO, RETIRADO, ACTIVO, SIN DATO
116. CAUSA DE MUERTE | TEXT | True
117. FECHA DE MUERTE | DATE | True
118. OBSERVACIONES | TEXT | True

## 15. Plantilla Gestante

### Resumen

- Clave: `gestante`
- Etiqueta: `Plantilla Gestante`
- Descripcion: ruta materno perinatal y controles prenatales
- Total variables: 207
- Distribucion por tipo:
  - `SET`: 68
  - `INT`: 31
  - `TEXT`: 41
  - `DATE`: 60
  - `DECIMAL`: 7

### Nota sobre nombres duplicados

La plantilla Gestante contiene nombres repetidos en la fuente funcional. El builder los vuelve unicos agregando sufijos `_2`, `_3`, etc. para que cada columna tenga identidad tecnica propia.

### Inventario completo de variables Gestante

Formato: `Indice. Nombre | Tipo | Requerido | Permitidos si aplica`

1. TIPO DE DOCUMENTO DE IDENTIDAD | SET | True | MENOR SIN IDENTIFICACION, TARJETA IDENTIDAD, CEDULA, ADULTO SIN IDENTIFICACION, REGISTRO CIVIL, CARNE DIPLOMATICO, CEDULA DE EXTRANJERIA, PASAPORTE
2. NO. DE IDENTIFICACION | INT | True
3. APELLIDO_1 | TEXT | True
4. APELLIDO_2 | TEXT | True
5. NOMBRE_1 | TEXT | True
6. NOMBRE_2 | TEXT | True
7. FECHA DE NACIMIENTO | DATE | True
8. EDAD | INT | True
9. SEXO | SET | True | FEMENINO, MASCULINO
10. REGIMEN DE AFILIACION | SET | True | SUBSIDIADO, CONTRIBUTIVO
11. PERTENECIA ETNICA | SET | True | INDIGENA, MESTIZO, NINGUNAS DE LAS ANTERIORES
12. GRUPO POBLACIONAL | SET | True | CABEZA DE FAMILIA, JOVENES VULNERABLES, POBLACION INFANTIL A CARGO DEL ICBF, MUJER CABEZA DE HOGAR, DISCAPACITADOS, OTRO GRUPO POBLACIONAL, DESMOVILIZADOS, ADULTO MAYOR
13. DEPARTAMENTO DE RESIDENCIA | TEXT | True
14. MUNICIPIO DE RESIDENCIA | INT | True
15. ZONA | SET | True | RURAL, URBANA
16. ETNIA | SET | True | WAYUU, ARHUACO, WIWA, YUKPA, KOGI, INGA, KANKUAMO, CHIMILA
17. ASENTAMIENTO/RANCHERIA/COMUNIDAD | TEXT | True
18. TELEFONO USUARIA | INT | True
19. DIRECCION | TEXT | True
20. NIVEL EDUCATIVO | TEXT | True
21. DISCAPACIDAD | SET | True | SI, NO
22. MUJER CABEZA DE HOGAR | SET | True | SI, NO, NO APLICA
23. OCUPACION | TEXT | True
24. ESTADO CIVIL | TEXT | True
25. CONTROL TRADICIONAL | SET | True | SABEDOR ANCESTRAL, PARTERA (O), SOBANDERA (O), NO APLICA
26. GESTANTE RENUENTE | SET | True | GESTANTE RENUENTE
27. INASISTENTE | TEXT | True
28. NOMBRE DE LA IPS PRIMARIA | TEXT | True
29. FECHA DE DIAGNOSTICO | DATE | True
30. FECHA DE INGRESO AL CONTROL PRENATAL | DATE | True
31. FUM | DATE | True
32. FPP | DATE | True
33. DIAS PARA EL PARTO | INT | True
34. ALARMA | TEXT | True
35. EDAD GEST INICIO CONTROL | DECIMAL | True
36. TRIMESTRE INICIO CONTROL | SET | True | PRIMER TRIMESTRE, SEGUNDO TRIMESTRE, TERCER TRIMESTRE
37. G | INT | True
38. P | INT | True
39. C | INT | True
40. A | INT | True
41. M | INT | True
42. V | INT | True
43. HIPERTENSION ARTERIAL | SET | True | SI, NO
44. DIABETES | SET | True | SI, NO
45. VIH | SET | True | SI, NO
46. SIFILIS | SET | True | SI, NO
47. TUBERCULOSIS | SET | True | SI, NO
48. OTRAS CONDICIONES MEDICAS GRAVES | SET | True | SI, NO
49. SI LA RESPUESTA ANTERIOR ES SI DESCRIBA LA OTRA CONDICION MEDICA GRAVE | TEXT | True
50. ANTECEDENTES DE EVENTOS OBSTETRICOS DESFAVORABLES | SET | True | SI, NO
51. PERIODO INTERGENESICO | INT | True
52. PESO INICIAL (KG) | DECIMAL | True
53. TALLA (METROS) | DECIMAL | True
54. INDICE DE MASA CORPORAL (IMC) | DECIMAL | True
55. CLASIFICACION DE IMC | TEXT | True
56. APOYO FAMILIAR | SET | True | SI, NO
57. EMBARAZO DESEADO | SET | True | SI, NO
58. HABITOS DE RIESGO | SET | True | SI, NO
59. HA SIDO VICTIMA DE VIOLENCIA FISICA O PSICOLOGICA | SET | True | SI, NO
60. HA SIDO VICTIMA DE ABUSO SEXUAL | SET | True | SI, NO
61. SE IDENTIFICAN CAUSALES PARA IVE? | SET | True | SI, NO
62. CLASIFICACION DEL RIESGO | SET | True | CLASIFICACION DEL RIESGO ALTO, CLASIFICACION DEL RIESGO BAJO
63. CAUSAS DE ALTO RIESGO | TEXT | True
64. PUNTAJE DE CLASIFICACION SEGUN ESCALA DE HERRERA Y HURTADO | TEXT | True
65. REMITIDA A ESPECIALISTA? | SET | True | SI, NO, SIN DATO
66. DESCRIBA CUAL(ES) ESPECIALISTAS LA HAN ATENDIDO | TEXT | True
67. ASESORIA PRUEBA VIH | DATE | True
68. TRIMESTRE ASESORIA VIH | INT | True
69. FECHA TOMA PRUEBA VIH PRIMER TAMIZAJE | DATE | True
70. RESULTADO PRIMER TAMIZAJE PRUEBA DE VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
71. TRIMESTRE TOMA PRUEBA VIH PRIMER TAMIZAJE | INT | True
72. FECHA TOMA PRUEBA VIH SEGUNDO TAMIZAJE | DATE | True
73. RESULTADO SEGUNDO TAMIZAJE PRUEBA DE VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
74. TRIMESTRE TOMA PRUEBA VIH SEGUNDO TAMIZAJE | INT | True
75. FECHA TOMA PRUEBA VIH TERCER TAMIZAJE | DATE | True
76. RESULTADO TERCER TAMIZAJE PRUEBA DE VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
77. TRIMESTRE TOMA PRUEBA VIH TERCER TAMIZAJE | INT | True
78. FECHA PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS | DATE | True
79. RESULTADO PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS | SET | True | POSITIVO, NEGATIVO, SIN DATO
80. TRIMESTRE PRIMERA PRUEBA TREPONEMICA RAPIDA SIFILIS | INT | True
81. FECHA SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS | DATE | True
82. RESULTADO SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS | SET | True | POSITIVO, NEGATIVO, SIN DATO
83. TRIMESTRE SEGUNDA PRUEBA TREPONEMICA RAPIDA SIFILIS | INT | True
84. FECHA TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS | DATE | True
85. RESULTADO TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS | SET | True | POSITIVO, NEGATIVO, SIN DATO
86. TRIMESTRE TERCERA PRUEBA TREPONEMICA RAPIDA SIFILIS | INT | True
87. FECHA TOMA SEGUNDA PRUEBA VIH | TEXT | True
88. RESULTADO TOMA SEGUNDA PRUEBA VIH | SET | True | POSITIVO, NEGATIVO, SIN DATO
89. TRIMESTRE TOMA SEGUNDA PRUEBA VIH | SET | True | PRIMER TRIMESTRE, SEGUNDO TRIMESTRE, TERCER TRIMESTRE, SIN DATO
90. FECHA PRUEBA CONFIRMATORIA SEGUN ALGORITMO | DATE | True
91. TRIMESTRE PRUEBA CONFIRMATORIA SEGUN ALGORITMO | INT | True
92. FECHA DE DIAGNOSTICO DE SIFILIS | DATE | True
93. TRATAMIENTO INSTAURADO | TEXT | True
94. FECHA DE INICIO DEL TRATAMIENTO | DATE | True
95. FECHA DE SEGUNDA DOSIS DEL TRATAMIENTO | DATE | True
96. FECHA DE TERCERA DOSIS DEL TRATAMIENTO | DATE | True
97. FECHA DE TOMA DE UROCULTIVO | DATE | True
98. RESULTADO UROCULTIVO | SET | True | POSITIVO, NEGATIVO, SIN DATO
99. FECHA TOMA GLICEMIA | DATE | True
100. RESULTADO GLICEMIA | INT | True
101. FECHA PRUEBA DE TOLERANCIA ORAL GLUCOSA | DATE | True
102. RESULTADO PRUEBA DE TOLERANCIA ORAL GLUCOSA | INT | True
103. FECHA REALIZACION HEMOGLOBINA | DATE | True
104. RESULTADO HEMOGLOBINA | DECIMAL | True
105. RESULTADO REALIZACION HEMOCLASIFICACION (FACTOR RH) | TEXT | True
106. FECHA DE ANTIGENO SUPERFICIE HEPATITIS B | DATE | True
107. RESULTADO ANTIGENO SUPERFICIE HEPATITIS B | SET | True | POSITIVO, NEGATIVO, SIN DATO
108. FECHA TAMIZAJE TOXOPLASMA | DATE | True
109. RESULTADO TOXOPLASMA | SET | True | POSITIVO, NEGATIVO, SIN DATO
110. FECHA DE LA PRUEBA DE RUBEOLA | DATE | True
111. RESULTADO RUBEOLA | SET | True | POSITIVO, NEGATIVO, SIN DATO
112. FECHA CITOLOGIA CERVICOUTERINA | DATE | True
113. RESULTADO TAMIZAJE DE CUELLO UTERINO | SET | True | POSITIVO, NEGATIVO, SIN DATO
114. FECHA PRUEBA DE TAMIZAJE PARA ESTREPTOCOCO GRUPO B | DATE | True
115. RESULTADO PRUEBA DE TAMIZAJE PARA ESTREPTOCOCO GRUPO B | SET | True | POSITIVO, NEGATIVO, SIN DATO
116. FECHA TOMA DE GOTA GRUESA (MALARIA) | DATE | True
117. RESULTADO GOTA GRUESA (MALARIA) | SET | True | POSITIVO, NEGATIVO, SIN DATO
118. FECHA DE REALIZACION TAMIZAJE CHAGAS | DATE | True
119. RESULTADO CHAGAS | SET | True | POSITIVO, NEGATIVO, SIN DATO
120. FECHA DE APLICACION INFLUENZA (DESDE SEMANA 14) | DATE | True
121. FECHA DE APLICACION TOXOIDE SEGUN ANTECEDENTE VACUNAL | DATE | True
122. FECHA DE APLICACION DPT ACELULAR (SEMANA 26) | DATE | True
123. FECHA CONSULTA ODONTOLOGICA | DATE | True
124. ECOGRAFIA OBSTETRICA CON TRANSLUCENCIA NUCAL (10,6 - 13,6) | DATE | True
125. ECOGRAFIA OBSTETRICA PARA LA DETECCION DE ANOMALIAS ESTRUCTURALES (18 - 23) | DATE | True
126. OTRAS ECOGRAFIAS? | DATE | True
127. FECHA SUMINISTRO ACIDO FOLICO | DATE | True
128. FECHA SUMINISTRO CALCIO (SEMANA 14) | DATE | True
129. FECHA SUMINISTRO HIERRO | DATE | True
130. FECHA SUMINISTRO ASA | DATE | True
131. FECHA DESPARASITACION ANTIHELMINTICA II Y III TRIMESTRE (ALBENDAZO 400 MG DOSIS UNICA) | DATE | True
132. FECHA 1ER CONTROL | DATE | True
133. QUIEN REALIZO EL CONTROL | TEXT | True
134. FECHA 2DO CONTROL | DATE | True
135. QUIEN REALIZO EL CONTROL_2 | TEXT | True
136. FECHA 3ER CONTROL | DATE | True
137. QUIEN REALIZO EL CONTROL_3 | TEXT | True
138. FECHA 4TO CONTROL | DATE | True
139. QUIEN REALIZO EL CONTROL_4 | TEXT | True
140. FECHA 5TO CONTROL | DATE | True
141. QUIEN REALIZO EL CONTROL_5 | TEXT | True
142. FECHA 6TO CONTROL | DATE | True
143. QUIEN REALIZO EL CONTROL_6 | TEXT | True
144. FECHA 7MO CONTROL | DATE | True
145. QUIEN REALIZO EL CONTROL_7 | TEXT | True
146. FECHA 8VO CONTROL | DATE | True
147. QUIEN REALIZO EL CONTROL_8 | TEXT | True
148. FECHA 9NO CONTROL | DATE | True
149. QUIEN REALIZO EL CONTROL_9 | TEXT | True
150. NUMERO TOTAL DE CONTROLES PRENATALES | INT | True
151. ULTIMO CONTROL PRENATAL | DATE | True
152. EDAD GESTACIONAL ACTUAL | INT | True
153. PESO ACTUAL | INT | True
154. TALLA ACTUAL | DECIMAL | True
155. IMC | DECIMAL | True
156. TA ACTUAL | INT | True
157. FECHA PRIMERA CONSULTA GINECOLOGIA | DATE | True
158. FECHA SEGUNDA CONSULTA GINECOLOGIA | DATE | True
159. FECHA TERCERA CONSULTA GINECOLOGIA | DATE | True
160. FECHA CONSULTA NUTRICION | DATE | True
161. FECHA CONSULTA PSICOLOGIA | DATE | True
162. FECHA DE ATENCION OTRO ESPECIALISTA | DATE | True
163. QUIEN REALIZO LA CONSULTA | TEXT | True
164. TIPO DE ABORTO | SET | True | ESPONTANEO, INDUCIDO, SIN DATO
165. FECHA | DATE | True
166. SEMANAS DE GESTACION | INT | True
167. COMPLICACIONES | TEXT | True
168. FECHA DE PARTO | DATE | True
169. CARACTERISTICAS DEL PARTO | SET | True | PARTO VAGINAL, CESAREA, TRADICIONAL, SIN DATO
170. PARTO ATENDIDO POR | SET | True | IPS BAJA COMPLEJIDAD, IPS MEDIANA O ALTA, PARTERA, MEDICO TRADICIONAL, SIN DATO
171. NO.SEMANAS DE GESTACION | INT | True
172. COMPLICACIONES DURANTE EL PARTO | SET | True | SI, NO, SIN DATO
173. TIPO COMPLICACION | TEXT | True
174. UCI MATERNA | SET | True | SI, NO, SIN DATO
175. TOMA DE PRUEBAS ITS INTRAPARTO | SET | True | SI, NO, SIN DATO
176. RESULTADO POSITIVO | SET | True | SI, NO, SIN DATO
177. FECHA DE DEFUNCION | DATE | True
178. CAUSA DE LA DEFUNCION | TEXT | True
179. MULTIPLICIDAD DEL EMBARAZO | SET | True | SIMPLE, DOBLE, TRIPLE, CUADRUPLE O MAS, SIN DATO
180. REGISTRO CIVIL RECIEN NACIDO 1 | TEXT | True
181. NOMBRE RECIEN NACIDO 1 | TEXT | True
182. SEXO RECIEN NACIDO 1 | SET | True | FEMENINO, MASCULINO, SIN DATO
183. PESO AL NACER (GRS) | INT | True
184. CONDICION DEL RECIEN NACIDO | SET | True | VIVO, MUERTO, SIN DATO
185. TOMA TSH RECIEN NACIDO 1 | SET | True | SI, NO, SIN DATO
186. DX HIPOTIROIDISMO | SET | True | SI, NO, SIN DATO
187. TTO HIPOTIROIDISMO | SET | True | SI, NO, SIN DATO
188. TIEMPO DE LECTURA | TEXT | True
189. UCI NEONATAL RECIEN NACIDO 1 | SET | True | SI, NO, SIN DATO
190. VACUNACION CON BCG | SET | True | SI, NO, SIN DATO
191. VACUNACION ANTIHEPATITIS B | SET | True | SI, NO, SIN DATO
192. REGISTRO CIVIL RECIEN NACIDO 2 | INT | True
193. NOMBRE RECIEN NACIDO 2 | TEXT | True
194. SEXO RECIEN NACIDO 2 | SET | True | FEMENINO, MASCULINO, SIN DATO
195. PESO AL NACER RECIEN NACIDO 2 (GRS) | INT | True
196. CONDICION DEL RECIEN NACIDO_2 | SET | True | VIVO, MUERTO, SIN DATO
197. TOMA TSH RECIEN NACIDO 2 | SET | True | SI, NO, SIN DATO
198. DX HIPOTIROIDISMO_2 | SET | True | SI, NO, SIN DATO
199. TIEMPO DE LECTURA RECIEN NACIDO 2 | TEXT | True
200. UCI NEONATAL RECIEN NACIDO 2 | SET | True | SI, NO, SIN DATO
201. TTO HIPOTIROIDISMO RECIEN NACIDO 2 | SET | True | SI, NO, SIN DATO
202. VACUNACION CON BCG_2 | SET | True | SI, NO, SIN DATO
203. VACUNACION ANTIHEPATITIS B_2 | SET | True | SI, NO, SIN DATO
204. TIPO | SET | True | DIU, INYECCION MENSUAL, INYECCION TRIMESTRAL, PILDORAS, CONDON, POMEROY, RENUENTE, SIN DATO
205. OBSEVACION | TEXT | True
206. FECHA_2 | DATE | True
207. OBSERVACIONES GENERALES | TEXT | True

## 16. Como se construyo este contexto

Este documento fue reconstruido directamente desde el codigo del proyecto, no desde suposiciones.

### Fuentes leidas

- registro de plantillas
- definiciones completas de RCV y Gestante
- endpoints y flujo de backend
- utilidades de mapeo
- motor de validacion y correccion
- componentes frontend y cliente API
- dependencias declaradas

### Metodo usado

1. Se leyo la arquitectura del repo.
2. Se identifico el flujo real de carga, validacion y exportacion.
3. Se extrajo el inventario vivo de variables desde el registro de plantillas con Python para evitar omisiones.
4. Se consolidaron reglas, defaults y comportamiento de UI/backend en un unico archivo.

## 17. Estado actual importante

Al momento de generar este contexto, la aplicacion ya incorpora estos ajustes relevantes:

- limpieza de valores malformados como `SINDATO`
- fallback seguro para evitar vacios en exportacion
- redondeo decimal a maximo 2 decimales
- soporte de alias de municipios, regimen, etnia, grupo poblacional y clasificacion HTA
- soporte de revalidacion con mapeo manual
- control de estructura y cobertura de mapeo en UI

## 18. Limitaciones y observaciones tecnicas

- La plantilla Gestante tiene nombres funcionales repetidos; por eso internamente algunos campos usan sufijos `_2`, `_3`, etc.
- El frontend historico conserva [frontend/src/template_list.js](frontend/src/template_list.js) solo para la lista RCV, pero la aplicacion activa ya consume el registro de plantillas desde backend.
- Los campos `TEXT` aceptan practicamente cualquier contenido y su validacion es mas de presencia que de catalogo.
- El porcentaje de calidad actual se calcula en funcion de errores finales, no en funcion del numero de correcciones aplicadas.

## 19. Conclusion

La aplicacion es un normalizador y validador institucional de datos clinicos orientado a recuperar la mayor cantidad de informacion posible sin romper el cargue final. Su diseño actual prioriza:

- tolerancia a encabezados imperfectos
- autocorreccion de valores frecuentes
- eliminacion de vacios peligrosos en exportacion
- trazabilidad de cambios por auditoria
- soporte operativo para dos plantillas institucionales grandes y distintas

Este archivo queda como referencia integral del proyecto y de sus plantillas vigentes.