import sys, os
sys.path.insert(0, '.')
os.environ.setdefault('DATABASE_URL', 'postgres://postgres:qazwsx12A.@129.80.159.38:5436/base_sie_dusakawi')

from database import SessionLocal, Cargue
import base64, gzip

db = SessionLocal()
cargues = db.query(Cargue).filter(Cargue.template_key == "gestante").order_by(Cargue.id.desc()).limit(1).all()
c = cargues[0]
texto = c.corrected_text or ""
if c.compressed and texto:
    texto = gzip.decompress(base64.b64decode(texto)).decode("utf-8", errors="replace")

lines = texto.strip().split('\n')
print(f'Total lines: {len(lines)}')
print(f'Line 0 (header?): {lines[0][:200]}')
print(f'Line 1 (first data?): {lines[1][:200]}')
print(f'Line 2 (second data?): {lines[2][:200] if len(lines) > 2 else "N/A"}')

# Count pipes in each line
print(f'\nPipes in line 0: {lines[0].count("|")}')
print(f'Pipes in line 1: {lines[1].count("|")}')
print(f'Pipes in line 2: {lines[2].count("|") if len(lines) > 2 else "N/A"}')

# Show col 2 of line 1 and line 2
parts1 = lines[1].split('|')
parts2 = lines[2].split('|') if len(lines) > 2 else []
print(f'\nLine 1 col 2: "{parts1[2] if len(parts1) > 2 else "N/A"}"')
print(f'Line 2 col 2: "{parts2[2] if len(parts2) > 2 else "N/A"}"')

# Search for 1005683202
for i, line in enumerate(lines):
    if '1005683202' in line:
        print(f'\nFOUND at line {i}: {line[:200]}')
        break
else:
    print(f'\n1005683202 NOT FOUND in any of {len(lines)} lines')

# Count distinct col2 values
col2_vals = set()
for line in lines[1:]:
    parts = line.split('|')
    if len(parts) > 2:
        col2_vals.add(parts[2])
print(f'\nDistinct col2 values: {len(col2_vals)}')
print(f'First 5: {list(col2_vals)[:5]}')

db.close()
