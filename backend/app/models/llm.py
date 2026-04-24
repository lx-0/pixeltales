from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LLMConfig(BaseModel):
    """LLM configuration for the character."""

    # Immutable + hashable; reject unknown keys so YAML / JSON typos surface.
    model_config = ConfigDict(frozen=True, extra="forbid")

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
