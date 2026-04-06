# ================================
# Data Governance App Dockerfile
# ================================

FROM python:3.11-bullseye

# ---- Environment variables ----
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    LD_LIBRARY_PATH=/opt/oracle/instantclient_23_0:$LD_LIBRARY_PATH \
    NODE_TLS_REJECT_UNAUTHORIZED=0 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_TRUSTED_HOST=pypi.org \
    PIP_EXTRA_INDEX_URL=https://pypi.org/simple

# ---- Install system dependencies ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl unzip build-essential libaio1 libnss3 libssl-dev \
    cron ca-certificates git xz-utils \
    && rm -rf /var/lib/apt/lists/*

# ---- Create app directory ----
WORKDIR /app

# ---- Copy project files ----
COPY ./backend ./backend
COPY ./etl ./etl
COPY ./database ./database
COPY ./frontend ./frontend
COPY ./docker/entrypoint.sh ./docker/entrypoint.sh
COPY ./oracle/instantclient_23_0 /opt/oracle/instantclient_23_0

# ---- Setup Python virtual environment ----
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip --trusted-host pypi.org --trusted-host files.pythonhosted.org \
    && /opt/venv/bin/pip install -r ./backend/requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org \
    && /opt/venv/bin/pip install -r ./etl/requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org

ENV PATH="/opt/venv/bin:$PATH"

# ---- Install Node.js 24.13.0 + npm 11.6.2 with SSL bypass ----
RUN curl -k -fsSL https://nodejs.org/dist/v24.13.0/node-v24.13.0-linux-x64.tar.xz \
    -o /tmp/node.tar.xz \
    && tar -xf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && ln -sf /usr/local/bin/node /usr/bin/node \
    && ln -sf /usr/local/bin/npm /usr/bin/npm \
    && ln -sf /usr/local/bin/npx /usr/bin/npx \
    && npm config set strict-ssl false \
    && npm config set registry https://registry.npmjs.org/ \
    && node -v \
    && npm -v

# ---- Build frontend ----
WORKDIR /app/frontend
RUN npm config set strict-ssl false \
    && npm config set registry https://registry.npmjs.org/ \
    && npm install --legacy-peer-deps \
    && npm run build

# ---- Final setup ----
WORKDIR /app
RUN chmod +x ./docker/entrypoint.sh
EXPOSE 3000 8000
ENTRYPOINT ["./docker/entrypoint.sh"]