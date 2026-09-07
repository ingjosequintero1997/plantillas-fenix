import sys
sys.path.insert(0, '.')
from template_to_db_map import TEMPLATE_TO_DB_EXPLICIT
from gestante_config import build_gestante_template

template = build_gestante_template()
for i in range(len(template)):
    if TEMPLATE_TO_DB_EXPLICIT.get(i) is None:
        print(f'{i}: {template[i]["name"]}')
