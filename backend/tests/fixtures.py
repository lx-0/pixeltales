"""Shared object fixtures for Harness / ConversationManager tests.

Hand-constructs a minimal valid Scene with two seed characters from the
real library so tests exercise the same load path production uses.
"""

from unittest.mock import AsyncMock

import pytest

from app.agent.characters import load as load_character
from app.agent.llm import CharacterResponse, LLMManager
from app.models.base import Position
from app.models.character import (
    CharacterConfig,
    CharacterIdentity,
    CharacterPlacement,
    CharacterState,
)
from app.models.conversation import Message
from app.models.scene import Scene, SceneConfig, SceneConfigStatus, SceneState


def _placement_for(identity: CharacterIdentity) -> CharacterPlacement:
    """Trivial placement at origin — tests don't care about positions."""
    return CharacterPlacement(
        id=identity.id,
        initial_position=Position(x=0, y=0),
        initial_direction="right",
        initial_action="idle",
        initial_mood="neutral",
    )


def _config_from(identity: CharacterIdentity) -> CharacterConfig:
    """Read-shape CharacterConfig: identity merged with a trivial placement."""
    return CharacterConfig(
        **identity.model_dump(),
        initial_position=Position(x=0, y=0),
        initial_direction="right",
        initial_action="idle",
        initial_mood="neutral",
    )


def _state_for(identity: CharacterIdentity) -> CharacterState:
    return CharacterState(
        id=identity.id,
        position=Position(x=0, y=0),
        direction="right",
        current_mood="neutral",
        action="idle",
        action_started_at=0.0,
        action_estimated_duration=None,
        end_conversation_requested=False,
        end_conversation_requested_at=None,
        end_conversation_requested_validity_duration=None,
    )


@pytest.fixture
def alice_identity() -> CharacterIdentity:
    return load_character("alice")


@pytest.fixture
def bob_identity() -> CharacterIdentity:
    return load_character("bob")


@pytest.fixture
def alice_config(alice_identity: CharacterIdentity) -> CharacterConfig:
    return _config_from(alice_identity)


@pytest.fixture
def bob_config(bob_identity: CharacterIdentity) -> CharacterConfig:
    return _config_from(bob_identity)


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
    alice_identity: CharacterIdentity,
    bob_identity: CharacterIdentity,
) -> Scene:
    state = SceneState(
        scene_id=1,
        scene_config_id=1,
        characters={
            "alice": _state_for(alice_identity),
            "bob": _state_for(bob_identity),
        },
        messages=[],
        started_at=0.0,
        conversation_active=True,
        conversation_ended=False,
        visitor_count=0,
    )
    return Scene(id=1, config=scene_config, state=state)


@pytest.fixture
def doctor_1_identity() -> CharacterIdentity:
    return load_character("doctor_1")


@pytest.fixture
def three_character_scene(
    alice_identity: CharacterIdentity,
    bob_identity: CharacterIdentity,
    doctor_1_identity: CharacterIdentity,
) -> Scene:
    """3-NPC scene for multi-NPC turn-taking tests."""
    config = SceneConfig(
        id=2,
        name="Three Character Test Scene",
        description="Three friends chatting in a test environment for at least ten chars.",
        system_prompt="You are {character_name}. Role: {character_role}",
        start_character_id="alice",
        characters_config={
            "alice": _config_from(alice_identity),
            "bob": _config_from(bob_identity),
            "doctor_1": _config_from(doctor_1_identity),
        },
        status=SceneConfigStatus.ACTIVE,
    )
    state = SceneState(
        scene_id=2,
        scene_config_id=2,
        characters={
            "alice": _state_for(alice_identity),
            "bob": _state_for(bob_identity),
            "doctor_1": _state_for(doctor_1_identity),
        },
        messages=[],
        started_at=0.0,
        conversation_active=True,
        conversation_ended=False,
        visitor_count=0,
    )
    return Scene(id=2, config=config, state=state)


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
