def build_where_clause(filters: dict, date_range, cursor):
    conditions = ["1=1"]

    if filters:
        for key, values in filters.items():
            value_list = ", ".join([f"'{v}'" for v in values])
            conditions.append(f"{key} IN ({value_list})")

    if date_range:
        if date_range.from_date:
            conditions.append(f"created_at >= '{date_range.from_date}'")
        if date_range.to_date:
            conditions.append(f"created_at <= '{date_range.to_date}'")

    if cursor:
        conditions.append(f"created_at < '{cursor}'")

    return " AND ".join(conditions)