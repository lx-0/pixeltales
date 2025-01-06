# Installation Guide

This guide will help you set up PixelTales on your local machine for development and testing purposes.

## Prerequisites

- Docker and Docker Compose (recommended)
- Python 3.11+ (for manual installation)
- Node.js 18+ (for manual installation)
- OpenAI API key

## Quick Start with Docker (Recommended)

1. **Clone the Repository**

   ```bash
   git clone https://github.com/lx-0/pixeltales.git
   cd pixeltales
   ```

2. **Set Up Environment**

   ```bash
   cp .env.example .env.development
   ```

3. **Configure Environment**
   Edit `.env.development` and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your-api-key-here
   ```

4. **Start the Application**

   ```bash
   docker compose up
   ```

   The database will be automatically initialized on first startup.

5. **Access the Application**
   - Frontend: <http://localhost:5173>
   - Backend: <http://localhost:8000>
   - API Documentation: <http://localhost:8000/docs>

## Manual Installation

### Backend Setup

1. **Navigate to Backend Directory**

   ```bash
   cd backend
   ```

2. **Install Poetry**

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. **Install Dependencies**

   ```bash
   poetry install
   ```

4. **Configure Environment**

   ```bash
   cp .env.example .env.development
   # Edit .env.development with your settings
   ```

5. **Initialize Database**

   ```bash
   # Create SQLite directory
   mkdir -p data/sqlite

   # Initialize database
   poetry run python -m app.db.init_db
   ```

6. **Start the Backend Server**

   ```bash
   poetry run uvicorn app.main:socket_app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to Frontend Directory**

   ```bash
   cd frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start the Development Server**

   ```bash
   npm run dev
   ```

## Production Deployment

1. **Configure Production Environment**

   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production settings
   ```

2. **Start Production Services**

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

## Environment Variables

### Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key

### Optional Variables

- `FRONTEND_PORT`: Frontend port (default: 5173)
- `BACKEND_PORT`: Backend port (default: 8000)
- `DB_TYPE`: Database type (sqlite/postgresql)
- `SQLITE_URL`: SQLite database URL
- `POSTGRES_*`: PostgreSQL configuration (if using PostgreSQL)

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if both frontend and backend are running
   - Verify CORS settings in `.env` file
   - Ensure ports are not blocked by firewall

2. **Database Connection Issues**
   - Verify database configuration in `.env` file
   - Check database file permissions
   - Ensure database service is running
   - For manual setup, make sure you've run the initialization script

3. **Docker Issues**
   - Run `docker compose down -v` to clean up volumes
   - Check Docker logs: `docker compose logs -f`
   - Verify Docker daemon is running

For more help, [open an issue](https://github.com/lx-0/pixeltales/issues).
