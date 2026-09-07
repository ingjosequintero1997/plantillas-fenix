import sys
sys.path.insert(0, '.')
from template_to_db_map import TEMPLATE_TO_DB_EXPLICIT
from gestante_config import build_gestante_template
from database import GESTANTE_COLUMNS

template = build_gestante_template()
gcol_set = set(GESTANTE_COLUMNS)

for i in range(len(template)):
    db_col = TEMPLATE_TO_DB_EXPLICIT.get(i)
    if not db_col or db_col not in gcol_set:
        name = template[i]['name']
        print(f'{i}: {name!r}')
