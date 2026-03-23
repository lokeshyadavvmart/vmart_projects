from app.core.database import get_client

client = get_client()

def fetch_same_style_diff_design(where_clause: str, limit: int, return_columns: bool = False):
    """
    Fetch rows from ClickHouse same_style_diff_design table.
    """
    query = f"""
    SELECT
        group_id,
        site_code,
        icode,
        po_number,
        design_no,
        color_or_style,
        order_date,
        order_month,
        vendor,
        division,
        section,
        department,
        cat1, cat2, cat3, cat4, cat5, cat6,
        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
        distinct_design_count
    FROM governance.same_style_diff_design
    WHERE {where_clause}
    ORDER BY order_date DESC
    LIMIT {limit}
    """

    result = client.query(query)
    rows = result.result_rows

    if return_columns:
        columns_query = "DESCRIBE TABLE governance.same_style_diff_design"
        columns_result = client.query(columns_query)
        columns = [col[0] for col in columns_result.result_rows]
        return rows, columns

    return rows