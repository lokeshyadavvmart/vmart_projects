import logging
import sys
from datetime import datetime
import pandas as pd
import numpy as np
from database.query_executor import execute_query_dict
from database.clickhouse_client import get_clickhouse_client

# ----------------------------
# Parameters
# ----------------------------
NUM_DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 730
ADMSITES = (101486, 101497)
BATCH_SIZE = 5000
OPTION_CHUNK_SIZE = 1000

# ----------------------------
# Configure logging
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("same_style_etl.log"),
        logging.StreamHandler()
    ]
)

def fetch_case3_items(num_days: int, admsites: tuple) -> pd.DataFrame:
    logging.info(f"Fetching Case-3 items from Oracle for last {num_days} days.")
    try:
        query = f"""
        WITH base_data AS (
            SELECT DISTINCT
                pm.ordcode,
                pm.scheme_docno AS po_number,
                pm.admsite_code,
                pm.orddt AS order_date,
                TRUNC(pm.orddt,'MM') AS order_month,
                pd.icode,
                vi.desc1 AS design_no,
                vi.desc3 AS color_or_style,
                vi.partyname AS vendor,
                vi.lev1grpname AS division,
                vi.lev2grpname AS section,
                vi.grpname AS department,
                vi.cname1, vi.cname2, vi.cname3, vi.cname4, vi.cname5, vi.cname6,
                vi.udfstring01, vi.udfstring02, vi.udfstring03, vi.udfstring04, vi.udfstring05,
                vi.udfstring06, vi.udfstring07, vi.udfstring08, vi.udfstring09, vi.udfstring10
            FROM purordmain pm
            JOIN purorddet pd ON pm.ordcode = pd.ordcode
            JOIN V_item vi ON pd.icode = vi.icode
            WHERE pm.orddt >= TRUNC(SYSDATE) - {num_days}
              AND pm.admsite_code IN {admsites}
              AND (pd.ordqty - pd.cnlqty) > 0
        ),
        marked AS (
            SELECT
                b.*,
                COUNT(DISTINCT design_no) OVER (
                    PARTITION BY
                        admsite_code, department,
                        cname1, cname2, cname3, cname4, cname5, cname6,
                        color_or_style,
                        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                        TRUNC(order_date,'MM')
                ) AS distinct_design_count,
                DENSE_RANK() OVER (
                    ORDER BY
                        admsite_code, department,
                        cname1, cname2, cname3, cname4, cname5, cname6,
                        color_or_style,
                        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                        TRUNC(order_date,'MM')
                ) AS group_id
            FROM base_data b
        )
        SELECT * FROM marked WHERE distinct_design_count > 1 ORDER BY group_id, icode
        """
        result = execute_query_dict(query)
        df = pd.DataFrame(result)
        df.columns = [c.lower() for c in df.columns]

        df.rename(columns={
            'admsite_code': 'site_code',
            'cname1': 'cat1', 'cname2': 'cat2', 'cname3': 'cat3',
            'cname4': 'cat4', 'cname5': 'cat5', 'cname6': 'cat6'
        }, inplace=True)
        return df
    except Exception:
        logging.exception("Error fetching data from Oracle.")
        raise

def fetch_options(icode_list: list) -> dict:
    if not icode_list: return {}
    logging.info(f"Fetching options for {len(icode_list)} icodes.")
    all_options = {}
    for i in range(0, len(icode_list), OPTION_CHUNK_SIZE):
        chunk = icode_list[i:i+OPTION_CHUNK_SIZE]
        placeholders = ",".join([f":{n+1}" for n in range(len(chunk))])
        query = f"SELECT icode, desc5 FROM V_item WHERE icode IN ({placeholders})"
        rows = execute_query_dict(query, params=chunk)
        for row in rows:
            all_options[row['ICODE']] = row['DESC5']
    return all_options

def insert_into_clickhouse(df: pd.DataFrame, table_name: str):
    try:
        client = get_clickhouse_client()
        logging.info(f"Truncating {table_name}...")
        client.command(f"TRUNCATE TABLE {table_name}")

        # --- DYNAMIC SCHEMA ADAPTATION (Copying logic from your working script) ---
        ch_columns_result = client.query(f"DESCRIBE TABLE {table_name}")
        ch_column_types = {row[0]: row[1] for row in ch_columns_result.result_rows}
        ch_columns = list(ch_column_types.keys())

        for col in ch_columns:
            if col not in df.columns:
                df[col] = None

            ch_type = ch_column_types[col]
            # Force Strings (Fixes the 'float has no len' error)
            if 'String' in ch_type or 'LowCardinality(String)' in ch_type:
                df[col] = df[col].apply(lambda x: str(x) if pd.notnull(x) and str(x).lower() != 'nan' else "")
            # Force Numbers
            elif 'UInt' in ch_type or 'Int' in ch_type or 'Float' in ch_type:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            # Force Dates
            elif 'Date' in ch_type:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                df[col] = df[col].apply(lambda x: x if pd.notnull(x) else datetime(1970,1,1).date())

        # Final alignment: Ensure columns are in the exact order ClickHouse expects
        df = df.reindex(columns=ch_columns)
        data_to_insert = df.values.tolist()

        total_batches = (len(data_to_insert) + BATCH_SIZE - 1) // BATCH_SIZE
        for i in range(total_batches):
            batch = data_to_insert[i*BATCH_SIZE:(i+1)*BATCH_SIZE]
            client.insert(table_name, batch, column_names=ch_columns)
            logging.info(f"Inserted batch {i+1}/{total_batches}")

    except Exception:
        logging.exception("ClickHouse Insertion failed.")
        raise

def main():
    logging.info("Starting Case-3 ETL process.")
    try:
        df_main = fetch_case3_items(NUM_DAYS, ADMSITES)
        if df_main.empty:
            logging.warning("No records found.")
            return

        # Fetch and Map Options
        options_map = fetch_options(df_main['icode'].unique().tolist())
        df_main['option'] = df_main['icode'].map(options_map)

        # Load
        insert_into_clickhouse(df_main, "governance.same_style_diff_design")
        logging.info("ETL process completed successfully.")
    except Exception:
        logging.exception("ETL process failed.")

if __name__ == "__main__":
    main()