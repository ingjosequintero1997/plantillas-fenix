#!/usr/bin/env python
"""Script para reparar la tabla gestantes mapeando columnas por NOMBRE en lugar de índice.

Usa sqlite3 directamente para evitar problemas de modelo SQLAlchemy.
"""

import sys
import os
import base64
import gzip
import unicodedata
import sqlite3

# Agregar path del backend
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from database import GESTANTE_COLUMNS
from gestante_config import RAW_FIELDS


def _norm(s):
    """Normalizar nombre de columna: mayúsculas, sin tildes, sin espacios/puntuación."""
    s = str(s).strip().upper()
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.replace(',', '').replace('.', '').replace('/', '').replace(' ', '')
    return s


def main():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'validador.db')
    
    if not os.path.exists(db_path):
        print(f"ERROR: No found database at {db_path}")
        sys.exit(1)

    # Conectar a SQLite directamente
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Crear tabla gestantes si no existe (usando la función del backend)
    try:
        from database import crear_tabla_gestantes
        # Ejecutarla en la conexión raw
        import inspect
        # La función crear_tabla_gestantes usa SessionLocal, intentaremos crearla manualmente
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gestantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                "TIPO_DE_DOCUMENTO_DE_IDENTIDAD" TEXT,
                "NO_DE_IDENTIFICACION" TEXT,
                "APELLIDO_1" TEXT,
                "APELLIDO_2" TEXT,
                "NOMBRE_1" TEXT,
                "NOMBRE_2" TEXT,
                "FECHA_DE_NACIMIENTO" TEXT,
                "EDAD" INTEGER,
                "SEXO" TEXT,
                "REGIMEN_DE_AFILIACION" TEXT,
                "PERTENECIA_ETNICA" TEXT,
                "GRUPO_POBLACIONAL" TEXT,
                "DEPARTAMENTO_DE_RESIDENCIA" TEXT,
                "MUNICIPIO_DE_RESIDENCIA" TEXT,
                "ZONA" TEXT,
                "ETNIA" TEXT,
                "ASENTAMIENTO_RANCHERIA_COMUNIDAD" TEXT,
                "TELEFONO_USUARIA" TEXT,
                "DIRECCION" TEXT,
                "NIVEL_EDUCATIVO" TEXT,
                "DISCAPACIDAD" TEXT,
                "MUJER_CABEZA_DE_HOGAR" TEXT,
                "OCUPACION" TEXT,
                "ESTADO_CIVIL" TEXT,
                "CONTROL_TRADICIONAL" TEXT,
                "GESTANTE_RENUENTE" TEXT,
                "INASISTENTE" TEXT,
                "NOMBRE_DE_LA_IPS_PRIMARIA" TEXT,
                "FECHA_DE_DIAGNOSTICO" TEXT,
                "FECHA_DE_INGRESO_AL_CONTROL_PRENATAL" TEXT,
                "FUM" TEXT,
                "FPP" TEXT,
                "DIAS_PARA_EL_PARTO" TEXT,
                "ALARMA" TEXT,
                "prestador_id" INTEGER,
                "user_id" INTEGER,
                "mes" TEXT,
                "original_filename" TEXT
            )
        """)
        print("Tabla gestantes asegurada (creada manualmente)")
    except Exception as e:
        print(f"Nota: {e}")

    # Construir mapeo RAW_FIELDS -> GESTANTE_COLUMNS por nombre normalizado
    raw_to_col = {}
    for rf_name, _ in RAW_FIELDS:
        raw_to_col[_norm(rf_name)] = None
    for gc in GESTANTE_COLUMNS:
        key = _norm(gc)
        if key in raw_to_col:
            raw_to_col[key] = gc

    print(f"Mapeo creado: {sum(1 for v in raw_to_col.values() if v is not None)} columnas mapeadas")

    # Buscar el último cargue usando sqlite3 directo
    cursor = conn.execute("""
        SELECT id, template_key, mes, user_id, original_filename, corrected_text, raw_text, compressed
        FROM cargues 
        WHERE template_key = 'gestante' 
        ORDER BY id DESC LIMIT 1
    """)
    cargue_row = cursor.fetchone()
    
    if not cargue_row:
        print("ERROR: No hay cargues de gestantes")
        conn.close()
        sys.exit(1)

    cargue = dict(cargue_row)
    print(f"Cargue: id={cargue['id']}, template_key={cargue['template_key']}, user_id={cargue['user_id']}")

    # Obtener texto del cargue
    texto = cargue['corrected_text'] or cargue['raw_text'] or ""
    if not texto:
        print("ERROR: Texto vacio en el cargue")
        conn.close()
        sys.exit(1)

    # Decodificar si viene en bytes
    if isinstance(texto, bytes):
        try:
            texto = texto.decode("utf-8", errors="replace")
            print("Texto decodificado desde bytes")
        except Exception:
            texto = str(texto)

    # Si parece base64, decodificarlo
    stripped = texto.strip()
    if stripped.startswith('JVBER') or stripped.startswith('eJw'):
        try:
            texto = base64.b64decode(stripped).decode("utf-8", errors="replace")
            print("Texto decodificado desde base64")
        except Exception as e:
            print(f"No se pudo decodificar base64: {e}")

    lineas = [l for l in texto.strip().split("\n") if l.strip()]
    print(f"Total lineas: {len(lineas)}")

    if not lineas:
        print("ERROR: 0 lineas de texto")
        conn.close()
        sys.exit(1)

    # Primera linea tiene nombres de columna del template
    primera_linea = lineas[0].split("|")
    nombres_template = [p.strip() for p in primera_linea]
    print(f"Template nombres (primeras 5): {nombres_template[:5]}")

    # Construir: indice_csv -> nombre_columna_tabla
    csv_to_col = {}
    for ci, n in enumerate(nombres_template):
        key = _norm(n)
        if key in raw_to_col and raw_to_col[key] is not None:
            csv_to_col[ci] = raw_to_col[key]

    print(f"Mapeo CSV->Tabla: {len(csv_to_col)} columnas mapeadas")
    for ci, col in sorted(csv_to_col.items()):
        if 'IPS' in col.upper() or 'prestador' in col.lower() or 'user_id' in col.lower() or 'mes' in col.lower():
            print(f"  indice_csv={ci} -> {col}")

    # Determinar ips_to_prestador consultando la tabla prestadores en SQLite
    # Primero verificamos si existe tabla prestadores
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prestadores'")
    if cursor.fetchone():
        cursor = conn.execute("SELECT id, ips, nombre FROM prestadores")
        prestadores = cursor.fetchall()
        ips_to_prestador = {}
        for prest in prestadores:
            ips_key = str(prest['ips']).strip().upper() if prest['ips'] else ""
            if ips_key:
                ips_to_prestador[ips_key] = prest['id']
            if prest['nombre']:
                name_key = str(prest['nombre']).strip().upper()
                if name_key not in ips_to_prestador:
                    ips_to_prestador[name_key] = prest['id']
        print(f"Prestadores mapeados: {len(ips_to_prestador)}")
    else:
        # Usar prestador_id del cargue
        print("No hay tabla prestadores en BD local, usando prestador_id del cargue")
        ips_to_prestador = {}

    # Limpiar tabla gestantes
    conn.execute("DELETE FROM gestantes")
    conn.commit()
    print("Tabla gestantes limpiada")

    # Insertar gestantes con mapeo por nombre
    total_insertadas = 0
    total_errores = []

    # Columnas reales esperadas en gestantes (según el CREATE TABLE arriba)
    gestante_cols = [row[1] for row in conn.execute("PRAGMA table_info(gestantes)").fetchall()]
    print(f"Columnas en tabla gestantes: {gestante_cols}")

    for idx, linea in enumerate(lineas):
        cols = linea.split("|")
        if len(cols) < 3:
            continue

        registro = {}
        for ci, col_name in csv_to_col.items():
            if ci < len(cols):
                registro[col_name] = cols[ci].strip()

        # Determinar prestador_id por NOMBRE_DE_LA_IPS_PRIMARIA
        ips_val = registro.get("NOMBRE_DE_LA_IPS_PRIMARIA", "").strip().upper()
        prestador_id = None
        if ips_val and ips_to_prestador:
            prestador_id = ips_to_prestador.get(ips_val)
        if prestador_id is None and cargue.get('user_id'):
            prestador_id = cargue.get('user_id')  # fallback

        registro["prestador_id"] = prestador_id
        registro["user_id"] = cargue.get('user_id')
        registro["mes"] = cargue.get('mes')
        registro["original_filename"] = cargue.get('original_filename')

        # Construir insert dinámico con columnas que existen
        cols_to_insert = [c for c in gestante_cols if c in registro and c != "id"]
        if not cols_to_insert:
            total_errores.append(f"Fila {idx+1}: no hay columnas validas para insertar")
            continue

        placeholders = ", ".join(f':{c}' for c in cols_to_insert)
        col_names = ", ".join(f'"{c}"' for c in cols_to_insert)
        params_ins = {c: registro.get(c) if registro.get(c) != "" else None for c in cols_to_insert}
        
        try:
            sql = f'INSERT INTO gestantes ({col_names}) VALUES ({placeholders})'
            conn.execute(sql, params_ins)
            total_insertadas += 1
        except Exception as e:
            total_errores.append(f"Fila {idx+1}: {str(e)[:100]}")

        if (idx + 1) % 200 == 0:
            print(f"  Procesadas {idx+1}/{len(lineas)} lineas...")

    conn.commit()
    print(f"\n=== RESULTADOS ===")
    print(f"Total lineas: {len(lineas)}")
    print(f"Insertadas: {total_insertadas}")
    print(f"Errores: {len(total_errores)}")

    # Verificar NOMBRE_DE_LA_IPS_PRIMARIA
    count_with_ips = conn.execute(
        "SELECT COUNT(*) FROM gestantes WHERE \"NOMBRE_DE_LA_IPS_PRIMARIA\" IS NOT NULL AND \"NOMBRE_DE_LA_IPS_PRIMARIA\" != ''"
    ).scalar()
    count_total = conn.execute("SELECT COUNT(*) FROM gestantes").scalar()
    print(f"Gestantes con NOMBRE_DE_LA_IPS_PRIMARIA: {count_with_ips}/{count_total}")

    # Mostrar IPS únicas
    ips_list = conn.execute(
        "SELECT DISTINCT \"NOMBRE_DE_LA_IPS_PRIMARIA\" FROM gestantes WHERE \"NOMBRE_DE_LA_IPS_PRIMARIA\" IS NOT NULL AND \"NOMBRE_DE_LA_IPS_PRIMARIA\" != '' ORDER BY \"NOMBRE_DE_LA_IPS_PRIMARIA\""
    ).fetchall()
    print(f"IPS únicas ({len(ips_list)}):")
    for r in ips_list[:15]:
        print(f"  - {r[0]}")

    # Contar por "prestador_id"
    if count_with_ips > 0:
        prestador_counts = conn.execute(
            "SELECT \"prestador_id\", COUNT(*) FROM gestantes WHERE \"NOMBRE_DE_LA_IPS_PRIMARIA\" IS NOT NULL AND \"NOMBRE_DE_LA_IPS_PRIMARIA\" != '' GROUP BY \"prestador_id\""
        ).fetchall()
        print(f"Registros por prestador:")
        for pc in prestador_counts[:10]:
            pid = pc[0]
            cnt = pc[1]
            nombre = "Admin (todos)" if pid is None else f"Prestador {pid}"
            print(f"  {nombre}: {cnt}")

    conn.close()
    print("\nScript completado!")


if __name__ == "__main__":
    main()