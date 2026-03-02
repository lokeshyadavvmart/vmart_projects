from database.query_executor import execute_query_dict
import pandas as pd

result = execute_query_dict("""
WITH base_data AS (
    SELECT DISTINCT
        pm.ordcode,
        pm.scheme_docno,
        pm.admsite_code,
        pm.orddt,
        pm.dtto,

        pd.icode,

        vi.partyname,
        vi.lev1grpname,   -- Division
        vi.lev2grpname,   -- Section
        vi.grpname,       -- Department

        vi.cname1,
        vi.cname2,
        vi.cname3,
        vi.cname4,
        vi.cname5,
        vi.cname6,        -- Color
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
        pm.orddt >= ADD_MONTHS(TRUNC(SYSDATE), -1)
        AND pm.admsite_code IN (101486, 101497)
        AND (pd.ordqty - pd.cnlqty) > 0
),

marked AS (
    SELECT
        b.*,

        /* count distinct PO */
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

        /* count distinct colors */
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

        /* unique group id */
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
    AND color_count > 1   -- only groups with different colors

ORDER BY
    group_id,
    order_code,
    icode
""")
df = pd.DataFrame(result)
df.to_csv("duplicate_items.csv")