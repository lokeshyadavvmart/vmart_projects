# 🟦 Duplicate Items API – Frontend Documentation

**Endpoint:** `POST /api/duplicate-items/`

**Purpose:** Fetch duplicate item records with optional filters, date range, and infinite scroll support.

---

## 1. Request JSON Structure

| Field        | Type    | Required                           | Description                                                                                  |
| ------------ | ------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `filters`    | object  | Optional (all keys must be arrays) | Filter data by allowed columns. Empty arrays mean no filter for that column.                 |
| `date_range` | object  | Optional                           | Filter data by `order_date` range. Empty strings are ignored.                                |
| `cursor`     | string  | Optional                           | Fetch rows older than this date (`YYYY-MM-DD`) for infinite scroll. Empty string is ignored. |
| `limit`      | integer | Optional                           | Number of rows to fetch. Default backend limit applies if not provided.                      |

### 1.1 `filters` Object

**Allowed keys (all must be arrays, can be empty):**

```
site_code, icode, po_number, vendor, division, section, department,
cat1, cat2, cat3, cat4, cat5, cat6
```

**Example:**

```json
{
  "filters": {
    "vendor": ["Rajul Textiles : 0022798"],
    "division": [],
    "cat1": []
  }
}
```

### 1.2 `date_range` Object

| Field       | Type   | Description                                                   |
| ----------- | ------ | ------------------------------------------------------------- |
| `from_date` | string | Start date (`YYYY-MM-DD`) inclusive. Empty string is ignored. |
| `to_date`   | string | End date (`YYYY-MM-DD`) inclusive. Empty string is ignored.   |

**Example:**

```json
{
  "date_range": {
    "from_date": "",
    "to_date": ""
  }
}
```

### 1.3 `cursor` Field

* Type: string (`YYYY-MM-DD`)
* Optional; used for infinite scroll. Empty string is ignored.

### 1.4 `limit` Field

* Type: integer
* Optional; number of rows to return.

### 1.5 Full Example Request

```json
{
  "filters": {
    "vendor": ["Rajul Textiles : 0022798"],
    "division": [],
    "cat1": []
  },
  "date_range": {
    "from_date": "",
    "to_date": ""
  },
  "cursor": "",
  "limit": 2
}
```

---

## 2. Response JSON Structure

| Field             | Type            | Description                                                                                       |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `columns`         | array of string | List of all column names returned.                                                                |
| `data`            | array of arrays | Each array is a row of data, ordered according to `columns`.                                      |
| `count`           | integer         | Number of rows returned.                                                                          |
| `next_cursor`     | string          | Date of the last row returned; use for next infinite scroll request.                              |
| `distinct_values` | object          | Unique values in the response for `site_code`, `division`, `section`, `department`, and `vendor`. |

### 2.1 Example Response

```json
{
  "columns": ["group_id","site_code","icode","po_number","mrp","order_date","last_delivery_date",
              "vendor","division","section","department","cat1","cat2","cat3","cat4","cat5","cat6",
              "itemdesc1","itemdesc3","itemdesc6","udfstring01","udfstring02","udfstring03","udfstring04",
              "udfstring05","udfstring06","udfstring07","udfstring08","udfstring09","udfstring10"],
  "data": [
    [1656,101486,"VM3079336","PO084011-0326PWL","399","2026-03-12","2026-05-25",
     "Rajul Textiles : 0022798","Women Western","Western Sets","Coordinate Set-W [L]",
     "1 N","LIMEROAD","SOLID","WALL : POLKA","91cm/M","BLUE","SS26-RAJ-39A",
     "RAYON SLUB","399","ROUND NECK","REGULAR FIT","SHORT SLEEVES","REGULAR SLEEVES",
     "CASUAL","PLAIN","ALL OVER","REGULAR","REGULAR",""]
  ],
  "count": 2,
  "next_cursor": "2026-03-12",
  "distinct_values": {
    "site_code": [101486],
    "division": ["Women Western"],
    "section": ["Western Sets"],
    "department": ["Coordinate Set-W [L]"],
    "vendor": ["Rajul Textiles : 0022798"]
  }
}
```

---

## 3. Frontend Usage Notes

1. Always send **lists for all filter keys**, even if empty.
2. Empty lists mean no filter on that column.
3. Empty strings in `date_range` and `cursor` are ignored.
4. Use `next_cursor` to implement infinite scroll or pagination.
5. `distinct_values` can populate dropdowns or multi-selects dynamically.
6. Column order in `data` always matches `columns`; map dynamically in frontend.
