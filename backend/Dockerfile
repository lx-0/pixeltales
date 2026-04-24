# Base stage with uv preinstalled
FROM python:3.12-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-client \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install uv from the official distroless image
COPY --from=ghcr.io/astral-sh/uv:0.8.13 /uv /uvx /usr/local/bin/

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    PATH=/opt/venv/bin:$PATH

WORKDIR /workspace

# Development stage — installs dev deps, mounts source via compose
FROM base AS development
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /data/sqlite \
    && chown -R 1000:1000 /data
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]

# Production stage — main deps only, source baked in
FROM base AS production
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /data/sqlite \
    && chown -R 1000:1000 /data
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]
