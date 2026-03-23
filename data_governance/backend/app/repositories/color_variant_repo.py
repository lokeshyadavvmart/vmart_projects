from app.core.database import get_client

client = get_client()

def fetch_color_variants(where_clause: str, limit: int, return_columns: bool = False):
    """
    Fetch rows from ClickHouse color_variants table.
    """
    query = f"""
    SELECT
        group_id,
        site_code,
        order_code,
        po_number,
        icode,
        po_count,
        order_date,
        last_delivery_date,
        vendor,
        division,
        section,
        department,
        cat1, cat2, cat3, cat4, cat5, cat6,
        fabric,
        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10
    FROM governance.color_variants
    WHERE {where_clause}
    ORDER BY order_date DESC
    LIMIT {limit}
    """

    result = client.query(query)
    rows = result.result_rows

    if return_columns:
        columns_query = "DESCRIBE TABLE governance.color_variants"
        columns_result = client.query(columns_query)
        columns = [col[0] for col in columns_result.result_rows]
        return rows, columns

    return rows