from sqlalchemy import create_engine, text
import base64, gzip, pandas as pd, io

DB_URL = "postgresql://postgres:qazwsx12A.@129.80.159.38:5436/base_sie_dusakawi"
engine = create_engine(DB_URL, connect_args={'connect_timeout': 10})

with engine.connect() as conn:
    # Ver columnas actuales de gestantes
    cols = conn.execute(text("""SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'gestantes' AND table_schema = 'public'
        ORDER BY ordinal_position""")).fetchall()
    print(f'Columnas actuales: {len(cols)}')
    
    # Ver registros
    total = conn.execute(text('SELECT COUNT(*) FROM gestantes')).scalar()
    print(f'Registros actuales: {total}')
    
    # Leer cargue
    row = conn.execute(text('SELECT corrected_text, compressed FROM cargues WHERE template_key = \'gestante\' ORDER BY id DESC LIMIT 1')).fetchone()
    if row and row[0]:
        texto = row[0]
        if row[1]:
            try:
                texto = gzip.decompress(base64.b64decode(texto)).decode('utf-8', errors='replace')
            except: pass
        
        df = pd.read_csv(io.StringIO(texto), sep='|', header=None, dtype=str, engine='python', keep_default_na=False)
        df = df.fillna('').astype(str)
        print(f'\nCargue: {len(df)} filas, {len(df.columns)} columnas')
        
        # Mapear columnas del cargue con las del template
        import sys, os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        from gestante_config import build_gestante_template
        import unicodedata
        
        def _norm(s):
            s = str(s).strip()
            s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
            s = s.upper().replace(' ', '_').replace('\n', '_').replace('(', '').replace(')', '').replace(',', '').replace('-', '_').replace('/', '_').replace('.', '').replace('?', '').replace(':', '').replace(';', '')
            s = '__'.join(filter(None, s.split('__')))
            return s.strip('_')
        
        tmpl = build_gestante_template()
        tmpl_names = [t['name'] for t in tmpl]
        
        print(f'\nTemplate: {len(tmpl_names)} columnas')
        print(f'Primeras 10 columnas cargue mapeadas:')
        for i in range(min(10, len(df.columns))):
            if i < len(tmpl_names):
                print(f'  col[{i}] -> {_norm(tmpl_names[i])}: {df.iloc[0, i][:50] if len(df) > 0 else ""}')
