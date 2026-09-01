"""
Servicio para consultar afiliados desde la BD corporativa Dusakawi.
Conecta a: postgres://postgres:qazwsx12A.@129.80.159.38:5435/base_sie_dusakawi
Schema: administrativo
Tabla: af_Afiliados
"""

import os
from typing import Optional, Dict, List

# URL de la BD corporativa (puede ser variable de entorno)
CORPORATE_DB_URL = os.environ.get(
    "CORPORATE_DATABASE_URL",
    "postgresql://postgres:qazwsx12A.@129.80.159.38:5435/base_sie_dusakawi"
)


def get_corporate_connection():
    """
    Obtiene una conexión a la BD corporativa.
    Se usa sqlalchemy con URL de conexión.
    """
    try:
        from sqlalchemy import create_engine
        # Convertir postgres:// a postgresql:// si es necesario
        url = CORPORATE_DB_URL
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        
        engine = create_engine(url, echo=False, pool_pre_ping=True, connect_args={"connect_timeout": 5})
        return engine
    except Exception as e:
        print(f"Error al conectar con BD corporativa: {str(e)[:200]}")
        return None


def validar_afiliado_corporativo(tipo_id: str, numero_id: str, apellido1: str, nombre1: str) -> Dict:
    """
    Valida un afiliado consultando administrativo."af_Afiliados" en la BD corporativa.
    
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
                FROM administrativo."af_Afiliados"
                WHERE "numero_identificacion" = :numero_id
                  AND "tipo_identificacion" = :tipo_id
                LIMIT 1
            ''')
            
            result = conn.execute(query, {
                "numero_id": str(numero_id).strip(),
                "tipo_id": str(tipo_id).strip().upper()
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
                FROM administrativo."af_Afiliados"
                WHERE "tipo_identificacion" = :tipo_id
                  AND (
                    "primer_apellido" ILIKE :apellido OR
                    "primer_nombre" ILIKE :nombre
                  )
                LIMIT 5
            ''')
            
            results = conn.execute(query_fuzzy, {
                "tipo_id": str(tipo_id).strip().upper(),
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
                FROM administrativo."af_Afiliados"
                WHERE "numero_identificacion" = :numero_id
                  AND "tipo_identificacion" = :tipo_id
                LIMIT 1
            ''')
            
            result = conn.execute(query, {
                "numero_id": str(numero_id).strip(),
                "tipo_id": str(tipo_id).strip().upper()
            }).fetchone()
            
            return result[0] if result else None
        
        finally:
            conn.close()
    
    except Exception as e:
        print(f"Error al obtener IPS: {str(e)}")
        return None


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
