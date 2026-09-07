"""Auto-fix template_to_db_map: set None for DB columns that don't exist."""
import sys
sys.path.insert(0, '.')
from gestante_config import build_gestante_template
from database import GESTANTE_COLUMNS

template = build_gestante_template()
gs = set(GESTANTE_COLUMNS)

# Read current map
exec(open('template_to_db_map.py', encoding='utf-8').read())
m = TEMPLATE_TO_DB_EXPLICIT

fixed = {}
for i in range(len(template)):
    col = m.get(i)
    if col and col in gs:
        fixed[i] = col
    else:
        fixed[i] = None

# Write new file
lines = [
    '"""Auto-generated: template index -> GESTANTE_COLUMNS mapping."""',
    '',
    'TEMPLATE_TO_DB_EXPLICIT = {',
]
for i in range(len(template)):
    name = template[i]['name']
    col = fixed.get(i)
    if col:
        lines.append(f'    {i}: "{col}",  # {name}')
    else:
        lines.append(f'    {i}: None,  # {name} (no DB col)')
lines.append('}')

with open('template_to_db_map.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

ok = sum(1 for v in fixed.values() if v)
print(f'Fixed: {ok}/{len(template)} mapped, {len(template)-ok} skipped')
