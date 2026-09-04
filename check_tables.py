import os
import psycopg2

try:
    conn = psycopg2.connect(
        host=os.environ.get("CORP_DB_HOST", "129.80.159.38"),
        port=os.environ.get("CORP_DB_PORT", "5435"),
        user=os.environ.get("CORP_DB_USER", "postgres"),
        password=os.environ.get("CORP_DB_PASSWORD", ""),
        database=os.environ.get("CORP_DB_NAME", "base_sie_dusakawi")
    )
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
    tables = cur.fetchall()
    print("Tablas disponibles:")
    for t in tables:
        print(f"  - {t[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
