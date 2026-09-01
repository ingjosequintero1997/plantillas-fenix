# Análisis Completo de la Aplicación - Validador IPS

**Última actualización:** 2026-09-01  
**Versión del análisis:** 1.0

---

## 1. RESUMEN EJECUTIVO

### Propósito
Aplicación web para validación, normalización y exportación de datos de salud en plantillas estandarizadas. Recibe archivos TXT o Excel de distintos formatos, los mapea contra una plantilla oficial, valida y corrige automáticamente los datos, genera reportes de auditoría, y exporta un archivo TXT limpio listo para carga en sistemas externos.

### Módulos principales
- **Gestante**: Ruta materno perinatal y controles prenatales
- **Citología**: Tamizaje de cáncer cervicouterino
- **Mamografía**: Tamizaje de cáncer de mama
- **Penta**: Vacunación pentavalente

### Usuarios objetivo
Instituciones de salud (IPS), prestadores de servicios de salud.

### Estado
En producción con despliegue serverless en Vercel.

---

## 2. STACK TECNOLÓGICO

### Backend
```
Framework:       FastAPI (Python)
Server:          Uvicorn
Procesamiento:   Pandas, NumPy
Excel:           OpenPyXL
Matching:        RapidFuzz (con fallback a Difflib)
Fechas:          Python Dateutil
Autenticación:   JWT, SQLAlchemy
Storage:         Google Cloud Storage (GCS)
DB:              SQLAlchemy (SQLite local, PostgreSQL en producción)
```

### Frontend
```
Framework:       React 18 (JavaScript/JSX)
Build:           Vite
Estilos:         Tailwind CSS
Rutas:           React Router v7
Gráficos:        Recharts
Excel I/O:       ExcelJS, XLSX
Compresión:      Pako (gzip para localStorage)
HTTP:            Fetch API, Axios
```

### Infraestructura
```
Hosting:         Vercel (Serverless Python + Static Hosting)
API:             FastAPI + Uvicorn en /api
Frontend:        Vite build a carpeta public
Versioning:      Git + GitHub
```

---

## 3. ESTRUCTURA DEL PROYECTO

