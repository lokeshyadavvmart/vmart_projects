# File: etl/item_master/get_items.py

import logging
import pandas as pd
from collections import defaultdict
from rapidfuzz import process, fuzz
from database.query_executor import get_connection
from database.clickhouse_client import get_clickhouse_client

# ----------------------------
# Config
# ----------------------------
FETCH_BATCH_SIZE = 5000
INSERT_BATCH_SIZE = 5000
FUZZY_THRESHOLD = 90
CHUNK_SIZE = 500

FUZZY_EXCLUDE_COLUMNS = {"cname4" , "udfstring09"}

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
    "cname1", "cname2", "cname3", "cname4", "cname5", "cname6",
    "shrtname", "udfstring03",
    "udfstring01", "udfstring02", "udfstring04", "udfstring05",
    "udfstring06", "udfstring07", "udfstring08", "udfstring09", "udfstring10"
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
        return ''
    if isinstance(x, float) and pd.isna(x):
        return ''
    return str(x)


def normalize(s):
    return s.lower().strip() if s else ""


# ----------------------------
# MAIN ETL
# ----------------------------
try:
    logging.info("Starting ETL")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM V_ITEM")
    total_expected = cursor.fetchone()[0]

    cursor.execute(f"SELECT {', '.join(REQUIRED_COLUMNS)} FROM V_ITEM")

    client = get_clickhouse_client()

    ch_table = "governance.v_item_master"
    meta_table = "governance.v_item_master_meta"
    fuzzy_table = "governance.v_item_fuzzy_pairs"

    logging.info("Truncating tables")
    client.command(f"TRUNCATE TABLE {ch_table}")
    client.command(f"TRUNCATE TABLE {meta_table}")
    client.command(f"TRUNCATE TABLE {fuzzy_table}")

    meta_counter = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(int)))))

    total_rows = 0
    batch_num = 0

    # ----------------------------
    # LOAD DATA
    # ----------------------------
    while True:
        rows = cursor.fetchmany(FETCH_BATCH_SIZE)
        if not rows:
            break

        batch_num += 1
        total_rows += len(rows)

        df = pd.DataFrame(rows, columns=[c[0].lower() for c in cursor.description])
        df = df[REQUIRED_COLUMNS]

        cleaned = [[clean_value(v) for v in r] for r in df.itertuples(index=False, name=None)]

        client.insert(ch_table, cleaned, column_names=REQUIRED_COLUMNS)

        for row in cleaned:
            d = dict(zip(REQUIRED_COLUMNS, row))
            div, sec, dept = d["lev1grpname"], d["lev2grpname"], d["grpname"]

            for col in META_COLUMNS:
                meta_counter[col][d[col]][div][sec][dept] += 1

        percent = (total_rows / total_expected) * 100 if total_expected else 0
        logging.info(f"Batch {batch_num} | Total {total_rows} ({percent:.2f}%)")

    logging.info("Main load done")

    # ----------------------------
    # METADATA
    # ----------------------------
    logging.info("Building metadata")

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
                                column_names=["column_name", "value", "division", "section", "department", "count"]
                            )
                            meta_data = []

    if meta_data:
        client.insert(
            meta_table,
            meta_data,
            column_names=["column_name", "value", "division", "section", "department", "count"]
        )

    logging.info("Metadata done")

    # ----------------------------
    # FUZZY (STREAMING, SAFE)
    # ----------------------------
    logging.info("Fuzzy start")

    for col in FUZZY_COLUMNS:
        logging.info(f"Processing column: {col}")

        value_map = defaultdict(int)

        for val, div_dict in meta_counter[col].items():
            for d2 in div_dict.values():
                for s2 in d2.values():
                    for dept, cnt in s2.items():
                        value_map[val] += cnt

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
                            v1,
                            v2,
                            normalize(v1),
                            normalize(v2),
                            score,
                            value_map[v1],
                            value_map[v2]
                        ])

                        if len(insert_batch) >= INSERT_BATCH_SIZE:
                            client.insert(
                                fuzzy_table,
                                insert_batch,
                                column_names=[
                                    "column_name",
                                    "value1",
                                    "value2",
                                    "normalized_value1",
                                    "normalized_value2",
                                    "score",
                                    "count1",
                                    "count2"
                                ]
                            )
                            total_pairs += len(insert_batch)
                            insert_batch = []

            if insert_batch:
                client.insert(
                    fuzzy_table,
                    insert_batch,
                    column_names=[
                        "column_name",
                        "value1",
                        "value2",
                        "normalized_value1",
                        "normalized_value2",
                        "score",
                        "count1",
                        "count2"
                    ]
                )
                total_pairs += len(insert_batch)

            logging.info(f"{col}: chunk {start} done | pairs: {total_pairs}")

        del values, norm, value_map

        logging.info(f"Completed {col} | total pairs: {total_pairs}")

    logging.info("ETL COMPLETED SUCCESSFULLY")

    cursor.close()
    conn.close()

except Exception:
    logging.exception("ETL FAILED")