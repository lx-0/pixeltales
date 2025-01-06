from typing import Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field

from app.models.character import CharacterConfig, CharacterState
from app.models.conversation import Message

# # Pydantic validation debugging
# BaseModel.model_config = ConfigDict(
#     validation_error_cause=True, extra="forbid", str_strip_whitespace=True
# )


class SceneBase(BaseModel):
    """Base class for the scene."""

    _ = None


class SceneConfigStatus(str, Enum):
    """Scene config status enum."""

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
    status: SceneConfigStatus = Field(
        default=SceneConfigStatus.PROPOSED,
        description="Current status of the scene configuration (proposed, active, or rejected)",
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
