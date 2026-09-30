# CONTEXTO DEL PROYECTO — DATAS PYM (ex FÉNIX DATA)

Este documento resume todo el contexto de la aplicación para que un chat nuevo pueda trabajar sin consumir tokens re-leyendo el código. Léelo completo antes de hacer cambios.

---

## 1. QUÉ ES

Aplicación web de **validación y gestión de datos de gestantes** para DUSAKAWI EPSI. El usuario sube un Excel/TXT de gestantes, la app lo valida contra un instructivo, corrige, consolida, calcula indicadores, sube historias clínicas (PDF) y gestiona usuarios por IPS.

## 2. STACK Y ARQUITECTURA

- **Frontend**: React + Vite (`frontend/`). Desplegado en **Vercel** → `https://plantillas-fenix.vercel.app`.
- **Backend**: FastAPI + uvicorn (`backend/`), Python 3.11, SQLAlchemy. Desplegado en **Coolify** (Dockerfile en `backend/Dockerfile`, puerto 9500) → `http://h109am3l3yyd1000mvcu7kam.129.80.241.180.sslip.io`.
- **Base de datos**: PostgreSQL `base_sie_dusakawi` en `129.80.159.38:5436`. En local se usa SQLite (`backend/validador.db`).
- **BD corporativa**: misma instancia PostgreSQL, esquema `administrativo` (tablas `af_afiliado`, `ct_ips`). Se conecta con `CORP_DB_*` (ver §8).
- **Almacenamiento PDFs**: OCI Object Storage (o GCS) mediante `backend/oci_storage.py` / `gcs_storage.py`. Leen todo de env vars (sin credenciales en el repo).
- **CORS**: `ALLOWED_ORIGINS` env (default: vercel + localhost:5173/3000). `allow_credentials=True`.

## 3. FLUJO DE DESPLIEGUE (IMPORTANTE)

**El usuario hace el git commit y el deploy. El agente NO commitea ni despliega.**
- El agente: implementa, compila localmente (`python -m py_compile backend/*.py` y `npx vite build` en `frontend/`), verifica contra local y/o prod (read-only), y reporta "listo para desplegar".
- El usuario commitea y despliega en Vercel (frontend) y Coolify (backend).
- `vercel.json`: rewrite `/api/*` → backend sslip.io. Cache headers para assets e index.html.

## 4. BASE DE DATOS — TABLAS PRINCIPALES

- **users**: `id`, `username`, `password_hash`, `name`, `role` (`admin|prestador|lider|ips_user`), `active`, `created_at`.
- **prestadores**: `id`, `user_id` (FK users), `nombre`, `ips` (código), `nit`, `municipio`, `permissions` (JSON).
- **usuarios_ips**: `id`, `username`, `ips_name`, `contrasena`, `active`, `permissions` (JSON). Son las cuentas de las IPS (login `/auth/ips-login`).
- **cargues**: cargues subidos/validados. Tiene `corrected_text`, `raw_text`, `compressed`, `template_key`, `prestador_id`, `user_id`, `mes`, `original_filename`, `row_count`, `quality_percent`.
- **gestantes**: tabla de 203 columnas (sin `prestador_id`/`user_id`/`created_at`). Columna clave: `"NOMBRE_DE_LA_IPS_PRIMARIA"` (nombre normalizado en MAYÚSCULAS de la IPS de la usuaria), `"NO_DE_IDENTIFICACION"`, `"CASO_CERRADO"` (boolean), `mes`.
- **historias_clinicas**: `id`, `prestador_id`, `user_id`, `ips_name`, `tipo_documento`, `template_key`, `paciente_documento`, `paciente_nombre`, `filename`, `content_type`, `file_size`, `pdf_data` (DB), `pdf_path` (bucket), `hash_original`, `hash_actual`, `created_at`.
- **historias_clinicas_audit**: auditoría (action CREATE/UPDATE/DELETE).
- **system_config**: `key`/`value` (ej. `cargue_masivo`, `historias_pdf`).
- **audit_logs**: bitácora general.
- Tablas reportes: `reporte_consultas`, `reporte_medicamentos`, `reporte_audit`.

