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
  - **Sidebar** (`DashboardLayout.jsx`, rediseño 2026-10-02): ancho 248px. Grupos: **Inicio** sin encabezado (arriba), **Plantilla activa** (indicador liviano con punto verde, no card verde), **Operaciones**, **Gestión** (verificar afiliado, historias clínicas, reportes) y **Administración** (admin-only: Usuarios, Bucket, Configuración). Filtrado centralizado en `filterItems()`; render de lista en `NavList`/`NavSection`. Íconos: `historial` y `cargue_masivo` ya no comparten path con `historias`/`subir`.
- **Validar data (subir)**: `DragDrop` + `uploadFile` (api.js) → `POST /upload`. Luego `POST /cargues` (saveCargue) guarda el cargue. `revalidate`, `evaluate`, `validate-data`, `validate-affiliation`, `export`, `export-excel`, `reporte-errores-excel-data`.
- **Validador**: `backend/validators.py` (`validate_and_correct`, `validate_afiliado`). Plantilla gestante en `gestante_config.py` (`get_gestante_template`), registrada en `templates_registry.py`. Columnas tipo: NUMERIC/INT/DECIMAL/DATE/TEXT/SET.
  - Las 4 sumatorias **HISTORIA REPRODUCTVA** (typo en la config, así está), EMBARAZO ACTUAL, RIESGO PSICOSOCIAL, PUNTAJE TOTAL son **NUMERIC obligatorio** — el instructivo dice que deben llevar el valor de la sumatoria (no "SIN DATO"). Si traen "Sin dato" → error en todas las filas (esperado).
  - Regla cruzada: si "REMITIDA A ESPECIALISTA?" = SI, "Describa cual(es) especialistas..." no puede estar vacío/SIN DATO.
- **Gestión de data**: `DataManagement.jsx` (lista por IPS, `mis-gestantes`, casos cerrados, `GestanteForm.jsx`, `FormularioRegistro.jsx`).
- **Verificar data**: `HistorialView.jsx` (historial de cargues, descargas).
- **Consolidar**: `ConsolidacionView.jsx` → `POST /consolidate`.
- **Indicadores**: `IndicadoresView.jsx` → `/indicadores`, `/indicadores-de-cargue/{id}`, `/indicadores-excel/{id}`.
- **Verificar afiliado**: `VerificarAfiliado.jsx` → `GET /verificar-afiliado/{doc}` (consulta `administrativo.af_afiliado`). Además **verificación masiva**: se sube un TXT/CSV con una línea por usuaria `TIPO,NUMERO` → `POST /verificar-afiliado-masivo` (valida en lote contra `af_afiliado`, devuelve estado por fila: Encontrado / Tipo no coincide / No encontrado, + descarga CSV). Tabla de resultados: Tipo de identificación · Número de identificación · Estado · **IPS primaria (por NOMBRE**, resuelto de `ct_ips` vía `obtener_nombres_ips`). Requiere las env `CORP_DB_*` para conectar la BD corporativa.
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
- **Commitado**: `backend/validators.py` — mensaje NUMERIC `"Debe ser un numero (valor de la sumatoria)"` en `_mensaje_esperado()` (líneas 1160-1163), commit `eba3bda` (30-sep-2026).
- **Commitado**: `frontend/src/components/DashboardLayout.jsx` — rediseño estético del sidebar, commit `97c18ce` ("ajustes en el sidebar").
- **Pendiente en working tree**: modo oscuro con interruptor (ver §14) + rediseño del `Login.jsx` (tarjeta centrada tipo SaaS, fondo de marca, logo `logo.png` con transparencia arriba, botón con gradiente, interruptor de tema propio). Build verificado con `npx vite build`. Listo para commit+deploy.
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

## 14. TEMA / MODO OSCURO

