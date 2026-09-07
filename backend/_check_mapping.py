import sys
sys.path.insert(0, '.')
from gestante_config import RAW_FIELDS, build_gestante_template
from database import GESTANTE_COLUMNS

template = build_gestante_template()
tmpl_names = [t['name'] for t in template]

print('Template fields:', len(tmpl_names))
print('GESTANTE_COLUMNS:', len(GESTANTE_COLUMNS))
print()

# Build a name-based mapping
def normalize(s):
    return s.upper().strip().replace(' ', '_').replace('(', '').replace(')', '').replace('¿','').replace('?','').replace(',','').replace('\n','_').replace('-','_').replace('/','_').replace('.','').replace('__','_')

# Map template name -> GESTANTE_COLUMN
mapping = {}
for i, tname in enumerate(tmpl_names):
    tn = normalize(tname)
    for j, gcol in enumerate(GESTANTE_COLUMNS):
        if tn == gcol:
            mapping[i] = (j, tname, gcol)
            break

print('Direct name matches:', len(mapping), '/', len(tmpl_names))
print()

# Show mismatches
print('UNMAPPED template fields:')
for i, tname in enumerate(tmpl_names):
    if i not in mapping:
        g = GESTANTE_COLUMNS[i] if i < len(GESTANTE_COLUMNS) else 'OUT_OF_RANGE'
        print(f'  [{i}] Template: {tname!r}  ->  GESTANTE_COLUMNS[{i}]: {g}')

print()
print('GESTANTE_COLUMNS with no template source:')
mapped_gcols = set(v[0] for v in mapping.values())
for j, gcol in enumerate(GESTANTE_COLUMNS):
    if j not in mapped_gcols:
        print(f'  [{j}] {gcol}')
