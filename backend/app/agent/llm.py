from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings

from app.agent.characters import load as load_character
from app.agent.skills import Skill, load_skill
from app.core.config import settings
from app.core.metrics import llm_response_seconds
from app.models.llm import LLMConfig
from app.models.scene import SceneConfig


# Character response schema
class CharacterResponse(BaseModel):
    """Structure for character response"""

    recipient: str = Field(description="The recipient of the message")
    reaction_on_previous_message: str | None = Field(
        description="A single unicode emoji that best represents your reaction on the previous message. Formatting instructions: Use unicode emoji."
    )
    conversation_rating: int | None = Field(
        description="How would you rate the conversation until now, from 1 to 10? You can use this to emphasize your feelings about the conversation."
    )
    mood: str = Field(
        description="A descriptive word or short phrase for your current emotional state"
    )
    mood_emoji: str = Field(
        description="A single unicode emoji that best represents your mood. Formatting instructions: Use unicode emoji."
    )
    thoughts: str = Field(
        description="Your thoughts about the conversation. Formatting instructions: To express your mood in the thoughts, use casual formatting style, including casual CAPS for emphasis, dramatic punctuation, but ABSOLUTELY NO emojis!"
    )
    content: str | None = Field(
        description="Your spoken response. Formatting instructions: To express your mood in the spoken response, use casual formatting style, including casual CAPS for emphasis, dramatic punctuation, but ABSOLUTELY NO emojis!"
    )
    end_conversation: bool = Field(description="Your response ends the conversation")


# Type aliases
SystemPromptTemplateVars = dict[str, str]


class LLMManager:
    """LLM manager backed by pydantic-ai.

    One Agent per character (no LLMConfig dedup — skills differ per character,
    and 2-7 Agent instances per scene is trivial memory). The system prompt
    template is per-scene; instructions are formatted with the per-call vars
    and passed to agent.run() each turn. Per-character skills loaded from
    `app/agent/skills/` are registered as PydanticAI tools at agent build time.
    """

    def __init__(self) -> None:
        self.agents: dict[str, Agent[None, CharacterResponse]] | None = None
        self.character_configs: dict[str, LLMConfig] | None = None
        self.system_prompt_template: str | None = None

    def init_scene(self, scene_config: SceneConfig) -> None:
        """Initialize one Agent per character in the scene.

        Each character's identity is loaded from the library so its `skills:`
        list flows through to tool registration. The placement-level
        LLMConfig (model, temperature, max_tokens) wins over the library
        identity's LLMConfig — placements may override.
        """
        self.system_prompt_template = scene_config.system_prompt
        self.character_configs = {
            char_id: scene_config.characters_config[char_id].llm_config
            for char_id in scene_config.characters_config
        }
        self.agents = {
            char_id: self._build_agent(
                self.character_configs[char_id],
                skills=tuple(load_skill(s) for s in load_character(char_id).skills),
            )
            for char_id in self.character_configs
        }

    def _build_agent(
        self, config: LLMConfig, skills: tuple[Skill, ...] = ()
    ) -> Agent[None, CharacterResponse]:
        """Build a pydantic-ai Agent for one character.

        Routes through the LiteLLM gateway when configured, else direct
        to the upstream provider. Each skill is registered as a tool
        with the SKILL.md description as the LLM-facing tool description.
        """
        model_settings: ModelSettings = {
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
        }

        if settings.use_gateway:
            assert settings.LITELLM_BASE_URL is not None
            assert settings.LITELLM_API_KEY is not None
            agent: Agent[None, CharacterResponse] = Agent(
                OpenAIChatModel(
                    config.model_name,
                    provider=OpenAIProvider(
                        base_url=settings.LITELLM_BASE_URL,
                        api_key=settings.LITELLM_API_KEY.get_secret_value(),
                    ),
                ),
                output_type=CharacterResponse,
                retries=3,
                model_settings=model_settings,
            )
        elif config.provider == "openai":
            if settings.OPENAI_API_KEY is None:
                raise ValueError("OPENAI_API_KEY is not set (and LITELLM gateway not configured)")
            agent = Agent(
                OpenAIChatModel(
                    config.model_name,
                    provider=OpenAIProvider(api_key=settings.OPENAI_API_KEY.get_secret_value()),
                ),
                output_type=CharacterResponse,
                retries=3,
                model_settings=model_settings,
            )
        elif config.provider == "anthropic":
            if settings.ANTHROPIC_API_KEY is None:
                raise ValueError(
                    "ANTHROPIC_API_KEY is not set (and LITELLM gateway not configured)"
                )
            agent = Agent(
                AnthropicModel(
                    config.model_name,
                    provider=AnthropicProvider(
                        api_key=settings.ANTHROPIC_API_KEY.get_secret_value()
                    ),
                ),
                output_type=CharacterResponse,
                retries=3,
                model_settings=model_settings,
            )
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")

        for skill in skills:
            # Two-step: kwargs-form returns a decorator, then we apply it to
            # the callable. PydanticAI's tool_plain has separate overloads for
            # positional and kwargs forms — mixing them confuses the typer.
            agent.tool_plain(name=skill.name, description=skill.description)(skill.callable)
        return agent

    async def generate_response(
        self,
        external_id: str,
        system_vars: SystemPromptTemplateVars,
        history: list[ModelMessage],
    ) -> CharacterResponse:
        """Generate a structured response for one character on its turn."""
        if (
            self.agents is None
            or self.character_configs is None
            or self.system_prompt_template is None
        ):
            raise ValueError("init_scene not called")

        instructions = self.system_prompt_template.format(**system_vars)
        user_prompt = system_vars["input"]
        cfg = self.character_configs[external_id]

        with llm_response_seconds.labels(provider=cfg.provider, model=cfg.model_name).time():
            result = await self.agents[external_id].run(
                user_prompt,
                instructions=instructions,
                message_history=history,
            )
        return result.output
