"""
Servicio para gestión de afiliados: carga, validación y búsqueda.
"""

import pandas as pd
from datetime import datetime
from difflib import SequenceMatcher
try:
    from rapidfuzz import fuzz
    USE_RAPIDFUZZ = True
except ImportError:
    USE_RAPIDFUZZ = False

try:
    from .database import SessionLocal, AfAfiliado, Prestador, text
except ImportError:
    from database import SessionLocal, AfAfiliado, Prestador
    from sqlalchemy import text


def cargar_afiliados_desde_csv(csv_path: str):
    """
    Carga el archivo CSV de afiliados en la tabla af_afiliados.
    
    Args:
        csv_path: Ruta al archivo CSV (delimitado con |)
    
    Returns:
        dict con estadísticas de carga
    """
    db = SessionLocal()
    try:
        # Limpiar tabla anterior
        db.query(AfAfiliado).delete()
        db.commit()
        
        # Leer CSV
        df = pd.read_csv(csv_path, sep='|', dtype=str, keep_default_na=False)
        
        columnas_esperadas = {
            'tipo_identificacion': 'tipo_identificacion',
            'numero_identificacion': 'numero_identificacion',
            'primer_apellido': 'primer_apellido',
            'segundo_apellido': 'segundo_apellido',
            'primer_nombre': 'primer_nombre',
            'segundo_nombre': 'segundo_nombre',
            'fecha_nacimiento': 'fecha_nacimiento',
            'sexo': 'sexo',
            'ips': 'ips',
        }
        
        # Validar y mapear columnas
        df_cols = {col.lower().strip().replace('"', ''): col for col in df.columns}
        
        total_insertados = 0
        errores = []
        
        for idx, row in df.iterrows():
            try:
                afiliado = AfAfiliado(
                    tipo_identificacion=str(row.get('tipo_identificacion', '')).strip().replace('"', ''),
                    numero_identificacion=str(row.get('numero_identificacion', '')).strip().replace('"', ''),
                    primer_apellido=str(row.get('primer_apellido', '')).strip().replace('"', ''),
                    segundo_apellido=str(row.get('segundo_apellido', '')).strip().replace('"', ''),
                    primer_nombre=str(row.get('primer_nombre', '')).strip().replace('"', ''),
                    segundo_nombre=str(row.get('segundo_nombre', '')).strip().replace('"', ''),
                    fecha_nacimiento=str(row.get('fecha_nacimiento', '')).strip().replace('"', ''),
                    sexo=str(row.get('sexo', '')).strip().replace('"', ''),
                    ips=str(row.get('ips', '')).strip().replace('"', ''),
                    estado_afiliado=str(row.get('estado_afiliado', 'ACTIVO')).strip().replace('"', ''),
                    suspendido=str(row.get('suspendido', '0')).strip().replace('"', '') in ('1', 'SI', 'S'),
                )
                db.add(afiliado)
                total_insertados += 1
            except Exception as e:
                errores.append(f"Fila {idx+1}: {str(e)[:100]}")
                if len(errores) >= 20:
                    break
        
        db.commit()
        return {
            "success": True,
            "total_insertados": total_insertados,
            "errores": errores[:10],
        }
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "error": str(e)[:300],
            "total_insertados": 0,
        }
    finally:
        db.close()


