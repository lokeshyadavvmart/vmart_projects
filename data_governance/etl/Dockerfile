FROM python:3.11-slim

WORKDIR /app

# Install cron, timezone, and Oracle deps
RUN apt-get update && apt-get install -y \
    cron \
    tzdata \
    libaio1 \
    unzip \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Kolkata
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient
ENV PYTHONPATH=/app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ETL source code
COPY . .

# Copy cron file
COPY cronjob /etc/cron.d/etl-cron
RUN chmod 0644 /etc/cron.d/etl-cron
RUN crontab /etc/cron.d/etl-cron

# Create log file
RUN touch /var/log/cron.log

# Start cron in foreground
CMD ["cron", "-f"]