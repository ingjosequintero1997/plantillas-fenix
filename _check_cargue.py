from sqlalchemy import create_engine, text
import base64, gzip, os

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise SystemExit("Define DATABASE_URL en el entorno (no la pongas en el repo).")
if DB_URL.startswith("postgres://"):
    DB_URL = "postgresql://" + DB_URL[len("postgres://"):]
engine = create_engine(DB_URL, connect_args={'connect_timeout': 10})

with engine.connect() as conn:
    # Leer cargue
    row = conn.execute(text("SELECT corrected_text, compressed FROM cargues WHERE template_key = 'gestante' ORDER BY id DESC LIMIT 1")).fetchone()
    texto = row[0]
    if row[1]:
        texto = gzip.decompress(base64.b64decode(texto)).decode('utf-8', errors='replace')
    
    lineas = [l for l in texto.strip().split('\n') if l.strip()]
    print(f'Lineas en cargue: {len(lineas)}')
    print(f'Columnas por linea: {len(lineas[0].split("|"))}')
    
    # Verificar cuantas tienen IPS
    con_ips = 0
    for l in lineas:
        parts = l.split('|')
        if len(parts) > 28 and parts[28].strip():
            con_ips += 1
    print(f'Con IPS: {con_ips}')
