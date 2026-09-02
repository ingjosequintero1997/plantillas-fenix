import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from backend.main import app
except Exception as e:
    import traceback
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()

    @app.get("/api/health")
    @app.get("/health")
    async def health():
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})
