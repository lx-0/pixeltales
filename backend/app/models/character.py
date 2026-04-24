from typing import Literal

from pydantic import BaseModel, Field

from app.models.base import Direction, Position
from app.models.llm import LLMConfig


class CharacterBase(BaseModel):
    """Base class for a character."""

    id: str = Field(
        min_length=1,
        max_length=50,
        description="Unique identifier for the character",
        json_schema_extra={"examples": ["bob", "alice"]},
    )
    name: str = Field(
        min_length=2,
        max_length=50,
        description="Character's display name (2-50 characters)",
        json_schema_extra={"examples": ["Bob", "Alice"]},
    )
    color: str = Field(
        pattern="^#[0-9a-fA-F]{6}$",
        description="Character's color in hex format (e.g., #FF0000)",
        json_schema_extra={"examples": ["#FF0000", "#00FF00"]},
    )
    role: str = Field(
        min_length=10,
        max_length=5000,
        description="Character's role and personality description (10-5000 characters)",
        json_schema_extra={"examples": ["A friendly shopkeeper who loves to tell stories..."]},
    )
    visual: str = Field(
        min_length=10,
        max_length=500,
        description="Character's visual appearance description (10-500 characters)",
        json_schema_extra={"examples": ["A tall person with short brown hair and glasses..."]},
    )
    llm_config: LLMConfig = Field(description="Configuration for the character's language model")


CharacterAction = Literal[
    "thinking",
    "thinking:love",
    "thinking:anger",
    "thinking:sadness",
    "thinking:surprise",
    "thinking:fear",
    "speaking",
    "idle",
]


class CharacterConfig(CharacterBase):
    """Configuration for a character."""

    sprite_id: str = Field(
        default="bob",
        description="ID of a sprite from the backend asset catalog (GET /api/v1/config).",
        json_schema_extra={"examples": ["bob", "cleaner_girl", "doctor_1", "zombie"]},
    )
    initial_position: Position
    initial_direction: Direction
    initial_action: CharacterAction
    initial_mood: str


class CharacterState(BaseModel):
    """Runtime state for a character — the static identity (name, color, role,
    visual, llm_config, sprite_id) lives in the matching CharacterConfig
    inside SceneConfig. Frontend joins by character id.
    """

    id: str = Field(
        min_length=1,
        max_length=50,
        description="Character id; matches a key in SceneConfig.characters_config",
        json_schema_extra={"examples": ["bob", "alice"]},
    )
    position: Position
    direction: Direction
    current_mood: str = "neutral"  # Free-form mood description
    action: CharacterAction
    action_started_at: float  # Unix timestamp (Epoch time)
    action_estimated_duration: float | None = None  # seconds
    end_conversation_requested: bool = False
    end_conversation_requested_at: float | None = None  # Unix timestamp (Epoch time)
    end_conversation_requested_validity_duration: float | None = None  # seconds