```
Proyecto Plantillas indicadores fenix/
│
├── api/
│   └── index.py                    # Entry point serverless para Vercel
│
├── backend/
│   ├── main.py                     # API FastAPI con todos los endpoints
│   ├── validators.py               # Lógica de validación y corrección por tipo
│   ├── utils.py                    # Normalización textual y fuzzy matching
│   ├── templates_registry.py       # Registro central de plantillas
│   ├── templates_registry.py       # Registro central de plantillas
│   │
│   ├── gestante_config.py          # Definición plantilla Gestante
│   ├── citologia_config.py         # Definición plantilla Citología
│   ├── mamografia_config.py        # Definición plantilla Mamografía
│   ├── penta_config.py             # Definición plantilla Penta
│   │
│   ├── auth_utils.py               # JWT, hashing, roles
│   ├── database.py                 # Modelos SQLAlchemy (User, Prestador, Cargue, etc.)
│   ├── gcs_storage.py              # Interfaz GCS
│   ├── evaluator.py                # Generación de reportes Excel
│   ├── formulas.py                 # Cálculos de indicadores
│   ├── excel_export.py             # Exportación a Excel
│   ├── indicadores_excel.py        # Generación de hojas de indicadores
│   ├── indicadores_pare.py         # Indicadores PARE
│   │
│   ├── requirements.txt            # Dependencias Python
│   ├── runtime.txt                 # Especificación de runtime (Python 3.11)
│   └── __init__.py
│
├── frontend/
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js              # Config de Vite
│   ├── tailwind.config.cjs         # Config Tailwind
│   ├── postcss.config.cjs          # Procesamiento CSS
│   ├── package.json                # Scripts y dependencias
│   │
│   └── src/
│       ├── main.jsx                # Bootstrap React
│       ├── App.jsx                 # Router y lógica principal
│       ├── AuthContext.jsx         # Gestión de autenticación (Context API)
│       ├── Login.jsx               # Página de login
│       ├── ProtectedRoute.jsx      # HOC para rutas protegidas
│       ├── api.js                  # Cliente HTTP (endpoints del backend)
│       ├── dataStore.js            # Persistencia en localStorage
│       ├── excelGenerator.js       # Utilitarios para generar Excel
│       ├── index.css               # Estilos globales
│       ├── tokens.css              # Tokens de diseño
│       │
│       ├── public/                 # Assets estáticos
│       │
│       └── components/
│           ├── TemplateSelector.jsx       # Selección inicial de plantilla
│           ├── DragDrop.jsx              # Carga de archivos (TXT/Excel)
│           ├── MappingEditor.jsx         # Editor de mapeo de columnas
│           ├── ValidationLogTable.jsx    # Tabla de logs de validación
│           ├── DataGridTable.jsx         # Vista detallada de datos
│           ├── EditableDataTable.jsx     # Edición manual de datos
│           ├── Pagination.jsx            # Control de paginación
│           ├── StatsCard.jsx             # Tarjetas de estadísticas
│           ├── QualityBanner.jsx         # Banner de calidad de datos
│           ├── ErrorBoundary.jsx         # Boundary para errores
│           ├── ErrorSummaryTable.jsx     # Resumen de errores
│           │
│           ├── DashboardLayout.jsx       # Layout principal autenticado
│           ├── DashboardHome.jsx         # Home del dashboard
│           ├── FormularioRegistro.jsx    # Formulario manual de registro
│           ├── VerificarAfiliado.jsx     # Verificación de afiliados
│           │
│           ├── HistorialView.jsx         # Vista de historial (lazy)
│           ├── PrestadoresView.jsx       # Gestión de prestadores (lazy)
│           ├── IndicadoresView.jsx       # Dashboard de indicadores (lazy)
│           ├── ConsolidacionView.jsx     # Consolidación de datos (lazy)
│           ├── HistoriasView.jsx         # Vista de historias clínicas (lazy)
│           ├── EvaluationDashboard.jsx   # Dashboard de evaluación (lazy)
│           └── DataManagement.jsx        # Gestión de datos (lazy)
│
├── vercel.json                     # Config para despliegue Vercel
├── package.json                    # Scripts de build (raíz)
├── README.md                       # Guía básica
├── CONTEXTO_APLICACION_COMPLETO.md # Documentación detallada
├── GUIA_BACKEND_DOCKER_VERCEL.md   # Guía de deployment
│
├── af_afiliado_202608281623.csv    # Archivo de prueba (afiliados)
├── test_export.txt                 # Archivo de prueba (exportación)
├── gen_test.py                     # Script generador de datos de prueba
├── make_test.py                    # Script de testing
└── x/                              # Carpeta auxiliar (sin documentar)
```

---

## 4. MÓDULOS Y PLANTILLAS

### 4.1 Plantilla Gestante (`gestante_config.py`)
**Propósito**: Validar ruta materno perinatal y controles prenatales.

**Columnas principales** (estructura tipo):
- Identificador de afiliado
- Datos demográficos (nombre, edad, municipio, zona)
- Información de embarazo (trimestre, riesgo obstétrico)
- Controles y seguimientos (médico, fechas, tipo de control)
- Pruebas (VIH, sífilis, etc.)
- Comorbilidades y factores de riesgo (HTA, diabetes, etc.)
- Información de parto
- Datos del recién nacido

**Reglas de validación**:
- Fechas en formato ISO (YYYY-MM-DD)
- Municipios validados contra catálogo
- Campos categóricos (regímenes, etnias, zonas) con autocorrección por alias
- Valores numéricos con rango permitido
- Autocorrección de Si/No a SI/NO

### 4.2 Plantilla Citología (`citologia_config.py`)
**Propósito**: Tamizaje de cáncer cervicouterino y seguimiento.

