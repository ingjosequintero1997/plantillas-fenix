from sqlalchemy import create_engine, text
import base64, gzip, unicodedata, sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from gestante_config import build_gestante_template

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise SystemExit("Define DATABASE_URL en el entorno (no la pongas en el repo).")
if DB_URL.startswith("postgres://"):
    DB_URL = "postgresql://" + DB_URL[len("postgres://"):]
engine = create_engine(DB_URL, connect_args={'connect_timeout': 10})

def _norm(s):
    s = str(s).strip()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = s.upper().replace(' ', '_').replace('\n', '_').replace('(', '').replace(')', '').replace(',', '').replace('-', '_').replace('/', '_').replace('.', '').replace('?', '').replace(':', '').replace(';', '')
    s = '__'.join(filter(None, s.split('__')))
    return s.strip('_')

tmpl = build_gestante_template()
col_names = [_norm(t['name']) for t in tmpl]
print(f'Columnas template: {len(col_names)}')

with engine.connect() as conn:
    # Leer cargue
    row = conn.execute(text("SELECT corrected_text, compressed FROM cargues WHERE template_key = 'gestante' ORDER BY id DESC LIMIT 1")).fetchone()
    texto = row[0]
    if row[1]:
        texto = gzip.decompress(base64.b64decode(texto)).decode('utf-8', errors='replace')
    
    lineas = [l for l in texto.strip().split('\n') if l.strip()]
    print(f'Lineas cargue: {len(lineas)}')
    
    # Limpiar tabla gestantes
    conn.execute(text("DELETE FROM gestantes"))
    print('Tabla gestantes limpiada')
    
    # Insertar registros en lotes
    BATCH = 200
    inserted = 0
    for batch_start in range(0, len(lineas), BATCH):
        batch = lineas[batch_start:batch_start+BATCH]
        values = []
        for linea in batch:
            parts = linea.split('|')
            # Mapear cada columna del template con el valor del cargue
            row_vals = {}
            for i, col in enumerate(col_names):
                val = parts[i].strip() if i < len(parts) else ''
                row_vals[col] = val if val else None
            values.append(row_vals)
        
        # Construir INSERT
        if values:
            cols_list = list(values[0].keys())
            placeholders = ', '.join(f':{c}' for c in cols_list)
            col_str = ', '.join(f'"{c}"' for c in cols_list)
            sql = f'INSERT INTO gestantes ({col_str}) VALUES ({placeholders})'
            conn.execute(text(sql), values)
            inserted += len(batch)
            print(f'  Insertados: {inserted}/{len(lineas)}')
    
    conn.commit()
    total = conn.execute(text('SELECT COUNT(*) FROM gestantes')).scalar()
    print(f'\nTotal en gestantes: {total}')
    
    # Verificar una fila
    sample = conn.execute(text('SELECT "NO_DE_IDENTIFICACION", "NOMBRE_DE_LA_IPS_PRIMARIA", "APELLIDO_1", "NOMBRE_1", "FUM" FROM gestantes LIMIT 3')).fetchall()
    print('\nMuestra:')
    for r in sample:
        print(f'  {r[0]} | {r[1]} | {r[2]} {r[3]} | FUM: {r[4]}')
