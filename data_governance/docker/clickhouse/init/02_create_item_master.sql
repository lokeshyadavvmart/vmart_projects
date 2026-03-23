-- File: 02_create_item_master.sql

-- ----------------------------
-- 1️⃣ MAIN TABLE
-- ----------------------------
DROP TABLE IF EXISTS governance.v_item_master;

CREATE TABLE governance.v_item_master
(
    icode LowCardinality(String),

    lev1grpname LowCardinality(String),
    lev2grpname LowCardinality(String),
    grpname LowCardinality(String),

    cname1 LowCardinality(String),
    cname2 LowCardinality(String),
    cname3 LowCardinality(String),
    cname4 LowCardinality(String),
    cname5 LowCardinality(String),
    cname6 LowCardinality(String),

    shrtname LowCardinality(String),
    udfstring03 String,

    udfstring01 String,
    udfstring02 String,
    udfstring04 String,
    udfstring05 String,
    udfstring06 String,
    udfstring07 String,
    udfstring08 String,
    udfstring09 String,
    udfstring10 String
)
ENGINE = MergeTree
ORDER BY (icode);


-- ----------------------------
-- 2️⃣ METADATA TABLE
-- ----------------------------
DROP TABLE IF EXISTS governance.v_item_master_meta;

CREATE TABLE governance.v_item_master_meta
(
    column_name LowCardinality(String),
    value String,

    division LowCardinality(String),
    section LowCardinality(String),
    department LowCardinality(String),

    count UInt32
)
ENGINE = MergeTree
ORDER BY (column_name, value, division, section, department);


-- ----------------------------
-- 3️⃣ FUZZY TABLE
-- ----------------------------
DROP TABLE IF EXISTS governance.v_item_fuzzy_pairs;

CREATE TABLE governance.v_item_fuzzy_pairs
(
    column_name LowCardinality(String),

    value1 String,
    value2 String,

    normalized_value1 String,
    normalized_value2 String,

    score UInt8,

    count1 UInt32,
    count2 UInt32
)
ENGINE = MergeTree
ORDER BY (column_name, score, value1, value2);


-- ----------------------------
-- 4️⃣ INDEX
-- ----------------------------
ALTER TABLE governance.v_item_master_meta
ADD INDEX idx_value value TYPE bloom_filter GRANULARITY 1;