**Columnas principales**:
- Identificador y datos demográficos
- Resultado de citología
- Seguimiento posterior

### 4.3 Plantilla Mamografía (`mamografia_config.py`)
**Propósito**: Tamizaje de cáncer de mama y seguimiento.

### 4.4 Plantilla Penta (`penta_config.py`)
**Propósito**: Registro de vacunación pentavalente.

### Registro Central (`templates_registry.py`)
```python
TEMPLATE_REGISTRY = {
    "gestante": {...},
    "citologia": {...},
    "mamografia": {...},
    "penta": {...},
}
```
Cada plantilla tiene:
- `key`: identificador único
- `label`: nombre legible
- `description`: propósito
- `template_factory()`: función que retorna definición

---

## 5. FLUJO DE DATOS COMPLETO

### 5.1 Fase 1: Selección y Carga
```
Usuario selecciona plantilla
         ↓
Usuario carga archivo (TXT o Excel)
         ↓
DragDrop.jsx envía archivo al backend
         ↓
POST /upload con archivo + configuración
```

### 5.2 Fase 2: Lectura del Archivo
```
Backend recibe archivo
         ↓
Si TXT: pd.read_csv(sep='|', header=None, dtype=str)
Si Excel: pd.read_excel(header=None, dtype=str, engine='openpyxl')
         ↓
DataFrame cargado en memoria (raw_text)
```

### 5.3 Fase 3: Detección de Encabezado
```
Función: detect_header_row()
         ↓
Recorre primeras 30 filas
         ↓
Calcula similitud contra nombres esperados de plantilla
         ↓
Aplica umbrales según ancho del archivo:
  - 1-2 cols: umbral 1 hit
  - 3-5 cols: umbral 2 hits
  - 6+ cols:  umbral 4 hits
         ↓
¿Encabezado encontrado?
  SÍ → Usa esa fila como headers
  NO → Genera C1, C2, C3, ... (columnas sintéticas)
```

### 5.4 Fase 4: Normalización del DataFrame
```
Función: normalize_source_dataframe()
         ↓
- Copia del DataFrame
- Eliminación de filas completamente vacías
- Limpieza de strings (espacios, caracteres especiales)
- Recorte de columnas vacías al final
- Preservación de estructura posicional
         ↓
DataFrame normalizado
```

### 5.5 Fase 5: Inferencia de Mapeo
```
Función: infer_mapping()
         ↓
¿Headers son C1..Cn (columnas sintéticas)?
  SÍ → Mapeo posicional directo por índice
  NO → Fuzzy mapping
         ↓
Función: fuzzy_map()
  1. Normalización textual (minúsculas, acentos, espacios)
  2. Coincidencia exacta/canónica primero
  3. Fuzzy matching con RapidFuzz (fallback a Difflib)
  4. Asignación uno-a-uno evitando cruces
         ↓
Mapeo: {nombre_plantilla → índice_columna_fuente}
```

### 5.6 Fase 6: Validación y Corrección
```
Función: validate_and_correct()
         ↓
Para cada fila del archivo:
  Para cada variable de plantilla:
    1. Obtener columna origen por mapeo
    2. Extraer valor original
    3. Convertir según tipo:
       - STRING: limpieza básica
       - INT: conversión numérica
       - DATE: conversión a ISO
       - SET: validación contra catálogo + alias
       - FLOAT: conversión numérica con precisión
    4. Si no se puede convertir:
       - Intentar autocorrección (alias mapping)
       - Si falla: asignar valor por defecto
    5. Registrar estado: OK / CORRECTED / ERROR
         ↓
Registrar en log_audit
```

### 5.7 Fase 7: Estructura Validation
```
Función: structure_validation()
         ↓
Calcula métricas:
- coverage_headers: % columnas mapeadas
- coverage_template: % variables de plantilla cubiertas
- column_match: % coincidencia de columnas
- unmapped_headers: lista de columnas no mapeadas
         ↓
Si strict_mode = true:
  Genera warnings si:
  - coverage_template < min_template_coverage
  - column_match < 100%
  - unmapped_headers.length > 0
```

