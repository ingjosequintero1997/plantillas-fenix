import sys, os, unicodedata
sys.path.insert(0, '.')
from gestante_config import build_gestante_template

tmpl = build_gestante_template()

def _norm(s):
    s = str(s).strip()
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = s.upper().replace(' ', '_').replace('\n', '_').replace('(', '').replace(')', '').replace(',', '').replace('-', '_').replace('/', '_').replace('.', '').replace('?', '').replace(':', '').replace(';', '')
    s = '__'.join(filter(None, s.split('__')))
    return s.strip('_')

print(f'Total template fields: {len(tmpl)}')
for i, t in enumerate(tmpl):
    key = _norm(t['name'])
    print(f'{i}\t{key}\t{t["name"]}')
