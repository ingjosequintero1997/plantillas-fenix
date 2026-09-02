import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from backend.main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI()

    @app.get("/api/health")
    @app.get("/health")
    async def health():
        return JSONResponse(content={"error": str(e), "tb": traceback.format_exc()})

    @app.api_route("/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
    async def fallback(path: str):
        return JSONResponse(status_code=500, content={"error": str(e), "tb": traceback.format_exc()})
