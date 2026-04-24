from app.config import TILE_SIZE
from app.models.base import Direction, Position
from app.models.character import CharacterPlacement
from app.models.scene import (
    CreateSceneConfig,
    SceneConfigStatus,
)


def _place(
    char_id: str,
    *,
    position: Position,
    direction: Direction,
) -> CharacterPlacement:
    return CharacterPlacement(
        id=char_id,
        initial_position=position,
        initial_direction=direction,
        initial_action="idle",
        initial_mood="neutral",
    )


# Identity (role / personality / sprite / llm) lives in app/agent/characters/<id>/.
# Default scene just places library characters by id.
characters: dict[str, CharacterPlacement] = {
    "bob": _place(
        "bob",
        position=Position(x=TILE_SIZE * 7.5, y=TILE_SIZE * 7.5),
        direction="right",
    ),
    "alice": _place(
        "alice",
        position=Position(x=TILE_SIZE * 9.5, y=TILE_SIZE * 7.5),
        direction="front",
    ),
}

default_scene_config_id = 1
default_scene_config = CreateSceneConfig(
    name="Default Scene: Ice Cream Shop with Alice and Bob",
    description="You are in an ice cream shop. You are having a conversation with another character.",
    start_character_id="bob",
    characters_config=characters,
    room_id="room",
    status=SceneConfigStatus.ACTIVE,
    proposer_name=None,
    proposed_at=None,
)
