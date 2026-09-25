from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from collections import deque
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

try:
    from .database import get_db, SessionLocal, User
except ImportError:
    from database import get_db, SessionLocal, User

# Usuario admin de respaldo para entornos sin base de datos persistente
# (ej. funciones serverless donde SQLite no puede escribir).
ADMIN_FALLBACK_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_FALLBACK_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
ADMIN_FALLBACK_NAME = "Administrador"

TOKEN_SECRET = os.environ.get("TOKEN_SECRET")
if not TOKEN_SECRET:
    raise RuntimeError(
        "TOKEN_SECRET no esta configurado. Definelo en el archivo .env "
        "(ver deploy/.env.example)."
    )
TOKEN_HOURS = int(os.environ.get("TOKEN_HOURS", "8"))

PBKDF2_ITERATIONS = 200_000

security = HTTPBearer(auto_error=False)

# ─── Rate limiting (ventana deslizante, en memoria por proceso) ─────────────
LOGIN_MAX_ATTEMPTS = int(os.environ.get("LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_WINDOW_SECONDS = int(os.environ.get("LOGIN_WINDOW_SECONDS", "300"))
_login_attempts: dict[str, deque] = {}


def _client_ip(request) -> str:
    if request is None:
        return "unknown"
    try:
        forwarded = (request.headers.get("x-forwarded-for") or "").strip()
        if forwarded:
            return forwarded.split(",")[0].strip()
    except Exception:
        pass
    try:
        return request.client.host if request.client else "unknown"
    except Exception:
        return "unknown"


def rate_limit_key(request, username: str = "") -> str:
    return f"{_client_ip(request)}|{(username or '').strip().lower()}"


def _prune(dq: deque, now: float) -> None:
    while dq and dq[0] <= now - LOGIN_WINDOW_SECONDS:
        dq.popleft()


def check_rate_limit(key: str) -> None:
    """Lanza 429 si se superaron los intentos fallidos en la ventana."""
    now = time.time()
    dq = _login_attempts.get(key)
    if not dq:
        return
    _prune(dq, now)
    if len(dq) >= LOGIN_MAX_ATTEMPTS:
        retry = max(1, int(LOGIN_WINDOW_SECONDS - (now - dq[0])))
        raise HTTPException(
            status_code=429,
            detail=f"Demasiados intentos fallidos. Intenta de nuevo en {retry} segundos",
        )


def register_failed_attempt(key: str) -> None:
    now = time.time()
    dq = _login_attempts.setdefault(key, deque())
    _prune(dq, now)
    dq.append(now)
    if len(_login_attempts) > 5000:
        stale = [
            k for k, v in _login_attempts.items() if not v or v[-1] <= now - LOGIN_WINDOW_SECONDS
        ]
        for k in stale[:2000]:
            _login_attempts.pop(k, None)


def clear_attempts(key: str) -> None:
    _login_attempts.pop(key, None)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt_b64, digest_b64 = stored.split("$")
        if scheme != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_b64)
        expected = base64.urlsafe_b64decode(digest_b64)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
        return hmac.compare_digest(digest, expected)
    except Exception:
        return False


def create_token(user: User) -> str:
    payload = json.dumps(
        {
            "sub": user.username,
            "uid": user.id,
            "role": user.role,
            "exp": (datetime.utcnow() + timedelta(hours=TOKEN_HOURS)).isoformat(),
        }
    )
    b64 = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    sig = hmac.new(TOKEN_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"


def verify_token(token: str) -> dict | None:
    try:
        b64, sig = token.split(".")
        expected = hmac.new(TOKEN_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        padded = b64 + "=" * (4 - len(b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        exp = datetime.fromisoformat(payload["exp"])
        if datetime.utcnow() > exp:
            return None
        return payload
    except Exception:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="No autorizado")
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    # Si el token es de un IPS user, siempre usar fallback para tener ips_name
    if payload.get("role") == "ips_user":
        fallback = User(
            id=payload.get("uid") or 1,
            username=payload.get("sub") or "",
            password_hash="",
            name=payload.get("name") or payload.get("ips_name") or "IPS",
            role="ips_user",
            active=True,
        )
        fallback.ips_name = payload.get("ips_name", "")
        if payload.get("ips_code"):
            fallback.ips_code = payload.get("ips_code", "")
        return fallback
    # Resolver el usuario con la misma sesion y consulta que usa el login
    # (SessionLocal + filtro por username): es el camino verificado en produccion.
    user = None
    try:
        session = SessionLocal()
        try:
            uname = payload.get("sub")
            if uname:
                user = session.query(User).filter(User.username == uname).first()
            if user is None and payload.get("uid") is not None:
                user = session.get(User, payload.get("uid"))
        finally:
            session.close()
    except Exception:
        user = None
    if user is None or not user.active:
        # No se otorga acceso con el rol del token si el usuario no existe o
        # esta inactivo (evita privilegios persistentes tras desactivar/eliminar).
        raise HTTPException(status_code=401, detail="Usuario inactivo o inexistente")
    return user


def verify_credentials(username: str, password: str) -> User | None:
    """Valida credenciales contra la BD si está disponible, si no contra el admin de respaldo."""
    try:
        session = SessionLocal()
        try:
            user = session.query(User).filter(User.username == username.strip()).first()
            if user and user.active and verify_password(password, user.password_hash):
                return user
        finally:
            session.close()
    except Exception:
        pass
    # Fallback admin sin BD (solo si hay ADMIN_PASSWORD configurado)
    if ADMIN_FALLBACK_PASSWORD and username.strip() == ADMIN_FALLBACK_USERNAME and password == ADMIN_FALLBACK_PASSWORD:
        return User(
            id=1,
            username=ADMIN_FALLBACK_USERNAME,
            password_hash="",
            name=ADMIN_FALLBACK_NAME,
            role="admin",
            active=True,
        )
    return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return current_user


def require_prestador(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "prestador":
        raise HTTPException(status_code=403, detail="Se requiere rol de prestador")
    return current_user
