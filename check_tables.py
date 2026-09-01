import psycopg2

try:
    conn = psycopg2.connect(
        host='129.80.159.38',
        port=5435,
        user='postgres',
        password='qazwsx12A.',
        database='base_sie_dusakawi'
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
