import structlog
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.database import async_session
from app.db.models import DBSceneStateSnapshot
from app.models.scene import Scene, SceneConfig, SceneState

logger = structlog.get_logger(__name__)


class SceneStateSnapshotService:
    """Service for scene state snapshot."""

    def __init__(self):
        pass

    async def create_snapshot(self, state: SceneState) -> None:
        """Create a snapshot of the scene state. Also prunes anything older
        than `settings.SCENE_SNAPSHOT_RETENTION` rows for the same scene_id
        — only the latest snapshot is ever read, so older ones are dead
        weight that bloats the DB linearly with conversation length.
        """
        try:
            async with async_session() as session:
                snapshot = DBSceneStateSnapshot(
                    state=state,
                )
                session.add(snapshot)
                await session.commit()
                await self._prune_old(session, state.scene_id)
        except Exception as e:
            raise Exception(f"Error saving state snapshot: {e!s}") from e

    @staticmethod
    async def _prune_old(session, scene_id: int) -> None:
        """Delete all but the latest N snapshots for a given scene_id."""
        keep = settings.SCENE_SNAPSHOT_RETENTION
        if keep <= 0:
            return
        keep_ids_q = (
            select(DBSceneStateSnapshot.id)
            .where(DBSceneStateSnapshot.scene_id == scene_id)
            .order_by(DBSceneStateSnapshot.timestamp.desc())
            .limit(keep)
        )
        keep_ids = [row[0] for row in (await session.execute(keep_ids_q)).all()]
        if not keep_ids:
            return
        await session.execute(
            delete(DBSceneStateSnapshot)
            .where(DBSceneStateSnapshot.scene_id == scene_id)
            .where(DBSceneStateSnapshot.id.notin_(keep_ids))
        )
        await session.commit()

    async def _get_latest_snapshot(self) -> DBSceneStateSnapshot | None:
        """Get the latest snapshot of the scene state."""
        try:
            async with async_session() as session:
                # Query for latest state snapshot with eager loading of config
                query = (
                    select(DBSceneStateSnapshot)
                    .options(selectinload(DBSceneStateSnapshot.config))
                    .order_by(DBSceneStateSnapshot.timestamp.desc())
                    .limit(1)
                )
                result = await session.execute(query)
                return result.scalar_one_or_none()

        except Exception as e:
            raise Exception(f"Error loading latest state snapshot: {e!s}") from e

    async def get_latest_snapshot(self) -> Scene | None:
        """Get the latest snapshot of the scene state."""
        snapshot = await self._get_latest_snapshot()
        if not snapshot:
            return None
        return Scene(
            id=snapshot.scene_id,
            config=SceneConfig.model_validate(snapshot.config.config),
            state=SceneState.model_validate(snapshot.state),
        )