- **Fuente de verdad**: `frontend/src/tokens.css`. Define `:root` (claro) y `.dark` (oscuro). El modo oscuro recolorea **todos** los tokens: fondos (carbón neutro con tinte verde, coherente con el claro), texto, bordes, la rampa verde completa (`--green-50..900`, para que los chips/activos no queden casi blancos), acento cálido, acciones y semánticos.
- **Interruptor**: en `DashboardLayout.jsx` hay un `ThemeSwitch` (switch etiquetado "Modo oscuro") en el pie del sidebar; es el **único** punto de activación (se quitó el botón sol/luna del header). En el `Login.jsx` hay otro interruptor (sol/luna) propio. El estado se inicializa desde la clase `dark` del `<html>` y se persiste en `localStorage` con la clave **`datas-theme`** (`'dark'`/`'light'`).
- **Sin flash**: `frontend/index.html` tiene un script inline pre-paint que añade `.dark` a `<html>` según `localStorage` o `prefers-color-scheme`, más `<meta name="color-scheme">`.
- **Regla para nuevos componentes**: usar tokens (`var(--bg-surface)`, `var(--text-primary)`, `var(--border-subtle)`, `var(--success-bg)`, etc.) o clases `bg-[var(--...)]`. NO hardcodear `bg-white`/hex claros para superficies, ni chips `#FEE2E2`/`#DCFCE7`/`#FEF3C7`: en oscuro se ven como parches claros. Excepciones válidas: overlays translúcidos (`bg-white/15`) y knobs de toggles sobre heroes de color.
- Aliases semánticos heredados ya definidos en tokens: `--error`, `--error-bg`, `--primary`, `--primary-light` (antes se usaban sin existir).

## 15. CASO CERRADO AUTOMÁTICO

- **Regla** (`backend/main.py`, helper `cumple_caso_cerrado`): un registro pasa a `CASO_CERRADO` cuando **(FUM + 10 meses calendario) ya ocurrió** **Y** existe **fecha real de parto O de aborto**. Se ignora el comodín `1845-01-01` (año < 1900).
- **Dónde se dispara**: **automático al guardar un cargue** (`POST /cargues` re-aplica las fórmulas y marca los casos cerrados) **solo si la data quedó LIMPIA (0 errores)** — así la data descargable cumple instructivo + validación + fórmulas. También al **crear** (`POST /data/gestantes`) y al **editar** (`PUT /data/gestantes/{id}`). El endpoint `POST /data/gestantes/caso-cerrado/auto-fill` sigue existiendo (ya **sin botón** en la UI). Forward-only: solo marca TRUE, nunca desmarca solo (`/caso-cerrado/limpiar` sigue existiendo).
- **La quita de la data**: `GET /data/gestantes` y `GET /data/gestantes/mis-gestantes` **excluyen** los `CASO_CERRADO=true`. Los cerrados se consultan en `GET /data/gestantes/caso-cerrado`.
- Verificado por simulación sobre las 1607 filas reales: da 15 cierres, que coinciden con los 15 ya cerrados.

## 16. MÓDULO "CASO CERRADO"

- **Frontend**: `frontend/src/components/CasoCerradoView.jsx` (nuevo). Replica "Gestión de data" pero solo con casos cerrados: grilla de IPS (con conteo y buscador) → detalle de la IPS (tabla + búsqueda + paginación) → **Editar** (reusa `GestanteForm mode="edit"` + `updateGestante`) → **Descargar Excel por IPS**.
- **Wiring**: sección `caso_cerrado` en `App.jsx` (lazy + `SectionErrorBoundary`; agregada a `ipsSections`). Menú en `DashboardLayout.jsx` (`GESTION_ITEMS` para admin/prestador/lider y `IPS_MENU_ITEMS_BASE` para ips_user, + `META`). Permiso `caso_cerrado` en `PrestadoresView.jsx` (grupo Gestión).
- **API** (`api.js`): `fetchIpsGruposCasoCerrado()` → `/data/gestantes/ips-grupos?closed=true`; `fetchCasoCerrado(page, pageSize, search, ips)`; `exportarCasoCerrado(filename, ips)`.
- **Backend** (`main.py`): módulo `caso_cerrado` en `MODULE_KEYS/LABELS/ROLE_DEFAULT_MODULES` y regla de ruta **antes** de `data` (si no, `/data/...` la captura). `GET /data/gestantes/caso-cerrado` ahora filtra por IPS (admin con `?ips=`, no-admin su IPS). `GET /data/gestantes/ips-grupos?closed=true` cuenta solo cerrados. `GET /data/gestantes/caso-cerrado/exportar?ips=` exporta por IPS (no-admin limitado a la suya).
- **Caveat**: `ips-grupos` sigue perteneciendo al módulo `data`; si un admin desactiva `data` pero deja `caso_cerrado`, los grupos darán 403 (por defecto ambos vienen habilitados).

