from typing import Dict, List, Optional, Union, Sequence, cast

from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import Runnable, RunnableSerializable

from app.models.llm import LLMConfig
from app.models.scene import SceneConfig
from app.core.config import settings


# Character response schema
class CharacterResponse(BaseModel):
    """Structure for character response"""

    recipient: str = Field(description="The recipient of the message")
    reaction_on_previous_message: str | None = Field(
        description="A single unicode emoji that best represents your reaction on the previous message. Formatting instructions: Use unicode emoji."
    )
    conversation_rating: Optional[int] = Field(
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
    content: Optional[str] = Field(
        description="Your spoken response. Formatting instructions: To express your mood in the spoken response, use casual formatting style, including casual CAPS for emphasis, dramatic punctuation, but ABSOLUTELY NO emojis!"
    )
    end_conversation: bool = Field(
        description="Your response ends the conversation"
        # description="Do you want to end the conversation to focus on other things?"
    )
    # prefer_to_continue_conversation: bool = Field(
    #     description="Do you want to continue the conversation?"
    # )


# Type aliases

LLMConfigHash = int
LLMRunnable = Runnable[
    Union[ChatPromptTemplate, str, Sequence[BaseMessage]],  # Input type(s)
    CharacterResponse,  # Output type
]

SystemPromptTemplateVars = Dict[str, str | List[HumanMessage | AIMessage]]


class LLMManager:
    """LLM manager."""

    def __init__(self) -> None:
        """Initialize the LLM manager."""

        self.llms: Dict[LLMConfigHash, LLMRunnable] | None = None
        self.prompt: ChatPromptTemplate | None = None
        self.chains: (
            Dict[
                LLMConfigHash,
                RunnableSerializable[SystemPromptTemplateVars, CharacterResponse],
            ]
            | None
        ) = None
        self.llm_configs: Dict[LLMConfigHash, LLMConfig] | None = None
        self.external_id_to_llm_hash_map: Dict[str, LLMConfigHash] | None = None

    def init_scene(self, scene_config: SceneConfig) -> None:
        """Initialize the LLMs for the scene."""
        llm_configs_by_external_id = {
            char_id: scene_config.characters_config[char_id].llm_config
            for char_id in scene_config.characters_config.keys()
        }
        # Map characters to LLMs via `llm_config` hash
        # self.external_id_to_llm_map =
        (
            self.llm_configs,
            self.external_id_to_llm_hash_map,
        ) = self._reduce_llm_config(llm_configs_by_external_id)
        self._init_llms()
        self.init_conversation_chain(scene_config.system_prompt)

    def _reduce_llm_config(
        self, llm_configs_by_id: dict[str, LLMConfig]
    ) -> tuple[dict[LLMConfigHash, LLMConfig], dict[str, LLMConfigHash]]:
        """Reduce the LLM configs to a reduced LLM config map."""
        return (
            {hash(llm_config): llm_config for llm_config in llm_configs_by_id.values()},
            {
                char_id: hash(llm_config)
                for char_id, llm_config in llm_configs_by_id.items()
            },
        )

    def _init_llms(self) -> None:
        """Initialize the LLMs for the scene."""

        if self.llm_configs is None:
            raise ValueError("LLM configs not initialized")

        # Initialize LLMs for each character with structured output support
        self.llms = {
            llm_config_hash: cast(
                LLMRunnable,
                self._get_model_instance(
                    self.llm_configs[llm_config_hash]
                ).with_structured_output(  # type: ignore
                    schema=CharacterResponse, method="function_calling", strict=True
                ),
            )
            for llm_config_hash in self.llm_configs.keys()
        }

    def init_conversation_chain(self, system_prompt: str) -> None:
        """Initialize the conversation chain for the scene."""

        if self.llm_configs is None:
            raise ValueError("LLM configs not initialized")

        if self.llms is None:
            raise ValueError("LLMs not initialized")

        # Initialize conversation chain with improved format instructions
        self.prompt = ChatPromptTemplate.from_messages(  # type: ignore
            [
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="history"),
                ("human", "{input}"),
            ]
        ).partial(
            format_instructions=PydanticOutputParser(
                pydantic_object=CharacterResponse
            ).get_format_instructions()
        )

        # Configure chains for each llm
        self.chains = {
            llm_config_hash: (self.prompt | self.llms[llm_config_hash])
            for llm_config_hash in self.llm_configs.keys()
        }

    def _get_model_instance(self, config: LLMConfig) -> ChatOpenAI | ChatAnthropic:
        if config.provider == "openai":
            if settings.OPENAI_API_KEY is None:
                raise ValueError("OPENAI_API_KEY is not set")
            return ChatOpenAI(
                temperature=config.temperature,
                model=config.model_name,
                api_key=settings.OPENAI_API_KEY,
                max_completion_tokens=config.max_tokens,
            )
        elif config.provider == "anthropic":
            if settings.ANTHROPIC_API_KEY is None:
                raise ValueError("ANTHROPIC_API_KEY is not set")
            return ChatAnthropic(
                temperature=config.temperature,
                model_name=config.model_name,
                api_key=settings.ANTHROPIC_API_KEY,
                max_tokens_to_sample=config.max_tokens,
                timeout=None,
                stop=None,
            )
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")

    async def generate_response(
        self, external_id: str, input: SystemPromptTemplateVars
    ) -> CharacterResponse:
        """Generate a response for the scene."""
        if self.chains is None:
            raise ValueError("Chains not initialized")

        if self.external_id_to_llm_hash_map is None:
            raise ValueError("External ID to LLM hash map not initialized")

        llm_config_hash = self.external_id_to_llm_hash_map[external_id]

        return await self.chains[llm_config_hash].ainvoke(input)
