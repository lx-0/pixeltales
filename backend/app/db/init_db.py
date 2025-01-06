import asyncio
import logging
import os
import re

from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy import text

from app.db.database import engine, Base
from app.db.models import DBScene, DBSceneConfig, DBSceneStateSnapshot
from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)


def sanitize_db_url(url: str) -> str:
    """Sanitize database URL by removing sensitive information."""
    if not url:
        return ""

    # For PostgreSQL URLs
    if url.startswith("postgresql"):
        # Replace password in format postgresql://user:password@host:port/db
        sanitized = re.sub(
            r"(postgresql(?:\+\w+)?:\/\/[^:]+:)[^@]+(@.*)", r"\1*****\2", url
        )
    # For SQLite URLs
    else:
        # Just return the SQLite URL as it doesn't contain sensitive info
        sanitized = url

    return sanitized


async def init_db(db_engine: AsyncEngine, drop_schema: bool = False) -> None:
    """Initialize database tables."""
    try:
        logger.info(f"Database type: {settings.DB_TYPE}")
        logger.info(f"Database URL: {sanitize_db_url(settings.database_url)}")

        # Initialize SQLite-specific variables
        db_path = None
        if settings.DB_TYPE == "sqlite":
            # Extract database path from URL
            db_path = settings.SQLITE_URL.replace("sqlite+aiosqlite:///", "")
            db_dir = os.path.dirname(db_path)

            logger.info(f"SQLite database path: {db_path}")
            logger.info(f"SQLite database directory: {db_dir}")

            # Check directory existence and permissions
            if not os.path.exists(db_dir):
                logger.info(f"Creating SQLite directory: {db_dir}")
                os.makedirs(db_dir, exist_ok=True)

            # Log directory permissions and ownership
            dir_stat = os.stat(db_dir)
            logger.info(f"Directory permissions: {oct(dir_stat.st_mode)[-3:]}")
            logger.info(f"Directory owner: {dir_stat.st_uid}")
            logger.info(f"Current process uid: {os.getuid()}")

        async with db_engine.begin() as conn:
            if settings.DB_TYPE == "postgresql":
                logger.info("Initializing PostgreSQL database...")
                logger.info(f"Schema: {settings.POSTGRES_SCHEMA}")

                # Only drop schema if explicitly requested
                if drop_schema:
                    logger.info("Dropping existing schema (drop_schema=True)")
                    await conn.execute(
                        text(
                            f"DROP SCHEMA IF EXISTS {settings.POSTGRES_SCHEMA} CASCADE"
                        )
                    )
                    logger.info(f"Dropped schema: {settings.POSTGRES_SCHEMA}")

                # Create schema if it doesn't exist
                await conn.execute(
                    text(f"CREATE SCHEMA IF NOT EXISTS {settings.POSTGRES_SCHEMA}")
                )
                logger.info(
                    f"Created schema (if not exists): {settings.POSTGRES_SCHEMA}"
                )

                # Set search path
                await conn.execute(
                    text(f"SET search_path TO {settings.POSTGRES_SCHEMA}")
                )
                logger.info(f"Set search path to: {settings.POSTGRES_SCHEMA}")

            # Create tables
            logger.info("Creating database tables...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Created tables:")
            logger.info(f"- {DBScene.__tablename__}")
            logger.info(f"- {DBSceneConfig.__tablename__}")
            logger.info(f"- {DBSceneStateSnapshot.__tablename__}")

            if settings.DB_TYPE == "sqlite" and db_path:
                # Log SQLite database file information if it exists
                if os.path.exists(db_path):
                    db_stat = os.stat(db_path)
                    logger.info(
                        f"Database file permissions: {oct(db_stat.st_mode)[-3:]}"
                    )
                    logger.info(f"Database file owner: {db_stat.st_uid}")
                else:
                    logger.warning(f"Database file not found after creation: {db_path}")

    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: {str(e)}")
        raise


async def main() -> None:
    """Main function to initialize database."""
    try:
        import argparse

        parser = argparse.ArgumentParser()
        parser.add_argument(
            "--drop-schema",
            action="store_true",
            help="Drop existing schema before creation (PostgreSQL only)",
        )
        args = parser.parse_args()

        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s | %(levelname)s | %(message)s",
            datefmt="%H:%M:%S",
        )

        logger.info(f"Starting database initialization... (type: {settings.DB_TYPE})")
        await init_db(engine, drop_schema=args.drop_schema)
        logger.info("Database initialization completed successfully!")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
