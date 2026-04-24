from typing import Literal

from pydantic import BaseModel


class LLMModel(BaseModel):
    """LLM model configuration."""

    id: str
    name: str
    max_tokens: int  # max completion tokens
    default_temperature: float = 0.7  # default temperature (0.0-2.0, default 0.7)
    description: str | None = None  # Model description


class LLMProvider(BaseModel):
    """LLM provider configuration."""

    id: Literal["openai", "anthropic"]
    name: str
    models: list[LLMModel]


class ColorOption(BaseModel):
    """Color option configuration."""

    id: str
    name: str
    hex: str
    group: str  # e.g., "gray", "brand", "accent"


class SpriteOption(BaseModel):
    """Character sprite asset option."""

    id: str
    name: str
    path: str  # public URL relative to frontend (e.g. /assets/characters/Bob_idle_anim_48x48.png)
    has_idle_anim: bool  # true → 6-frame idle spritesheet; false → single 48x48 still


class RoomOption(BaseModel):
    """Room background asset option."""

    id: str
    name: str
    path: str  # public URL relative to frontend (e.g. /assets/scenes/room.png)


class ConfigOptions(BaseModel):
    """Available configuration options."""

    llm_providers: list[LLMProvider]
    colors: list[ColorOption]
    sprites: list[SpriteOption]
    rooms: list[RoomOption]
