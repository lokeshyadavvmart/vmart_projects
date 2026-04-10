# D:\work\vmart_projects\data_governance\etl\processes\duplicate_item.py
import logging
import sys
from datetime import datetime
import pandas as pd
from database.query_executor import execute_query_dict
from database.clickhouse_client import get_clickhouse_client

# ----------------------------
# Parameters
# ----------------------------
NUM_DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 730  # Default: last 2 years
ADMSITES = (101486, 101497)  # Site codes filter
BATCH_SIZE = 5000
IN_CHUNK = 900  # Safe chunk for Oracle IN clause

# ----------------------------
# Configure logging
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("duplicate_items_etl.log"),
        logging.StreamHandler()
    ]
)

# ----------------------------
# STEP 1: Fetch duplicate items from Oracle
# ----------------------------
def fetch_duplicate_items(num_days: int, admsites: tuple) -> pd.DataFrame:
    logging.info(f"Fetching duplicate item groups from Oracle for last {num_days} days.")
    try:
        query = f"""
        WITH base_data AS (
            SELECT DISTINCT
                pm.ordcode,
                pm.scheme_docno AS po_number,
                pm.admsite_code,
                pm.orddt AS order_date,
                pm.dtto AS last_delivery_date,
                pd.icode,
                vi.desc6 AS mrp,
                vi.partyname AS vendor,
                vi.lev1grpname AS division,
                vi.lev2grpname AS section,
                vi.grpname AS department,
                vi.cname1, vi.cname2, vi.cname3, vi.cname4, vi.cname5, vi.cname6,
                vi.desc1 AS itemdesc1,
                vi.desc3 AS itemdesc3,
                vi.desc6 AS itemdesc6,
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
                COUNT(DISTINCT icode) OVER (
                    PARTITION BY 
                        admsite_code,
                        department,
                        cname1, cname2, cname3, cname4, cname5, cname6,
                        itemdesc1, itemdesc3, itemdesc6,
                        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                        order_date,
                        last_delivery_date
                ) AS item_count,
                DENSE_RANK() OVER (
                    ORDER BY
                        admsite_code,
                        department,
                        cname1, cname2, cname3, cname4, cname5, cname6,
                        itemdesc1, itemdesc3, itemdesc6,
                        udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                        udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                        order_date,
                        last_delivery_date
                ) AS group_id
            FROM base_data b
        )
        SELECT *
        FROM marked
        WHERE item_count > 1
        ORDER BY group_id, icode
        """
        rows = execute_query_dict(query)
        df = pd.DataFrame(rows)
        df.columns = [c.lower() for c in df.columns]

        # Rename columns to match ClickHouse
        df.rename(columns={
            'admsite_code': 'site_code',
            'cname1': 'cat1',
            'cname2': 'cat2',
            'cname3': 'cat3',
            'cname4': 'cat4',
            'cname5': 'cat5',
            'cname6': 'cat6'
        }, inplace=True)

        logging.info(f"Fetched {len(df)} duplicate item records from Oracle.")
        return df
    except Exception:
        logging.exception("Error fetching data from Oracle.")
        raise

# ----------------------------
# STEP 2: Fetch desc5 as 'option'
# ----------------------------
def fetch_desc5_map(icode_list: list) -> dict:
    """Fetch desc5 for given icodes from Oracle safely, returns {icode: desc5}."""
    if not icode_list:
        return {}

    logging.info("Fetching desc5 for icodes safely...")
    result_rows = []

    for i in range(0, len(icode_list), IN_CHUNK):
        chunk = icode_list[i:i + IN_CHUNK]
        placeholders = ",".join([f":{n+1}" for n in range(len(chunk))])
        query = f"""
            SELECT icode, desc5
            FROM V_item
            WHERE icode IN ({placeholders})
        """
        rows = execute_query_dict(query, params=chunk)
        result_rows.extend(rows)

    df_desc5 = pd.DataFrame(result_rows)
    df_desc5.columns = [c.lower() for c in df_desc5.columns]
    df_desc5 = df_desc5.drop_duplicates(subset=['icode'])  # enforce one desc5 per icode

    logging.info(f"Fetched desc5 for {len(df_desc5)} unique icodes.")
    return dict(zip(df_desc5['icode'], df_desc5['desc5']))

# ----------------------------
# STEP 3: Export CSV (debug)
# ----------------------------
def export_to_csv(df: pd.DataFrame, num_days: int) -> str:
    file_name = f"duplicate_items_last_{num_days}_days.csv"
    df.to_csv(file_name, index=False)
    logging.info(f"CSV written successfully: {file_name}")
    return file_name

# ----------------------------
# STEP 4: Insert into ClickHouse (truncate table first)
# ----------------------------
def insert_into_clickhouse(df: pd.DataFrame, table_name: str = "governance.duplicate_items"):
    try:
        client = get_clickhouse_client()

        # ----------------------------
        # Truncate table to replace old data
        # ----------------------------
        logging.info(f"Truncating ClickHouse table {table_name} before insert...")
        client.query(f"TRUNCATE TABLE {table_name}")

        # ----------------------------
        # Get ClickHouse schema
        # ----------------------------
        ch_columns_result = client.query(f"DESCRIBE TABLE {table_name}")
        ch_column_types = {row[0]: row[1] for row in ch_columns_result.result_rows}
        ch_columns = list(ch_column_types.keys())

        # ----------------------------
        # Add missing columns
        # ----------------------------
        for col in ch_columns:
            if col not in df.columns:
                df[col] = None

        # ----------------------------
        # Type conversion
        # ----------------------------
        for col in ch_columns:
            if col in df.columns:
                ch_type = ch_column_types[col]
                if 'String' in ch_type or 'LowCardinality(String)' in ch_type:
                    df[col] = df[col].apply(lambda x: str(x) if pd.notnull(x) else "")
                elif 'UInt' in ch_type or 'Int' in ch_type or 'Float' in ch_type:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                elif 'Date' in ch_type:
                    df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                    df[col] = df[col].apply(lambda x: x if pd.notnull(x) else datetime(1970,1,1).date())

        df = df.reindex(columns=ch_columns).where(pd.notnull(df), None)

        # ----------------------------
        # Insert in batches
        # ----------------------------
        data_to_insert = df.values.tolist()
        total_batches = (len(data_to_insert) + BATCH_SIZE - 1) // BATCH_SIZE

        for i in range(total_batches):
            batch = data_to_insert[i*BATCH_SIZE:(i+1)*BATCH_SIZE]
            client.insert(table_name, batch, column_names=ch_columns)
            logging.info(f"Inserted batch {i+1}/{total_batches} ({len(batch)} records)")

        logging.info(f"Successfully inserted {len(df)} records into {table_name}")

    except Exception:
        logging.exception("Error inserting into ClickHouse.")
        raise

# ----------------------------
# MAIN ETL
# ----------------------------
def main():
    logging.info("Starting Duplicate Items ETL process.")
    try:
        # Fetch duplicate items
        df = fetch_duplicate_items(NUM_DAYS, ADMSITES)
        if df.empty:
            logging.warning("No duplicate items found for the given period.")
            return

        # Fetch desc5 → option
        icode_list = df["icode"].unique().tolist()
        desc5_map = fetch_desc5_map(icode_list)
        df["option"] = df["icode"].map(desc5_map)

        # Debug CSV
        export_to_csv(df, NUM_DAYS)

        # Insert into ClickHouse (truncate first)
        insert_into_clickhouse(df)

        logging.info("Duplicate Items ETL completed successfully.")

    except Exception:
        logging.exception("Duplicate Items ETL failed.")

if __name__ == "__main__":
    main()