"""
Servicio para consultar afiliados desde la BD corporativa Dusakawi.
Schema: administrativo
Tabla: af_afiliado (singular, minusculas)
"""

import os
from typing import Optional, Dict, List
from sqlalchemy import create_engine, text

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Mapeo de tipo de documento string -> codigo numerico en BD corporativa
TIPO_DOC_MAP = {
    "CC": 3,   # Cedula de Ciudadania
    "TI": 6,   # Tarjeta de Identidad
    "RC": 5,   # Registro Civil
    "CE": 7,   # Cedula de Extranjeria
    "PA": 8,   # Pasaporte
    "MS": 4,   # Menor sin Identificacion
    "AS": 9,   # Adulto sin Identificacion
    "CN": 11,  # Certificado Nacido Vivo
    "SC": 12,  # Salvo Conducto
    "CD": 10,  # Carnet Diplomatico
    "PE": 13,  # Permiso Especial de Permanencia
    "PT": 14,  # Permiso Proteccion Temporal
    "NI": 1,   # NIT
    "NIT": 1,
}

# Inverso: codigo numerico -> string
TIPO_DOC_REVERSE = {v: k for k, v in TIPO_DOC_MAP.items()}


def _build_corporate_url() -> str:
    """Construye la URL de conexion a BD corporativa desde variables de entorno."""
    host = os.environ.get("CORP_DB_HOST", "")
    port = os.environ.get("CORP_DB_PORT", "5435")
    name = os.environ.get("CORP_DB_NAME", "")
    user = os.environ.get("CORP_DB_USER", "")
    password = os.environ.get("CORP_DB_PASSWORD", "")
    if host and name and user:
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"
    return ""


CORPORATE_DB_URL = _build_corporate_url()


def get_corporate_connection():
    """
    Obtiene una conexión a la BD corporativa.
    Se usa sqlalchemy con URL de conexión.
    Reconstruye la URL en cada llamada para capturar variables de entorno.
    """
    url = _build_corporate_url()
    if not url:
        print("[corporate_db] CORP_DB_HOST/CORP_DB_NAME/CORP_DB_USER no configurados")
        return None
    try:
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        
        engine = create_engine(url, echo=False, pool_pre_ping=True, connect_args={"connect_timeout": 8})
        return engine
    except Exception as e:
        print(f"Error al conectar con BD corporativa: {str(e)[:200]}")
        return None


