from database.clickhouse_client import get_clickhouse_client
import json

client = get_clickhouse_client()

print("--- Testing client.command('DESCRIBE ...') ---")
res_cmd = client.command("DESCRIBE TABLE governance.color_variants")
print(f"Type of res_cmd: {type(res_cmd)}")
try:
    print(f"Sample of res_cmd: {res_cmd[:5]}")
except:
    print(f"First 100 chars of res_cmd: {str(res_cmd)[:100]}")

print("\n--- Testing client.query('DESCRIBE ...').result_rows ---")
res_query = client.query("DESCRIBE TABLE governance.color_variants")
print(f"Type of result_rows: {type(res_query.result_rows)}")
print(f"Sample row: {res_query.result_rows[0]}")
cols = [row[0] for row in res_query.result_rows]
print(f"Extracted columns: {cols}")
