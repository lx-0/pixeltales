"""Boundary models reject unknown keys.

Pydantic's default is `extra="ignore"` — typos in YAML / JSON payloads get
silently dropped. For models on read/write boundaries (library YAML, API
write shapes, message storage) we set `extra="forbid"` so typos fail loud.

These tests pin the policy so a future model-cleanup that drops
`ConfigDict(extra="forbid")` doesn't quietly weaken the boundary.
"""

import pytest
from pydantic import ValidationError

from app.models.base import Position
from app.models.character import CharacterIdentity, CharacterPlacement
from app.models.conversation import Message
from app.models.llm import LLMConfig
from app.models.scene import Comment, CreateSceneConfig


def _llm_payload() -> dict:
    return {
        "provider": "openai",
        "model_name": "gpt-4o-mini",
        "max_tokens": 100,
        "temperature": 0.7,
    }


def _identity_payload() -> dict:
    return {
        "id": "alice",
        "name": "Alice",
        "color": "#aabbcc",
        "role": "A test character that exists for boundary tests.",
        "visual": "A character used in the unit tests for validation.",
        "sprite_id": "bob",
        "llm_config": _llm_payload(),
    }


def _placement_payload() -> dict:
    return {
        "id": "alice",
        "initial_position": {"x": 0, "y": 0},
        "initial_direction": "right",
        "initial_action": "idle",
        "initial_mood": "neutral",
    }


def _scene_create_payload() -> dict:
    return {
        "name": "Test Scene",
        "description": "A test scene with at least ten characters of description.",
        "start_character_id": "alice",
        "characters_config": {"alice": _placement_payload()},
        "room_id": "room",
    }


class TestExtraForbidBoundaries:
    def test_position_rejects_unknown(self):
        with pytest.raises(ValidationError, match="z"):
            Position.model_validate({"x": 0, "y": 0, "z": 0})

    def test_llm_config_rejects_unknown(self):
        payload = _llm_payload() | {"top_p": 0.9}
        with pytest.raises(ValidationError, match="top_p"):
            LLMConfig.model_validate(payload)

    def test_character_identity_rejects_unknown(self):
        payload = _identity_payload() | {"voice_id": "xyz"}
        with pytest.raises(ValidationError, match="voice_id"):
            CharacterIdentity.model_validate(payload)

    def test_character_placement_rejects_unknown(self):
        payload = _placement_payload() | {"name": "smuggled-identity"}
        with pytest.raises(ValidationError, match="name"):
            CharacterPlacement.model_validate(payload)

    def test_create_scene_config_rejects_unknown(self):
        payload = _scene_create_payload() | {"system_prompt": "leaks-from-read-shape"}
        with pytest.raises(ValidationError, match="system_prompt"):
            CreateSceneConfig.model_validate(payload)

    def test_comment_rejects_unknown(self):
        with pytest.raises(ValidationError, match="moderated"):
            Comment.model_validate(
                {
                    "user": "alice",
                    "comment": "looks good",
                    "timestamp": "2026-04-24T12:00:00",
                    "moderated": False,
                }
            )

    def test_message_rejects_unknown(self):
        payload = {
            "character": "alice",
            "content": "hi",
            "recipient": "bob",
            "thoughts": "just saying hi",
            "mood": "neutral",
            "mood_emoji": "🙂",
            "timestamp": "2026-04-24T12:00:00",
            "unix_timestamp": 0.0,
            "calculated_speaking_time": 1.0,
            "end_conversation": False,
            "tone": "friendly",  # extra
        }
        with pytest.raises(ValidationError, match="tone"):
            Message.model_validate(payload)

    def test_happy_paths_still_work(self):
        # Sanity: forbidding unknown keys must not break valid payloads.
        Position.model_validate({"x": 0, "y": 0})
        LLMConfig.model_validate(_llm_payload())
        CharacterIdentity.model_validate(_identity_payload())
        CharacterPlacement.model_validate(_placement_payload())
        CreateSceneConfig.model_validate(_scene_create_payload())
