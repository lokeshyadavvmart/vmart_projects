from typing import List, Dict
from app.repositories.anomaly_repo import (
    fetch_fuzzy_pairs,
    fetch_table_columns,
    fetch_filter_values
)


def fuzzy_pairs_for_column(column: str, threshold: int = 90, filters: Dict[str, List[str]] = None):
    return fetch_fuzzy_pairs(column, threshold, filters or {})


def available_columns(table: str = "governance.v_item_master"):
    return fetch_table_columns(table)


def get_filter_values():
    return fetch_filter_values()