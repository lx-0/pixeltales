from app.characters import load as load_character
from app.config import TILE_SIZE
from app.models.base import Position
from app.models.character import CharacterConfig, CharacterIdentity
from app.models.scene import (
    CreateSceneConfig,
    SceneConfigStatus,
)


def _place(
    identity: CharacterIdentity,
    *,
    position: Position,
    direction: str,
) -> CharacterConfig:
    """Combine a library identity with scene-specific placement."""
    return CharacterConfig(
        **identity.model_dump(),
        initial_position=position,
        initial_direction=direction,  # type: ignore[arg-type]
        initial_action="idle",
        initial_mood="neutral",
    )


# Library identities (role / personality / sprite / llm) live on disk in
# app/characters/<id>/. Scene-specific placement (where they stand, which
# way they face) is composed here.
characters: dict[str, CharacterConfig] = {
    "bob": _place(
        load_character("bob"),
        position=Position(x=TILE_SIZE * 7.5, y=TILE_SIZE * 7.5),
        direction="right",
    ),
    "alice": _place(
        load_character("alice"),
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