## 5. AUTENTICACIÓN

- Tokens: **base64(payload) + HMAC-SHA256(firma)** con `TOKEN_SECRET` (env, obligatorio; si falta, la app no arranca). Payload: `{sub: username, uid, role, exp (ISO, 8h)}`. No es JWT estándar.
- Endpoints: `POST /auth/login` (admin/prestador/lider vía `users`), `POST /auth/ips-login` (paso 1: `usuarios_ips`; paso 2: `users` con `role='ips_user'`), `GET /auth/me`, `GET /auth/permissions`, `POST /auth/change-password`, `POST /auth/verify-ips-active`.
- **Rate limiting** (en memoria): `LOGIN_MAX_ATTEMPTS=5` / `LOGIN_WINDOW_SECONDS=300`, key = IP+username. Aplica a login, ips-login, change-password.
- **Frontend login** (`Login.jsx`): selector de perfil (Admin/Líder/Prestador-IPS). Si el perfil no coincide con el rol del token → error y cierra sesión. Limpia sesión previa al hacer login.
- **get_current_user** (`auth_utils.py`): **confía en el token firmado** (no consulta la BD para resolver el usuario, excepto construir `User` desde el payload). Así la app funciona aunque la BD esté caída. `verify_credentials` hace fallback al admin de respaldo (`ADMIN_PASSWORD`) si la BD no responde o no hay fila.
- **Frontend 401**: `api.js` no reintenta en 401 (evita el loop) y dispara `auth:expired` → `AuthContext` limpia sesión.

## 6. SISTEMA DE PERMISOS POR MÓDULO (admin controla todo)

- **MODULE_KEYS** (9 módulos): `inicio`, `subir` (Validar data), `data` (Gestión de data), `historial` (Verificar data), `consolidar`, `indicadores`, `verificar` (Verificar afiliado), `historias`, `reportes`.
- **Defaults por rol**: `prestador` → inicio,subir,data,indicadores,verificar,historias,reportes. `lider` → inicio,data,historial,consolidar,indicadores,verificar,historias,reportes. `ips_user` → todos True (menos `historias`, que SIEMPRE True porque lo controla `system_config.historias_pdf`).
- **admin siempre todo True**; `prestadores` (Usuarios) y `configuracion` no son configurables (solo admin).
- **Middleware** `enforce_module_permissions` (main.py): mapea ruta→módulo y devuelve **403** si el permiso es False para `prestador/lider/ips_user`. Admin y rutas no mapeadas pasan.
- Endpoints: `GET /admin/permissions/catalog` (módulos + defaults por rol), `PUT /admin/prestadores/{id}/permissions`, `GET /auth/permissions`.
- **Módulo Usuarios** (`PrestadoresView.jsx`): lista prestadores/líderes **y** IPS (`usuarios_ips`) unificadas (campo `tipo: 'prestador'|'ips'`). Filtro por rol. Para IPS: botones Editar (nombre/usuario/contraseña), Permisos (los 9 módulos; `historias` se muestra "Siempre activo" no editable) y Activar/Desactivar. Para prestador/líder: Editar + Permisos. Al crear/editar, los módulos se recalculan según el rol elegido.
- `get_current_user` devuelve `User` sintético; endpoints usan `current_user.role`.

## 7. MÓDULOS Y ARCHIVOS CLAVE

