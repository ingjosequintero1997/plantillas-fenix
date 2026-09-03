"""
Simula EXACTAMENTE lo que hace /upload en modo validador (main.py line 677-746)
para ver qué errores genera la app vs qué errores hay en la data real.
"""
import pandas as pd
import io

# 1. Parse Excel (exactamente como make_upload_file_from_path)
from backend.main import parse_excel_bytes, normalize_source_dataframe, infer_mapping, get_template_by_key, template_names, _errores_rapidos

with open('reporte_errores_gestante_2026-09-03 (1).xlsx', 'rb') as f:
    contents = f.read()

raw_df = parse_excel_bytes(contents)
meta = get_template_by_key("gestante")
active_template = meta["template"]

# 2. normalize_source_dataframe (line 636)
df = normalize_source_dataframe(raw_df, template_names(active_template))

# 3. infer_mapping (line 639)
orig_headers = list(df.columns)
map_suggest = infer_mapping(orig_headers, active_template)

# 4. reordenar_a_template (line 644)
from backend.validators import reordenar_a_template
df = reordenar_a_template(df, map_suggest, active_template)

# 5. This is what mode validador does (line 677-687):
from backend.validators import normalizar_fechas_df, limpiar_celdas_export

# Save original df before cleaning
df_original = df.copy()

# Normalize dates
df = normalizar_fechas_df(df, active_template)
df = limpiar_celdas_export(df)
df_safe = df.fillna("SIN DATO").astype(str)

# Show what changed during cleaning
print("=== CAMBIOS DURANTE LIMPIEZA ===")
changes = []
for col in df_original.columns:
    for idx in range(min(5, len(df_original))):
        orig = str(df_original.iloc[idx][col]) if col in df_original.columns else ""
        cleaned = str(df_safe.iloc[idx][col]) if col in df_safe.columns else ""
        if orig != cleaned and orig.strip() and orig.lower() != 'nan':
            changes.append((idx+1, col, orig, cleaned))

if changes:
    print(f"Found {len(changes)} changes in first 5 rows:")
    for row, col, orig, cleaned in changes[:20]:
        print(f"  Row {row}, {col}: '{orig}' -> '{cleaned}'")
else:
    print("No changes in first 5 rows")

# 6. Generate canonical text and validate
canonical_raw_text = df_safe.to_csv(sep='|', index=False, header=False)
errors_by_cell = _errores_rapidos(canonical_raw_text, "gestante")

# 7. Count errors
from collections import Counter
col_counts = Counter()
for (row_idx, col_name), msg in errors_by_cell.items():
    col_counts[col_name] += 1

print(f"\n=== ERRORES (modo validador) ===")
print(f"Total errors: {len(errors_by_cell)}")
print(f"Columns with errors: {len(col_counts)}")
for col, count in col_counts.most_common():
    print(f"  {col}: {count}")

# 8. Show sample errors with the actual value
print(f"\n=== MUESTRA DE ERRORES (primeros 5 por columna) ===")
shown = {}
for (row_idx, col_name), msg in errors_by_cell.items():
    if col_name not in shown:
        shown[col_name] = 0
    if shown[col_name] >= 5:
        continue
    val = str(df_safe.iloc[row_idx][col_name]) if row_idx < len(df_safe) and col_name in df_safe.columns else "?"
    print(f"  Row {row_idx+1}, {col_name}: valor='{val}' -> {msg}")
    shown[col_name] += 1

# 9. Also check what the ORIGINAL data had for these errors
print(f"\n=== VALORES ORIGINALES para los mismos errores ===")
shown2 = {}
for (row_idx, col_name), msg in errors_by_cell.items():
    if col_name not in shown2:
        shown2[col_name] = 0
    if shown2[col_name] >= 3:
        continue
    orig_val = str(df_original.iloc[row_idx][col_name]) if row_idx < len(df_original) and col_name in df_original.columns else "?"
    print(f"  Row {row_idx+1}, {col_name}: ORIGINAL='{orig_val}'")
    shown2[col_name] += 1
