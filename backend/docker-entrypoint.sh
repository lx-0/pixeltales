#!/bin/sh
set -e

echo "Current working directory: $(pwd)"
echo "Listing /data directory:"
ls -la /data
echo "Listing /data/sqlite directory:"
ls -la /data/sqlite || true

# Change to the workspace directory where our code is mounted
cd /workspace
echo "Changed to workspace directory: $(pwd)"

# Function to check if tables exist in SQLite database
check_sqlite_tables() {
    db_path="$1"
    echo "Checking SQLite database at: $db_path"

    if [ -f "$db_path" ]; then
        echo "Database file exists"
        echo "File permissions: $(ls -l "$db_path")"
        echo "File size: $(stat -f %z "$db_path" || stat -c %s "$db_path")"

        echo "Attempting to query tables..."
        # Capture both stdout and stderr
        output=$(sqlite3 "$db_path" "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;" 2>&1)
        exit_code=$?

        echo "SQLite query exit code: $exit_code"
        if [ $exit_code -eq 0 ]; then
            if [ -n "$output" ]; then
                echo "Found tables in database"
                echo "First table found: $output"
                return 0  # Tables exist
            else
                echo "No tables found in database"
                return 1
            fi
        else
            echo "Error executing SQLite query: $output"
            return 1
        fi
    else
        echo "Database file does not exist at: $db_path"
    fi
    return 1  # No tables or database doesn't exist
}

# Function to check if tables exist in PostgreSQL schema
check_postgres_tables() {
    echo "Checking PostgreSQL tables..."
    echo "Host: $POSTGRES_HOST"
    echo "Port: $POSTGRES_PORT"
    echo "User: $POSTGRES_USER"
    echo "Database: $POSTGRES_DB"
    echo "Schema: $POSTGRES_SCHEMA"

    # First test the connection
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "Error: Could not connect to PostgreSQL"
        return 1
    fi
    echo "PostgreSQL connection successful"

    # Then check for tables in schema
    local query="SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = '$POSTGRES_SCHEMA' LIMIT 1);"
    echo "Executing query: $query"

    local result
    result=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "$query" 2>&1)
    local exit_code=$?

    echo "Query result: '$result'"
    echo "Query exit code: $exit_code"

    if [ $exit_code -ne 0 ]; then
        echo "Error executing query"
        return 1
    fi

    [ "$result" = "t" ]
    return $?
}

if [ "$DB_TYPE" = "sqlite" ]; then
    echo "SQLite database URL: $SQLITE_URL"

    # Extract database path from URL
    DB_PATH=$(echo "$SQLITE_URL" | sed -e 's|sqlite+aiosqlite:///||')
    echo "Extracted database path: $DB_PATH"
    DB_DIR=$(dirname "$DB_PATH")
    echo "Extracted directory path: $DB_DIR"

    # Create SQLite directory if it doesn't exist
    mkdir -p "$DB_DIR"
    echo "Created/verified SQLite directory: $DB_DIR"
    echo "Directory contents:"
    ls -la "$DB_DIR"

    if ! check_sqlite_tables "$DB_PATH"; then
        echo "Database not found or empty, initializing..."
        PYTHONPATH=/workspace poetry run python -m app.db.init_db
    else
        echo "Database exists with tables, skipping initialization"
    fi
elif [ "$DB_TYPE" = "postgresql" ]; then
    echo "PostgreSQL database selected, checking schema..."

    if ! check_postgres_tables; then
        echo "Schema not found or empty, initializing..."
        if [ "$ENV" = "development" ]; then
            echo "Development environment, initializing schema with drop..."
            PYTHONPATH=/workspace poetry run python -m app.db.init_db --drop-schema
        else
            echo "Production environment, initializing schema..."
            PYTHONPATH=/workspace poetry run python -m app.db.init_db
        fi
    else
        echo "Schema exists with tables, skipping initialization"
    fi
else
    echo "Error: Unknown database type: $DB_TYPE"
    exit 1
fi

# Start the application
exec poetry run uvicorn app.main:socket_app --host 0.0.0.0 --reload --port 8000