- **App.jsx**: shell principal, secciones por `section` (inicio, subir, data, historial, consolidar, indicadores, verificar, historias, reportes, prestadores, configuracion, bucket). `DashboardLayout.jsx` arma el menú (roles + permisos). `DashboardHome.jsx` (tiles).
- **Validar data (subir)**: `DragDrop` + `uploadFile` (api.js) → `POST /upload`. Luego `POST /cargues` (saveCargue) guarda el cargue. `revalidate`, `evaluate`, `validate-data`, `validate-affiliation`, `export`, `export-excel`, `reporte-errores-excel-data`.
- **Validador**: `backend/validators.py` (`validate_and_correct`, `validate_afiliado`). Plantilla gestante en `gestante_config.py` (`get_gestante_template`), registrada en `templates_registry.py`. Columnas tipo: NUMERIC/INT/DECIMAL/DATE/TEXT/SET.
  - Las 4 sumatorias **HISTORIA REPRODUCTVA** (typo en la config, así está), EMBARAZO ACTUAL, RIESGO PSICOSOCIAL, PUNTAJE TOTAL son **NUMERIC obligatorio** — el instructivo dice que deben llevar el valor de la sumatoria (no "SIN DATO"). Si traen "Sin dato" → error en todas las filas (esperado).
  - Regla cruzada: si "REMITIDA A ESPECIALISTA?" = SI, "Describa cual(es) especialistas..." no puede estar vacío/SIN DATO.
- **Gestión de data**: `DataManagement.jsx` (lista por IPS, `mis-gestantes`, casos cerrados, `GestanteForm.jsx`, `FormularioRegistro.jsx`).
- **Verificar data**: `HistorialView.jsx` (historial de cargues, descargas).
- **Consolidar**: `ConsolidacionView.jsx` → `POST /consolidate`.
- **Indicadores**: `IndicadoresView.jsx` → `/indicadores`, `/indicadores-de-cargue/{id}`, `/indicadores-excel/{id}`.
- **Verificar afiliado**: `VerificarAfiliado.jsx` → `GET /verificar-afiliado/{doc}` (consulta `administrativo.af_afiliado`).
- **Historias clínicas**: `HistoriasView.jsx` → `/historias` (GET list, POST upload, DELETE). Subida: OCI/GCS/DB.
- **Reportes pendientes**: `ReportesView.jsx` → `/reportes/consultas`, `/reportes/medicamentos`.
- **Configuración**: `ConfiguracionView.jsx` → `/admin/config`, `/admin/ips-list`, `/admin/ips-toggle` (global cargue_masivo/historias_pdf).
- **Gestión de bucket** (solo admin): `BucketView.jsx` → `GET /admin/bucket-usage`. Agrupa `historias_clinicas` por `ips_name`, suma `file_size`. Barra = uso absoluto vs **tope fijo 100 MB por IPS** (env `BUCKET_TOPE_MB`). El % se calcula `bytes / (tope*1MB)`.

## 8. VARIABLES DE ENTORNO (valores en Coolify/Vercel, NO en el repo)

- `DATABASE_URL` (Postgres). En local: `sqlite:///./validador.db`.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `TOKEN_SECRET` (obligatorio).
- `IPS_DEFAULT_PASSWORD` (para seed de usuarios IPS; sin default seguro).
- `CORP_DB_HOST/PORT/NAME/USER/PASSWORD` (BD corporativa).
- `OCI_TENANCY`, `OCI_USER`, `OCI_FINGERPRINT`, `OCI_REGION`, `OCI_NAMESPACE`, `OCI_BUCKET`, `OCI_PRIVATE_KEY` (o PART1/PART2 base64).
- `GCP_PROJECT_ID`, `GCP_PROJECT_NUMBER`, `GCP_SERVICE_ACCOUNT_EMAIL`, `GCP_WORKLOAD_IDENTITY_POOL_ID`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`, `GCS_BUCKET_NAME`.
- `ALLOWED_ORIGINS`, `BUCKET_TOPE_MB`, `API_ROOT_PATH`, `MAX_PDF_MB`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_WINDOW_SECONDS`, `TOKEN_HOURS`.
- Frontend: `VITE_API_BASE` (en Vercel `/api`).

