# PixelTales Backend

FastAPI-based backend service with SQLite persistence and WebSocket support for real-time character interactions.

## 🚦 Setup

1. Install dependencies:

```bash
poetry install
```

2. Create `.env` file:

```bash
cp .env.example .env
# Edit .env with your settings
```

3. Initialize the database:

```bash
# Make sure you're in the backend directory
cd backend  # if not already there
poetry run python -m app.db.init_db
```

## 🚀 Development

Start the development server:

```bash
# Make sure you're in the backend directory
cd backend  # if not already there
poetry run uvicorn app.main:socket_app --reload --port 8000
```

## 💾 Database

The application uses SQLite for data persistence. The database file will be created at `pixeltales.db` in the project root directory (one level up from the backend directory).

### 📊 Database Schema

- **scene_configs**: Stores scene configurations
    - id: Primary key
    - created_at: Timestamp when config was created
    - config: JSON field containing complete scene config

- **scene_state_snapshots**: Stores scene state history
    - id: Primary key
    - timestamp: When the snapshot was taken
    - state: JSON field containing complete scene state
    - config_id: Foreign key to scene_configs

### 🔄 Reinitialize Database

If you need to reset the database:
1. Delete the `pixeltales.db` file from the project root directory
2. Run the initialization script again:

```bash
cd backend  # make sure you're in the backend directory
poetry run python -m app.db.init_db
```

### 🔧 Troubleshooting

If you get "no such table" errors:
1. Check if `pixeltales.db` exists in the project root directory (not in the backend directory)
2. If the file exists but you still get errors, try reinitializing the database
3. Make sure you're running all commands from the backend directory
