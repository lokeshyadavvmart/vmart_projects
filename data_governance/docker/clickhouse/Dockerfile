FROM clickhouse/clickhouse-server:24.1

# copy custom configs
COPY config/config.xml /etc/clickhouse-server/config.xml
COPY config/users.xml /etc/clickhouse-server/users.xml

# copy initialization scripts
COPY init/ /docker-entrypoint-initdb.d/