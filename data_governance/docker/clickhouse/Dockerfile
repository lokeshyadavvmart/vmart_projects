FROM clickhouse/clickhouse-server:24.1

# ---- Copy configs ----
COPY config/config.xml /etc/clickhouse-server/config.xml
COPY config/users.xml /etc/clickhouse-server/users.xml

# ---- Copy init SQL scripts ----
COPY init/ /docker-entrypoint-initdb.d/

# ---- Run init scripts in proper order ----
CMD bash -c "\
    /usr/bin/clickhouse-server --config-file=/etc/clickhouse-server/config.xml & \
    sleep 10 && \
    echo 'Running 01_create_database.sql...' && \
    clickhouse-client --multiquery < /docker-entrypoint-initdb.d/01_create_database.sql && \
    for f in /docker-entrypoint-initdb.d/02_create_*.sql; do \
    echo 'Running init script:' \$f; \
    clickhouse-client --multiquery < \$f; \
    done && \
    fg"