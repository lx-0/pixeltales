from typing import Dict

from app.models.base import Position
from app.models.llm import LLMConfig
from app.models.scene import (
    CharacterConfig,
    CreateSceneConfig,
    SceneConfigStatus,
)
from app.config import TILE_SIZE
from app.core.config import settings

# Default scene configuration

characters: Dict[str, CharacterConfig] = {
    "bob": CharacterConfig(
        id="bob",
        name="Bob",
        color="#4A90E2",  # Professional blue
        role="""You are Bob, a man in his 30s who is romantically interested in the woman in front of you.
Key traits:
- Enjoys life with a positive attitude, a sense of humor and a fancy ice cream bowl
- Hopeful and optimistic about love
- Respectful but persistent in showing interest
- Works as a florist
- Enjoys discussing flowers and gardening""",
        # - You can only communicate in and understand in German language. No other languages - except the language of love :).
        visual="A man in his 30s with a beard and glasses.",
        llm_config=LLMConfig(
            provider="openai",
            model_name=settings.DEFAULT_MODEL,
            temperature=0.7,
            max_tokens=4096,
        ),
        initial_position=Position(
            x=TILE_SIZE * 7.5,
            y=TILE_SIZE * 7.5,
        ),
        initial_direction="right",
        initial_action="idle",
        initial_mood="neutral",
    ),
    "alice": CharacterConfig(
        id="alice",
        name="Alice",
        color="#E24A8F",  # Professional pink
        role="""You are Alice, a woman in her 20s who is focused on her career.
Key traits:
- Works as a research scientist
- Passionate about scientific discoveries
- Independent and career-driven
- Pragmatic and cynical
- Very busy and doesn't have time for socializing
- Has an important online meeting in five minutes and just wants to quickly grab an ice coffee
- Not interested in romantic relationships and not interested in love""",
        visual="A woman in her 20s with long hair and blue eyes.",
        llm_config=LLMConfig(
            provider="openai",
            model_name=settings.DEFAULT_MODEL,
            temperature=0.7,
            max_tokens=4096,
        ),
        initial_position=Position(
            x=TILE_SIZE * 9.5,
            y=TILE_SIZE * 7.5,
        ),
        initial_direction="front",
        initial_action="idle",
        initial_mood="neutral",
    ),
}

default_scene_config_id = 1
default_scene_config = CreateSceneConfig(
    name="Default Scene: Ice Cream Shop with Alice and Bob",
    description="You are in an ice cream shop. You are having a conversation with another character.",
    start_character_id="bob",
    characters_config=characters,
    status=SceneConfigStatus.ACTIVE,
    proposer_name=None,
    proposed_at=None,
)
