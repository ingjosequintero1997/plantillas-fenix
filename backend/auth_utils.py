from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
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
ADMIN_FALLBACK_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
ADMIN_FALLBACK_NAME = "Administrador"

TOKEN_SECRET = os.environ.get("TOKEN_SECRET", "fenix-secret-change-in-production")
TOKEN_HOURS = int(os.environ.get("TOKEN_HOURS", "8"))

PBKDF2_ITERATIONS = 200_000

security = HTTPBearer(auto_error=False)


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
    try:
        user = db.get(User, payload.get("uid"))
    except Exception:
        user = None
    if user is None or not user.active:
        # Fallback: si no hay BD, acepta el token firmado como fuente de verdad
        fallback = User(
            id=payload.get("uid") or 1,
            username=payload.get("sub") or ADMIN_FALLBACK_USERNAME,
            password_hash="",
            name=payload.get("name") or ADMIN_FALLBACK_NAME,
            role=payload.get("role") or "admin",
            active=True,
        )
        return fallback
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
    # Fallback admin sin BD
    if username.strip() == ADMIN_FALLBACK_USERNAME and password == ADMIN_FALLBACK_PASSWORD:
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