### 5.8 Fase 8: Respuesta al Frontend
```
Backend retorna JSON con:
{
  "mapping_suggested": {...},     // Mapeo automático
  "mapping": {...},               // Mapeo ajustable
  "summary": {
    "total_rows": int,
    "corrected_rows": int,
    "error_rows": int,
    "corrected_fields": int,
    "error_fields": int
  },
  "logs_sample": [...],           // Primeros 100 logs
  "corrected_text": str,          // TXT limpio comprimido
  "preview_rows": [...],          // Primeras filas para vista previa
  "raw_text": str,                // TXT original comprimido
  "template_names": [...],        // Nombres esperados de plantilla
  "original_headers": [...],      // Encabezados detectados
  "mapping_stats": {...},
  "structure_validation": {...}
}
```

### 5.9 Fase 9: Edición Interactiva (Opcional)
```
Usuario puede:
1. Ajustar mapeo en MappingEditor.jsx
2. Editar datos en EditableDataTable.jsx
3. Ver logs de validación en ValidationLogTable.jsx
         ↓
Si ejecuta revalidación:
  POST /revalidate con mapping ajustado
         ↓
Backend revalida con nuevo mapeo
```

### 5.10 Fase 10: Exportación
```
Usuario descarga TXT limpio:
  POST /export
         ↓
Backend:
- Arma DataFrame con columnas en orden de plantilla
- Convierte a TXT con separador |
- Reemplaza valores vacíos con "SIN DATO"
- Retorna StreamingResponse
         ↓
Descarga de archivo TXT listo para carga en sistema destino
```

---

## 6. ENDPOINTS DE LA API

### Autenticación

#### `POST /auth/login`
```
Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "string (JWT)",
  "user": {
    "id": int,
    "username": string,
    "name": string,
    "role": string
  }
}
```

#### `GET /auth/me`
Requiere: Header `Authorization: Bearer <token>`
```
Response:
{
  "id": int,
  "username": string,
  "name": string,
  "role": string,
  "prestador_id": int | null,
  "prestador_nombre": string | null,
  "prestador_ips": string | null
}
```

### Plantillas

#### `GET /templates`
```
Response:
[
  {
    "key": "gestante",
    "label": "Plantilla Gestante",
    "description": "Ruta materno perinatal...",
    "fields": 47
  },
  ...
]
```

#### `GET /template?template_key=gestante`
```
Response:
{
  "key": "gestante",
  "label": "Plantilla Gestante",
  "description": "...",
  "template": [
    {
      "name": "ID_AFILIADO",
      "type": "STRING",
      "required": true,
      "values": null
    },
    ...
  ]
}
```

### Procesamiento de Archivos

#### `POST /upload`
```
Request (multipart/form-data):
- file: UploadFile
- template_key: str = "gestante"
- strict_mode: bool = false
- min_template_coverage: float = 0.5
- require_exact_columns: bool = false

Response:
{
  "mapping_suggested": {...},
  "mapping": {...},
  "summary": {
    "total_rows": int,
    "corrected_rows": int,
    "error_rows": int,
    "corrected_fields": int,
    "error_fields": int
  },
  "logs_sample": [...],
  "corrected_text": str (base64 gzip),
  "preview_rows": [...],
  "raw_text": str (base64 gzip),
  "template_names": [...],
  "original_headers": [...],
  "mapping_stats": {...},
  "structure_validation": {...}
}
```

#### `POST /revalidate`
```
Request:
{
  "raw_text": str,
  "mapping": {str: str | null},
  "template_key": str = "gestante",
  "mode": str = "limpiador"
}

Response:
{
  "summary": {...},
  "logs_sample": [...],
  "corrected_text": str
}
```

#### `POST /export`
```
Request:
{
  "corrected_text": str,
  "template_key": str = "gestante"
}

Response: StreamingResponse (TXT file)
Content-Type: text/plain
Content-Disposition: attachment; filename="validado_TIMESTAMP.txt"
```

