import sys
sys.path.insert(0, '.')
from gestante_config import build_gestante_template

template = build_gestante_template()

for i in range(80, 100):
    if i < len(template):
        print(f'{i}: {template[i]["name"]!r}')
