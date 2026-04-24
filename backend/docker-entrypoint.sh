#!/bin/sh
set -e

cd /workspace
echo "[entrypoint] cwd: $(pwd) | DB_TYPE=$DB_TYPE | ENV=$ENV"

stamp_if_pre_alembic_sqlite() {
    db_path="$1"
    if [ ! -f "$db_path" ]; then return; fi
    if sqlite3 "$db_path" ".tables" 2>/dev/null | grep -q alembic_version; then return; fi
    if sqlite3 "$db_path" ".tables" 2>/dev/null | grep -q scene_configs; then
        echo "[entrypoint] Pre-Alembic SQLite DB found at $db_path — stamping head"
        alembic stamp head
    fi
}

stamp_if_pre_alembic_postgres() {
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "[entrypoint] PostgreSQL unreachable, skipping pre-Alembic check"
        return
    fi
    has_alembic=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c \
        "SELECT 1 FROM information_schema.tables WHERE table_schema='${POSTGRES_SCHEMA}' AND table_name='alembic_version' LIMIT 1;" 2>/dev/null)
    if [ "$has_alembic" = "1" ]; then return; fi
    has_scene_configs=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c \
        "SELECT 1 FROM information_schema.tables WHERE table_schema='${POSTGRES_SCHEMA}' AND table_name='scene_configs' LIMIT 1;" 2>/dev/null)
    if [ "$has_scene_configs" = "1" ]; then
        echo "[entrypoint] Pre-Alembic PostgreSQL schema found — stamping head"
        alembic stamp head
    fi
}

if [ "$DB_TYPE" = "sqlite" ]; then
    DB_PATH=$(echo "$SQLITE_URL" | sed -e 's|sqlite+aiosqlite:///||')
    DB_DIR=$(dirname "$DB_PATH")
    mkdir -p "$DB_DIR"
    stamp_if_pre_alembic_sqlite "$DB_PATH"
elif [ "$DB_TYPE" = "postgresql" ]; then
    stamp_if_pre_alembic_postgres
else
    echo "[entrypoint] Unknown DB_TYPE: $DB_TYPE" >&2
    exit 1
fi

echo "[entrypoint] Running alembic upgrade head"
alembic upgrade head

echo "[entrypoint] Starting uvicorn"
exec uvicorn app.main:socket_app --host 0.0.0.0 --reload --port 8000
