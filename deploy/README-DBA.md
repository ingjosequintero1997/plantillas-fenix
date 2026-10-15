# Entrega al DBA - Backend Fenix (Docker)

Paquete para desplegar el **backend** del aplicativo en la instancia de **produccion**.
Las credenciales **no** viajan en la imagen ni en este documento: se cargan por
variables de entorno en el servidor.

---

## 1. Que es

API REST en FastAPI (Python 3.11) que da servicio al frontend. Se conecta a
PostgreSQL y crea/actualiza su propio esquema al arrancar.

| Dato | Valor |
|---|---|
| Puerto interno | `9500` (fijo, definido en la imagen) |
| Healthcheck | `GET /health` |
| Usuario del contenedor | el usuario por defecto del contenedor, igual que la imagen ya probada en la instancia de prueba |
| Directorio de trabajo | `/app` |

---

## 2. Como construir la imagen

Desde la raiz del repositorio (el contexto de build es `backend/`):

```bash
docker build -t <REGISTRO>/fenix-backend:<tag> ./backend
```

Ejemplo: `docker build -t midominio/fenix-backend:latest ./backend`

> Importante: construir con el contexto `./backend` para que aplique el
> `.dockerignore` (que excluye `.env`, `.env.*`, `*.log`, `*.db`, `*.xlsx`).

---

## 3. Como ejecutar

### Opcion A - docker run

```bash
docker run -d \
  --name fenix-backend \
  --restart unless-stopped \
  -p 9500:9500 \
  --env-file /ruta/al/.env \
  <REGISTRO>/fenix-backend:<tag>
```

### Opcion B - docker compose

Usar el `docker-compose.yml` de la carpeta `deploy/` (incluye Watchtower para
auto-actualizar la imagen). El archivo lee las variables de `deploy/.env`.

---

## 4. Red y acceso a la base de datos (OCI)

Esta seccion es la que habilita que el backend **llegue** a PostgreSQL en OCI.

### 4.1. Desde que IP sale la conexion

El contenedor corre en la red **bridge** por defecto de Docker. El trafico
saliente sale **enmascarado con la IP del host** (la instancia), no con una IP
propia del contenedor.

> Por lo tanto, **la IP que hay que autorizar en OCI es la IP publica de la
> instancia** donde corre el contenedor. No hay que configurar nada especial en
> el Dockerfile ni en el compose para esto.

### 4.2. IP fija (requisito de la allowlist)

La IP de una instancia OCI **cambia si se reinicia o se recrea**. Para que la
allowlist siga siendo valida:

1. En OCI, asignar a la instancia (o a su NAT Gateway) una **Reserved Public IP**.
2. Verificar que esa IP sea la que sale hacia la base (ver 4.4).

### 4.3. Autorizar la IP en OCI

Agregar la IP fija del paso anterior en **las reglas de acceso de la base de
datos**:

- Security List / Network Security Group de la subred de la base, o
- la lista de IPs permitidas del DB System / listener de la base.

| Origen (CIDR de la IP fija) | Protocolo | Puerto destino | Para que |
|---|---|---|---|
| `<IP_FIJA>/32` | TCP | `6432` | Que el backend llegue a la base (pgbouncer) |

Ademas, para que el frontend (Vercel) alcance el backend:

| Origen | Protocolo | Puerto destino | Para que |
|---|---|---|---|
| `0.0.0.0/0` (o el rango del proxy) | TCP | `9500` | Que entren las peticiones `/api/*` |

### 4.4. Verificar la conexion

El endpoint `GET /health` es **consciente de la base** y sirve para confirmar a
que base se conecto realmente.

> **Importante:** por seguridad, el detalle tecnico (IP de la base, nombre y
> conteos) **solo** se devuelve desde el propio host (loopback, que es lo que
> usa el HEALTHCHECK de Docker) o presentando el header `X-Health-Token` con el
> valor de la variable de entorno `HEALTH_TOKEN`. Desde cualquier otro origen,
> `GET /health` responde unicamente `{"status": "ok"}`, sin filtrar
> infraestructura.

**Opcion A - desde el propio servidor (recomendada):**

```bash
docker exec -it fenix-backend python -c "import urllib.request,json;print(json.dumps(json.load(urllib.request.urlopen('http://127.0.0.1:9500/health')),indent=2))"
```

**Opcion B - remota, definiendo `HEALTH_TOKEN` en el `.env`:**

```bash
curl -s -H "X-Health-Token: <valor-de-HEALTH_TOKEN>" http://<IP_FIJA>:9500/health
```

Campos a revisar:

| Campo | Significado | Valor esperado en produccion |
|---|---|---|
| `db.available` | La URL de BD se pudo usar | `true` |
| `db.ok` | El `select 1` respondio | `true` |
| `db.server` | IP:puerto real de la base alcanzada | el de produccion |
| `db.database` | Nombre de la base | `base_sie_dusakawi` |
| `db.users` / `db.gestantes` | Conteos de filas | los de produccion |

