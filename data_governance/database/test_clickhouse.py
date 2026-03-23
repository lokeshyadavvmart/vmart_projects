from .clickhouse_client import get_clickhouse_client

client = get_clickhouse_client()

result = client.query("SELECT count() FROM governance.color_variants")

print(result.result_rows)