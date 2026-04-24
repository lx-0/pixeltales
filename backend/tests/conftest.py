"""Shared pytest fixtures.

Each test gets a fresh in-memory SQLite database, schema applied via
SQLAlchemy create_all (faster than alembic for tests). The production
async_session is monkey-patched to point at the test engine.
"""

from collections.abc import AsyncGenerator
from typing import Any

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import database
from app.db.database import Base


@pytest.fixture
async def test_engine() -> AsyncGenerator[Any, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def session_factory(test_engine: Any, monkeypatch: pytest.MonkeyPatch) -> Any:
    """Override async_session everywhere it was imported by-reference.

    `from app.db.database import async_session` binds a local name in each
    importing module, so patching `database.async_session` alone is not enough.
    """
    factory = async_sessionmaker(test_engine, expire_on_commit=False)
    monkeypatch.setattr(database, "async_session", factory)
    for module_path in (
        "app.services.scene_config_service",
        "app.services.scene_service",
        "app.services.scene_state_snapshot_service",
    ):
        import importlib

        mod = importlib.import_module(module_path)
        if hasattr(mod, "async_session"):
            monkeypatch.setattr(mod, "async_session", factory)
    return factory
