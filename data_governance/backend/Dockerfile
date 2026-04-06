# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps (needed for oracle + build tools)
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy Oracle Instant Client (we'll mount or copy later)
# ENV for oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]