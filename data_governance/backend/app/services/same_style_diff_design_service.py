# D:\work\vmart_projects\data_governance\backend\app\services\same_style_diff_design_service.py
from datetime import datetime
from typing import Optional, Dict, Set, Any
from app.repositories.same_style_diff_design_repo import fetch_same_style_diff_design
from app.core.database import get_client

client = get_client()

# Added 'option' to allowed filters
ALLOWED_FILTERS = {
    "site_code", "icode", "po_number", "design_no", "color_or_style",
    "vendor", "division", "section", "department",
    "cat1", "cat2", "cat3", "cat4", "cat5", "cat6", "option"
}

DISTINCT_KEYS = ["site_code", "division", "section", "department", "vendor", "color_or_style"]

def is_valid_date(date_str: Optional[str]) -> bool:
    if not date_str or date_str == "string":
        return False
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except Exception:
        return False

def clean_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    value = str(value).strip()
    if value in ["", "string"]:
        return None
    return value.replace("'", "''")

def build_filter_condition(key: str, value: Any) -> Optional[str]:
    if isinstance(value, list):
        cleaned = [clean_value(v) for v in value if clean_value(v)]
        if not cleaned:
            return None
        values_str = ", ".join([f"'{v}'" for v in cleaned])
        return f"{key} IN ({values_str})"

    value = clean_value(value)
    if not value:
        return None
    if len(value) < 4:
        return f"{key} ILIKE '%{value}%'"
    return f"{key} = '{value}'"

def fetch_all_distinct_values() -> Dict[str, Set[str]]:
    distincts: Dict[str, Set[str]] = {}
    for col in DISTINCT_KEYS:
        query = f"SELECT DISTINCT {col} FROM governance.same_style_diff_design"
        result = client.query(query)
        distincts[col] = set([row[0] for row in result.result_rows if row[0]])
    return distincts

def get_same_style_diff_design(params, previous_distincts: Optional[Dict[str, Set[str]]] = None) -> Dict[str, Any]:
    conditions = ["1 = 1"]

    if getattr(params, "date_range", None):
        from_date = getattr(params.date_range, "from_date", None)
        to_date = getattr(params.date_range, "to_date", None)
        if is_valid_date(from_date):
            conditions.append(f"order_date >= toDate('{from_date}')")
        if is_valid_date(to_date):
            conditions.append(f"order_date <= toDate('{to_date}')")

    filters = getattr(params, "filters", None)
    if filters:
        for key, value in filters.items():
            if key not in ALLOWED_FILTERS:
                continue
            condition = build_filter_condition(key, value)
            if condition:
                conditions.append(condition)

    cursor = getattr(params, "cursor", None)
    if cursor and cursor != "string":
        if is_valid_date(cursor):
            conditions.append(f"order_date < toDate('{cursor}')")

    where_clause = " AND ".join(conditions)

    limit = getattr(params, "limit", 100)
    # rows and columns are now guaranteed to be in the same order
    rows, columns = fetch_same_style_diff_design(where_clause, limit, return_columns=True)

    next_cursor = None
    if rows:
        last_row = rows[-1]
        try:
            # Dynamic index lookup for safety
            date_idx = columns.index("order_date")
            next_cursor = str(last_row[date_idx])
        except (Exception, ValueError):
            next_cursor = None

    if previous_distincts is None:
        distincts: Dict[str, Set[str]] = fetch_all_distinct_values()
    else:
        distincts: Dict[str, Set[str]] = {k: set(v) for k, v in previous_distincts.items()}

    key_index_map = {col: idx for idx, col in enumerate(columns)}
    for row in rows:
        for key in DISTINCT_KEYS:
            idx = key_index_map.get(key)
            if idx is not None:
                val = row[idx]
                if val:
                    distincts.setdefault(key, set()).add(val)

    distincts_out = {k: sorted(list(v)) for k, v in distincts.items()}

    return {
        "columns": columns,
        "data": rows,
        "count": len(rows),
        "next_cursor": next_cursor,
        "distinct_values": distincts_out
    }

def get_full_same_style_diff_design(filters: Optional[Dict[str, Any]] = None):
    conditions = ["1 = 1"]
    if filters:
        for key, value in filters.items():
            if key not in ALLOWED_FILTERS:
                continue
            condition = build_filter_condition(key, value)
            if condition:
                conditions.append(condition)
    where_clause = " AND ".join(conditions)
    limit = 1000000
    rows, columns = fetch_same_style_diff_design(where_clause, limit, return_columns=True)
    return rows, columns