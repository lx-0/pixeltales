from typing import List, Optional
from datetime import datetime, UTC

from sqlalchemy import select

from app.config import SYSTEM_PROMPT, TILE_SIZE
from app.db.models import DBSceneConfig
from app.db.database import async_session
from app.models.scene import (
    SceneConfig,
    CreateSceneConfig,
    SceneStatus,
    Position,
    Comment,
)
from app.default_scene import default_scene_config, default_scene_config_id

import logging

# Set up logger
logger = logging.getLogger(__name__)


class SceneConfigManager:
    """Manages scene config."""

    async def _save_scene_config(self, scene_config: CreateSceneConfig) -> SceneConfig:
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

    async def propose_scene(self, scene_config: CreateSceneConfig) -> SceneConfig:
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
        scene_config.status = SceneStatus.PROPOSED

        # Save to database
        scene = await self._save_scene_config(scene_config)
        return scene

    async def get_default_scene_config(self) -> SceneConfig:
        """Get the default scene config."""
        db_default = await self.get_scene_config(default_scene_config_id)
        if not db_default:
            db_default = await self._save_scene_config(
                default_scene_config,
            )
        return db_default

    async def get_scene_config(self, scene_config_id: int) -> Optional[SceneConfig]:
        """Get a scene config by ID."""
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(DBSceneConfig).where(DBSceneConfig.id == scene_config_id)
                )
                db_scene_config = result.scalar_one_or_none()
                if db_scene_config:
                    return self._convert_to_scene_config(db_scene_config)
            return None
        except Exception as e:
            logger.error(f"Error getting scene config {scene_config_id}: {str(e)}")
            raise

    async def get_highest_voted_scene_config(self) -> Optional[SceneConfig]:
        """Get the highest voted scene config."""
        try:
            async with async_session() as session:
                result = await session.execute(
                    select(DBSceneConfig)
                    .where(DBSceneConfig.status == SceneStatus.PROPOSED)
                    .order_by(DBSceneConfig.votes.desc())
                )
                db_scene_config = result.scalar_one_or_none()
                if db_scene_config:
                    return self._convert_to_scene_config(db_scene_config)
            return None
        except Exception as e:
            logger.error(f"Error getting highest voted scene config: {str(e)}")
            raise

    async def get_proposals(
        self, status: SceneStatus | None = None
    ) -> List[SceneConfig]:
        """Get all proposed scenes."""
        async with async_session() as session:
            query = select(DBSceneConfig).order_by(DBSceneConfig.created_at.desc())
            # if status:
            #     query = query.where(DBSceneConfig.status == status)
            result = await session.execute(query)
            db_scene_config_list = result.scalars().all()
            # Filter out scenes that are not the same status as the requested status
            scenes = [
                self._convert_to_scene_config(db_scene_config)
                for db_scene_config in db_scene_config_list
                if status is None or db_scene_config.status == status
            ]
            return scenes

    async def vote_proposal(self, scene_id: int, vote: int) -> Optional[SceneConfig]:
        """Vote on a proposed scene."""
        async with async_session() as session:
            result = await session.execute(
                select(DBSceneConfig).where(DBSceneConfig.id == scene_id)
            )
            db_scene_config = result.scalar_one_or_none()
            if db_scene_config:
                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.votes = (scene_config.votes or 0) + vote
                db_scene_config.votes = scene_config.votes
                db_scene_config.config = scene_config.model_dump()
                await session.commit()
                return scene_config
        return None

    async def activate_proposal(self, scene_id: int) -> Optional[SceneConfig]:
        """Activate a proposed scene."""
        async with async_session() as session:
            result = await session.execute(
                select(DBSceneConfig).where(DBSceneConfig.id == scene_id)
            )
            db_scene_config = result.scalar_one_or_none()
            if db_scene_config:
                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.status = SceneStatus.ACTIVE
                db_scene_config.status = scene_config.status
                db_scene_config.config = scene_config.model_dump()
                await session.commit()
                return scene_config
        return None

    async def reject_proposal(self, scene_id: int) -> Optional[SceneConfig]:
        """Reject a proposed scene."""
        async with async_session() as session:
            result = await session.execute(
                select(DBSceneConfig).where(DBSceneConfig.id == scene_id)
            )
            db_scene_config = result.scalar_one_or_none()
            if db_scene_config:
                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.status = SceneStatus.REJECTED
                db_scene_config.status = scene_config.status
                db_scene_config.config = scene_config.model_dump()
                await session.commit()
                return scene_config
        return None

    async def add_comment_on_proposal(
        self, scene_id: int, user: str, comment: str
    ) -> Optional[SceneConfig]:
        """Add a comment to a proposed scene."""
        async with async_session() as session:
            result = await session.execute(
                select(DBSceneConfig).where(DBSceneConfig.id == scene_id)
            )
            db_scene_config = result.scalar_one_or_none()
            if db_scene_config:
                scene_config = self._convert_to_scene_config(db_scene_config)
                if not scene_config.comments:
                    scene_config.comments = []
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
        return None
