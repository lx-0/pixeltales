from typing import Optional, Literal
from pydantic import BaseModel, Field

from app.models.llm import LLMConfig
from app.models.base import Direction, Position


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
        max_length=1000,
        description="Character's role and personality description (10-1000 characters)",
        json_schema_extra={
            "examples": ["A friendly shopkeeper who loves to tell stories..."]
        },
    )
    visual: str = Field(
        min_length=10,
        max_length=500,
        description="Character's visual appearance description (10-500 characters)",
        json_schema_extra={
            "examples": ["A tall person with short brown hair and glasses..."]
        },
    )
    llm_config: LLMConfig = Field(
        description="Configuration for the character's language model"
    )


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

    initial_position: Position
    initial_direction: Direction
    initial_action: CharacterAction
    initial_mood: str


class CharacterState(CharacterBase):
    """A character in the scene."""

    position: Position
    direction: Direction
    current_mood: str = "neutral"  # Free-form mood description
    action: CharacterAction
    action_started_at: float  # Unix timestamp (Epoch time)
    action_estimated_duration: Optional[float] = None  # seconds
    end_conversation_requested: bool = False
    end_conversation_requested_at: Optional[float] = None  # Unix timestamp (Epoch time)
    end_conversation_requested_validity_duration: Optional[float] = None  # seconds
