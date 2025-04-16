import logging
import time
from typing import Dict

from app.db.database import async_session
from app.db.models import DBScene
from app.models.character import CharacterConfig, CharacterState
from app.models.scene import Scene, SceneConfig, SceneState

# Set up logger
logger = logging.getLogger(__name__)


class SceneService:
    """Service for scenes."""

    def __init__(self):
        pass

    def _initialize_characters_state(
        self, characters_config: Dict[str, CharacterConfig], started_at: float
    ) -> Dict[str, CharacterState]:
        """Initialize characters from `characters` dict with more detailed context"""
        return {
            char_id: CharacterState(
                id=char_config.id,
                name=char_config.name,
                color=char_config.color,
                role=char_config.role,
                visual=char_config.visual,
                llm_config=char_config.llm_config,
                position=char_config.initial_position,
                direction=char_config.initial_direction,
                action=char_config.initial_action,
                action_started_at=started_at,
                current_mood=char_config.initial_mood,
            )
            for char_id, char_config in characters_config.items()
        }

    def _initialize_scene_state(
        self, scene_id: int, scene_config: SceneConfig, visitor_count: int = 0
    ) -> SceneState:
        """Initialize the scene."""
        logger.info("Initializing scene")
        started_at = time.time()
        return SceneState(
            scene_id=scene_id,
            scene_config_id=scene_config.id,
            characters=self._initialize_characters_state(
                scene_config.characters_config, started_at
            ),
            messages=[],
            started_at=started_at,
            conversation_active=visitor_count > 0,
            conversation_ended=False,
            visitor_count=visitor_count,
        )  # Initial State

    async def create_scene(
        self, scene_config: SceneConfig, current_visitor_count: int
    ) -> Scene:
        """Create a new scene."""
        try:
            async with async_session() as session:
                # Create new scene record
                db_scene = DBScene(
                    config_id=scene_config.id,
                )
                session.add(db_scene)
                await session.commit()
                await session.refresh(db_scene)

                scene = Scene(
                    id=db_scene.id,
                    config=scene_config,
                    state=self._initialize_scene_state(
                        db_scene.id, scene_config, current_visitor_count
                    ),
                )

                return scene
        except Exception as e:
            logger.error(f"Error saving scene: {e}")
            raise e
