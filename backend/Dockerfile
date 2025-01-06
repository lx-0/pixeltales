# Base stage for both development and production
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    postgresql-client \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_HOME=/opt/poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    cd /usr/local/bin && \
    ln -s /opt/poetry/bin/poetry

# Set working directory for dependencies and venv
WORKDIR /opt/venv

# Configure Poetry
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Development stage
FROM base AS development
# Copy dependency files
COPY pyproject.toml poetry.lock ./
# Install dependencies
RUN poetry install --no-root
# Set PATH to use poetry virtual environment
ENV PATH="/opt/venv/.venv/bin:$PATH"
# Create and set workspace directory
WORKDIR /workspace
# Create data directory with proper permissions
RUN mkdir -p /data/sqlite && chown -R 1000:1000 /data
# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# Copy the application code temporarily for development install
COPY . .
# Install the application in development mode
RUN poetry install
# Expose port
EXPOSE 8000
# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Production stage
FROM base AS production
# Copy dependency files
COPY pyproject.toml poetry.lock ./
# Install dependencies (without development dependencies)
RUN poetry install --no-root --only main
# Set PATH to use poetry virtual environment
ENV PATH="/opt/venv/.venv/bin:$PATH"
# Create and set workspace directory
WORKDIR /workspace
# Create data directory with proper permissions
RUN mkdir -p /data/sqlite && chown -R 1000:1000 /data
# Copy application code
COPY . .
# Install the application
RUN poetry install --only main
# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# Expose port
EXPOSE 8000
# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]