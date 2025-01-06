from typing import Dict, List, Optional, Literal
from enum import Enum

from pydantic import BaseModel, Field


Direction = Literal["front", "right", "left", "back"]


class Position(BaseModel):
    """A position in the scene."""

    x: float
    y: float


class Message(BaseModel):
    """A message in the conversation."""

    character: str  # message sender
    content: Optional[str] = None
    recipient: str  # sender's free-form label for the recipient
    thoughts: str
    mood: str  # Free-form mood description
    mood_emoji: str  # Matching emoji for the mood
    reaction_on_previous_message: Optional[str] = None
    timestamp: str  # ISO format datetime
    unix_timestamp: float  # Unix timestamp (Epoch time)
    calculated_speaking_time: float  # seconds
    conversation_rating: Optional[int] = None
    end_conversation: bool


class LLMConfig(BaseModel):
    """LLM configuration for the character."""

    provider: Literal["openai", "anthropic"] = Field(
        description="The LLM provider (openai or anthropic)"
    )
    model_name: str = Field(
        min_length=1,
        max_length=50,
        description="The name of the model to use",
        json_schema_extra={"examples": ["gpt-4o-mini", "claude-3-5-sonnet-20241022"]},
    )
    max_tokens: int = Field(
        gt=0, le=32000, description="Maximum number of tokens to generate (1-32000)"
    )
    temperature: float = Field(
        ge=0.0,
        le=2.0,
        description="Temperature controls randomness (0.0-2.0, default 0.7)",
    )


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


class SceneBase(BaseModel):
    """Base class for the scene."""

    _ = None


class SceneStatus(str, Enum):
    """Scene status enum."""

    PROPOSED = "proposed"
    ACTIVE = "active"
    REJECTED = "rejected"


class Comment(BaseModel):
    """Comment on a scene proposal."""

    user: str
    comment: str
    timestamp: str  # ISO format datetime


def empty_comment_list() -> List[Comment]:
    """Return an empty list of comments."""
    return []


class SceneConfigBase(SceneBase):
    """Base scene configuration with common fields."""

    name: str = Field(
        min_length=3,
        max_length=50,
        description="Scene name (3-50 characters)",
        json_schema_extra={"examples": ["Coffee Shop Chat", "Park Meeting"]},
    )
    description: str = Field(
        min_length=10,
        max_length=500,
        description="Scene description (10-500 characters)",
        json_schema_extra={
            "examples": [
                "Two friends meet at a coffee shop and discuss their dreams..."
            ]
        },
    )
    start_character_id: str = Field(
        description="ID of the character who starts the conversation",
        json_schema_extra={"examples": ["bob", "alice"]},
    )
    characters_config: Dict[str, CharacterConfig] = Field(
        description="Configuration for each character in the scene, keyed by character ID"
    )
    status: SceneStatus = Field(
        default=SceneStatus.PROPOSED,
        description="Current status of the scene (proposed, active, or rejected)",
    )

    # Proposal-specific fields
    proposer_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=50,
        description="Name of the person proposing the scene (2-50 characters)",
        json_schema_extra={"examples": ["John Doe", "Jane Smith"]},
    )
    proposed_at: Optional[str] = Field(
        None, description="ISO format datetime when the scene was proposed"
    )
    votes: Optional[int] = Field(
        default=0, description="Number of votes the scene proposal has received"
    )
    comments: Optional[List[Comment]] = Field(
        default_factory=empty_comment_list,
        description="List of comments on the scene proposal",
    )


class CreateSceneConfig(SceneConfigBase):
    """Scene configuration for creation without ID."""

    pass


class SceneConfig(SceneConfigBase):
    """Scene configuration."""

    id: int
    system_prompt: str = Field(
        min_length=10,
        max_length=1000,
        description="System prompt that sets the context and rules (10-1000 characters)",
        json_schema_extra={
            "examples": ["You are in a cozy coffee shop on a rainy afternoon..."]
        },
    )


class SceneState(SceneBase):
    """State of the scene."""

    scene_id: int
    scene_config_id: int
    characters: Dict[str, CharacterState]
    messages: List[Message]
    started_at: float  # Unix timestamp (Epoch time)
    conversation_active: bool
    conversation_ended: bool
    ended_at: Optional[float] = None  # Unix timestamp (Epoch time)
    visitor_count: int  # number of current visitors in the scene


class Scene(BaseModel):
    """Scene."""

    id: int
    config: SceneConfig
    state: SceneState
