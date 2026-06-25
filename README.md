# Validador IPS

Validador institucional para cargue masivo de plantillas de salud.  
Soporta los módulos **RCV** (riesgo cardiovascular) y **Gestante** (ruta materno perinatal).

## Estructura del proyecto

```
/
├── api/              # Entry point serverless para Vercel
├── backend/          # API FastAPI + lógica de validacion
├── frontend/         # Interfaz React + Vite + Tailwind
├── vercel.json       # Configuracion de despliegue Vercel
└── package.json      # Script de build para Vercel
```

## Ejecutar en desarrollo

### Backend

```powershell
cd backend
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

El frontend carga en `http://localhost:5173` y apunta al backend en `http://localhost:8000`.

## Despliegue en Vercel

### 1. Subir el repositorio a GitHub

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Importar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa el repositorio de GitHub
3. Vercel detecta automaticamente:
   - **Frontend**: Build con `npm run build` (Vite)
   - **Backend**: Serverless Python en `api/index.py`
4. Haz clic en **Deploy**

### Variables de entorno en Vercel

No es necesario configurar ninguna variable de entorno.  
El frontend en produccion usa `VITE_API_BASE=/api` (definido en `.env.production`).  
El backend usa `API_ROOT_PATH=/api` (definido en `vercel.json`).

### Resultado

- Frontend: `https://tu-proyecto.vercel.app`
- API: `https://tu-proyecto.vercel.app/api/health`

## Endpoints de la API

- `GET /health` - Estado del servidor
- `GET /templates` - Lista de plantillas disponibles
- `GET /template?template_key=rcv` - Detalle de una plantilla
- `POST /upload` - Cargar archivo (TXT o Excel)
- `POST /revalidate` - Revalidar con mapeo ajustado
- `POST /export` - Descargar TXT corregido

## Tecnologias

- **Backend**: Python, FastAPI, Pandas, OpenPyXL, RapidFuzz
- **Frontend**: React 18, Vite, Tailwind CSS
- **Infra**: Vercel (Serverless Python + Static)
