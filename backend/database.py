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


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(120), nullable=True)
    gestante_id = Column(Integer, nullable=True)
    action = Column(String(20), nullable=False)  # CREATE | UPDATE | DELETE
    field_name = Column(String(255), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)


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
    # Crear tabla de auditoria si no existe
    try:
        with engine.begin() as conn:
            is_pg = str(engine.url).startswith("postgresql")
            if is_pg:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
                        user_id INTEGER,
                        username VARCHAR(120),
                        gestante_id INTEGER,
                        action VARCHAR(20) NOT NULL,
                        field_name VARCHAR(255),
                        old_value TEXT,
                        new_value TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        username VARCHAR(120),
                        gestante_id INTEGER,
                        action VARCHAR(20) NOT NULL,
                        field_name VARCHAR(255),
                        old_value TEXT,
                        new_value TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
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
    "CONSECUTIVO", "TIPO_DE_DOCUMENTO_DE_IDENTIDAD", "NO_DE_IDENTIFICACION",
    "APELLIDO_1", "APELLIDO_2", "NOMBRE_1", "NOMBRE_2", "FECHA_DE_NACIMIENTO",
    "EDAD", "SEXO", "REGIMEN_DE_AFILIACION", "PERTENECIA_ETNICA",
    "GRUPO_POBLACIONAL", "DEPARTAMENTO_DE_RESIDENCIA", "MUNICIPIO_DE_RESIDENCIA",
    "ZONA", "ETNIA", "ASENTAMIENTO_RANCHERIA_COMUNIDAD", "TELEFONO_USUARIA",
    "DIRECCION", "NIVEL_EDUCATIVO", "DISCAPACIDAD", "MUJER_CABEZA_DE_HOGAR",
    "OCUPACION", "ESTADO_CIVIL", "CONTROL_TRADICIONAL", "GESTANTE_RENUENTE",
    "INASISTENTE", "NOMBRE_DE_LA_IPS_PRIMARIA",
    "FECHA_DE_INGRESO_AL_CONTROL_PRENATAL", "FUM", "FPP", "DIAS_PARA_EL_PARTO",
    "ALARMA", "EDAD_GEST_INICIO_CONTROL", "TRIMESTRE_INICIO_CONTROL", "G",
    "P", "C", "A", "M", "V", "HIPERTENSION_ARTERIAL", "DIABETES", "VIH",
    "SIFILIS", "TUBERCULOSIS", "OTRAS_CONDICIONES_MEDICAS_GRAVES",
    "SI_LA_RESPUESTA_ANTERIOR_ES_SI_DESCRIBA_LA_OTRA_CONDICION_MEDICA_GRAVE",
    "ANTECEDENTES_DE_EVENTOS_OBSTETRICOS_DESFAVORABLES", "PERIODO_INTERGENESICO",
    "PESO", "TALLA_METROS", "INDICE_DE_MASA_CORPORAL_IMC",
    "CLASIFICACION_DE_IMC", "APOYO_FAMILIAR", "EMBARAZO_DESEADO",
    "HABITOS_DE_RIESGO", "HA_SIDO_VICTIMA_DE_VIOLENCIA_FISICA_O_PSICOLOGICA",
    "HA_SIDO_VICTIMA_DE_ABUSO_SEXUAL", "SE_IDENTIFICAN_CAUSALES_PARA_IVE",
    "CLASIFICACION_DEL_RIESGO", "CAUSAS_DE_ALTO_RIESGO",
    "REMITIDA_A_ESPECIALISTA", "DESCRIBA_CUAL_ES_ESPECIALISTAS_LA_HAN_ATENDIDO",
    "ASESORIA_PRUEBA_VIH", "TRIMESTRE_ASESORIA_VIH",
    "FECHA_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "TRIMESTRE_TOMA_PRUEBA_VIH_PRIMER_TAMIZAJE",
    "FECHA_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "TRIMESTRE_TOMA_PRUEBA_VIH_SEGUNDO_TAMIZAJE",
    "FECHA_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "TRIMESTRE_TOMA_PRUEBA_VIH_TERCER_TAMIZAJE",
    "FECHA_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_PRIMERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_SEGUNDA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "TRIMESTRE_TERCERA_PRUEBA_TREPONEMICA_RAPIDA_SIFILIS",
    "FECHA_DE_LA_REALIZACION_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "RESULTADO_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "FECHA_DE_LA_REALIZACION_PRUEBA_IGG_RUBEOLA",
    "FECHA_TAMIZAJE_TOXOPLASMA", "RESULTADO_TOXOPLASMA",
    "FECHA_DE_TAMIZAJE_PARA_CA_CUELLO_UTERINO",
    "FECHA_DE_TOMA_DE_UROCULTIVO_Y_ANTIBIOGRAMA",
    "FECHA_TOMA_GLICEMIA",
    "FECHA_REALIZACION_HEMOGRAMA_INICIAL",
    "FECHA_REALIZACION_SEGUNDO_HEMOGRAMA_SEMANA_28",
    "FECHA_REALIZACION_HEMOCLASIFICACION",
    "FECHA_REALIZACION_PRUEBA_TAMIZAJE_ESTREPTOCOCO_GRUPO_B",
    "FECHA_REALIZACION_PRUEBA_TOLERANCIA_ORAL_GLUCOSA",
    "FECHA_TOMA_DE_GOTA_GRUESA_MALARIA",
    "FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS",
    "TOMA_SEGUNDA_PRUEBA_VIH", "TRIMESTRE_TOMA_SEGUNDA_PRUEBA_VIH",
    "PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "TRIMESTRE_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "FTA_ABS", "TRIMESTRE_FTA_ABS",
    "FECHA_DE_APLICACION_INFLUENZA_DESDE_SEMANA_14",
    "FECHA_DE_APLICACION_TOXOIDE_SEGUN_ANTECEDENTE_VACUNAL",
    "FECHA_DE_APLICACION_DPT_ACELULAR_SEMANA_26",
    "PRIMERA_ECOGRAFIA_OBSTETRICA_10_13",
    "SEGUNDA_ECOGRAFIA",
    "ECOGRAFIA_OBSTETRICA_PARA_LA_DETECCION_DE_ANOMALIAS_ESTRUCTURALES_18_23",
    "OTRAS_ECOGRAFIAS", "FECHA_SUMINISTRO_ACIDO_FOLICO",
    "FECHA_SUMINISTRO_CALCIO_SEMANA_14", "FECHA_SUMINISTRO_HIERRO",
    "FECHA_DESPARASITACION_ANTIHELMINTICA_II_Y_III_TRIMESTRE_ALBENDAZO_400_MG_DOSIS_UNICA",
    "INFORMACION_EN_SALUD", "FECHA_CONSULTA_ODONTOLOGICA",
    "FECHA_1ER_CONTROL", "QUIEN_REALIZO_EL_CONTROL", "FECHA_2DO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_2", "FECHA_3ER_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_3", "FECHA_4TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_4", "FECHA_5TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_5", "FECHA_6TO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_6", "FECHA_7MO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_7", "FECHA_8VO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_8", "FECHA_9NO_CONTROL",
    "QUIEN_REALIZO_EL_CONTROL_9", "FECHA_OTROS_CONTROLES_PRENATALES",
    "QUIEN_REALIZO_EL_CONTROL_10",
    "FECHA_PRIMERA_CONSULTA_GINECOLOGIA",
    "FECHA_SEGUNDA_CONSULTA_GINECOLOGIA", "FECHA_TERCERA_CONSULTA_GINECOLOGIA",
    "FECHA_CONSULTA_NUTRICION", "FECHA_CONSULTA_PSICOLOGIA",
    "FECHA_DE_ATENCION_OTRO_ESPECIALISTA", "QUIEN_REALIZO_LA_CONSULTA",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_1_TRIM",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_2_TRIM",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_3_TRIM",
    "SANGRADO_VAGINAL_1_TRIM", "SANGRADO_VAGINAL_2_TRIM",
    "SANGRADO_VAGINAL_3_TRIM", "INFECCION_URINARIA_1_TRIM",
    "INFECCION_URINARIA_2_TRIM", "INFECCION_URINARIA_3_TRIM",
    "VIH_1_TRIM", "VIH_2_TRIM", "VIH_3_TRIM",
    "SIFILIS_1_TRIM", "SIFILIS_2_TRIM", "SIFILIS_3_TRIM",
    "HEPATITIS_B_1_TRIM", "HEPATITIS_B_2_TRIM", "HEPATITIS_B_3_TRIM",
    "OTRAS_PATOLOGIAS_DESCRIPCION_Y_FECHA",
    "PRIORIZADA_PARA_SEGUIMIENTO_ESPECIAL",
    "NOTIFICACION_A_LA_IPS", "REMISION", "VISITA_DOMICILIARA",
    "ACOMPAÑAMIENTO_DURANTE_CPN_IMAGENES_DX_Y_EXAMENES_DE_LABORATORIO",
    "CASA_DE_PASO", "APOYO_PARA_TRANSPORTE",
    "ACTIVACION_DE_RED_DE_APOYO_COMUNITARIA",
    "COORDINACION_DE_ESTRATEGIAS_CON_SDSM", "OBSERVACIONES_GESTION_RIESGO",
    "TIPO_DE_EVENTO_CRITERIO_1", "FECHA_CRITERIO_1",
    "TIPO_DE_EVENTO_CRITERIO_2", "FECHA_CRITERIO_2",
    "TIPO_DE_EVENTO_CRITERIO_3", "FECHA_CRITERIO_3",
    "CAUSA_PRINCIPAL_DE_LA_MME",
    "NOMBRE_DEL_FUNCIONARIO_AL_QUE_SE_LE_ASIGNO_EL_CASO",
    "SE_CONCERTO_PLAN_DE_MEJORA_CON_LA_IPS",
    "EVALUACION_Y_SEGUIMIENTO_AL_PLAN_DE_MEJORA",
    "TIPO_DE_ABORTO", "FECHA_DE_ABORTO", "SEMANAS_DE_GESTACION",
    "COMPLICACIONES", "FECHA_DE_PARTO", "CARACTERISTICAS_DEL_PARTO",
    "PARTO_ATENDIDO_POR", "NO_SEMANAS_DE_GESTACION",
    "COMPLICACIONES_DURANTE_EL_PARTO", "TIPO_COMPLICACION", "UCI_MATERNA",
    "TOMA_DE_PRUEBAS_ITS_INTRAPARTO", "RESULTADO_POSITIVO",
    "FECHA_DE_DEFUNCION", "CAUSA_DE_LA_DEFUNCION",
    "MULTIPLICIDAD_DEL_EMBARAZO", "REGISTRO_CIVIL_RECIEN_NACIDO_1",
    "NOMBRE_RECIEN_NACIDO_1", "SEXO_RECIEN_NACIDO_1", "PESO_AL_NACER_GRS",
    "CONDICION_DEL_RECIEN_NACIDO", "TOMA_TSH_RECIEN_NACIDO_1",
    "TOMA_HEMOCLASIFICACION_RECIEN_NACIDO_1",
    "DX_HIPOTIROIDISMO", "TTO_HIPOTIROIDISMO", "TIEMPO_DE_LECTURA",
    "UCI_NEONATAL_RECIEN_NACIDO_1", "VACUNACION_CON_BCG",
    "VACUNACION_ANTIHEPATITIS_B", "REGISTRO_CIVIL_RECIEN_NACIDO_2",
    "NOMBRE_RECIEN_NACIDO_2", "SEXO_RECIEN_NACIDO_2",
    "PESO_AL_NACER_RECIEN_NACIDO_2", "CONDICION_DEL_RECIEN_NACIDO_2",
    "TOMA_TSH_RECIEN_NACIDO_2", "TOMA_HEMOCLASIFICACION_RECIEN_NACIDO_2",
    "DX_HIPOTIROIDISMO_2", "TIEMPO_DE_LECTURA_RECIEN_NACIDO_2",
    "TTO_HIPOTIROIDISMO_RECIEN_NACIDO_2", "UCI_NEONATAL_RECIEN_NACIDO_2",
    "VACUNACION_CON_BCG_2", "VACUNACION_ANTIHEPATITIS_B_2",
    "TIPO", "OBSEVACIONES",
    "CASO_CERRADO",
]


def crear_tabla_gestantes():
    """Crea la tabla gestantes con todos los encabezados.
    En PostgreSQL usa el esquema public; en SQLite crea la tabla directamente.
    Si la tabla ya existe, agrega columnas faltantes."""
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

        # Agregar columnas faltantes a tabla existente
        try:
            result = conn.execute(_text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'gestantes'"
            ))
            existing = {row[0].upper() for row in result}
            for col in GESTANTE_COLUMNS:
                if col.upper() not in existing:
                    try:
                        conn.execute(_text(f'ALTER TABLE gestantes ADD COLUMN "{col}" TEXT'))
                    except Exception:
                        pass
        except Exception:
            pass

    return len(GESTANTE_COLUMNS)
