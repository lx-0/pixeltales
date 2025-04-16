import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import DBSceneStateSnapshot
from app.db.database import async_session
from app.models.scene import Scene, SceneConfig, SceneState

# Set up logger
logger = logging.getLogger(__name__)


class SceneStateSnapshotService:
    """Service for scene state snapshot."""

    def __init__(self):
        pass

    async def create_snapshot(self, state: SceneState) -> None:
        """Create a snapshot of the scene state."""
        try:
            async with async_session() as session:
                # Create new snapshot
                snapshot = DBSceneStateSnapshot(
                    state=state,
                )
                session.add(snapshot)
                await session.commit()
        except Exception as e:
            raise Exception(f"Error saving state snapshot: {str(e)}")

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
            raise Exception(f"Error loading latest state snapshot: {str(e)}")

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
