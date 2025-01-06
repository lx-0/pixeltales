import logging
from typing import AsyncGenerator, Dict, Any

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.schema import CreateSchema

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

# Configure engine args based on database type
engine_args: Dict[str, Any] = {
    "echo": False,  # Set to True for SQL query logging
}

if settings.DB_TYPE == "postgresql":
    # PostgreSQL-specific settings for Supabase
    engine_args.update(
        {
            "pool_pre_ping": True,
            "pool_size": 20,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "connect_args": {
                "server_settings": {"search_path": settings.POSTGRES_SCHEMA}
            },
        }
    )

# Create async engine using settings
logger.info(f"Creating database engine with URL: {settings.database_url}")
engine = create_async_engine(
    settings.database_url,
    **engine_args,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass


# Dependency to get DB session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


# Function to initialize database schema for PostgreSQL
async def init_schema() -> None:
    """Initialize PostgreSQL schema if needed."""
    if settings.DB_TYPE == "postgresql":
        try:
            async with engine.begin() as conn:
                await conn.execute(
                    CreateSchema(settings.POSTGRES_SCHEMA, if_not_exists=True)
                )
                logger.info(f"Created schema: {settings.POSTGRES_SCHEMA}")
        except Exception as e:
            logger.error(f"Error creating schema: {e}")
            raise
