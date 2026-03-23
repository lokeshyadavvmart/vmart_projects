-- Drop the old table if it exists
DROP TABLE IF EXISTS governance.duplicate_items;

-- Create the new table with po_number
CREATE TABLE IF NOT EXISTS governance.duplicate_items
(
    group_id UInt64,

    site_code UInt32,
    icode String,
    po_number String,        -- Added PO number
    mrp String,

    order_date Date,
    last_delivery_date Date,

    vendor LowCardinality(String),

    division LowCardinality(String),
    section LowCardinality(String),
    department LowCardinality(String),

    cat1 LowCardinality(String),
    cat2 LowCardinality(String),
    cat3 LowCardinality(String),
    cat4 LowCardinality(String),
    cat5 LowCardinality(String),
    cat6 LowCardinality(String),

    itemdesc1 LowCardinality(String),
    itemdesc3 LowCardinality(String),
    itemdesc6 LowCardinality(String),

    udfstring01 String,
    udfstring02 String,
    udfstring03 String,
    udfstring04 String,
    udfstring05 String,
    udfstring06 String,
    udfstring07 String,
    udfstring08 String,
    udfstring09 String,
    udfstring10 String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(order_date)
ORDER BY
(
    site_code,
    division,
    department,
    order_date,
    group_id,
    icode
)
SETTINGS index_granularity = 8192;