from __future__ import annotations

import os
from datetime import datetime, timezone

try:
    from dotenv import load_dotenv
    load_dotenv()  # Carga backend/.env si existe (config local)
except ImportError:
    pass

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
    create_engine,
    text,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker


def _utcnow():
    return datetime.now(timezone.utc)


# La variable puede llamarse DATABASE_URL o DATABASE (nombre usado en Vercel).
# Se da prioridad a DATABASE_URL y se acepta DATABASE como alternativa.
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE") or "sqlite:///./validador.db"

# SQLAlchemy 2.x requiere postgresql:// (no acepta el alias postgres://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

# Resiliencia: si el driver de la BD no está disponible o la URL es inválida
# (p. ej. serverless sin driver instalado), se usa SQLite en memoria para no
# romper la importación. Las consultas caerán en el admin de respaldo.
DB_AVAILABLE = True
try:
    connect_args = {}
    if DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        # Timeout corto para no bloquear el cold start si la BD no responde.
        connect_args = {"connect_timeout": 5}
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
except Exception:
    DB_AVAILABLE = False
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="prestador")  # admin | prestador
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    prestador = relationship("Prestador", back_populates="user", uselist=False)


class Prestador(Base):
    __tablename__ = "prestadores"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    nombre = Column(String(255), nullable=False)
    nit = Column(String(60), nullable=True)
    departamento = Column(String(120), nullable=True)
    municipio = Column(String(120), nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    user = relationship("User", back_populates="prestador")
    plantillas = relationship("PrestadorPlantilla", back_populates="prestador", cascade="all, delete-orphan")
    cargues = relationship("Cargue", back_populates="prestador", cascade="all, delete-orphan")
    historias = relationship("HistoriaClinica", back_populates="prestador", cascade="all, delete-orphan")


class PrestadorPlantilla(Base):
    __tablename__ = "prestador_plantillas"
    __table_args__ = (UniqueConstraint("prestador_id", "template_key", name="uq_prestador_plantilla"),)

    id = Column(Integer, primary_key=True)
    prestador_id = Column(Integer, ForeignKey("prestadores.id"), nullable=False)
    template_key = Column(String(60), nullable=False)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    prestador = relationship("Prestador", back_populates="plantillas")


class Cargue(Base):
    __tablename__ = "cargues"
    __table_args__ = (
        UniqueConstraint("prestador_id", "template_key", "mes", name="uq_prestador_template_mes"),
    )

    id = Column(Integer, primary_key=True)
    prestador_id = Column(Integer, ForeignKey("prestadores.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_key = Column(String(60), nullable=False)
    mes = Column(String(7), nullable=False)  # YYYY-MM
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    raw_text = Column(Text, nullable=True)
    corrected_text = Column(Text, nullable=True)
    compressed = Column(Boolean, nullable=False, default=False)
    summary_json = Column(Text, nullable=True)
    logs_json = Column(Text, nullable=True)
    row_count = Column(Integer, nullable=True, default=0)
    errors_count = Column(Integer, nullable=True, default=0)
    corrected_count = Column(Integer, nullable=True, default=0)
    ok_count = Column(Integer, nullable=True, default=0)
    quality_percent = Column(Float, nullable=True, default=0.0)
    mapping_stats_json = Column(Text, nullable=True)
    structure_json = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="validado")  # validado | error
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    prestador = relationship("Prestador", back_populates="cargues")
    user = relationship("User")


class HistoriaClinica(Base):
    __tablename__ = "historias_clinicas"

    id = Column(Integer, primary_key=True)
    prestador_id = Column(Integer, ForeignKey("prestadores.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_key = Column(String(60), nullable=True, index=True)
    paciente_documento = Column(String(60), nullable=True, index=True)
    paciente_nombre = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    pdf_data = Column(LargeBinary, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    prestador = relationship("Prestador", back_populates="historias")
    user = relationship("User")


def init_db():
    Base.metadata.create_all(bind=engine)
    # Migraciones ligeras para tablas creadas con esquemas anteriores
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cargues ADD COLUMN compressed BOOLEAN"))
    except Exception:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE cargues ALTER COLUMN prestador_id DROP NOT NULL"))
    except Exception:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE historias_clinicas ADD COLUMN pdf_path VARCHAR(500)"))
    except Exception:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE historias_clinicas ADD COLUMN template_key VARCHAR(60)"))
    except Exception:
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
