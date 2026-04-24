from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.models.character import CharacterConfig, CharacterPlacement, CharacterState
from app.models.conversation import Message


class SceneConfigStatus(StrEnum):
    """Scene config status enum."""

    PROPOSED = "proposed"
    ACTIVE = "active"
    REJECTED = "rejected"


class Comment(BaseModel):
    """Comment on a scene proposal."""

    model_config = ConfigDict(extra="forbid")

    user: str
    comment: str
    timestamp: str  # ISO format datetime


def empty_comment_list() -> list[Comment]:
    """Return an empty list of comments."""
    return []


class SceneConfigCommon(BaseModel):
    """Scene configuration fields shared between read and write shapes."""

    name: str = Field(
        min_length=3,
        max_length=50,
        description="Scene name (3-50 characters)",
        json_schema_extra={"examples": ["Coffee Shop Chat", "Park Meeting"]},
    )
    description: str = Field(
        min_length=10,
        max_length=5000,
        description="Scene description (10-5000 characters)",
        json_schema_extra={
            "examples": ["Two friends meet at a coffee shop and discuss their dreams..."]
        },
    )
    start_character_id: str = Field(
        description="ID of the character who starts the conversation",
        json_schema_extra={"examples": ["bob", "alice"]},
    )
    room_id: str = Field(
        default="room",
        description="ID of a room background from the backend asset catalog (GET /api/v1/config).",
        json_schema_extra={"examples": ["room", "the-lab", "the-lab-w-docs"]},
    )
    status: SceneConfigStatus = Field(
        default=SceneConfigStatus.PROPOSED,
        description="Current status of the scene configuration (proposed, active, or rejected)",
    )

    # Proposal-specific fields
    proposer_name: str | None = Field(
        None,
        min_length=2,
        max_length=50,
        description="Name of the person proposing the scene (2-50 characters)",
        json_schema_extra={"examples": ["John Doe", "Jane Smith"]},
    )
    proposed_at: str | None = Field(
        None, description="ISO format datetime when the scene was proposed"
    )
    votes: int | None = Field(
        default=0, description="Number of votes the scene proposal has received"
    )
    comments: list[Comment] | None = Field(
        default_factory=empty_comment_list,
        description="List of comments on the scene proposal",
    )


class CreateSceneConfig(SceneConfigCommon):
    """Scene config WRITE shape: clients send placement-only entries.
    Character identity (name, color, role, visual, llm_config, sprite_id)
    must already exist in the library — POST /api/v1/characters to add a
    new one before proposing a scene that uses it.

    Strict on unknown keys: API write boundary, typos should fail loud.
    """

    model_config = ConfigDict(extra="forbid")

    characters_config: dict[str, CharacterPlacement] = Field(
        description="Per-character placement (id, initial_position/direction/action/mood). "
        "Identity is looked up from the library by id at render time."
    )


class SceneConfig(SceneConfigCommon):
    """Scene config READ shape: characters are returned fully hydrated
    (placement merged with library identity) so the frontend can render
    without a separate library round-trip per character.
    """

    id: int
    characters_config: dict[str, CharacterConfig] = Field(
        description="Each entry merges the per-scene placement with the library "
        "identity (name, color, role, visual, llm_config, sprite_id)."
    )
    system_prompt: str = Field(
        min_length=10,
        max_length=1000,
        description="System prompt that sets the context and rules (10-1000 characters)",
        json_schema_extra={"examples": ["You are in a cozy coffee shop on a rainy afternoon..."]},
    )


class SceneState(BaseModel):
    """State of the scene."""

    scene_id: int
    scene_config_id: int
    characters: dict[str, CharacterState]
    messages: list[Message]
    started_at: float  # Unix timestamp (Epoch time)
    conversation_active: bool
    conversation_ended: bool
    ended_at: float | None = None  # Unix timestamp (Epoch time)
    visitor_count: int  # number of current visitors in the scene


class Scene(BaseModel):
    """Scene."""

    id: int
    config: SceneConfig
    state: SceneState
