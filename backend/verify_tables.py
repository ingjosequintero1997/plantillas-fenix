"""
Script para verificar y crear las tablas necesarias en la BD local.
Ejecutar después de cambiar a SQLite o cuando se necesite reinicializar.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, init_db, SessionLocal, Base, crear_tabla_gestantes
from sqlalchemy import inspect, text

def verify_and_create_tables():
    """Verifica que todas las tablas necesarias existan y las crea si faltan."""
    
    print("=" * 60)
    print("VERIFICADOR Y CREADOR DE TABLAS")
    print("=" * 60)
    
    # 1. Crear todas las tablas de models si no existen
    print("\n1. Creando tablas de modelos SQLAlchemy...")
    try:
        Base.metadata.create_all(bind=engine)
        print("   ✓ Tablas de modelos creadas/verificadas")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # 2. Crear tabla gestantes
    print("\n2. Creando tabla 'gestantes'...")
    try:
        ncols = crear_tabla_gestantes()
        print(f"   ✓ Tabla gestantes creada/verificada con {ncols} columnas")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # 3. Verificar tablas creadas
    print("\n3. Verificando tablas creadas...")
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"   Tablas encontradas ({len(tables)}):")
        for tbl in sorted(tables):
            cols = len(inspector.get_columns(tbl))
            print(f"      - {tbl} ({cols} columnas)")
    except Exception as e:
        print(f"   Error al inspeccionar: {e}")
        return False
    
    # 4. Test de conexión
    print("\n4. Probando conexión...")
    try:
        db = SessionLocal()
        # Contar registros en cargues
        from database import Cargue
        count = db.query(Cargue).count()
        print(f"   ✓ Conexión OK. Registros en 'cargues': {count}")
        db.close()
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✓ TODAS LAS TABLAS ESTÁN LISTAS")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = verify_and_create_tables()
    sys.exit(0 if success else 1)
