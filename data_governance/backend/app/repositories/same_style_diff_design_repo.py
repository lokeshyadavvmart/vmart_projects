# D:\work\vmart_projects\data_governance\backend\app\repositories\same_style_diff_design_repo.py
from app.core.database import get_client

client = get_client()

# This is now the single source of truth for the data structure
COLUMN_ORDER = [
    "group_id", "site_code", "icode", "po_number", "design_no", "color_or_style",
    "order_date", "order_month", "vendor", "division", "section", "department",
    "cat1", "cat2", "cat3", "cat4", "cat5", "cat6",
    "option",  # Positioned here to match ClickHouse schema order
    "udfstring01", "udfstring02", "udfstring03", "udfstring04", "udfstring05",
    "udfstring06", "udfstring07", "udfstring08", "udfstring09", "udfstring10",
    "distinct_design_count"
]

def fetch_same_style_diff_design(where_clause: str, limit: int, return_columns: bool = False):
    """
    Fetch rows from ClickHouse with a guaranteed column order to prevent frontend misalignment.
    """
    selected_cols = ", ".join(COLUMN_ORDER)
    
    query = f"""
    SELECT
        {selected_cols}
    FROM governance.same_style_diff_design
    WHERE {where_clause}
    ORDER BY order_date DESC
    LIMIT {limit}
    """

    result = client.query(query)
    rows = result.result_rows

    if return_columns:
        # Return the explicit COLUMN_ORDER instead of DESCRIBE TABLE
        return rows, COLUMN_ORDER

    return rows