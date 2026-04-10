import logging
from datetime import datetime
from database.query_executor import execute_query_dict
from database.clickhouse_client import get_clickhouse_client
import pandas as pd
import sys
import math

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
    # Step 1: Fetch main data from Oracle
    # ----------------------------
    logging.info("Fetching main data from Oracle.")
    main_result = execute_query_dict(f"""
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
        JOIN purorddet pd ON pm.ordcode = pd.ordcode
        JOIN V_item vi ON pd.icode = vi.icode
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

    df = pd.DataFrame(main_result)
    logging.info(f"Fetched {len(df)} records from Oracle.")
    df.columns = [c.lower() for c in df.columns]

    # ----------------------------
    # Step 1b: Fetch desc5 in batches to avoid ORA-01795
    # ----------------------------
    logging.info("Fetching desc5 for each icode from Oracle in batches.")
    icodes = df['icode'].unique().tolist()
    icode_to_desc5 = {}
    batch_size = 1000
    num_batches = math.ceil(len(icodes) / batch_size)

    for i in range(num_batches):
        batch_icodes = icodes[i*batch_size:(i+1)*batch_size]
        placeholders = ",".join(f"'{c}'" for c in batch_icodes)
        batch_result = execute_query_dict(f"""
            SELECT icode, desc5 FROM V_item
            WHERE icode IN ({placeholders})
        """)
        for row in batch_result:
            icode_to_desc5[row['ICODE']] = row['DESC5']

    df['desc5'] = df['icode'].map(icode_to_desc5)
    logging.info("desc5 column added successfully to all rows.")

    # ----------------------------
    # Step 1c: Map desc5 to ClickHouse 'option' column
    # ----------------------------
    df['option'] = df['desc5']
    logging.info("'option' column mapped from desc5 for ClickHouse insertion.")

    # ----------------------------
    # Step 1d: Export Oracle output with option for debugging
    # ----------------------------
    debug_csv_file = f"oracle_output_last_{NUM_DAYS}_days_with_option.csv"
    df.to_csv(debug_csv_file, index=False)
    logging.info(f"Oracle output with option written to CSV for debugging: {debug_csv_file}")

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
    # Step 4: Fetch ClickHouse columns and types
    # ----------------------------
    ch_columns_result = client.query("DESCRIBE TABLE governance.color_variants")
    ch_column_types = {row[0]: row[1] for row in ch_columns_result.result_rows}
    ch_columns = list(ch_column_types.keys())
    logging.info(f"ClickHouse columns found: {ch_columns}")

    # ----------------------------
    # Step 5: Prepare DataFrame for ClickHouse
    # ----------------------------
    df = df.where(pd.notnull(df), None)

    for col in ch_columns:
        if col not in df.columns:
            logging.warning(f"Column '{col}' missing in DataFrame. Adding empty column.")
            df[col] = None

    for col in ch_columns:
        if col in df.columns:
            ch_type = ch_column_types[col]
            if 'String' in ch_type:
                df[col] = df[col].apply(lambda x: str(x) if pd.notnull(x) else "")
            elif 'Int' in ch_type or 'Float' in ch_type:
                df[col] = pd.to_numeric(df[col], errors='coerce').replace({pd.NA: None, float('nan'): None})
            elif 'Date' in ch_type:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                df[col] = df[col].apply(lambda x: x if pd.notnull(x) else datetime(1970, 1, 1).date())

    df = df.reindex(columns=ch_columns)
    df = df.where(pd.notnull(df), None)
    logging.info(f"DataFrame ready for ClickHouse insertion. Dtypes:\n{df.dtypes}")

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