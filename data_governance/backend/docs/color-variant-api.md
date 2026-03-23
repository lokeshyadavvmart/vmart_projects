# 🟦 Color Variants API – Frontend Documentation

**Endpoint:** `POST /api/color-variants/`

**Purpose:** Fetch color variant records with optional filters, date range, and infinite scroll support.

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
site_code, icode, po_number, order_code, vendor, division, section, department,
cat1, cat2, cat3, cat4, cat5, cat6, fabric
```

**Example:**

```json
{
  "filters": {
    "vendor": ["Rajul Textiles : 0022798"],
    "division": [],
    "fabric": ["Cotton"]
  }
}
```

---

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

---

### 1.3 `cursor` Field

* Type: string (`YYYY-MM-DD`)
* Optional; used for infinite scroll. Empty string is ignored.

---

### 1.4 `limit` Field

* Type: integer
* Optional; number of rows to return.

---

### 1.5 Full Example Request

```json
{
  "filters": {
    "vendor": ["Rajul Textiles : 0022798"],
    "division": [],
    "fabric": ["Cotton"]
  },
  "date_range": {
    "from_date": "",
    "to_date": ""
  },
  "cursor": "",
  "limit": 100
}
```

---

## 2. Response JSON Structure

| Field             | Type            | Description                                                                                             |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `columns`         | array of string | List of all column names returned.                                                                      |
| `data`            | array of arrays | Each array is a row of data, ordered according to `columns`.                                            |
| `count`           | integer         | Number of rows returned.                                                                                |
| `next_cursor`     | string          | Date of the last row returned; use for next infinite scroll request.                                    |
| `distinct_values` | object          | Unique values in the response for `site_code`, `division`, `section`, `department`, `vendor`, `fabric`. |

---

### 2.1 Example Response

```json
{
  "columns": ["group_id","site_code","order_code","po_number","icode","po_count",
              "order_date","last_delivery_date","vendor","division","section","department",
              "cat1","cat2","cat3","cat4","cat5","cat6","fabric",
              "udfstring01","udfstring02","udfstring03","udfstring04","udfstring05",
              "udfstring06","udfstring07","udfstring08","udfstring09","udfstring10"],
  "data": [
    [1656,101486,"OC123456","PO084011-0326PWL","VM3079336",5,
     "2026-03-12","2026-05-25","Rajul Textiles : 0022798","Women Western","Western Sets",
     "Coordinate Set-W [L]","1 N","LIMEROAD","SOLID","WALL : POLKA","91cm/M","BLUE",
     "RAYON SLUB","399","ROUND NECK","REGULAR FIT","SHORT SLEEVES","REGULAR SLEEVES",
     "CASUAL","PLAIN","ALL OVER","REGULAR","REGULAR","COTTON"]
  ],
  "count": 1,
  "next_cursor": "2026-03-12",
  "distinct_values": {
    "site_code": [101486],
    "division": ["Women Western"],
    "section": ["Western Sets"],
    "department": ["Coordinate Set-W [L]"],
    "vendor": ["Rajul Textiles : 0022798"],
    "fabric": ["Cotton"]
  }
}
```

---

## 3. Full Export Endpoint

**Endpoint:** `GET /api/color-variants/export-full-report`

**Purpose:** Download full table or filtered data as CSV.

**Query Parameters:**

| Parameter   | Type   | Description                   |
| ----------- | ------ | ----------------------------- |
| `vendor`    | string | Optional filter for vendor    |
| `site_code` | string | Optional filter for site_code |
| `fabric`    | string | Optional filter for fabric    |

**Example URL:**

```
GET /api/color-variants/export-full-report?vendor=Rajul Textiles : 0022798&fabric=Cotton
```

---

## 4. Frontend Usage Notes

1. Always send **lists for all filter keys**, even if empty.
2. Empty lists mean no filter on that column.
3. Empty strings in `date_range` and `cursor` are ignored.
4. Use `next_cursor` to implement infinite scroll or pagination.
5. `distinct_values` can populate dropdowns or multi-selects dynamically.
6. Column order in `data` always matches `columns`; map dynamically in frontend.
7. For CSV export, query parameters can be used instead of request body.
