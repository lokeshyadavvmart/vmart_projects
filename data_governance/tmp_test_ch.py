from database.clickhouse_client import get_clickhouse_client

client = get_clickhouse_client()

print("--- Testing client.command('DESCRIBE ...') ---")
res_cmd = client.command("DESCRIBE TABLE governance.color_variants")
print(f"Type: {type(res_cmd)}")
print(f"Value: {res_cmd}")

print("\n--- Testing client.query('DESCRIBE ...').result_rows ---")
res_query = client.query("DESCRIBE TABLE governance.color_variants")
print(f"Type: {type(res_query.result_rows)}")
for row in res_query.result_rows[:2]:
    print(f"Row: {row}")
