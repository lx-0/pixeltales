from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings

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
LLMConfigHash = int
SystemPromptTemplateVars = dict[str, str]


class LLMManager:
    """LLM manager backed by pydantic-ai.

    One Agent per unique LLMConfig (deduped by hash) so two characters with
    the same model+temperature+max_tokens share a single client. The system
    prompt template is per-scene; instructions are formatted with the
    per-call vars and passed to agent.run() each turn.
    """

    def __init__(self) -> None:
        self.agents: dict[LLMConfigHash, Agent[None, CharacterResponse]] | None = None
        self.llm_configs: dict[LLMConfigHash, LLMConfig] | None = None
        self.external_id_to_llm_hash_map: dict[str, LLMConfigHash] | None = None
        self.system_prompt_template: str | None = None

    def init_scene(self, scene_config: SceneConfig) -> None:
        """Initialize agents for the scene's character set."""
        llm_configs_by_external_id = {
            char_id: scene_config.characters_config[char_id].llm_config
            for char_id in scene_config.characters_config
        }
        (
            self.llm_configs,
            self.external_id_to_llm_hash_map,
        ) = self._reduce_llm_config(llm_configs_by_external_id)
        self.system_prompt_template = scene_config.system_prompt
        self.agents = {h: self._build_agent(self.llm_configs[h]) for h in self.llm_configs}

    def _reduce_llm_config(
        self, llm_configs_by_id: dict[str, LLMConfig]
    ) -> tuple[dict[LLMConfigHash, LLMConfig], dict[str, LLMConfigHash]]:
        """Dedupe LLM configs across characters, mapping each character to a hash."""
        return (
            {hash(c): c for c in llm_configs_by_id.values()},
            {char_id: hash(c) for char_id, c in llm_configs_by_id.items()},
        )

    def _build_agent(self, config: LLMConfig) -> Agent[None, CharacterResponse]:
        """Build a pydantic-ai Agent for one LLMConfig.

        Routes through the LiteLLM gateway when configured, else direct
        to the upstream provider.
        """
        model_settings: ModelSettings = {
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
        }

        if settings.use_gateway:
            assert settings.LITELLM_BASE_URL is not None
            assert settings.LITELLM_API_KEY is not None
            return Agent(
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

        if config.provider == "openai":
            if settings.OPENAI_API_KEY is None:
                raise ValueError("OPENAI_API_KEY is not set (and LITELLM gateway not configured)")
            return Agent(
                OpenAIChatModel(
                    config.model_name,
                    provider=OpenAIProvider(api_key=settings.OPENAI_API_KEY.get_secret_value()),
                ),
                output_type=CharacterResponse,
                retries=3,
                model_settings=model_settings,
            )

        if config.provider == "anthropic":
            if settings.ANTHROPIC_API_KEY is None:
                raise ValueError(
                    "ANTHROPIC_API_KEY is not set (and LITELLM gateway not configured)"
                )
            return Agent(
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

        raise ValueError(f"Unsupported provider: {config.provider}")

    async def generate_response(
        self,
        external_id: str,
        system_vars: SystemPromptTemplateVars,
        history: list[ModelMessage],
    ) -> CharacterResponse:
        """Generate a structured response for one character on its turn."""
        if (
            self.agents is None
            or self.external_id_to_llm_hash_map is None
            or self.llm_configs is None
            or self.system_prompt_template is None
        ):
            raise ValueError("init_scene not called")

        instructions = self.system_prompt_template.format(**system_vars)
        user_prompt = system_vars["input"]

        llm_config_hash = self.external_id_to_llm_hash_map[external_id]
        cfg = self.llm_configs[llm_config_hash]

        with llm_response_seconds.labels(provider=cfg.provider, model=cfg.model_name).time():
            result = await self.agents[llm_config_hash].run(
                user_prompt,
                instructions=instructions,
                message_history=history,
            )
        return result.output