## 17. MOTOR DE FÓRMULAS

- **Archivo**: `backend/formulas.py` (`aplicar_formulas(fila)` / `aplicar_formulas_df(df)`). Replica las fórmulas del instructivo Excel.
- **Cuándo se aplican**: **solo cuando la data quedó 100% limpia** (sin errores) — en `validators.py` (`validate_and_correct`) y en `main.py` (cargue unificado). Es la regla pedida: "aplicar una vez que cumpla los parámetros".
- **Cubiertas**: Edad · FPP (FUM+280) · Días para el parto · Alarma · Edad gest. inicio + Trimestre inicio · IMC inicial + Clasificación · Nº total de controles · Último control · Edad gestacional actual · IMC actual + **Clasificación del IMC ACTUAL** (nuevo) · 9 trimestres de tamizajes (VIH/sífilis) · **Relación Anemia vs tratamiento** (nuevo).
- **Trimestre confirmatorio**: base = `Fecha de Ingreso al Control Prenatal` (columna **AE** del Excel, no FUM). Límites: 1 Trim `[0.1, 13)`, 2 Trim `[13, 26.1)`, 3 Trim `>= 26.1`; sin fecha → 0.
- **Relación Anemia vs tratamiento**: toma la hemoglobina de la **fecha de tamizaje más reciente** (1ra/2da/3ra) y compara con el tratamiento (`Tipo de tratamiento suminitrado para anemia`, primer dígito = 1 oral / 2 parenteral / 3 transfusión). Devuelve **🟢 ADECUADO / 🔴 NO ADECUADO / 🟡 SIN TAMIZAJE** (vacío si no hay documento). Esos 3 valores se agregaron a los `allowed` de esa columna en `gestante_config.py` para que validen.
- **Ojo**: las fórmulas con `HOY()` (Edad, Días para el parto, Alarma) se calculan al momento de validar/cargar; no se recalculan solas cada día salvo que se vuelva a pasar por el flujo.
- **Automatización (sin botones)**: al guardar un cargue gestante (`POST /cargues`) se **re-aplican las fórmulas** (`_recalcular_formulas_cargue`) y se **marcan los casos cerrados** (`_marcar_casos_cerrados`) automáticamente. Se quitaron de la UI los botones manuales **"Recalcular fórmulas"** y **"Generar casos cerrados"**. Los endpoints siguen existiendo por si se necesitan (`POST /data/gestantes/recalcular-formulas` re-aplica a todos los cargues forzando el recálculo —limpia las columnas calculadas antes de aplicar, porque `aplicar_formulas` solo rellena vacíos).
- **Conjunto EXACTO de fórmulas (solo estas 21)**: Edad · FPP · Días para el parto · Alarma · IMC · Clasificación del IMC · IMC ACTUAL · Clasificación del IMC ACTUAL · los 9 trimestres (asesoría VIH, tamizajes VIH 1/2/3, sífilis 1/2/3, segunda prueba VIH, confirmatoria) · Número Total de Controles Prenatales · Último Control Prenatal · edad gestacional actual · Relación Anemia vs tratamiento. **Se OMITEN a propósito** `Edad Gest Inicio Control` y `Trimestre inicio control` (no estaban en la lista pedida).
- **Bugs corregidos (nombres desalineados)**: en `formulas.py` los nombres `'Edad Gestacional actual'`, `'Peso Actual'`, `'Talla actual'` y `'Trimestre Toma  Prueba VIH Segundo Tamizaje'` no coincidían con la plantilla (minúsculas/doble espacio) → la fórmula no caía. Además, la asesoría VIH usaba la fecha del primer tamizaje (ahora `'Asesoria Prueba VIH'`) y la segunda prueba VIH usaba la del segundo tamizaje (ahora `'Fecha toma Segunda Prueba VIH'`).
- **Export (`excel_export.py`)**: `build_formulas` usaba índices fijos **corridos una posición** → escribía fórmulas de Excel en columnas equivocadas (Fecha de Nacimiento, FUM, Talla, Fecha 3er Control…). Reescrito para resolver **por nombre** (`build_formulas(template)`); ahora escribe exactamente las 21 fórmulas en su columna correcta. Verificado: 21 columnas = las 21 esperadas.