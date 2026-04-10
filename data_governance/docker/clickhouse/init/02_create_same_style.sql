-- Drop the old table if it exists
DROP TABLE IF EXISTS governance.same_style_diff_design;

-- Create the new table with option column added
CREATE TABLE IF NOT EXISTS governance.same_style_diff_design
(
    group_id UInt64,

    site_code UInt32,
    icode String,
    po_number String,
    design_no String,                        -- desc1
    color_or_style LowCardinality(String),   -- desc3

    order_date Date,
    order_month Date,

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

    option LowCardinality(String),           -- << NEW COLUMN ADDED HERE >>

    udfstring01 String,
    udfstring02 String,
    udfstring03 String,
    udfstring04 String,
    udfstring05 String,
    udfstring06 String,
    udfstring07 String,
    udfstring08 String,
    udfstring09 String,
    udfstring10 String,

    distinct_design_count UInt32
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(order_month)
ORDER BY
(
    site_code,
    division,
    department,
    order_month,
    group_id,
    icode
)
SETTINGS index_granularity = 8192;