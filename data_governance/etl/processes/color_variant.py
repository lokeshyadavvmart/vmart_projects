import logging
from datetime import datetime, timedelta
from database.query_executor import execute_query_dict
from database.clickhouse_client import get_clickhouse_client
import pandas as pd
import sys

# ----------------------------
# Parameters
# ----------------------------
NUM_DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 730

# ----------------------------
# Configure logging
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("color_variants_etl.log"),
        logging.StreamHandler()
    ]
)

logging.info(f"ETL process started for last {NUM_DAYS} day(s).")

try:
    # ----------------------------
    # Step 1: Fetch data from Oracle
    # ----------------------------
    logging.info("Fetching data from source database.")
    result = execute_query_dict(f"""
    WITH base_data AS (
        SELECT DISTINCT
            pm.ordcode,
            pm.scheme_docno,
            pm.admsite_code,
            pm.orddt,
            pm.dtto,
            pd.icode,
            vi.partyname,
            vi.lev1grpname,
            vi.lev2grpname,
            vi.grpname,
            vi.cname1,
            vi.cname2,
            vi.cname3,
            vi.cname4,
            vi.cname5,
            vi.cname6,
            vi.desc3,
            vi.udfstring01,
            vi.udfstring02,
            vi.udfstring03,
            vi.udfstring04,
            vi.udfstring05,
            vi.udfstring06,
            vi.udfstring07,
            vi.udfstring08,
            vi.udfstring09,
            vi.udfstring10
        FROM purordmain pm
        JOIN purorddet pd
            ON pm.ordcode = pd.ordcode
        JOIN V_item vi
            ON pd.icode = vi.icode
        WHERE
            pm.orddt >= TRUNC(SYSDATE) - {NUM_DAYS}
            AND pm.admsite_code IN (101486, 101497)
            AND (pd.ordqty - pd.cnlqty) > 0
    ),
    marked AS (
        SELECT
            b.*,
            COUNT(DISTINCT ordcode) OVER (
                PARTITION BY
                    admsite_code,
                    lev1grpname,
                    cname1, cname2, cname3, cname4, cname5,
                    desc3,
                    udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                    udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                    orddt,
                    dtto
            ) AS po_count,
            COUNT(DISTINCT cname6) OVER (
                PARTITION BY
                    admsite_code,
                    lev1grpname,
                    cname1, cname2, cname3, cname4, cname5,
                    desc3,
                    udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                    udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                    orddt,
                    dtto
            ) AS color_count,
            DENSE_RANK() OVER (
                ORDER BY
                    admsite_code,
                    lev1grpname,
                    cname1, cname2, cname3, cname4, cname5,
                    desc3,
                    udfstring01, udfstring02, udfstring03, udfstring04, udfstring05,
                    udfstring06, udfstring07, udfstring08, udfstring09, udfstring10,
                    orddt,
                    dtto
            ) AS group_id
        FROM base_data b
    )
    SELECT
        group_id,
        admsite_code    AS site_code,
        ordcode         AS order_code,
        scheme_docno    AS po_number,
        icode,
        po_count,
        orddt           AS order_date,
        dtto            AS last_delivery_date,
        partyname       AS vendor,
        lev1grpname     AS division,
        lev2grpname     AS section,
        grpname         AS department,
        cname1          AS cat1,
        cname2          AS cat2,
        cname3          AS cat3,
        cname4          AS cat4,
        cname5          AS cat5,
        cname6          AS cat6,
        desc3           AS fabric,
        udfstring01,
        udfstring02,
        udfstring03,
        udfstring04,
        udfstring05,
        udfstring06,
        udfstring07,
        udfstring08,
        udfstring09,
        udfstring10
    FROM marked
    WHERE
        po_count > 1
        AND color_count > 1
    ORDER BY
        group_id,
        order_code,
        icode
    """)

    df = pd.DataFrame(result)
    logging.info(f"Fetched {len(df)} records from Oracle.")
    df.columns = [c.lower() for c in df.columns]

    # ----------------------------
    # Step 1b: Export Oracle output to CSV for debugging
    # ----------------------------
    debug_csv_file = f"oracle_output_last_{NUM_DAYS}_days.csv"
    df.to_csv(debug_csv_file, index=False)
    logging.info(f"Oracle output written to CSV for debugging: {debug_csv_file}")

    # ----------------------------
    # Step 2: Connect to ClickHouse
    # ----------------------------
    logging.info("Connecting to ClickHouse.")
    client = get_clickhouse_client()

    # ----------------------------
    # Step 3: Delete old data
    # ----------------------------
    logging.info("Deleting old data from ClickHouse table 'color_variants'.")
    client.command("TRUNCATE TABLE governance.color_variants")

    # ----------------------------
    # Step 4: Fetch ClickHouse columns
    # ----------------------------
    ch_columns_result = client.query("DESCRIBE TABLE governance.color_variants")
    # row format: (name, type, default_type, default_expression, comment, codec_expression, ttl_expression)
    ch_column_types = {row[0]: row[1] for row in ch_columns_result.result_rows}
    ch_columns = list(ch_column_types.keys())

    logging.info(f"ClickHouse columns found: {ch_columns}")

    # ----------------------------
    # Step 5: Prepare DataFrame
    # ----------------------------
    # Ensure all NaN/NAT are replaced with None for ClickHouse NULL
    df = df.where(pd.notnull(df), None)

    # Add missing columns if any
    for col in ch_columns:
        if col not in df.columns:
            logging.warning(f"Column '{col}' missing in DataFrame. Adding empty column.")
            df[col] = None

    # Type conversion based on ClickHouse types
    for col in ch_columns:
        if col in df.columns:
            ch_type = ch_column_types[col]
            if 'String' in ch_type:
                # ClickHouse String columns don't like None/NaN if not Nullable. Use empty string.
                df[col] = df[col].apply(lambda x: str(x) if pd.notnull(x) else "")
            elif 'Int' in ch_type or 'Float' in ch_type:
                df[col] = pd.to_numeric(df[col], errors='coerce').replace({pd.NA: None, float('nan'): None})
            elif 'Date' in ch_type:
                # ClickHouse Date columns expect datetime.date objects
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                # For non-nullable dates, fill with 1970-01-01 if needed, 
                # but many ClickHouse setups allow NULL if wrapped in Nullable().
                # For simplicity and to avoid error 508, let's ensure it's a date object or None
                df[col] = df[col].apply(lambda x: x if pd.notnull(x) else datetime(1970, 1, 1).date())

    # Final pass to ensure NO np.nan or pd.NA remain (convert everything to None or native types)
    # Note: reindex might re-introduce NaN for missing columns, so we reindex first then cleanup.
    df = df.reindex(columns=ch_columns)
    df = df.where(pd.notnull(df), None)

    # Final data check
    logging.info(f"DataFrame dtypes before insertion:\n{df.dtypes}")
    
    # ----------------------------
    # Step 6: Insert into ClickHouse in batches
    # ----------------------------
    data_to_insert = df.values.tolist()
    logging.info(f"Inserting {len(data_to_insert)} records into ClickHouse.")

    batch_size = 5000
    for start in range(0, len(data_to_insert), batch_size):
        batch = data_to_insert[start:start+batch_size]
        client.insert('governance.color_variants', batch, column_names=ch_columns)
        logging.info(f"Inserted batch {start // batch_size + 1} ({len(batch)} records)")

    logging.info("ETL process finished successfully.")

except Exception as e:
    logging.exception("ETL process failed with an error:")