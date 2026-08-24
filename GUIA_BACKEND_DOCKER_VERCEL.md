# Guía de Arquitectura: Backend Python + Frontend React + Docker + Vercel

## Arquitectura del Sistema

```
┌─────────────────────────────┐
│  Vercel (Frontend React)    │
│  app.midominio.com          │──── API calls ────┐
└─────────────────────────────┘                   │
                                                  ▼
┌─────────────────────────────┐    ┌──────────────────────────────┐
│  Oracle Cloud (Backend)     │    │  PostgreSQL (Base de datos)   │
│  IP:PUERTO                  │───▶│  IP:PUERTO                   │
│  Docker + Watchtower        │    │  base_sie_xxx                │
│  Auto-update cada 5 min     │    │  Servidor separado           │
└─────────────────────────────┘    └──────────────────────────────┘
```

**Puntos clave:**
- Frontend y Backend están en servidores DIFERENTES
- Backend y Base de datos están en servidores DIFERENTES
- Vercel reescribe llamadas `/api/*` al backend via `vercel.json`
- Watchtower auto-actualiza el backend cada 5 minutos con `--interval 300`

---

## 1. Estructura del Proyecto

```
mi-proyecto/
├── backend/
│   ├── main.py          # FastAPI, endpoints, validaciones
│   ├── db.py            # Conexion a PostgreSQL
│   ├── configs.py       # Templates, listas de opciones
│   ├── indicators.py    # Calculo de indicadores
│   └── Dockerfile       # Si no lo tienes, crealo
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Componente principal
│   │   ├── api.js       # Funciones para llamar al backend
│   │   └── ...
│   ├── .env             # Variables de entorno (NO subir a git)
│   └── package.json
├── deploy/
│   ├── docker-compose.yml
│   ├── .env             # Credenciales (NO subir a git)
│   └── .env.example     # Plantilla sin credenciales
├── vercel.json
└── .github/
    └── workflows/
        └── docker-publish.yml  # Build automatico en Docker Hub
```

---

## 2. Variables de Entorno

### Backend (docker-compose .env)
```bash
DATABASE_URL=postgres://USUARIO:CONTRASENA@HOST:PUERTO/NOMBRE_BASE
TOKEN_SECRET=TU_TOKEN_SECRETO
PORT=7000
```

### Frontend (Vercel Environment Variables o .env)
```bash
VITE_API_URL=  # Vacio = usa rutas relativas /api/*
# Vercel reescribe /api/* a http://BACKEND:PUERTO/api/*
```

### Vercel (vercel.json)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "http://BACKEND_IP:PUERTO/api/$1" }
  ]
}
```

---

## 3. Docker Compose Completo

```yaml
services:
  backend:
    image: TU_USUARIO_DOCKERHUB/mi-app-backend:latest
    container_name: mi-backend
    restart: unless-stopped
    command: uvicorn main:app --host 0.0.0.0 --port 7000
    ports:
      - "7000:7000"
    env_file:
      - .env
    environment:
      - PORT=7000
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:7000/api/health', timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
```

**Puntos importantes:**
- `env_file: .env` → Las credenciales van en `.env` separado, NO hardcodeadas
- `--interval 300` → Watchtower revisa Docker Hub cada 5 minutos
- `--cleanup` → Elimina imágenes viejas para no llenar disco
- `healthcheck` → Reinicia automáticamente si el backend se cae

---

## 4. GitHub Actions (Build Automático)

`.github/workflows/docker-publish.yml`:
```yaml
name: Build and Push to Docker Hub
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: TU_USUARIO_DOCKERHUB/mi-app-backend:latest
```

**Flujo automático:**
1. `git push` al branch `main`
2. GitHub Actions construye la imagen Docker
3. La sube a Docker Hub con tag `latest`
4. Watchtower (cada 5 min) detecta la imagen nueva
5. Descarga y reinicia el contenedor
6. **Sin intervención manual**

---

## 5. Seguridad - Credenciales

### NUNCA hacer:
- ❌ Credenciales en `docker-compose.yml` hardcodeadas
- ❌ Credenciales en el código fuente (Python/JS)
- ❌ Subir `.env` a GitHub
- ❌ `TOKEN_SECRET` con fallback en el código

### SIEMPRE hacer:
- ✅ `docker-compose.yml` usa `env_file: .env`
- ✅ `.env` en `.gitignore`
- ✅ `.env.example` como referencia (sin credenciales reales)
- ✅ Repo privado en GitHub
- ✅ `TOKEN_SECRET` sin fallback: `os.environ.get("TOKEN_SECRET", "")`

### Archivos necesarios en deploy/
```
deploy/
├── docker-compose.yml    # Referencia .env
├── .env                  # Credenciales reales (NO subir a git)
└── .env.example          # Plantilla para el DBA
```

---

## 6. Backend - FastAPI

### Health check (obligatorio)
```python
@app.get("/api/health")
def health():
    return {"status": "ok"}
