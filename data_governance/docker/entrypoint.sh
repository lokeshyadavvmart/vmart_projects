#!/bin/bash
set -e

# ---- Start cron for ETL ----
echo "0 23 * * * root python /app/etl/run_all.py >> /var/log/etl.log 2>&1" > /etc/cron.d/data_governance_etl
chmod 0644 /etc/cron.d/data_governance_etl
crontab /etc/cron.d/data_governance_etl
service cron start

# ---- Start backend (Uvicorn) ----
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# ---- Start frontend (Next.js) ----
cd /app/frontend
npm run start