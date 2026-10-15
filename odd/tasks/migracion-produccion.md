# Migracion a base de datos de produccion

## Objetivo
Apuntar el backend a la base de datos de **produccion** y dejarlo desplegable por Docker, **sin ninguna credencial en el repositorio**.

## Decisiones
- Las credenciales viven **solo** en el `.env` del servidor (ignorado por git: patrones `.env` y `.env*` en `.gitignore`).
- En el repo solo se versiona una plantilla con **placeholders** (`.env.example`).
- El backend **crea sus propias tablas** al arrancar (`main.py:8046` -> `ensure_db_ready()` -> `init_db()` + `crear_tabla_gestantes()`), asi que no hace falta DDL manual.

## Tablas del aplicativo (13) que el backend crea/usa
`users`, `prestadores`, `prestador_plantillas`, `cargues`, `historias_clinicas`,
`historias_clinicas_audit`, `audit_logs`, `usuarios_ips`, `seguimientos`,
`reporte_consultas`, `reporte_medicamentos`, `reportes_audit`, `gestantes`.

Ademas, el app **lee** del esquema `administrativo` de la misma base:
`af_afiliado`, `ct_ips`, `tb_eps`, `tb_municipio`.

## Variables de entorno
| Variable | Uso |
|---|---|
| `DATABASE_URL` | BD del app (`postgresql://usuario:clave@host:puerto/base`) |
| `CORP_DB_HOST` / `CORP_DB_PORT` / `CORP_DB_NAME` / `CORP_DB_USER` / `CORP_DB_PASSWORD` | BD corporativa (opcional: si falta, usa la misma BD del app) |
| `TOKEN_SECRET` | Firma de tokens de auth |
| `BACKEND_IMAGE` | Imagen Docker del backend (para el compose) |

## Tareas
- [x] Relevar las tablas existentes en la BD de prueba (13 del app).
- [x] Crear `deploy/docker-compose.yml` (backend + watchtower, `env_file: .env`).
- [x] Crear la plantilla `deploy/.env.example` **sin credenciales reales**.
- [x] Verificar que las credenciales de produccion **no** aparezcan en el repo (`git grep` -> 0 coincidencias).
- [x] Confirmar que el usuario de BD de produccion tenga permisos de escritura (el usuario confirmo: acceso total).
- [x] Panic-check del Dockerfile: `.dockerignore` excluye `.env`/`.env.*` -> la imagen NO lleva credenciales.
- [x] Dockerfile: se decidio **riesgo 0** -> quedo **identico** al que ya corre en la instancia de prueba (usuario por defecto + puerto fijo 9500). `git diff` del archivo: **vacio**.
- [x] Agregar `*.log` y `*.bak` al `.dockerignore` (los logs podian filtrar cadenas de conexion).
- [x] Crear `deploy/README-DBA.md` (entrega al DBA: build, run, variables, checklist).
- [ ] (Pendiente) Confirmar que la BD de produccion tenga el esquema `administrativo`.
- [ ] (Pendiente) Validar el build de la imagen (no hay Docker en la maquina de desarrollo; lo valida el DBA).
- [ ] (Recomendado) Fijar versiones en `requirements.txt` (hoy sin pin) para builds reproducibles.
- [x] Documentar la seccion de red/OCI en `deploy/README-DBA.md`: la salida del contenedor usa la IP del host (bridge NAT) -> la IP a autorizar en OCI es la IP **publica de la instancia**; debe ser una **Reserved Public IP** (fija) porque las IP de OCI cambian al reiniciar/recrear. Puerto a habilitar: **6432** (base) + **9500** (frontend).
- [x] Verificacion de conexion documentada: `GET /health` devuelve `db.available`, `db.ok`, `db.server`, `db.database` y conteos -> confirma a que base llego realmente.
- [ ] (Hallazgo de seguridad) `/health` es **publico y sin auth** y expone IP:puerto de la base, nombre de la base y conteos de filas (`users`, `gestantes`). Conviene devolver el detalle solo para localhost o con un token; dejar `{status:"ok"}` para el exterior.


## Criterios de aceptacion
- `git grep` de host/usuario/clave de produccion -> **0 resultados**.
- `.env` figura como ignorado en `git check-ignore`.
- El backend arranca contra produccion y `/health` responde.
- `python verify_tables.py` reporta las 13 tablas.

## Entrega al DBA
- `backend/Dockerfile` (imagen del backend).
- `backend/.dockerignore`.
- `deploy/docker-compose.yml` + `deploy/.env.example`.
- `deploy/README-DBA.md` (instructivo completo).
- **NO** se entrega ningun `.env` real: las credenciales las carga el DBA en el servidor.

