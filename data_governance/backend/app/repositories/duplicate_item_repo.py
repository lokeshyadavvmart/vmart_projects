from app.core.database import get_client

client = get_client()

def fetch_duplicate_items(where_clause: str, limit: int, return_columns: bool = False):
    """
    Fetch rows from ClickHouse duplicate_items table, including the new 'option' column.
    """
    query = f"""
    SELECT
        group_id,
        site_code,
        icode,
        po_number,
        mrp,
        order_date,
        last_delivery_date,
        vendor,
        division,
        section,
        department,
        cat1, cat2, cat3, cat4, cat5, cat6,
        itemdesc1, itemdesc3, itemdesc6,
        option,  -- NEW COLUMN
        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10
    FROM governance.duplicate_items
    WHERE {where_clause}
    ORDER BY order_date DESC
    LIMIT {limit}
    """

    try:
        result = client.query(query)
        rows = result.result_rows

        if return_columns:
            # Get column names dynamically from ClickHouse
            columns_query = "DESCRIBE TABLE governance.duplicate_items"
            columns_result = client.query(columns_query)
            columns = [col[0] for col in columns_result.result_rows]  # first element is column name
            return rows, columns

        return rows

    except Exception:
        # Log the error if you have a logging setup, else just raise
        raise

# ------------------------------------------------------------------------------------A