def validar_afiliado(tipo_id: str, numero_id: str, apellido1: str, nombre1: str, fecha_nac: str = None) -> dict:
    """
    Valida un afiliado contra la tabla af_afiliados usando fuzzy matching.
    
    Args:
        tipo_id: Tipo de identificación (CC, TI, etc.)
        numero_id: Número de identificación
        apellido1: Primer apellido
        nombre1: Primer nombre
        fecha_nac: Fecha de nacimiento (opcional, formato YYYY-MM-DD)
    
    Returns:
        dict con resultado de validación:
        {
            "encontrado": bool,
            "afiliado_id": int | None,
            "concordancia": float (0-100),
            "detalles": {...}
        }
    """
    db = SessionLocal()
    try:
        # Búsqueda exacta por número de ID primero
        exacto = db.query(AfAfiliado).filter(
            AfAfiliado.numero_identificacion == str(numero_id).strip(),
            AfAfiliado.tipo_identificacion == str(tipo_id).strip().upper()
        ).first()
        
        if exacto:
            return {
                "encontrado": True,
                "afiliado_id": exacto.id,
                "concordancia": 100.0,
                "tipo": "exacto",
                "detalles": {
                    "nombre": f"{exacto.primer_nombre} {exacto.segundo_nombre} {exacto.primer_apellido} {exacto.segundo_apellido}".strip(),
                    "fecha_nacimiento": exacto.fecha_nacimiento,
                    "ips": exacto.ips,
                }
            }
        
        # Búsqueda fuzzy si no hay coincidencia exacta
        query_name = f"{nombre1} {apellido1}".strip().upper()
        afiliados = db.query(AfAfiliado).filter(
            AfAfiliado.tipo_identificacion == str(tipo_id).strip().upper()
        ).all()
        
        mejores = []
        for afd in afiliados:
            afd_name = f"{afd.primer_nombre} {afd.primer_apellido}".strip().upper()
            
            # Usar RapidFuzz si está disponible, sino SequenceMatcher
            if USE_RAPIDFUZZ:
                score = fuzz.ratio(query_name, afd_name)
            else:
                score = int(SequenceMatcher(None, query_name, afd_name).ratio() * 100)
            
            if score >= 70:  # Threshold de 70%
                mejores.append((score, afd))
        
        if mejores:
            mejores.sort(key=lambda x: x[0], reverse=True)
            score, afd = mejores[0]
            return {
                "encontrado": True,
                "afiliado_id": afd.id,
                "concordancia": float(score),
                "tipo": "fuzzy",
                "detalles": {
                    "nombre": f"{afd.primer_nombre} {afd.segundo_nombre} {afd.primer_apellido} {afd.segundo_apellido}".strip(),
                    "fecha_nacimiento": afd.fecha_nacimiento,
                    "ips": afd.ips,
                }
            }
        
        # No encontrado
        return {
            "encontrado": False,
            "afiliado_id": None,
            "concordancia": 0.0,
            "tipo": "no_encontrado",
            "detalles": None
        }
    
    except Exception as e:
        return {
            "encontrado": False,
            "error": str(e)[:200],
            "afiliado_id": None,
            "concordancia": 0.0,
        }
    finally:
        db.close()


def obtener_prestador_por_ips(ips_nombre: str) -> dict:
    """
    Busca un prestador por el nombre de IPS.
    
    Args:
        ips_nombre: Nombre de la IPS (e.g., "DUSAKAWI IPS")
    
    Returns:
        dict con datos del prestador o None
    """
    db = SessionLocal()
    try:
        # Búsqueda exacta
        ips_norm = str(ips_nombre).strip().upper()
        
        prestador = db.query(Prestador).filter(
            Prestador.ips == ips_norm
        ).first()
        
        if not prestador:
            # Búsqueda fuzzy en nombre
            if USE_RAPIDFUZZ:
                from rapidfuzz import process
                todos = db.query(Prestador).all()
                matches = process.extract(
                    ips_norm,
                    [p.nombre.upper() if p.nombre else '' for p in todos],
                    limit=1,
                    score_cutoff=70
                )
                if matches:
                    prestador = todos[matches[0][2]]
            else:
                # Fallback simple: buscar LIKE
                prestador = db.query(Prestador).filter(
                    Prestador.nombre.ilike(f"%{ips_nombre}%")
                ).first()
        
        if prestador:
            return {
                "id": prestador.id,
                "nombre": prestador.nombre,
                "ips": prestador.ips,
            }
        
        return None
    
    except Exception as e:
        return None
    finally:
        db.close()


def agrupar_gestantes_por_ips(registro_ips_nombre: str) -> str:
    """
    Normaliza el nombre de IPS para agrupar correctamente.
    Utilizado para el filtrado en listar_ips_grupos.
    """
    return str(registro_ips_nombre).strip().upper()