### Gestión de Datos

#### `POST /cargue`
Registra un cargue en BD con metadatos y auditoría.

#### `GET /cargues?prestador_id=int&limit=int&offset=int`
Lista cargues de un prestador.

#### `POST /prestadores` / `GET /prestadores`
Gestión de prestadores (IPS).

#### `POST /historia`
Carga historial clínico estructurado.

#### `POST /evaluacion`
Genera reporte de evaluación y Excel.

---

## 7. COMPONENTES DEL FRONTEND

### Flujo Principal

```
App.jsx (Router)
  ├── Login.jsx (sin autenticar)
  │
  └── DashboardLayout.jsx (autenticado)
      ├── TemplateSelector.jsx         → selecciona plantilla
      │
      ├── DragDrop.jsx                 → carga archivo
      │   └── POST /upload
      │
      ├── MappingEditor.jsx            → ajusta mapeo
      │   └── visualiza/edita mapping
      │
      ├── ValidationLogTable.jsx       → logs de validación
      │   └── paginable, filtrable
      │
      ├── DataGridTable.jsx            → preview de datos
      │   └── muestra primeras 100 filas
      │
      ├── EditableDataTable.jsx        → edición manual
      │   └── permite cambios antes de exportar
      │
      └── [Vistas Lazy - carga diferida]
          ├── HistorialView
          ├── PrestadoresView
          ├── IndicadoresView
          ├── ConsolidacionView
          ├── HistoriasView
          ├── EvaluationDashboard
          └── DataManagement
```

### Componentes Clave

#### `App.jsx`
- Gestiona rutas principales
- Integra AuthContext para estado de login
- Carga lazy de componentes pesados
- Compresión/descompresión de datos (gzip)
- Persistencia en localStorage con límite

#### `DragDrop.jsx`
- Carga de archivos por drag-drop o input
- Soporta TXT y Excel (.xlsx, .xls)
- Envía a POST /upload
- Recibe respuesta con mapping y datos

#### `MappingEditor.jsx`
- Visualización del mapeo automático
- Edición columna por columna
- Dropdown con nombres de plantilla
- Revalidación en tiempo real

#### `ValidationLogTable.jsx`
- Tabla paginada de logs de validación
- Muestra fila, columna, valor original, corrección, motivo
- Filtrado por estado (OK, CORRECTED, ERROR)
- Export a CSV/Excel

#### `DataGridTable.jsx`
- Vista previa del DataFrame corregido
- Paginación
- Resaltado de celdas corregidas
- Scroll horizontal para muchas columnas

#### `AuthContext.jsx`
- Context API para autenticación global
- Almacena token JWT en localStorage
- Proporciona `user`, `login()`, `logout()`
- Interceptor de rutas protegidas

#### `api.js`
- Cliente HTTP centralizado
- Funciones: `fetchTemplates()`, `uploadFile()`, `revalidate()`, `exportFile()`
- Manejo de compresión/descompresión
- Gestión de errores y reintentos

---

## 8. VALIDACIONES Y REGLAS DE NEGOCIO

### 8.1 Tipos de Datos (`validators.py`)

#### STRING
- Limpieza de espacios
- Preservación de caracteres válidos
- Valor por defecto: vacío

#### INT
- Conversión numérica
- Validación de rango si aplica
- Valor por defecto: 0

#### DATE
```python
to_date_iso(value) → "YYYY-MM-DD"
```
- Intenta múltiples formatos: DD/MM/YYYY, YYYY-MM-DD, etc.
- Usa dateutil.parser
- Valor por defecto: "1900-01-01"

#### FLOAT
- Conversión numérica con precisión
- Separador decimal ajustable (. o ,)
- Valor por defecto: 0.0

