CREATE TABLE IF NOT EXISTS governance.color_variants
(
    group_id UInt64,

    site_code UInt32,
    order_code String,
    po_number String,
    icode String,

    po_count UInt32,

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

    fabric LowCardinality(String),

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
    order_code
)
SETTINGS index_granularity = 8192;