def validar_afiliado_corporativo(tipo_id: str, numero_id: str, apellido1: str, nombre1: str) -> Dict:
    """
    Valida un afiliado consultando administrativo."af_afiliado" en la BD corporativa.
    
    Args:
        tipo_id: Tipo de identificación (CC, TI, etc.)
        numero_id: Número de identificación
        apellido1: Primer apellido
        nombre1: Primer nombre
    
    Returns:
        dict con:
        {
            "encontrado": bool,
            "concordancia": float (0-100),
            "datos": {...} | None,
            "error": str | None
        }
    """
    try:
        engine = get_corporate_connection()
        if not engine:
            return {
                "encontrado": False,
                "concordancia": 0,
                "datos": None,
                "error": "No se pudo conectar con BD corporativa"
            }
        
        from sqlalchemy import text
        conn = engine.connect()
        
        try:
            # Búsqueda exacta por número de ID
            query = text('''
                SELECT 
                    "numero_identificacion",
                    "tipo_identificacion",
                    "primer_apellido",
                    "segundo_apellido",
                    "primer_nombre",
                    "segundo_nombre",
                    "fecha_nacimiento",
                    "sexo",
                    "ips"
                FROM administrativo."af_afiliado"
                WHERE "numero_identificacion" = :numero_id
                  AND "tipo_identificacion" = :tipo_id
                LIMIT 1
            ''')
            
            result = conn.execute(query, {
                "numero_id": str(numero_id).strip(),
                "tipo_id": TIPO_DOC_MAP.get(str(tipo_id).strip().upper(), 0)
            }).fetchone()
            
            if result:
                return {
                    "encontrado": True,
                    "concordancia": 100.0,
                    "datos": {
                        "numero_identificacion": result[0],
                        "tipo_identificacion": result[1],
                        "primer_apellido": result[2],
                        "segundo_apellido": result[3],
                        "primer_nombre": result[4],
                        "segundo_nombre": result[5],
                        "fecha_nacimiento": result[6],
                        "sexo": result[7],
                        "ips": result[8],
                    },
                    "error": None
                }
            
            # Si no hay coincidencia exacta, búsqueda fuzzy
            query_fuzzy = text('''
                SELECT 
                    "numero_identificacion",
                    "tipo_identificacion",
                    "primer_apellido",
                    "segundo_apellido",
                    "primer_nombre",
                    "segundo_nombre",
                    "fecha_nacimiento",
                    "sexo",
                    "ips"
                FROM administrativo."af_afiliado"
                WHERE "tipo_identificacion" = :tipo_id
                  AND (
                    "primer_apellido" ILIKE :apellido OR
                    "primer_nombre" ILIKE :nombre
                  )
                LIMIT 5
            ''')
            
            results = conn.execute(query_fuzzy, {
                "tipo_id": TIPO_DOC_MAP.get(str(tipo_id).strip().upper(), 0),
                "apellido": f"%{apellido1.strip()}%",
                "nombre": f"%{nombre1.strip()}%",
            }).fetchall()
            
            if results:
                # Simple matching: si hay al menos coincidencia en apellido y nombre
                from difflib import SequenceMatcher
                
                query_str = f"{nombre1} {apellido1}".strip().upper()
                best_match = None
                best_score = 0
                
                for row in results:
                    afd_str = f"{row[4]} {row[2]}".strip().upper()  # nombre + apellido
                    score = int(SequenceMatcher(None, query_str, afd_str).ratio() * 100)
                    if score > best_score:
                        best_score = score
                        best_match = row
                
                if best_match and best_score >= 60:
                    return {
                        "encontrado": True,
                        "concordancia": float(best_score),
                        "datos": {
                            "numero_identificacion": best_match[0],
                            "tipo_identificacion": best_match[1],
                            "primer_apellido": best_match[2],
                            "segundo_apellido": best_match[3],
                            "primer_nombre": best_match[4],
                            "segundo_nombre": best_match[5],
                            "fecha_nacimiento": best_match[6],
                            "sexo": best_match[7],
                            "ips": best_match[8],
                        },
                        "error": None
                    }
            
            # No encontrado
            return {
                "encontrado": False,
                "concordancia": 0,
                "datos": None,
                "error": None
            }
        
        finally:
            conn.close()
    
    except Exception as e:
        return {
            "encontrado": False,
            "concordancia": 0,
            "datos": None,
            "error": f"Error al validar: {str(e)[:150]}"
        }


def obtener_ips_de_afiliado(numero_id: str, tipo_id: str = "CC") -> Optional[str]:
    """
    Obtiene el código de IPS primaria de un afiliado.
    
    Args:
        numero_id: Número de identificación
        tipo_id: Tipo de identificación (default: CC)
    
    Returns:
        str con código de IPS o None
    """
    try:
        engine = get_corporate_connection()
        if not engine:
            return None
        
        from sqlalchemy import text
        conn = engine.connect()
        
        try:
            query = text('''
                SELECT "ips"
                FROM administrativo."af_afiliado"
                WHERE "numero_identificacion" = :numero_id
                  AND "tipo_identificacion" = :tipo_id
                LIMIT 1
            ''')
            
            result = conn.execute(query, {
                "numero_id": str(numero_id).strip(),
                "tipo_id": TIPO_DOC_MAP.get(str(tipo_id).strip().upper(), 0)
            }).fetchone()
            
            return result[0] if result else None
        
        finally:
            conn.close()
    
    except Exception as e:
        print(f"Error al obtener IPS: {str(e)}")
        return None


