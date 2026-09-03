"""
Check if column mapping causes misalignment.
Compare RAW Excel headers vs template headers.
"""
import pandas as pd
from backend.main import parse_excel_bytes, normalize_source_dataframe, infer_mapping, get_template_by_key, template_names

with open('reporte_errores_gestante_2026-09-03 (1).xlsx', 'rb') as f:
    contents = f.read()

raw_df = parse_excel_bytes(contents)
meta = get_template_by_key("gestante")
active_template = meta["template"]

print(f"Excel columns: {raw_df.shape[1]}")
print(f"Template columns: {len(active_template)}")

# Check the mapping
df = normalize_source_dataframe(raw_df, template_names(active_template))
orig_headers = list(df.columns)
map_suggest = infer_mapping(orig_headers, active_template)

print(f"\n=== COLUMN MAPPING ===")
mapped = 0
unmapped = 0
for excel_col, template_col in map_suggest.items():
    if template_col:
        mapped += 1
    else:
        unmapped += 1
        print(f"  UNMAPPED: Excel='{excel_col}' -> template=None")

print(f"\nMapped: {mapped}, Unmapped: {unmapped}")

# Check if there are columns with mismatched content
from backend.validators import reordenar_a_template, normalizar_fechas_df, limpiar_celdas_export
df = reordenar_a_template(df, map_suggest, active_template)
df_safe = df.fillna("SIN DATO").astype(str)

# Show first 3 rows of critical columns
critical_cols = [
    "No", "TIPO_DE_DOCUMENTO_DE_IDENTIDAD", "No_DE_IDENTIFICACION",
    "APELLIDO_1", "APELLIDO_2", "NOMBRE_1", "NOMBRE_2",
    "EDAD", "SEXO", "ETNIA", "TELEFONO_USUARIA",
    "NIVEL_EDUCATIVO", "DISCAPACIDAD", "ESTADO_CIVIL",
    "PERIODO_INTERGENESICO", "RESULTADO_TOXOPLASMA",
    "RESULTADO_REALIZACION_HEMOCLASIFICACION_FACTOR_RH",
    "RESULTADO_PRUEBA_DE_TOLERANCIA_ORAL_GLUCOSA",
    "C", "A", "M"
]

print(f"\n=== PRIMERAS 5 FILAS - COLUMNAS CRITICAS ===")
for col in critical_cols:
    if col in df_safe.columns:
        vals = [str(df_safe.iloc[i][col]) for i in range(min(5, len(df_safe)))]
        print(f"  {col}: {vals}")
    else:
        print(f"  {col}: NOT FOUND IN DF")
