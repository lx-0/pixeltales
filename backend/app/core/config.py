from typing import List, Optional
from typing_extensions import Literal
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    PROJECT_NAME: str = "PixelTales"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENV: Literal["development", "production"] = "development"

    # Database
    DB_TYPE: Literal["sqlite", "postgresql"] = "sqlite"  # "sqlite" or "postgresql"
    SQLITE_URL: str = "sqlite+aiosqlite:///data/sqlite/pixeltales.db"

    # PostgreSQL settings
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None
    POSTGRES_PORT: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    POSTGRES_SCHEMA: str = "pixeltales"

    @property
    def database_url(self) -> str:
        """Get the database URL."""
        if self.DB_TYPE == "sqlite":
            return self.SQLITE_URL
        elif self.DB_TYPE == "postgresql":
            # For Supabase, use the pooler connection string format
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        raise ValueError(f"Unsupported database type: {self.DB_TYPE}")

    # Port settings
    FRONTEND_PORT: str = "5173"  # Default development port
    BACKEND_PORT: str = "8000"  # Default backend port

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    @property
    def cors_origins(self) -> List[str]:
        """Get the CORS origins based on environment and ports."""
        if self.BACKEND_CORS_ORIGINS:
            return self.BACKEND_CORS_ORIGINS

        # Default origins based on environment
        if self.ENV == "development":
            return [f"http://localhost:{self.FRONTEND_PORT}"]
        else:
            return [f"http://localhost:{self.FRONTEND_PORT}", f"http://localhost:80"]

    # LLMs
    DEFAULT_MODEL: str = "gpt-4o-mini"

    # OpenAI
    OPENAI_API_KEY: Optional[SecretStr] = None

    # Anthropic
    ANTHROPIC_API_KEY: Optional[SecretStr] = None


settings = Settings()
