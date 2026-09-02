"""Migración: agrega columnas nuevas a tabla gestantes (208→223+).

Ejecutar con: python migrate_gestantes_223.py
"""
import os

def get_engine():
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        db_url = "postgresql://neondb_owner:npg_j1bE0dvmu2Vm@ep-dry-pine-a5gmdzov.us-east-2.aws.neon.tech/neondb?sslmode=require"
    from sqlalchemy import create_engine
    return create_engine(db_url)

NEW_COLUMNS = [
    "CONSECUTIVO",
    "FECHA_DE_LA_REALIZACION_ANTIGENO_SUPERFICIE_HEPATITIS_B",
    "FECHA_DE_LA_REALIZACION_PRUEBA_IGG_RUBEOLA",
    "FECHA_DE_TAMIZAJE_PARA_CA_CUELLO_UTERINO",
    "FECHA_DE_TOMA_DE_UROCULTIVO_Y_ANTIBIOGRAMA",
    "FECHA_REALIZACION_HEMOGRAMA_INICIAL",
    "FECHA_REALIZACION_SEGUNDO_HEMOGRAMA_SEMANA_28",
    "FECHA_REALIZACION_HEMOCLASIFICACION",
    "FECHA_REALIZACION_PRUEBA_TAMIZAJE_ESTREPTOCOCO_GRUPO_B",
    "FECHA_REALIZACION_PRUEBA_TOLERANCIA_ORAL_GLUCOSA",
    "FECHA_TOMA_DE_GOTA_GRUESA_MALARIA",
    "FECHA_DE_REALIZACION_TAMIZAJE_CHAGAS",
    "TOMA_SEGUNDA_PRUEBA_VIH",
    "TRIMESTRE_TOMA_SEGUNDA_PRUEBA_VIH",
    "PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "TRIMESTRE_PRUEBA_CONFIRMATORIA_SEGUN_ALGORITMO",
    "FTA_ABS",
    "TRIMESTRE_FTA_ABS",
    "PRIMERA_ECOGRAFIA_OBSTETRICA_10_13",
    "SEGUNDA_ECOGRAFIA",
    "INFORMACION_EN_SALUD",
    "FECHA_OTROS_CONTROLES_PRENATALES",
    "QUIEN_REALIZO_EL_CONTROL_10",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_1_TRIM",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_2_TRIM",
    "HIPERTENSION_INDUCIDA_POR_EMBARAZO_3_TRIM",
    "SANGRADO_VAGINAL_1_TRIM",
    "SANGRADO_VAGINAL_2_TRIM",
    "SANGRADO_VAGINAL_3_TRIM",
    "INFECCION_URINARIA_1_TRIM",
    "INFECCION_URINARIA_2_TRIM",
    "INFECCION_URINARIA_3_TRIM",
    "VIH_1_TRIM",
    "VIH_2_TRIM",
    "VIH_3_TRIM",
    "SIFILIS_1_TRIM",
    "SIFILIS_2_TRIM",
    "SIFILIS_3_TRIM",
    "HEPATITIS_B_1_TRIM",
    "HEPATITIS_B_2_TRIM",
    "HEPATITIS_B_3_TRIM",
    "OTRAS_PATOLOGIAS_DESCRIPCION_Y_FECHA",
    "PRIORIZADA_PARA_SEGUIMIENTO_ESPECIAL",
    "NOTIFICACION_A_LA_IPS",
    "REMISION",
    "VISITA_DOMICILIARA",
    "ACOMPAÑAMIENTO_DURANTE_CPN_IMAGENES_DX_Y_EXAMENES_DE_LABORATORIO",
    "CASA_DE_PASO",
    "APOYO_PARA_TRANSPORTE",
    "ACTIVACION_DE_RED_DE_APOYO_COMUNITARIA",
    "COORDINACION_DE_ESTRATEGIAS_CON_SDSM",
    "OBSERVACIONES_GESTION_RIESGO",
    "TIPO_DE_EVENTO_CRITERIO_1",
    "FECHA_CRITERIO_1",
    "TIPO_DE_EVENTO_CRITERIO_2",
    "FECHA_CRITERIO_2",
    "TIPO_DE_EVENTO_CRITERIO_3",
    "FECHA_CRITERIO_3",
    "CAUSA_PRINCIPAL_DE_LA_MME",
    "NOMBRE_DEL_FUNCIONARIO_AL_QUE_SE_LE_ASIGNO_EL_CASO",
    "SE_CONCERTO_PLAN_DE_MEJORA_CON_LA_IPS",
    "EVALUACION_Y_SEGUIMIENTO_AL_PLAN_DE_MEJORA",
    "TOMA_HEMOCLASIFICACION_RECIEN_NACIDO_1",
    "TOMA_HEMOCLASIFICACION_RECIEN_NACIDO_2",
    "PESO",
    "FECHA_DE_ABORTO",
]


def migrate():
    engine = get_engine()
    from sqlalchemy import text

    with engine.begin() as conn:
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'gestantes' ORDER BY ordinal_position"
        ))
        existing = {row[0].upper() for row in result}
        print(f"Columnas existentes: {len(existing)}")

        added = 0
        for col in NEW_COLUMNS:
            if col not in existing:
                try:
                    conn.execute(text(f'ALTER TABLE gestantes ADD COLUMN "{col}" TEXT'))
                    added += 1
                    print(f"  + {col}")
                except Exception as e:
                    if "already exists" not in str(e).lower():
                        print(f"  ! Error: {col}: {e}")
        print(f"\nColumnas agregadas: {added}")

        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'gestantes' ORDER BY ordinal_position"
        ))
        final = [row[0] for row in result]
        print(f"Total columnas finales: {len(final)}")


if __name__ == "__main__":
    migrate()
