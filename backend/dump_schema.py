import sqlite3
import json
import os

db_path = os.path.expanduser('~/.hermes/hermes_state.db')
try:
    conn = sqlite3.connect(db_path)
    res = conn.execute("SELECT name, sql FROM sqlite_master WHERE type='table';").fetchall()
    for name, sql in res:
        print(f"Table: {name}")
        print(sql)
        print("-" * 40)
except Exception as e:
    print(f"Error: {e}")