## 9. DIAGNÓSTICO DE PRODUCCIÓN

- `GET /health` reporta: `db.available`, `configured` (dialect), `drivers` (psycopg2/psycopg), `ok`, `database`, `server`, conteos (`users`, `usuarios_ips`, `gestantes`), `init_error` (con credenciales redactadas). **Úsalo para verificar si el backend está desplegado y conectado.**
- Antes el backend caía a SQLite en memoria porque `DATABASE_URL` usaba driver `psycopg` (v3) no instalado. **Fix**: `database.py` normaliza `postgresql://` → `postgresql+psycopg2://` si psycopg2 está disponible.

## 10. LECCIONES / TRAMPAS YA RESUELTAS (no repetir)

- **No usar `var(--primary)` en toggles** — solo existe `--green-500` en el CSS (causó "quedan en blanco").
- `app.get("/data/gestantes/mis-gestantes")` NO tiene `prestador_id`/`user_id`/`created_at` en gestantes (no existen esas columnas).
- Cargue: `NOMBRE_DE_LA_IPS_PRIMARIA` se tomaba del Excel; **ahora** `_mapa_ips_afiliados()` consulta `af_afiliado.ips` → `ct_ips.razon_social` y sobrescribe (fix en ambos loops de INSERT). Si no está en afiliados o BD caída → usa valor del archivo.
- Al subir historia el `ips_name` se asigna automático (por usuario); para admin se toma de la gestante (`NOMBRE_DE_LA_IPS_PRIMARIA`).
- No hay columna `prestador_id` en gestantes → el filtrado por IPS es por `"NOMBRE_DE_LA_IPS_PRIMARIA"` (UPPER exacto contra `usuarios_ips.ips_name`).
- 7 gestantes fueron reparadas en BD de producción (cambio real de IPS con cuenta existente). Las demás diferencias eran formato (misma IPS) o IPS sin cuenta → **no tocar**.

## 11. ESTADO ACTUAL (verificado)

- **Commitado por el usuario** (últimos commits): validador masivo, bucket con tope, ajustes de IPS, login IPS, historias, módulo bucket, filtro roles, usuarios IPS, permisos por rol.
- **Pendiente en working tree**: `backend/validators.py` (mensaje NUMERIC mejorado: "Debe ser un numero (valor de la sumatoria)"). Listo para commit+deploy.
- Se quitó el sistema de meses/periodo de cargue en todos los módulos (commit `6cd1f9a "ajuste del validador masivo"` y anteriores). El frontend ya no envía `mes`; los params `mes` en el backend quedaron opcionales.

## 12. COMANDOS ÚTILES

- Compilar backend: `python -m py_compile backend/main.py backend/auth_utils.py backend/database.py backend/validators.py`
- Build frontend: `npx vite build` (workdir `frontend/`)
- Servidor local backend: `Start-Process python -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","PORT" -WorkingDirectory <repo>\backend` con `$env:ADMIN_PASSWORD="admin123"` si la BD local no tiene admin.
- Verificar prod (read-only): `curl` al backend sslip.io o via `https://plantillas-fenix.vercel.app/api/...`.
- **Shell es PowerShell**: no usar `&&`; usar `;`. Evitar `python -c` con comillas anidadas (escribir scripts temporales en `C:\Users\PROFESIONAL\AppData\Local\Temp\opencode`).

## 13. CREDENCIALES / SEGURIDAD

- Credenciales reales **solo en Coolify/Vercel (env vars)**; el repo no debe contener secretos.
- El usuario confirmó que las contraseñas en la BD están OK (no migrar hashes de `usuarios_ips`).
- Acceso a BD de producción (read-only para consultas): `postgres://postgres:qazwsx12A.@129.80.159.38:5436/base_sie_dusakawi` (prefijo `postgresql://` para SQLAlchemy).
- No exponer credenciales en respuestas/logs. `_health_error`/`_redact` redactan `user:pass@`.