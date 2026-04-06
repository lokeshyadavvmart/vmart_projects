import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

oracledb.init_oracle_client(
    lib_dir=os.getenv("ORACLE_LIB_DIR")
)

pool = oracledb.create_pool(
    user=os.getenv("ORACLE_USER"),
    password=os.getenv("ORACLE_PASSWORD"),
    dsn=os.getenv("ORACLE_DSN"),
    min=1,
    max=5,
    increment=1,
)

def get_connection():
    return pool.acquire()