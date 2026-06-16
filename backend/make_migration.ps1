# This script generates the Alembic migration for the new tables.
# Ensure your Postgres database is running before executing this.

$env:SECRET_KEY="temporary_key_for_migration"
$env:MASTER_KEY="K1fD2Z1s9Jc5V_tD0fU9F1L8Zz3K_qE0yS7sW5pY8Wc="
$env:DB_PASSWORD="your_db_password"

alembic revision --autogenerate -m "add_missing_tables"
alembic upgrade head
