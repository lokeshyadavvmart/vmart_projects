from database.oracle_pool import get_connection
def execute_query_dict(query, params=None):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(query, params or ())
        columns = [col[0] for col in cursor.description]

        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

    finally:
        cursor.close()
        conn.close()

