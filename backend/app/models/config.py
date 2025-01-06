from typing import List
from typing_extensions import Literal
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
    models: List[LLMModel]


class ColorOption(BaseModel):
    """Color option configuration."""

    id: str
    name: str
    hex: str
    group: str  # e.g., "gray", "brand", "accent"


class ConfigOptions(BaseModel):
    """Available configuration options."""

    llm_providers: List[LLMProvider]
    colors: List[ColorOption]
