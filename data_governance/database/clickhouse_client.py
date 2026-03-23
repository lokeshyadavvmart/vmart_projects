import os
import clickhouse_connect
from dotenv import load_dotenv

load_dotenv()


def get_clickhouse_client():

    host = os.getenv("CLICKHOUSE_HOST")
    port = os.getenv("CLICKHOUSE_PORT")
    user = os.getenv("CLICKHOUSE_USER")
    password = os.getenv("CLICKHOUSE_PASSWORD")
    database = os.getenv("CLICKHOUSE_DB")

    if not all([host, port, user, database]):
        raise ValueError("Missing ClickHouse environment variables")

    client = clickhouse_connect.get_client(
        host=host,
        port=int(port),
        username=user,
        password=password,
        database=database
    )

    return client