```

### Conexion a PostgreSQL
```python
import psycopg2
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "")

def get_db():
    return psycopg2.connect(DATABASE_URL)

def close_db():
    pass  # O cerrar conexion
```

### CORS (obligatorio para Vercel)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu-app.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### JWT Auth (básico)
```python
import hmac, hashlib, base64, os
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

TOKEN_SECRET = os.environ.get("TOKEN_SECRET", "")
security = HTTPBearer()

def get_current_user(credentials = Depends(security)):
    try:
        token = credentials.credentials
        parts = token.split(".")
        if len(parts) != 3:
            raise Exception("Token invalido")
        b64 = parts[0] + "." + parts[1]
        sig = hmac.new(TOKEN_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
        if sig != parts[2]:
            raise Exception("Firma invalida")
        import json
        payload = json.loads(base64.b64decode(parts[1] + "=="))
        return payload
    except:
        raise HTTPException(401, "Token invalido")
```

---

## 7. Frontend - React + Vite

### api.js
```javascript
const API = import.meta.env.VITE_API_URL || '';

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${url}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Error');
    }
    return res.json();
}

export const loginUser = (data) => apiFetch('/api/login', { method: 'POST', body: JSON.stringify(data) });
export const guardarRegistro = (tipo, data) => apiFetch(`/api/guardar/${tipo}`, { method: 'POST', body: JSON.stringify({ data }) });
export const validarMasivo = (tipo, filas) => apiFetch(`/api/validar-masivo/${tipo}`, { method: 'POST', body: JSON.stringify({ filas }) });
export const guardarMasivo = (tipo, filas) => apiFetch(`/api/guardar-masivo/${tipo}`, { method: 'POST', body: JSON.stringify({ filas }) });
```

---

## 8. Funcionalidades Clave Implementadas

### 8.1 Cargue Masivo "Todo o Nada" (Transacción PostgreSQL)
```python
@app.post("/api/guardar-masivo/{tipo}")
def guardar_masivo(tipo: str, ...):
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()
    try:
        for fila in filas:
            errores = validar(tipo, fila)
            if errores:
                conn.rollback()  # FALLA → rollback total
                return {"ok": False, "errores": [...]}
            # INSERT...
        conn.commit()  # TODAS OK → commit
        return {"ok": True, "creados": len(filas)}
    except:
        conn.rollback()
        raise
```

### 8.2 Validación de Duplicados por Tipo
```python
# Tipo 2: Bloquear misma gestante (tipo+número) sin importar prestador
# Tipo 3: Bloquear misma usuaria + misma fecha + mismo CUPS
# Tipo 4: Bloquear misma usuaria + misma fecha seguimiento
# Tipo 5: Bloquear misma usuaria + misma fecha ingreso
def db_check_duplicado_exacto(tipo, data, username):
    if tipo == 'tipo2':
        existe = conn.execute("SELECT id FROM tabla WHERE tipo_id=? AND num_id=? AND activo='1'", ...).fetchone()
        if existe: return "Ya existe esta gestante"
    # ...
