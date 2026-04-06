import logging
import pandas as pd
from collections import defaultdict
from rapidfuzz import process, fuzz

from database.query_executor import execute_query_dict
from database.clickhouse_client import get_clickhouse_client

# ----------------------------
# CONFIG
# ----------------------------
FETCH_BATCH_SIZE = 5000
INSERT_BATCH_SIZE = 5000
FUZZY_THRESHOLD = 90
CHUNK_SIZE = 500
ICODE_CHUNK = 1000

FUZZY_EXCLUDE_COLUMNS = {"cname4", "udfstring09"}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("v_item_etl.log"),
        logging.StreamHandler()
    ]
)

# ----------------------------
# REQUIRED COLUMNS
# ----------------------------
REQUIRED_COLUMNS = [
    "icode",
    "lev1grpname",
    "lev2grpname",
    "grpname",
    "cname1", "cname2", "cname3", "cname4",
    "cname5", "cname6",
    "shrtname", "udfstring03",
    "udfstring01", "udfstring02", "udfstring04", "udfstring05",
    "udfstring06", "udfstring07", "udfstring08",
    "udfstring09", "udfstring10"
]

META_COLUMNS = [
    "cname1", "cname2", "cname3", "cname4", "cname5", "cname6",
    "shrtname", "udfstring03", "udfstring01", "udfstring02",
    "udfstring04", "udfstring05", "udfstring06", "udfstring07",
    "udfstring08", "udfstring09", "udfstring10"
]

FUZZY_COLUMNS = [c for c in META_COLUMNS if c not in FUZZY_EXCLUDE_COLUMNS]


# ----------------------------
# HELPERS
# ----------------------------
def clean_value(x):
    if x is None:
        return ""
    if isinstance(x, float) and pd.isna(x):
        return ""
    return str(x)


def normalize(s):
    return s.lower().strip() if s else ""


