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
    JSON,
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
    ips = Column(String(60), nullable=True)
    permissions = Column(JSON, nullable=True)
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
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE prestadores ADD COLUMN ips VARCHAR(60)"))
    except Exception:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE prestadores ADD COLUMN permissions JSON"))
    except Exception:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE gestantes ADD COLUMN CASO_CERRADO BOOLEAN DEFAULT FALSE"))
    except Exception:
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Tabla de gestantes (encabezados del modulo gestante) ────────────────
# Columnas generadas desde gestante_config (207 variables). Todas TEXT para
# aceptar cualquier valor; se pueden ajustar tipos despues.
GESTANTE_COLUMNS = [
    "TIPO_DE_DOCUMENTO_DE_IDENTIDAD", "NO_DE_IDENTIFICACION", "APELLIDO_1",
    "APELLIDO_2", "NOMBRE_1", "NOMBRE_2", "FECHA_DE_NACIMIENTO", "EDAD",
    "SEXO", "REGIMEN_DE_AFILIACION", "PERTENECIA_ETNICA", "GRUPO_POBLACIONAL",
    "DEPARTAMENTO_DE_RESIDENCIA", "MUNICIPIO_DE_RESIDENCIA", "ZONA", "ETNIA",
    "ASENTAMIENTO_RANCHERIA_COMUNIDAD", "TELEFONO_USUARIA", "DIRECCION",
    "NIVEL_EDUCATIVO", "DISCAPACIDAD", "MUJER_CABEZA_DE_HOGAR", "OCUPACION",
    "ESTADO_CIVIL", "CONTROL_TRADICIONAL", "GESTANTE_RENUENTE", "INASISTENTE",
    "NOMBRE_DE_LA_IPS_PRIMARIA", "FECHA_DE_DIAGNOSTICO",
    "FECHA_DE_INGRESO_AL_CONTROL_PRENATAL", "FUM", "FPP", "DIAS_PARA_EL_PARTO",
    "ALARMA", "EDAD_GEST_INICIO_CONTROL", "TRIMESTRE_INICIO_CONTROL", "G",
    "P", "C", "A", "M", "V", "HIPERTENSION_ARTERIAL", "DIABETES", "VIH",
    "SIFILIS", "TUBERCULOSIS", "OTRAS_CONDICIONES_MEDICAS_GRAVES",
    "SI_LA_RESPUESTA_ANTERIOR_ES_SI_DESCRIBA_LA_OTRA_CONDICION_MEDICA_GRAVE",
    "ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES", "PERIODO_INTERGENESICO",
    "PESO_INICIAL_KG", "TALLA_METROS", "INDICE_DE_MASA_CORPORAL_IMC",
    "CLASIFICACION_DE_IMC", "APOYO_FAMILIAR", "EMBARAZO_DESEADO",
    "HABITOS_DE_RIESGO", "HA_SIDO_VICTIMA_DE_VIOLENCIA_FISICA_O_PSICOLOGICA",
    "HA_SIDO_VICTIMA_DE_ABUSO_SEXUAL", "SE_IDENTIFICAN_CAUSALES_PARA_IVE",
    "CLASIFICACION_DEL_RIESGO", "CAUSAS_DE_ALTO_RIESGO",
    "PUNTAJE_DE_CLASIFICACION_SEGUN_ESCALA_DE_HERRERA_Y_HURTADO",
    "REMITIDA_A_ESPECIALISTA", "DESCRIBA_CUAL_ES_ESPECIALISTAS_LA_HAN_ATENDIDO",
    "ASESORIA_PRUEBA_VIH", "TRIMESTRE_ASESORIA_VIH",
    "FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "RESULTADO_PRIMER_TAMIZAJE_PRUEBA_DE_VIH",
    "TRIMESTRE_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "RESULTADO_SEGUNDO_TAMIZAJE_PRUEBA_DE_VIH",
    "TRIMESTRE_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "RESULTADO_TERCER_TAMIZAJE_PRUEBA_DE_VIH",
    "TRIMESTRE_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "RESULTADO_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "RESULTADO_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "RESULTADO_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_TOMA_SEGUNDA_PRUEBA_VIH", "RESULTADO_TOMA_SEGUNDA_PRUEBA_VIH",
    "TRIMESTRE_TOMA_SEGUNDA_PRUEBA_VIH",
    "FECHA_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "TRIMESTRE_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "FECHA_DE_DIAGNOSTICO_DE_SIFILIS", "TRATAMIENTO_INSTAURADO",
    "FECHA_DE_INICIO_DEL_TRATAMIENTO", "FECHA_DE_SEGUNDA_DOSIS_DEL_TRATAMIENTO",
    "FECHA_DE_TERCERA_DOSIS_DEL_TRATAMIENTO", "FECHA_DE_TOMA_DE_UROCULTIVO",
    "RESULTADO_UROCULTIVO", "FECHA_TOMA_GLICEMIA", "RESULTADO_GLICEMIA",
    "FECHA_PRUEBA_DE_TOLERANCIA_ORAL_GLUCOSA",
    "RESULTADO_PRUEBA_DE_TOLERANCIA_ORAL_GLUCOSA",
    "FECHA_REALIZACION_HEMOGLOBINA", "RESULTADO_HEMOGLOBINA",
    "RESULTADO_REALIZACION_HEMOCLASIFICACION_FACTOR_RH",
    "FECHA_DE_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "RESULTADO_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "FECHA_TAMIZAJE_TOXOPLASMA", "RESULTADO_TOXOPLASMA",
    "FECHA_DE_LA_PRUEBA_DE_RUBEOLA", "RESULTADO_RUBEOLA",
    "FECHA_CITOLOGIA_CERVICOUTERINA", "RESULTADO_TAMIZAJE_DE_CUELLO_UTERINO",
    "FECHA_PRUEBA_DE_TAMIZAJE_PARA_ESTREPTOCOCO_GRUPO_B",
    "RESULTADO_PRUEBA_DE_TAMIZAJE_PARA_ESTREPTOCOCO_GRUPO_B",
    "FECHA_TOMA_DE_GOTA_GRUESA_MALARIA", "RESULTADO_GOTA_GRUESA_MALARIA",
    "FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS", "RESULTADO_CHAGAS",
    "FECHA_DE_APLICACION_INFLUENZA_DESDE_SEMANA_14",
    "FECHA_DE_APLICACION_TOXOIDE_SEGUN_ANTECEDENTE_VACUNAL",
    "FECHA_DE_APLICACION_DPT_ACELULAR_SEMANA_26", "FECHA_CONSULTA_ODONTOLOGICA",
    "ECOGRAFIA_OBSTETRICA_CON_TRANSLUCENCIA_NUCAL_10_6_13_6",
    "ECOGRAFIA_OBSTETRICA_PARA_LA_DETECCION_DE_ANOMALIAS_ESTRUCTURALES_18_23",
    "OTRAS_ECOGRAFIAS", "FECHA_SUMINISTRO_ACIDO_FOLICO",
    "FECHA_SUMINISTRO_CALCIO_SEMANA_14", "FECHA_SUMINISTRO_HIERRO",
    "FECHA_SUMINISTRO_ASA",
    "FECHA_DESPARASITACION_ANTIHELMINTICA_II_Y_III_TRIMESTRE_ALBENDAZO_400_MG_DOSIS_UNICA",
    "FECHA_1ER_CONTROL", "QUIEN_REALIZO_EL_CONTROL", "FECHA_2DO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_2", "FECHA_3ER_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_3", "FECHA_4TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_4", "FECHA_5TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_5", "FECHA_6TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_6", "FECHA_7MO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_7", "FECHA_8VO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_8", "FECHA_9NO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_9", "NUMERO_TOTAL_DE_CONTROLES_PRENATALES",
    "ULTIMO_CONTROL_PRENATAL", "EDAD_GESTACIONAL_ACTUAL", "PESO_ACTUAL",
    "TALLA_ACTUAL", "IMC", "TA_ACTUAL", "FECHA_PRIMERA_CONSULTA_GINECOLOGIA",
    "FECHA_SEGUNDA_CONSULTA_GINECOLOGIA", "FECHA_TERCERA_CONSULTA_GINECOLOGIA",
    "FECHA_CONSULTA_NUTRICION", "FECHA_CONSULTA_PSICOLOGIA",
    "FECHA_DE_ATENCION_OTRO_ESPECIALISTA", "QUIEN_REALIZO_LA_CONSULTA",
    "TIPO_DE_ABORTO", "FECHA", "SEMANAS_DE_GESTACION", "COMPLICACIONES",
    "FECHA_DE_PARTO", "CARACTERISTICAS_DEL_PARTO", "PARTO_ATENDIDO_POR",
    "NO_SEMANAS_DE_GESTACION", "COMPLICACIONES_DURANTE_EL_PARTO",
    "TIPO_COMPLICACION", "UCI_MATERNA", "TOMA_DE_PRUEBAS_ITS_INTRAPARTO",
    "RESULTADO_POSITIVO", "FECHA_DE_DEFUNCION", "CAUSA_DE_LA_DEFUNCION",
    "MULTIPLICIDAD_DEL_EMBARAZO", "REGISTRO_CIVIL_RECIEN_NACIDO_1",
    "NOMBRE_RECIEN_NACIDO_1", "SEXO_RECIEN_NACIDO_1", "PESO_AL_NACER_GRS",
    "CONDICION_DEL_RECIEN_NACIDO", "TOMA_TSH_RECIEN_NACIDO_1",
    "DX_HIPOTIROIDISMO", "TTO_HIPOTIROIDISMO", "TIEMPO_DE_LECTURA",
    "UCI_NEONATAL_RECIEN_NACIDO_1", "VACUNACION_CON_BCG",
    "VACUNACION_ANTIHEPATITIS_B", "REGISTRO_CIVIL_RECIEN_NACIDO_2",
    "NOMBRE_RECIEN_NACIDO_2", "SEXO_RECIEN_NACIDO_2",
    "PESO_AL_NACER_RECIEN_NACIDO_2_GRS", "CONDICION_DEL_RECIEN_NACIDO_2",
    "TOMA_TSH_RECIEN_NACIDO_2", "DX_HIPOTIROIDISMO_2",
    "TIEMPO_DE_LECTURA_RECIEN_NACIDO_2", "UCI_NEONATAL_RECIEN_NACIDO_2",
    "TTO_HIPOTIROIDISMO_RECIEN_NACIDO_2", "VACUNACION_CON_BCG_2",
    "VACUNACION_ANTIHEPATITIS_B_2", "TIPO", "OBSEVACION", "FECHA_2",
    "OBSERVACIONES_GENERALES",
    "CASO_CERRADO",
]


def crear_tabla_gestantes():
    """Crea la tabla gestantes con todos los encabezados.
    En PostgreSQL usa el esquema public; en SQLite crea la tabla directa."""
    from sqlalchemy import text as _text
    is_pg = str(engine.url).startswith("postgresql")
    col_defs = ", ".join(f'"{c}" TEXT' for c in GESTANTE_COLUMNS)
    if is_pg:
        schema_ddl = 'CREATE SCHEMA IF NOT EXISTS public'
    else:
        schema_ddl = None
    table_ddl = f'''
        CREATE TABLE IF NOT EXISTS {("public." if is_pg else "")}gestantes (
            id INTEGER PRIMARY KEY {("GENERATED BY DEFAULT AS IDENTITY" if is_pg else "AUTOINCREMENT")},
            prestador_id INTEGER,
            user_id INTEGER,
            mes VARCHAR(7),
            original_filename VARCHAR(255),
            {col_defs},
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    '''
    with engine.begin() as conn:
        if schema_ddl:
            conn.execute(_text(schema_ddl))
        conn.execute(_text(table_ddl))
    return len(GESTANTE_COLUMNS)
