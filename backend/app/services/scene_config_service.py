from datetime import UTC, datetime
from typing import Any

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.characters import load as load_character
from app.config import SYSTEM_PROMPT
from app.db.database import async_session
from app.db.models import DBSceneConfig
from app.default_scene import default_scene_config, default_scene_config_id
from app.models.character import CharacterConfig, CharacterIdentity
from app.models.llm import LLMConfig
from app.models.scene import (
    Comment,
    CreateSceneConfig,
    SceneConfig,
    SceneConfigStatus,
)

logger = structlog.get_logger(__name__)


def _placeholder_identity(char_id: str) -> CharacterIdentity:
    """Identity used when a scene references a character no longer in the
    library and no fallback identity is available in the stored row.
    Keeps the scene rendering instead of 500-ing.
    """
    return CharacterIdentity(
        id=char_id,
        name=f"[unknown:{char_id}]",
        color="#888888",
        sprite_id="bob",
        role="(missing character — id not found in the library)",
        visual="(unknown character)",
        llm_config=LLMConfig(
            provider="openai",
            model_name="gpt-4o-mini",
            temperature=0.7,
            max_tokens=4096,
        ),
    )


def _slim_scene_for_storage(scene_config: SceneConfig | CreateSceneConfig) -> dict[str, Any]:
    """Serialize a SceneConfig (read shape) for the DB JSON column, dropping
    identity fields per character — the library is the source of truth.
    """
    payload = scene_config.model_dump()
    chars: dict[str, dict[str, Any]] = payload.get("characters_config", {}) or {}
    payload["characters_config"] = {
        cid: {
            "id": raw["id"],
            "initial_position": raw["initial_position"],
            "initial_direction": raw["initial_direction"],
            "initial_action": raw["initial_action"],
            "initial_mood": raw["initial_mood"],
        }
        for cid, raw in chars.items()
    }
    return payload


def _hydrate_character(char_id: str, raw: dict[str, Any]) -> CharacterConfig:
    """Merge a stored placement entry with the library identity. Tolerant of
    the legacy fat shape — if identity fields are still embedded in the row
    (pre-library DB rows), they're used as a last-resort fallback.
    """
    placement_keys = {"initial_position", "initial_direction", "initial_action", "initial_mood"}
    placement = {k: raw[k] for k in placement_keys if k in raw}

    try:
        identity = load_character(char_id)
    except KeyError:
        # Legacy fallback: old rows embed the identity directly. Try to
        # reconstruct from those before falling back to a placeholder.
        legacy_identity_keys = {"name", "color", "role", "visual", "llm_config"}
        if legacy_identity_keys.issubset(raw.keys()):
            return CharacterConfig.model_validate({**raw, "id": char_id})
        logger.warning("scene.character_missing_from_library", id=char_id)
        identity = _placeholder_identity(char_id)

    return CharacterConfig(**identity.model_dump(), **placement)


class SceneConfigService:
    """Service for scene config."""

    def __init__(self):
        pass

    def _convert_to_scene_config(self, db_config: DBSceneConfig) -> SceneConfig:
        """Convert a DBSceneConfig (storage shape, slim placements) into a
        SceneConfig (read shape, identities hydrated from the library).
        """
        db_config_raw: dict[str, Any] = dict(db_config.config)
        db_config_raw["id"] = db_config.id
        db_config_raw["system_prompt"] = db_config.system_prompt

        raw_chars: dict[str, dict[str, Any]] = db_config_raw.get("characters_config", {})
        db_config_raw["characters_config"] = {
            cid: _hydrate_character(cid, raw).model_dump() for cid, raw in raw_chars.items()
        }
        return SceneConfig.model_validate(db_config_raw)

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

    async def _get_by_id(self, scene_config_id: int, session: AsyncSession) -> DBSceneConfig | None:
        """Get a scene config by ID using select for update."""
        try:
            stmt = (
                select(DBSceneConfig).where(DBSceneConfig.id == scene_config_id).with_for_update()
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            raise Exception(f"Error getting scene config {scene_config_id}: {e!s}") from e

    async def get_by_id(self, scene_config_id: int) -> SceneConfig | None:
        """Get a scene config by ID."""
        async with async_session() as session:
            db_scene_config = await self._get_by_id(scene_config_id, session)
            if not db_scene_config:
                return None
        return self._convert_to_scene_config(db_scene_config)

    async def get_all(self) -> list[SceneConfig]:
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
            raise Exception(f"Error getting all scene configs: {e!s}") from e

    async def get_all_by_status(self, status: SceneConfigStatus) -> list[SceneConfig]:
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
            raise Exception(f"Error getting scene configs by status: {e!s}") from e

    async def get_highest_voted_scene_config(self) -> SceneConfig | None:
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
            raise Exception(f"Error getting highest voted scene config: {e!s}") from e

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
                db_scene_config.config = _slim_scene_for_storage(scene_config)
                await session.commit()
                return scene_config
        except Exception as e:
            raise Exception(
                f"Error incrementing votes for scene config {scene_config_id}: {e!s}"
            ) from e

    async def set_status(self, scene_config_id: int, status: SceneConfigStatus) -> SceneConfig:
        """Set the status of a scene config."""
        try:
            async with async_session() as session:
                db_scene_config = await self._get_by_id(scene_config_id, session)
                if not db_scene_config:
                    raise Exception(f"Scene config {scene_config_id} not found")

                scene_config = self._convert_to_scene_config(db_scene_config)
                scene_config.status = status
                db_scene_config.status = scene_config.status
                db_scene_config.config = _slim_scene_for_storage(scene_config)
                await session.commit()
                return scene_config
        except Exception as e:
            raise Exception(
                f"Error setting status for scene config {scene_config_id}: {e!s}"
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
                db_scene_config.config = _slim_scene_for_storage(scene_config)
                await session.commit()
                return scene_config
        except Exception as e:
            raise Exception(f"Error adding comment to scene config {scene_config_id}: {e!s}") from e

    async def get_default_scene_config(self) -> SceneConfig:
        """Get the default scene config."""
        db_default = await self.get_by_id(default_scene_config_id)
        if not db_default:
            db_default = await self.save_scene_config(
                default_scene_config,
            )
        return db_default

    async def get_proposals(self) -> list[SceneConfig]:
        """Get all proposed scene configs."""
        return await self.get_all_by_status(SceneConfigStatus.PROPOSED)

    async def create_scene_config_proposal(self, scene_config: CreateSceneConfig) -> SceneConfig:
        """Propose a new scene. Placement is required by the schema; the
        client is expected to position the characters before submitting.
        """
        scene_config.proposed_at = datetime.now(UTC).isoformat()
        scene_config.status = SceneConfigStatus.PROPOSED

        return await self.save_scene_config(scene_config)