#### SET (Categórico)
- Validación contra lista de valores permitidos
- Aplicación de alias de autocorrección
- Ejemplo campo: `REGIMEN DE AFILIACION`
  ```
  Valor entrada: "SUBS"
  Alias mapeado: "SUBSIDIADO"
  Valor final: "SUBSIDIADO"
  ```

### 8.2 Alias de Autocorrección (`validators.py`)

Definidos en `FIELD_SET_ALIASES`. Ejemplos:

```python
"REGIMEN DE AFILIACION": {
  "SUBSIDIADO": {"SUBSIDIADO", "SUBS", "SUB", "SISBEN", ...},
  "CONTRIBUTIVO": {"CONTRIBUTIVO", "EPS", "COTIZANTE", ...}
}

"ETNIA": {
  "WAYUU": {"WAYUU", "WAYU", "GUAJIRO"},
  "ARHUACO": {"ARHUACO", "IKU"},
  ...
}

"ZONA": {
  "RURAL": {"R", "RURAL", "RURAL DISPERSO", ...},
  ...
}
```

### 8.3 Catálogos de Municipios

Mapeados por código DANE:
```python
MUNICIPALITY_CODE_ALIASES = {
  "RIOHACHA": 44001,
  "VALLEDUPAR": 20001,
  ...
}
```

### 8.4 Validación de Estructura

**Modo Estricto** (`strict_mode=true`):
- Validación de cobertura de plantilla mínima
- Validación de coincidencia de columnas
- Advertencias sobre encabezados no mapeados

**Métricas**:
```
coverage_headers = (columnas_mapeadas / columnas_totales) * 100
coverage_template = (variables_cubiertas / variables_plantilla) * 100
column_match = (columnas_exactas / columnas_esperadas) * 100
```

---

## 9. AUTENTICACIÓN Y AUTORIZACIÓN

### Modelo de Usuario
```
User:
  - id (int, PK)
  - username (str, unique)
  - password (hash)
  - name (str)
  - role (str): admin, prestador, usuario
  - created_at (datetime)

Prestador:
  - id (int, PK)
  - user_id (int, FK)
  - nombre (str)
  - ips (str, código IPS)
  - municipio (str)
  - contacto (str)
```

### JWT
```
Token = Header.Payload.Signature
Header: {typ: "JWT", alg: "HS256"}
Payload: {user_id, username, role, exp}
```

### Roles y Permisos
```
admin:
  - Gestión de prestadores
  - Gestión de usuarios
  - Acceso a reportes globales

prestador:
  - Cargue de plantillas propias
  - Histórico de cargues
  - Reportes propios

usuario:
  - Cargue de plantillas
  - Vista de logs propios
```

---

## 10. PERSISTENCIA DE DATOS

### Base de Datos

#### Tablas Principales
```
users              → Usuarios del sistema
prestadores        → IPS/Instituciones
cargues            → Histórico de cargues
historias_clinicas → Datos de pacientes
prestador_plantilla → Relación plantilla-prestador
```

#### Modelos SQLAlchemy (`database.py`)
```python
User
Prestador
Cargue
HistoriaClinica
PrestadorPlantilla
```

### Almacenamiento de Archivos
- **Local**: SQLite para desarrollo
- **GCS** (Google Cloud Storage): Producción
- Interfaz: `gcs_storage.py`

### localStorage (Frontend)
- Almacenamiento de token JWT
- Últimas plantillas usadas
- Compresión gzip para datos voluminosos
- Límite: ~5MB por navegador

---

## 11. CONFIGURACIÓN Y DESPLIEGUE

### Desarrollo Local

#### Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API: `http://localhost:8000/docs` (Swagger)

### Producción (Vercel)

#### Estructura Esperada
```
/api/index.py          → Serverless Python handler
/frontend/build/       → Static React build
vercel.json            → Config de rutas y env
```

#### Archivo `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Variables de Entorno
```
VITE_API_BASE=/api          (frontend, build time)
API_ROOT_PATH=/api          (backend, runtime)
DATABASE_URL                (opcional, Postgres)
GCS_BUCKET                  (almacenamiento)
```