# ----------------------------
# MAIN ETL
# ----------------------------
try:
    logging.info("Starting ETL job...")

    # ------------------------------------------------
    # 1) FETCH icodes purchased in last 2 years
    # ------------------------------------------------
    logging.info("Fetching icodes purchased in last 2 years...")

    icode_rows = execute_query_dict("""
        SELECT DISTINCT pd.icode
        FROM purorddet pd
        JOIN purordmain pm ON pd.ordcode = pm.ordcode
        WHERE (pd.ordqty - pd.cnlqty) != 0
          AND pm.orddt >= ADD_MONTHS(TRUNC(SYSDATE), -24)
    """)

    icodes = [str(r["ICODE"]) for r in icode_rows]
    logging.info(f"Found {len(icodes)} active icodes in last 2 years")

    # ------------------------------------------------
    # 2) Fetch filtered V_ITEM rows in chunks
    # ------------------------------------------------
    logging.info("Fetching filtered V_ITEM rows...")

    all_rows = []
    for i in range(0, len(icodes), ICODE_CHUNK):
        chunk = icodes[i:i + ICODE_CHUNK]
        chunk_list = ",".join(f"'{c}'" for c in chunk)

        query = f"""
            SELECT {", ".join(REQUIRED_COLUMNS)}
            FROM V_ITEM
            WHERE icode IN ({chunk_list})
        """

        result = execute_query_dict(query)
        logging.info(f"Fetched {len(result)} rows for this icode chunk.")
        all_rows.extend(result)

    logging.info(f"Total fetched rows from V_ITEM: {len(all_rows)}")

    # ------------------------------------------------
    # ClickHouse setup
    # ------------------------------------------------
    client = get_clickhouse_client()

    ch_table = "governance.v_item_master"
    meta_table = "governance.v_item_master_meta"
    fuzzy_table = "governance.v_item_fuzzy_pairs"

    logging.info("Truncating ClickHouse tables...")
    client.command(f"TRUNCATE TABLE {ch_table}")
    client.command(f"TRUNCATE TABLE {meta_table}")
    client.command(f"TRUNCATE TABLE {fuzzy_table}")

    # ------------------------------------------------
    # Metadata dictionary
    # ------------------------------------------------
    meta_counter = defaultdict(lambda: defaultdict(
        lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    ))

    # ------------------------------------------------
    # 3) PROCESS IN BATCHES
    # ------------------------------------------------
    total_rows = 0
    from math import ceil
    total_batches = ceil(len(all_rows) / FETCH_BATCH_SIZE)

    for batch_num in range(total_batches):
        start = batch_num * FETCH_BATCH_SIZE
        end = start + FETCH_BATCH_SIZE
        batch = all_rows[start:end]

        df = pd.DataFrame(batch)

        # 1) Make columns lowercase
        df.columns = [c.lower() for c in df.columns]

        # 2) Add missing columns (Oracle might not return all)
        for col in REQUIRED_COLUMNS:
            if col not in df.columns:
                df[col] = ""

        # 3) Reorder
        df = df[REQUIRED_COLUMNS]

        cleaned = [
            [clean_value(v) for v in r]
            for r in df.itertuples(index=False, name=None)
        ]

        # Insert into ClickHouse
        client.insert(ch_table, cleaned, column_names=REQUIRED_COLUMNS)

        # Aggregate metadata
        for row in cleaned:
            d = dict(zip(REQUIRED_COLUMNS, row))
            div, sec, dept = d["lev1grpname"], d["lev2grpname"], d["grpname"]

            for col in META_COLUMNS:
                meta_counter[col][d[col]][div][sec][dept] += 1

        total_rows += len(cleaned)
        logging.info(
            f"Batch {batch_num+1}/{total_batches} | {total_rows} rows processed"
        )

    logging.info("Main Oracle to ClickHouse load complete.")

    # ------------------------------------------------
    # 4) METADATA INSERT
    # ------------------------------------------------
    logging.info("Building metadata...")
    meta_data = []

    for col, val_dict in meta_counter.items():
        for val, div_dict in val_dict.items():
            for div, sec_dict in div_dict.items():
                for sec, dept_dict in sec_dict.items():
                    for dept, cnt in dept_dict.items():

                        meta_data.append([col, val, div, sec, dept, cnt])

                        if len(meta_data) >= INSERT_BATCH_SIZE:
                            client.insert(
                                meta_table,
                                meta_data,
                                column_names=[
                                    "column_name", "value",
                                    "division", "section",
                                    "department", "count"
                                ]
                            )
                            meta_data = []

    if meta_data:
        client.insert(
            meta_table,
            meta_data,
            column_names=[
                "column_name", "value",
                "division", "section",
                "department", "count"
            ]
        )

    logging.info("Metadata load completed.")

    # ------------------------------------------------
    # 5) FUZZY MATCHING
    # ------------------------------------------------
    logging.info("Starting fuzzy matching...")

    for col in FUZZY_COLUMNS:
        logging.info(f"Processing fuzzy for column: {col}")

        value_map = defaultdict(int)

        # Flatten counts
        for val, div_dict in meta_counter[col].items():
            total = 0
            for d2 in div_dict.values():
                for s2 in d2.values():
                    for cnt in s2.values():
                        total += cnt
            value_map[val] = total

        values = list(value_map.keys())
        if len(values) < 2:
            continue

        norm = [normalize(v) for v in values]
        total_pairs = 0

        for start in range(0, len(values), CHUNK_SIZE):
            chunk_vals = values[start:start + CHUNK_SIZE]
            chunk_norm = norm[start:start + CHUNK_SIZE]

            matrix = process.cdist(
                chunk_norm,
                norm,
                scorer=fuzz.token_sort_ratio,
                score_cutoff=FUZZY_THRESHOLD
            )

            insert_batch = []

            for i, row in enumerate(matrix):
                for j, score in enumerate(row):
                    gi = start + i

                    if gi >= j:
                        continue
                    if score >= FUZZY_THRESHOLD:
                        v1 = chunk_vals[i]
                        v2 = values[j]

                        insert_batch.append([
                            col,
                            v1, v2,
                            normalize(v1), normalize(v2),
                            score, value_map[v1], value_map[v2]
                        ])

                        if len(insert_batch) >= INSERT_BATCH_SIZE:
                            client.insert(
                                fuzzy_table, insert_batch,
                                column_names=[
                                    "column_name",
                                    "value1", "value2",
                                    "normalized_value1", "normalized_value2",
                                    "score", "count1", "count2"
                                ]
                            )
                            insert_batch = []

            if insert_batch:
                client.insert(
                    fuzzy_table, insert_batch,
                    column_names=[
                        "column_name",
                        "value1", "value2",
                        "normalized_value1", "normalized_value2",
                        "score", "count1", "count2"
                    ]
                )

        logging.info(f"Completed fuzzy for column {col}")

    logging.info("ETL COMPLETED SUCCESSFULLY.")

except Exception:
    logging.exception("ETL FAILED")