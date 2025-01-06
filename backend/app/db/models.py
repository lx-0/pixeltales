from datetime import UTC, datetime
import time
from typing import Any, cast

from sqlalchemy import ForeignKey, event, Update, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship, Mapper
from sqlalchemy.engine.base import Connection
from sqlalchemy.types import JSON, Float, Integer, String

from app.config import SYSTEM_PROMPT
from app.db.database import Base
from app.core.config import settings
from app.models.scene import CreateSceneConfig, SceneState, SceneConfigStatus


class DBSceneConfig(Base):
    """Model for storing scene configurations."""

    __tablename__ = "scene_configs"
    __table_args__ = (
        {"schema": settings.POSTGRES_SCHEMA}
        if settings.DB_TYPE == "postgresql"
        else None
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[float] = mapped_column(Float, index=True)  # unix timestamp
    config: Mapped[dict[str, Any]] = mapped_column(JSON)  # Complete SceneConfig as JSON
    votes: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[SceneConfigStatus] = mapped_column(
        String, default=SceneConfigStatus.PROPOSED
    )
    system_prompt: Mapped[str] = mapped_column(String, default="")
    # Relationship to scene with cascade delete
    scenes: Mapped[list["DBScene"]] = relationship(
        back_populates="config", cascade="all, delete-orphan"
    )

    # Relationship to snapshots with cascade delete
    snapshots: Mapped[list["DBSceneStateSnapshot"]] = relationship(
        back_populates="config", cascade="all, delete-orphan"
    )

    def __init__(
        self,
        config: CreateSceneConfig,
        created_at: float = datetime.now(UTC).timestamp(),
        system_prompt: str = SYSTEM_PROMPT,
    ):
        super().__init__()
        self.config = config.model_dump()
        self.config["system_prompt"] = system_prompt
        self.system_prompt = system_prompt
        self.votes = config.votes or 0
        self.status = config.status
        self.created_at = created_at


# Event listener to sync ID to config after insert
@event.listens_for(DBSceneConfig, "after_insert")
def receive_after_insert(
    mapper: Mapper[Any], connection: Connection, target: DBSceneConfig
) -> None:
    """After a DBSceneConfig is inserted, sync its ID to the config dict."""
    target.config["id"] = target.id
    # Get the table object and cast it to Table type
    table = cast(Table, mapper.local_table)
    # Update the config column in the database using type-safe Update
    stmt = Update(table).where(table.c.id == target.id).values(config=target.config)
    connection.execute(stmt)


class DBScene(Base):
    """Model for storing scenes."""

    __tablename__ = "scenes"
    __table_args__ = (
        {"schema": settings.POSTGRES_SCHEMA}
        if settings.DB_TYPE == "postgresql"
        else None
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[float] = mapped_column(Float, index=True)  # unix timestamp
    config_id: Mapped[int] = mapped_column(
        ForeignKey(
            (
                f"{settings.POSTGRES_SCHEMA}.scene_configs.id"
                if settings.DB_TYPE == "postgresql"
                else "scene_configs.id"
            ),
            ondelete="CASCADE",
        )
    )

    # Relationship to config
    config: Mapped[DBSceneConfig] = relationship(back_populates="scenes")

    # Relationship to snapshots with cascade delete
    snapshots: Mapped[list["DBSceneStateSnapshot"]] = relationship(
        back_populates="scene", cascade="all, delete-orphan"
    )

    def __init__(self, config_id: int, created_at: float | None = None):
        super().__init__()
        self.config_id = config_id
        self.created_at = created_at or datetime.now(UTC).timestamp()


class DBSceneStateSnapshot(Base):
    """Model for storing scene state snapshots."""

    __tablename__ = "scene_state_snapshots"
    __table_args__ = (
        {"schema": settings.POSTGRES_SCHEMA}
        if settings.DB_TYPE == "postgresql"
        else None
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[float] = mapped_column(Float, index=True)  # unix timestamp
    state: Mapped[dict[str, Any]] = mapped_column(JSON)  # Complete SceneState as JSON
    scene_id: Mapped[int] = mapped_column(
        ForeignKey(
            (
                f"{settings.POSTGRES_SCHEMA}.scenes.id"
                if settings.DB_TYPE == "postgresql"
                else "scenes.id"
            ),
            ondelete="CASCADE",
        )
    )
    config_id: Mapped[int] = mapped_column(
        ForeignKey(
            (
                f"{settings.POSTGRES_SCHEMA}.scene_configs.id"
                if settings.DB_TYPE == "postgresql"
                else "scene_configs.id"
            ),
            ondelete="CASCADE",
        )
    )

    # Relationship to config
    config: Mapped[DBSceneConfig] = relationship(back_populates="snapshots")

    # Relationship to scene
    scene: Mapped[DBScene] = relationship(back_populates="snapshots")

    def __init__(self, state: SceneState, timestamp: float | None = None):
        super().__init__()
        self.state = state.model_dump()
        self.timestamp = timestamp or time.time()
        self.config_id = state.scene_config_id
        self.scene_id = state.scene_id
