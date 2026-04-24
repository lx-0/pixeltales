"""Shared pytest fixtures.

DB fixtures: each test gets a fresh in-memory SQLite database. The
production `async_session` is monkey-patched in every importing module
(not just database.py) because `from … import async_session` captures a
reference per module.

Object fixtures: see tests/fixtures.py. Re-exported here so pytest
discovers them without import gymnastics.
"""

from collections.abc import AsyncGenerator
from typing import Any

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import database
from app.db.database import Base
from tests.fixtures import (  # noqa: F401  (re-exported for pytest discovery)
    alice_config,
    alice_identity,
    bob_config,
    bob_identity,
    doctor_1_identity,
    mock_llm_manager,
    scene,
    scene_config,
    three_character_scene,
)


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
        "app.harness.scene_config_loader",
        "app.harness.scene_loader",
        "app.world.persistence.snapshots",
    ):
        import importlib

        mod = importlib.import_module(module_path)
        if hasattr(mod, "async_session"):
            monkeypatch.setattr(mod, "async_session", factory)
    return factory
