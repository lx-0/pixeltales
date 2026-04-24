from app.config import TILE_SIZE
from app.models.base import Position
from app.models.character import CharacterPlacement
from app.models.scene import (
    CreateSceneConfig,
    SceneConfigStatus,
)


def _place(
    char_id: str,
    *,
    position: Position,
    direction: str,
) -> CharacterPlacement:
    return CharacterPlacement(
        id=char_id,
        initial_position=position,
        initial_direction=direction,  # type: ignore[arg-type]
        initial_action="idle",
        initial_mood="neutral",
    )


# Scene composes library characters by id; identity (claude, chatgpt) lives
# under app/characters/{claude,chatgpt}/.
characters: dict[str, CharacterPlacement] = {
    "claude": _place(
        "claude",
        position=Position(x=TILE_SIZE * 7.5, y=TILE_SIZE * 7.5),
        direction="right",
    ),
    "chatgpt": _place(
        "chatgpt",
        position=Position(x=TILE_SIZE * 9.5, y=TILE_SIZE * 7.5),
        direction="front",
    ),
}

default_scene_config_id = 1
default_scene_config = CreateSceneConfig(
    name="The Construct",
    description="You are in 'The Construct' - a virtual work space to run simulations like in the movie 'The Matrix'. You have a meeting to discuss the branding of the new endeavor of Sid and Alex with one of your colleagues. You both have knowledge about a conversation with Alex. Each of you has a different perspective on the topic and had a different conversation with Alex. You will discuss the topic given to you with the other character in the scene until you come to an agreement. Please start the conversation as you would in a real meeting. Be critical (this is a very important decision), ask questions, and be open to the other character's perspective. Also discuss the topic is a systematic way as brand experts would do it. Then, discuss alternatives. Also discuss other aspects of the brand, such as visuals and language (but not limited to that). Do not limit ideas to what was discussed with Alex but keep his values and ideas in mind. So please also come up with fresh ideas. At the end, summarize your agreement and the conversation.",
    start_character_id="claude",
    characters_config=characters,
    room_id="room",
    status=SceneConfigStatus.ACTIVE,
    proposer_name=None,
    proposed_at=None,
)
