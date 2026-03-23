def get_next_cursor(rows):
    if not rows:
        return None
    return rows[-1].get("created_at")