import logging
from typing import List, Optional
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import SYSTEM_PROMPT, TILE_SIZE
from app.db.models import DBSceneConfig
from app.db.database import async_session
from app.models.base import Position
from app.models.scene import (
    Comment,
    CreateSceneConfig,
    SceneConfig,
    SceneConfigStatus,
)
from app.default_scene import default_scene_config, default_scene_config_id

# Set up logger
logger = logging.getLogger(__name__)


class SceneConfigService:
    """Service for scene config."""

    def __init__(self):
        pass

    def _convert_to_scene_config(self, db_config: DBSceneConfig) -> SceneConfig:
        """Convert a DBSceneConfig to a SceneConfig."""
        db_config_raw = db_config.config
        db_config_raw["id"] = (
            db_config.id
        )  # Patch id since it's not in the config json after insert
        db_config_raw["system_prompt"] = (
            db_config.system_prompt
        )  # Patch `system_prompt`
        scene_config = SceneConfig.model_validate(db_config_raw)
        return scene_config

    async def save_scene_config(self, scene_config: CreateSceneConfig) -> SceneConfig:
        """Save the current scene config to the database."""
        try:
            async with async_session() as session:
                # Create new config record
                db_config = DBSceneConfig(
                    config=scene_config,
                    system_prompt=SYSTEM_PROMPT,
                )
                session.add(db_config)
                await session.commit()
                await session.refresh(db_config)
                return self._convert_to_scene_config(db_config)
        except Exception as e:
            logger.error(f"Error saving scene config: {e}")
            raise e

    async def _get_by_id(
        self, scene_config_id: int, session: AsyncSession
    ) -> Optional[DBSceneConfig]:
        """Get a scene config by ID using select for update."""
        try:
            stmt = (
                select(DBSceneConfig)
                .where(DBSceneConfig.id == scene_config_id)
                .with_for_update()
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            raise Exception(
                f"Error getting scene config {scene_config_id}: {str(e)}"
            ) from e

    async def get_by_id(self, scene_config_id: int) -> Optional[SceneConfig]:
        """Get a scene config by ID."""
        async with async_session() as session:
            db_scene_config = await self._get_by_id(scene_config_id, session)
            if not db_scene_config:
                return None
        return self._convert_to_scene_config(db_scene_config)

    async def get_all(self) -> List[SceneConfig]:
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(DBSceneConfig).order_by(DBSceneConfig.created_at.asc())
                )
                db_scene_configs = result.scalars().all()
                return [
                    self._convert_to_scene_config(db_scene_config)
                    for db_scene_config in db_scene_configs
                ]
        except Exception as e:
            raise Exception(f"Error getting all scene configs: {str(e)}") from e

    async def get_all_by_status(self, status: SceneConfigStatus) -> List[SceneConfig]:
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(DBSceneConfig)
                    .where(DBSceneConfig.status == status)
                    .order_by(DBSceneConfig.created_at.asc())
                )
                db_scene_configs = result.scalars().all()
                return [
                    self._convert_to_scene_config(db_scene_config)
                    for db_scene_config in db_scene_configs
                ]
        except Exception as e:
            raise Exception(f"Error getting scene configs by status: {str(e)}") from e

    async def get_highest_voted_scene_config(self) -> Optional[SceneConfig]:
        """Get the highest voted scene config."""
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(DBSceneConfig)
                    .where(DBSceneConfig.status == SceneConfigStatus.PROPOSED)
                    .order_by(DBSceneConfig.votes.desc())
                )
                db_scene_config = result.scalar_one_or_none()
                if db_scene_config:
                    return self._convert_to_scene_config(db_scene_config)
            return None
        except Exception as e:
            raise Exception(
                f"Error getting highest voted scene config: {str(e)}"
            ) from e

    async def increment_votes(self, scene_config_id: int, vote: int) -> SceneConfig:
        """Increment the votes for a scene config."""
        try:
            async with async_session() as session:
                db_scene_config = await self._get_by_id(scene_config_id, session)
                if not db_scene_config:
                    raise Exception(f"Scene config {scene_config_id} not found")

                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.votes = (scene_config.votes or 0) + vote
                db_scene_config.votes = scene_config.votes
                db_scene_config.config = scene_config.model_dump()
                await session.commit()
                return scene_config
        except Exception as e:
            raise Exception(
                f"Error incrementing votes for scene config {scene_config_id}: {str(e)}"
            ) from e

    async def set_status(
        self, scene_config_id: int, status: SceneConfigStatus
    ) -> SceneConfig:
        """Set the status of a scene config."""
        try:
            async with async_session() as session:
                db_scene_config = await self._get_by_id(scene_config_id, session)
                if not db_scene_config:
                    raise Exception(f"Scene config {scene_config_id} not found")

                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.status = status
                db_scene_config.status = scene_config.status
                db_scene_config.config = scene_config.model_dump()
                await session.commit()
                return scene_config
        except Exception as e:
            raise Exception(
                f"Error setting status for scene config {scene_config_id}: {str(e)}"
            ) from e

    async def activate_proposal(self, scene_config_id: int) -> SceneConfig:
        """Activate a proposed scene config."""
        return await self.set_status(scene_config_id, SceneConfigStatus.ACTIVE)

    async def reject_proposal(self, scene_config_id: int) -> SceneConfig:
        """Reject a proposed scene config."""
        return await self.set_status(scene_config_id, SceneConfigStatus.REJECTED)

    async def add_comment_on_proposal(
        self, scene_config_id: int, user: str, comment: str
    ) -> SceneConfig:
        """Add a comment to a proposed scene config."""
        try:
            async with async_session() as session:
                db_scene_config = await self._get_by_id(scene_config_id, session)
                if not db_scene_config:
                    raise Exception(f"Scene config {scene_config_id} not found")

                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.comments = scene_config.comments or []
                scene_config.comments.append(
                    Comment(
                        user=user,
                        comment=comment,
                        timestamp=datetime.now(UTC).isoformat(),
                    )
                )
                db_scene_config.config = scene_config.model_dump()
                await session.commit()
                return scene_config
        except Exception as e:
            raise Exception(
                f"Error adding comment to scene config {scene_config_id}: {str(e)}"
            ) from e

    async def get_default_scene_config(self) -> SceneConfig:
        """Get the default scene config."""
        db_default = await self.get_by_id(default_scene_config_id)
        if not db_default:
            db_default = await self.save_scene_config(
                default_scene_config,
            )
        return db_default

    async def get_proposals(self) -> List[SceneConfig]:
        """Get all proposed scene configs."""
        return await self.get_all_by_status(SceneConfigStatus.PROPOSED)

    async def create_scene_config_proposal(
        self, scene_config: CreateSceneConfig
    ) -> SceneConfig:
        """Propose a new scene."""
        # Set default positions for characters if not provided
        for i, (_, char) in enumerate(scene_config.characters_config.items()):
            if not char.initial_position:
                # Default to a line formation
                char.initial_position = Position(
                    x=TILE_SIZE
                    * (7.5 + i),  # Start at x=7.5 tiles, increment by 1 tile
                    y=TILE_SIZE * 7.5,  # Center vertically
                )

        scene_config.proposed_at = datetime.now(UTC).isoformat()
        scene_config.status = SceneConfigStatus.PROPOSED

        # Save to database
        return await self.save_scene_config(scene_config)
