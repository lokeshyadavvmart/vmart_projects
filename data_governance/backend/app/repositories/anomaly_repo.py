from app.core.database import get_client
from typing import List, Dict

client = get_client()


def esc(x: str):
    return x.replace("'", "''")


def in_clause(vals):
    return ",".join(f"'{esc(v)}'" for v in vals)


def fetch_fuzzy_pairs(column: str, threshold: int, filters: Dict[str, List[str]]):

    clauses = []

    if filters.get("division"):
        v = in_clause(filters["division"])
        clauses.append(f"(m1.division IN ({v}) AND m2.division IN ({v}))")

    if filters.get("section"):
        v = in_clause(filters["section"])
        clauses.append(f"(m1.section IN ({v}) AND m2.section IN ({v}))")

    if filters.get("department"):
        v = in_clause(filters["department"])
        clauses.append(f"(m1.department IN ({v}) AND m2.department IN ({v}))")

    where_extra = " AND ".join(clauses)

    query = f"""
        SELECT f.value1, f.count1, f.value2, f.count2, f.score
        FROM governance.v_item_fuzzy_pairs f
        JOIN governance.v_item_master_meta m1
          ON f.column_name = m1.column_name AND f.value1 = m1.value
        JOIN governance.v_item_master_meta m2
          ON f.column_name = m2.column_name AND f.value2 = m2.value
        WHERE f.column_name = '{esc(column)}'
          AND f.score >= {threshold}
          {f"AND {where_extra}" if where_extra else ""}
        GROUP BY f.value1, f.count1, f.value2, f.count2, f.score
        ORDER BY f.score DESC
        LIMIT 500
    """

    res = client.query(query)

    return [
        {
            "value1": r[0],
            "count1": r[1],
            "value2": r[2],
            "count2": r[3],
            "score": r[4]
        }
        for r in res.result_rows
    ]


def fetch_filter_values():
    q = """
    SELECT
        groupUniqArray(division),
        groupUniqArray(section),
        groupUniqArray(department)
    FROM governance.v_item_master_meta
    """

    r = client.query(q).result_rows[0]

    return {
        "division": r[0] or [],
        "section": r[1] or [],
        "department": r[2] or []
    }


def fetch_table_columns(table: str):
    db, tb = table.split(".")

    q = f"""
    SELECT name FROM system.columns
    WHERE database = '{esc(db)}'
      AND table = '{esc(tb)}'
    """

    res = client.query(q)
    return [r[0] for r in res.result_rows]