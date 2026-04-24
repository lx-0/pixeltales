from typing import Literal

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

    # Character library — runtime data dir for user-proposed characters.
    # Container mounts /data/characters; local dev defaults to data/characters
    # relative to backend/. The seed library at app/characters/ is always
    # scanned in addition to this dir.
    CHARACTERS_DATA_DIR: str = "data/characters"

    # Scene state snapshot retention. Only `_get_latest_snapshot()` is read,
    # so older snapshots are dead weight; we keep a small recent window for
    # debugging. Each new snapshot prunes anything beyond the latest N for
    # its scene_id. 0 disables pruning entirely (not recommended in prod).
    SCENE_SNAPSHOT_RETENTION: int = 10

    # PostgreSQL settings
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: str | None = None
    POSTGRES_HOST: str | None = None
    POSTGRES_PORT: str | None = None
    POSTGRES_DB: str | None = None
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
    BACKEND_CORS_ORIGINS: list[str] = []

    @property
    def cors_origins(self) -> list[str]:
        """Get the CORS origins based on environment and ports."""
        if self.BACKEND_CORS_ORIGINS:
            return self.BACKEND_CORS_ORIGINS

        # Default origins based on environment
        if self.ENV == "development":
            return [f"http://localhost:{self.FRONTEND_PORT}"]
        else:
            return [f"http://localhost:{self.FRONTEND_PORT}", "http://localhost:80"]

    # LLMs
    DEFAULT_MODEL: str = "gpt-4o-mini"

    # LiteLLM gateway (OpenAI-compatible). When set, every provider call
    # routes through the gateway instead of the upstream API directly.
    # Lets us centralize keys, rate limits, and usage tracking.
    LITELLM_BASE_URL: str | None = None
    LITELLM_API_KEY: SecretStr | None = None

    # OpenAI
    OPENAI_API_KEY: SecretStr | None = None

    # Anthropic
    ANTHROPIC_API_KEY: SecretStr | None = None

    @property
    def use_gateway(self) -> bool:
        return bool(self.LITELLM_BASE_URL and self.LITELLM_API_KEY)


settings = Settings()
