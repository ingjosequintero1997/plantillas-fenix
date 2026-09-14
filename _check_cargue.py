from sqlalchemy import create_engine, text
import base64, gzip

DB_URL = "postgresql://postgres:qazwsx12A.@129.80.159.38:5436/base_sie_dusakawi"
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
