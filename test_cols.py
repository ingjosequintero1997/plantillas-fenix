"""
Show actual column names in the DataFrame after mapping.
"""
import pandas as pd
from backend.main import parse_excel_bytes, normalize_source_dataframe, infer_mapping, get_template_by_key, template_names
from backend.validators import reordenar_a_template

with open('reporte_errores_gestante_2026-09-03 (1).xlsx', 'rb') as f:
    contents = f.read()

raw_df = parse_excel_bytes(contents)
meta = get_template_by_key("gestante")
active_template = meta["template"]

df = normalize_source_dataframe(raw_df, template_names(active_template))
orig_headers = list(df.columns)
map_suggest = infer_mapping(orig_headers, active_template)
df = reordenar_a_template(df, map_suggest, active_template)

print(f"DF columns after reorder ({len(df.columns)}):")
for i, col in enumerate(df.columns):
    template_name = active_template[i]["name"] if i < len(active_template) else "???"
    match = "OK" if col == template_name else "MISMATCH"
    if match == "MISMATCH" or i < 10 or i > 195:
        print(f"  [{i}] DF='{col}' vs Template='{template_name}' -> {match}")
