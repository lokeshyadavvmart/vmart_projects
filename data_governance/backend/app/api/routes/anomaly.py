from fastapi import APIRouter, Query
from typing import List
from app.services.anomaly_service import (
    fuzzy_pairs_for_column,
    available_columns,
    get_filter_values   # ✅ import this
)

router = APIRouter(tags=["anomalies"])


@router.get("/fuzzy")
def fuzzy_anomalies(
    column: str = Query(...),
    threshold: int = Query(90),
    division: List[str] = Query(None),
    section: List[str] = Query(None),
    department: List[str] = Query(None)
):
    filters = {
        "division": division or [],
        "section": section or [],
        "department": department or []
    }

    pairs = fuzzy_pairs_for_column(column, threshold, filters)

    return {
        "column": column,
        "threshold": threshold,
        "filters": {k: v for k, v in filters.items() if v},
        "pairs_found": len(pairs),
        "pairs": pairs
    }


@router.get("/columns")
def get_columns(table: str = Query("governance.v_item_master")):
    cols = available_columns(table)

    return {
        "table": table,
        "columns_count": len(cols),
        "columns": cols
    }


# ✅ NEW ENDPOINT
@router.get("/filters")
def get_filters():
    values = get_filter_values()

    return {
        "filters": values
    }