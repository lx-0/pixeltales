"""Shared object fixtures for SceneManager / ConversationManager tests.

Hand-constructs a minimal valid Scene with two characters so tests don't
need DB access to exercise tick logic.
"""

from unittest.mock import AsyncMock

import pytest

from app.models.base import Position
from app.models.character import CharacterConfig, CharacterState
from app.models.conversation import Message
from app.models.llm import LLMConfig
from app.models.scene import Scene, SceneConfig, SceneConfigStatus, SceneState
from app.services.llm_manager import CharacterResponse, LLMManager


def _make_char_config(cid: str, name: str, color: str) -> CharacterConfig:
    return CharacterConfig(
        id=cid,
        name=name,
        color=color,
        role="A friendly test character that likes to chat with other characters.",
        visual="A tall person with short brown hair and glasses for testing",
        llm_config=LLMConfig(
            provider="openai",
            model_name="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1000,
        ),
        initial_position=Position(x=0, y=0),
        initial_direction="right",
        initial_action="idle",
        initial_mood="neutral",
    )


def _make_char_state(cfg: CharacterConfig) -> CharacterState:
    return CharacterState(
        id=cfg.id,
        name=cfg.name,
        color=cfg.color,
        role=cfg.role,
        visual=cfg.visual,
        llm_config=cfg.llm_config,
        position=cfg.initial_position,
        direction=cfg.initial_direction,
        current_mood=cfg.initial_mood,
        action=cfg.initial_action,
        action_started_at=0.0,
        action_estimated_duration=None,
        end_conversation_requested=False,
        end_conversation_requested_at=None,
        end_conversation_requested_validity_duration=None,
    )


@pytest.fixture
def alice_config() -> CharacterConfig:
    return _make_char_config("alice", "Alice", "#ff0000")


@pytest.fixture
def bob_config() -> CharacterConfig:
    return _make_char_config("bob", "Bob", "#00ff00")


@pytest.fixture
def scene_config(alice_config: CharacterConfig, bob_config: CharacterConfig) -> SceneConfig:
    return SceneConfig(
        id=1,
        name="Test Scene",
        description="Two friends chatting in a test environment for at least ten chars.",
        system_prompt="You are {character_name}. Role: {character_role}",
        start_character_id="alice",
        characters_config={"alice": alice_config, "bob": bob_config},
        status=SceneConfigStatus.ACTIVE,
    )


@pytest.fixture
def scene(
    scene_config: SceneConfig,
    alice_config: CharacterConfig,
    bob_config: CharacterConfig,
) -> Scene:
    state = SceneState(
        scene_id=1,
        scene_config_id=1,
        characters={
            "alice": _make_char_state(alice_config),
            "bob": _make_char_state(bob_config),
        },
        messages=[],
        started_at=0.0,
        conversation_active=True,
        conversation_ended=False,
        visitor_count=0,
    )
    return Scene(id=1, config=scene_config, state=state)


@pytest.fixture
def mock_llm_manager() -> LLMManager:
    """LLMManager whose generate_response is a pre-canned CharacterResponse."""
    m = LLMManager()
    m.generate_response = AsyncMock(  # type: ignore[method-assign]
        return_value=CharacterResponse(
            recipient="bob",
            reaction_on_previous_message=None,
            conversation_rating=7,
            mood="curious",
            mood_emoji="🙂",
            thoughts="I wonder what Bob thinks about this.",
            content="Hello, Bob! How are you today?",
            end_conversation=False,
        )
    )
    return m


def make_message(character: str, content: str, unix_ts: float = 0.0) -> Message:
    """Build a minimal valid Message for tests."""
    return Message(
        character=character,
        content=content,
        recipient="",
        thoughts="",
        mood="neutral",
        mood_emoji="😐",
        reaction_on_previous_message=None,
        timestamp="2026-01-01T00:00:00",
        unix_timestamp=unix_ts,
        calculated_speaking_time=5.0,
        conversation_rating=None,
        end_conversation=False,
    )