def validar_afiliados_lote(usuarios: list) -> dict:
    """
    Valida un lote de usuarios contra administrativo."af_afiliado".
    
    Args:
        usuarios: lista de dicts con "tipo_id" y "numero_id"
        Ej: [{"tipo_id": "CC", "numero_id": "123456789"}, ...]
    
    Returns:
        dict con:
        {
            "encontrados": [{"tipo_id": "CC", "numero_id": "123", "ips": "803709"}, ...],
            "no_encontrados": [{"tipo_id": "CC", "numero_id": "999"}, ...],
            "error": str | None
        }
    """
    try:
        engine = get_corporate_connection()
        if not engine:
            return {"encontrados": [], "no_encontrados": usuarios, "error": "No se pudo conectar con BD corporativa"}
        
        from sqlalchemy import text
        conn = engine.connect()
        
        try:
            encontrados = []
            no_encontrados = []
            
            BATCH_SIZE = 200
            for i in range(0, len(usuarios), BATCH_SIZE):
                batch = usuarios[i:i + BATCH_SIZE]
                
                params = {}
                conditions = []
                for idx, u in enumerate(batch):
                    key_tipo = f"tipo_{idx}"
                    key_num = f"num_{idx}"
                    tipo_str = str(u["tipo_id"]).strip().upper()
                    tipo_num = TIPO_DOC_MAP.get(tipo_str, 0)
                    params[key_tipo] = tipo_num
                    params[key_num] = str(u["numero_id"]).strip()
                    conditions.append(f"(a.\"tipo_identificacion\" = :{key_tipo} AND a.\"numero_identificacion\" = :{key_num})")
                
                where_clause = " OR ".join(conditions)
                query = text(f'''
                    SELECT a."tipo_identificacion", a."numero_identificacion", a."ips"
                    FROM administrativo."af_afiliado" a
                    WHERE {where_clause}
                ''')
                
                result = conn.execute(query, params).fetchall()
                
                # Indexar resultados encontrados
                encontrados_set = set()
                for row in result:
                    tipo_raw = str(row[0]).strip()
                    num = str(row[1]).strip()
                    ips_code = str(row[2]).strip() if row[2] else None
                    # Convertir tipo numerico (3) a string (CC) para poder comparar
                    tipo_int = int(float(tipo_raw)) if tipo_raw.isdigit() or (tipo_raw.replace('.','').isdigit()) else 0
                    tipo_str_db = TIPO_DOC_REVERSE.get(tipo_int, tipo_raw)
                    encontrados_set.add((tipo_str_db, num))
                    encontrados.append({"tipo_id": tipo_str_db, "numero_id": num, "ips": ips_code})
                
                # Marcar no encontrados
                for u in batch:
                    key = (str(u["tipo_id"]).strip().upper(), str(u["numero_id"]).strip())
                    if key not in encontrados_set:
                        no_encontrados.append({"tipo_id": key[0], "numero_id": key[1]})
            
            return {"encontrados": encontrados, "no_encontrados": no_encontrados, "error": None}
        
        finally:
            conn.close()
    
    except Exception as e:
        return {"encontrados": [], "no_encontrados": usuarios, "error": f"Error en lote: {str(e)[:200]}"}


def obtener_nombres_ips(ips_codes: list) -> dict:
    """
    Obtiene los nombres de IPS desde ct_ips para una lista de códigos.
    
    Args:
        ips_codes: lista de códigos de IPS (strings)
    
    Returns:
        dict mapeando codigo IPS -> razon_social
        Ej: {"803709": "DUSAKAWI IPSI", ...}
    """
    if not ips_codes:
        return {}
    
    try:
        engine = get_corporate_connection()
        if not engine:
            return {}
        
        from sqlalchemy import text
        conn = engine.connect()
        
        try:
            # Limpiar códigos nulos/vacíos
            clean_codes = list({str(c).strip() for c in ips_codes if c and str(c).strip()})
            if not clean_codes:
                return {}
            
            BATCH_SIZE = 200
            resultado = {}
            
            for i in range(0, len(clean_codes), BATCH_SIZE):
                batch = clean_codes[i:i + BATCH_SIZE]
                params = {}
                placeholders = []
                for idx, code in enumerate(batch):
                    key = f"code_{idx}"
                    params[key] = code
                    placeholders.append(f":{key}")
                
                in_clause = ", ".join(placeholders)
                query = text(f'''
                    SELECT "ips", "razon_social"
                    FROM administrativo."ct_ips"
                    WHERE "ips" IN ({in_clause})
                ''')
                
                result = conn.execute(query, params).fetchall()
                for row in result:
                    resultado[str(row[0]).strip()] = str(row[1]).strip() if row[1] else f"IPS {row[0]}"
            
            return resultado
        
        finally:
            conn.close()
    
    except Exception as e:
        print(f"Error al obtener nombres IPS: {str(e)}")
        return {}


def test_conexion_corporativa() -> bool:
    """
    Prueba la conexión con la BD corporativa.
    
    Returns:
        True si conecta correctamente, False en caso contrario
    """
    try:
        engine = get_corporate_connection()
        if not engine:
            return False
        
        from sqlalchemy import text
        conn = engine.connect()
        conn.execute(text("SELECT 1"))
        conn.close()
        return True
    
    except Exception as e:
        print(f"Error en test de conexión: {str(e)}")
        return False