---

## 12. INDICADORES Y REPORTES

### Módulos de Reportes

#### `evaluator.py`
- Función: `evaluate()` → calcula indicadores
- Función: `build_evaluation_excel()` → genera archivo Excel

#### `formulas.py`
- Fórmulas para cálculos de indicadores
- Transformaciones de datos

#### `indicadores_excel.py`
- Generación de hojas de cálculo
- Exportación estructurada

#### `indicadores_pare.py`
- Indicadores específicos del programa PARE

### Ejemplo: Dashboard de Evaluación
```
EvaluationDashboard.jsx
  ├── POST /evaluacion con cargue_id
  ├── Recibe Excel con indicadores
  └── Renderiza Recharts con gráficos
```

---

## 13. CASOS DE USO PRINCIPALES

### Caso 1: Carga Simple de Gestantes
```
1. Usuario selecciona "Plantilla Gestante"
2. Carga archivo Excel descargado de clínica
3. Sistema detecta encabezado automáticamente
4. Muestra mapeo sugerido
5. Usuario revisa logs de correcciones
6. Descarga TXT validado
7. Importa en sistema destino
```

### Caso 2: Corrección Manual
```
1. Carga archivo con errores
2. Sistema marca filas problemáticas
3. Usuario abre EditableDataTable
4. Edita valores directamente
5. Revalida con POST /revalidate
6. Descarga versión corregida
```

### Caso 3: Auditoría y Seguimiento
```
1. Usuario descarga reporte de cargue anterior
2. ValidationLogTable muestra todas las correcciones
3. CSV exportable con fecha, usuario, cambios
4. Cumple requisitos de auditoría
```

### Caso 4: Integración con Sistema Externo
```
1. Sistema externo hace POST /upload con archivo
2. Backend procesa y retorna JSON
3. Sistema externo mapea según su lógica
4. Descarga TXT final con POST /export
```

---

## 14. FLUJOS DE ERROR Y RECUPERACIÓN

### Errores Comunes

#### Archivo Vacío
- **Detección**: `len(df) == 0`
- **Acción**: HTTPException 400 "Archivo vacío"

#### Encabezado No Detectado
- **Detección**: No se alcanza umbral de similitud
- **Acción**: Genera columnas sintéticas C1, C2, ...
- **Impacto**: Mapeo posicional por índice

#### Columnas Insuficientes
- **Detección**: `num_columns < template.variables / 2`
- **Acción**: Warning en `structure_validation`
- **Impacto**: Si strict_mode, puede bloquear

#### Conversión de Tipo Fallida
- **Detección**: TypeError en validación
- **Acción**: Intentar alias de autocorrección
- **Fallback**: Asignar valor por defecto + ERROR en log

#### Archivo Muy Grande
- **Detección**: Tamaño > 50MB
- **Acción**: Rechazar o procesar en chunks
- **Compresión**: gzip en respuesta JSON

---

## 15. MÉTRICAS Y CALIDAD

### Métricas de Calidad por Cargue
```
total_rows:        Filas totales procesadas
corrected_rows:    Filas con al menos 1 corrección
error_rows:        Filas con al menos 1 error sin corrección
corrected_fields:  Total de campos corregidos
error_fields:      Total de campos con error
success_rate:      (total - error_rows) / total * 100
```

### Dashboard de Calidad
```
QualityBanner.jsx
  ├── Visualiza success_rate
  ├── Resalta si < 95%
  └── Ofrece descargar reporte detallado
```

### Auditoría
```
Cargue:
  - usuario_id
  - prestador_id
  - archivo_original_hash
  - fecha_cargue
  - resumen (json)
  - estado (procesado, en_revision, rechazado)
```

---

## 16. CONSIDERACIONES DE SEGURIDAD

### CORS
- Configurado para aceptar cualquier origen (`allow_origins=["*"]`)
- **Recomendación**: Restringir en producción a dominios autorizados