Si `db.available` es `true` pero `db.ok` es `false`, la base **rechaza** la
conexion: normalmente la IP no esta autorizada en OCI o la credencial es
incorrecta.

> Si la instancia y la base **no** estan en la misma region OCI, la latencia
> puede superar el timeout de conexion actual (5 s, fijo en `database.py`).
> En ese caso hay que subirlo antes de desplegar.

---

## 5. Variables de entorno (OBLIGATORIAS en runtime)

| Variable | Descripcion | Ejemplo (formato) |
|---|---|---|
| `DATABASE_URL` | Cadena de conexion a PostgreSQL | `postgresql://USUARIO:PASSWORD@HOST:PUERTO/BASE` |
| `TOKEN_SECRET` | Secreto para firmar los tokens de autenticacion | cadena larga aleatoria |
| `CORP_DB_HOST` | (Opcional) Host de la BD corporativa | `HOST` |
| `CORP_DB_PORT` | (Opcional) Puerto de la BD corporativa | `5432` |
| `CORP_DB_NAME` | (Opcional) Nombre de la BD corporativa | `BASE` |
| `CORP_DB_USER` | (Opcional) Usuario de la BD corporativa | `USUARIO` |
| `CORP_DB_PASSWORD` | (Opcional) Clave de la BD corporativa | `PASSWORD` |
| `HEALTH_TOKEN` | (Opcional) Token para consultar el detalle de `/health` desde fuera del servidor | cadena larga aleatoria |

`CORP_DB_*` es opcional: si no se define, el backend usa la misma base de
`DATABASE_URL` para leer el esquema `administrativo`.

---

## 6. Comportamiento al arrancar

1. Al iniciar, el backend **crea automaticamente sus tablas** si no existen
   (`ensure_db_ready()` -> `init_db()` + `crear_tabla_gestantes()`). **No hace
   falta ejecutar DDL manualmente.**
2. Crea el usuario administrador inicial si no existe (`seed_admin()`).
3. Las tablas del aplicativo son **13**:
   `users`, `prestadores`, `prestador_plantillas`, `cargues`,
   `historias_clinicas`, `historias_clinicas_audit`, `audit_logs`,
   `usuarios_ips`, `seguimientos`, `reporte_consultas`,
   `reporte_medicamentos`, `reportes_audit`, `gestantes`.
4. **Requiere** que la base tenga el esquema `administrativo` con las tablas
   `af_afiliado`, `ct_ips`, `tb_eps`, `tb_municipio` (validacion de afiliadas
   y resolucion de nombre de IPS/municipio).
5. Si la conexion a la base falla, el backend **no se cae**: arranca con
   SQLite en memoria y las operaciones de datos fallan. Verificar `/health` y
   los logs.

Verificacion manual del esquema (dentro del contenedor):

```bash
docker exec -it fenix-backend python verify_tables.py
```

---

## 7. Seguridad

- La imagen **no contiene credenciales**: `.dockerignore` excluye `.env` y `.env.*`.
- Las credenciales se pasan **solo** en runtime (`--env-file` / `env_file`),
  nunca en el `Dockerfile`, ni en `docker-compose.yml`, ni en el codigo.
- El contenedor corre con el usuario por defecto del contenedor, igual que la
  imagen ya probada en la instancia de prueba. (Si mas adelante se quiere
  correr sin root, son dos lineas en el `Dockerfile`: un `useradd` y un `USER`.)
- Solo se expone el puerto `9500` hacia el exterior; el acceso a la base se
  restringe por IP en OCI (seccion 4).
- `GET /health` **no filtra infraestructura** desde el exterior: el detalle de
  la base solo se devuelve desde loopback o con `HEALTH_TOKEN` (seccion 4.4).

---

## 8. Checklist de despliegue

- [ ] Construir la imagen con el contexto `./backend`.
- [ ] Crear el `.env` en el servidor con `DATABASE_URL`, `TOKEN_SECRET` y
      (si aplica) `CORP_DB_*`. Permisos `600`.
- [ ] Asignar **IP fija** (Reserved Public IP) a la instancia.
- [ ] Autorizar esa IP en OCI para el puerto `6432` de la base.
- [ ] Abrir el puerto `9500` para el frontend.
- [ ] Levantar el contenedor y confirmar `GET /health` -> `db.ok = true`.
- [ ] Confirmar en `db.server` / `db.database` que apunta a **produccion**.
- [ ] Correr `python verify_tables.py` y confirmar las 13 tablas.
- [ ] Confirmar que la base de produccion tiene el esquema `administrativo`.
- [ ] Probar un guardado real (INSERT/UPDATE) para validar permisos de escritura.