```

### 8.3 Control Semanal con cerrado_en
```python
# Cerrar semana: registra timestamp
@app.post("/api/cerrar-semana")
def cerrar_semana():
    ahora = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    for tabla in tablas:
        conn.execute(f"UPDATE {tabla} SET activo='0', cerrado_en=? WHERE activo='1'", (ahora,))

# Restaurar: solo la última semana cerrada
@app.post("/api/reactivar-semana")
def reactivar_semana():
    for tabla in tablas:
        row = conn.execute(f"SELECT MAX(cerrado_en) FROM {tabla} WHERE activo='0' AND cerrado_en IS NOT NULL").fetchone()
        if row and row[0]:
            conn.execute(f"UPDATE {tabla} SET activo='1', cerrado_en=NULL WHERE activo='0' AND cerrado_en=?", (row[0],))
```

### 8.4 CUPS / Validaciones por Código
```python
# Mapeo CUPS → tipo de validación
CUPS_ODONTOLOGIA = {'890203', '890204'}
CUPS_MEDICINA_GENERAL = {'890201', '890301'}
CUPS_GINECOLOGIA = {'890250', '890350'}

def es_cups_sv_obligatorio(cups):
    """Signos vitales obligatorios solo en ginecología/medicina general"""
    return cups in CUPS_GINECOLOGIA | CUPS_MEDICINA_GENERAL

# Finalidad según CUPS
FINALIDADES_CONSULTA = {f'{i:02d}': f'Consulta {i}' for i in range(1, 11)}
FINALIDADES_PROCEDIMIENTO = {f'{i:02d}': f'Procedimiento {i}' for i in range(1, 6)}
```

---

## 9. Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `CORS error` | Frontend no puede llamar al backend | Agregar origen de Vercel en `allow_origins` |
| `Token invalido` | `TOKEN_SECRET` hardcodeado con fallback | Usar `os.environ.get("TOKEN_SECRET", "")` sin fallback |
| `Backend caído` | Watchtower no actualizó | Verificar build en GitHub Actions, revisar logs Docker |
| `Restore恢复 todo` | No había `cerrado_en` | Agregar columna + usar `MAX(cerrado_en)` para restaurar solo la última semana |
| `Fecha rechazada` | `datetime.utcnow()` vs hora local | Usar UTC-5: `(datetime.utcnow() - timedelta(hours=5))` |
| `Duplicate entries` | Sin validación de duplicados | Agregar `db_check_duplicado_exacto()` antes de INSERT |

---

## 10. Checklist de Deploy

- [ ] Backend: `DATABASE_URL` y `TOKEN_SECRET` en `.env` (no hardcodeados)
- [ ] Backend: `docker-compose.yml` usa `env_file: .env`
- [ ] Backend: `.env.example` creado como referencia
- [ ] Backend: Health check en `/api/health`
- [ ] Backend: CORS configurado con el dominio de Vercel
- [ ] Frontend: `vercel.json` apunta a la IP correcta del backend
- [ ] Frontend: `.env` o `VITE_API_URL` configurado
- [ ] GitHub: Repo privado
- [ ] GitHub Actions: Workflow de build a Docker Hub
- [ ] Docker Hub: Imagen `latest` subida
- [ ] Oracle Cloud: Puerto 7000 abierto en Security List
- [ ] Oracle Cloud: Docker + Watchtower corriendo
- [ ] BD: Tablas creadas,columnas necesarias (ej. `cerrado_en`)
- [ ] Vercel: Deploy automático configurado

---

## 11. Comandos Útiles

```bash
# Verificar si el backend responde
curl http://IP:7000/api/health

# Ver logs del contenedor
docker logs mi-backend --tail 50

# Reiniciar manualmente (si Watchtower no funciona)
docker compose down && docker compose pull && docker compose up -d

# Verificar Watchtower
docker logs watchtower --tail 20

# Verificar build en GitHub Actions
# https://github.com/USUARIO/REPO/actions

# Conectar a la BD desde el servidor
psql -h HOST -p PUERTO -U USUARIO -d BASE
```