### CSRF
- Requiere header `Authorization` con JWT
- No hay tokens CSRF explícitos (confiar en JWT)

### SQL Injection
- Uso de SQLAlchemy ORM evita inyecciones
- Validación de entrada en pydantic BaseModel

### XSS
- React escapa automáticamente valores en JSX
- Sanitizar entrada en componentes si es necesario

### Validación de Archivos
- Solo acepta TXT (sep `|`) y Excel (openpyxl)
- Limite de tamaño no visible (agregar si es necesario)

### Contraseñas
- Hash bcrypt en base de datos
- JWT sin expiración explícita (ajustar en producción)

---

## 17. LIMITACIONES Y DEUDA TÉCNICA

### Funcionales
- [ ] Soporte para múltiples separadores en TXT (solo `|`)
- [ ] Validación de caracteres especiales limitada
- [ ] No hay rollback de cargues
- [ ] Edición de datos después de exportar no actualiza histórico

### Técnicas
- [ ] Sin tests automatizados (gen_test.py, make_test.py manuales)
- [ ] Gestión de sesión en memoria (no escalable para múltiples workers)
- [ ] Compresión gzip en localStorage crea deuda técnica
- [ ] Sin rate limiting en endpoints
- [ ] Sin logging centralizado (print a consola)

### Infraestructura
- [ ] Base de datos local (SQLite) no apta para producción
- [ ] Sin replicación de datos
- [ ] Sin backup automático
- [ ] GCS storage requiere credenciales configuradas

---

## 18. ROADMAP Y MEJORAS SUGERIDAS

### Corto Plazo (1-2 meses)
1. Agregar tests unitarios con pytest
2. Implementar rate limiting
3. Centralizar logging (CloudLogging/Datadog)
4. Restringir CORS a dominios específicos
5. Agregar expires a JWT

### Mediano Plazo (2-4 meses)
1. Caché de plantillas (Redis)
2. Procesamiento asincrónico de archivos grandes (Celery)
3. Webhook para notificaciones de cargue
4. Versionado de plantillas
5. UI mejorada para edición de mapeos

### Largo Plazo (4-12 meses)
1. API pública con documentación OpenAPI
2. Integración con sistemas de salud (HL7 FHIR)
3. Predicción de errores con ML
4. Dashboard de analítica avanzada
5. Soporte para múltiples idiomas

---

## 19. REFERENCIAS Y ARCHIVOS RELACIONADOS

- [README.md](README.md) - Guía básica de ejecución
- [CONTEXTO_APLICACION_COMPLETO.md](CONTEXTO_APLICACION_COMPLETO.md) - Detalles técnicos profundos
- [GUIA_BACKEND_DOCKER_VERCEL.md](GUIA_BACKEND_DOCKER_VERCEL.md) - Despliegue en Vercel
- `backend/requirements.txt` - Dependencias Python
- `frontend/package.json` - Dependencias Node.js
- `vercel.json` - Configuración de despliegue

---

## 20. GLOSARIO

| Término | Definición |
|---------|-----------|
| **Plantilla** | Esquema de columnas y validaciones para un tipo de dato (e.g., Gestante) |
| **Mapeo** | Relación entre columnas del archivo fuente y variables de la plantilla |
| **Fuzzy Matching** | Búsqueda de coincidencias aproximadas entre strings |
| **Alias** | Valor alternativo aceptado como válido (e.g., "SUBS" → "SUBSIDIADO") |
| **Cargue** | Operación de cargar y procesar un archivo (registro histórico) |
| **Audit Trail** | Log de cambios y correcciones realizadas en los datos |
| **Coverage** | Porcentaje de cobertura (columnas mapeadas, variables cubiertas) |
| **Strict Mode** | Modo de validación riguroso que genera advertencias |
| **Streaming** | Envío de datos en chunks (para archivos grandes) |
| **JWT** | JSON Web Token para autenticación sin sesión |

---

**Fin del análisis**  
Generado: 2026-09-01  
Versión: 1.0
