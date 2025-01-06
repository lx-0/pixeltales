from typing import Dict, List, Set, Optional, Union, Sequence, cast
from datetime import datetime
import time
import logging
import random
import asyncio
from socket import SocketIO

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import Runnable, RunnableSerializable

from app.db.models import DBScene, DBSceneStateSnapshot
from app.db.database import async_session
from app.services.scene_config_manager import SceneConfigManager
from app.core.config import settings
from app.models.scene import (
    CharacterAction,
    CharacterConfig,
    LLMConfig,
    Scene,
    SceneConfig,
    SceneState,
    CharacterState,
    Message,
)

# Set up logger
logger = logging.getLogger(__name__)


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

LLMRunnable = Runnable[
    Union[ChatPromptTemplate, str, Sequence[BaseMessage]],  # Input type(s)
    CharacterResponse,  # Output type
]

SystemPromptTemplateVars = Dict[str, str | List[HumanMessage | AIMessage]]


def get_model_instance(config: LLMConfig) -> ChatOpenAI | ChatAnthropic:
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


class SceneManager:
    """Scene manager."""

    def __init__(self) -> None:
        """Initialize the scene manager."""

        # Configs
        self.context_window = 20  # number of messages to keep in context
        self.end_conversation_request_validity = 180.0  # 3 minutes in seconds
        self.base_speaking_time = 5.0  # Base speaking time in seconds
        self.char_speaking_time = 0.05  # Additional seconds per character
        self.base_pause_time = 5.0  # Base pause time for engagement (between speaking and thinking), in seconds
        self.new_conversation_cooldown = 600.0  # 10 minutes in seconds

        # Scene incl state and config
        self.scene: Scene | None = None  # active scene
        self.scene_config_manager = SceneConfigManager()

        # Internal states
        self.active_visitors: Set[str] = set()

        # Technical
        self.sio: Optional[SocketIO] = None  # Will be set by the socket manager

        # Start the conversation loop
        asyncio.create_task(self._load_and_run())

    async def _create_new_scene(self, scene_config: SceneConfig) -> Scene:
        """Create a new scene."""
        try:
            async with async_session() as session:
                # Create new scene record
                db_scene = DBScene(
                    config_id=scene_config.id,
                )
                session.add(db_scene)
                await session.commit()
                await session.refresh(db_scene)

                scene = Scene(
                    id=db_scene.id,
                    config=scene_config,
                    state=self.initialize_scene(
                        db_scene.id, scene_config, len(self.active_visitors)
                    ),
                )

                return scene
        except Exception as e:
            logger.error(f"Error saving scene: {e}")
            raise e

    async def get_next_scene_config(self) -> SceneConfig:
        """Get the next scene config."""
        highest_voted_scene_config = (
            await self.scene_config_manager.get_highest_voted_scene_config()
        )
        if highest_voted_scene_config is None:
            return await self.scene_config_manager.get_default_scene_config()
        await self.scene_config_manager.activate_proposal(highest_voted_scene_config.id)
        return highest_voted_scene_config

    async def load_new_scene(self, scene_config_id: int | None = None) -> None:
        """Load a new scene."""
        scene_config: SceneConfig | None = None
        if scene_config_id is None:
            scene_config = await self.get_next_scene_config()
        else:
            scene_config = await self.scene_config_manager.get_scene_config(
                scene_config_id
            )
            if scene_config is None:
                raise ValueError(f"Scene config with id {scene_config_id} not found")
        self.scene = await self._create_new_scene(scene_config)
        await self._save_scene_state_snapshot()

    async def _load_and_run(self) -> None:
        """Initialize the scene manager."""
        # Wait for self.sio to be set
        while self.sio is None:
            await asyncio.sleep(1)

        # Load latest scene state snapshot
        latest_snapshot = await self._load_latest_scene_state_snapshot()
        if latest_snapshot is None:
            await self.load_new_scene()

        if self.scene is None:
            raise ValueError("Scene not found")

        # Initialize LLMs for each character with structured output support
        self.llms: Dict[str, LLMRunnable] = {
            char_id: cast(
                LLMRunnable,
                get_model_instance(
                    self.scene.config.characters_config[char_id].llm_config
                ).with_structured_output(  # type: ignore
                    schema=CharacterResponse, method="function_calling", strict=True
                ),
            )
            for char_id in self.scene.config.characters_config.keys()
        }

        # Initialize conversation chain with improved format instructions
        self.prompt = ChatPromptTemplate.from_messages(  # type: ignore
            [
                ("system", self.scene.config.system_prompt),
                MessagesPlaceholder(variable_name="history"),
                ("human", "{input}"),
            ]
        ).partial(
            format_instructions=PydanticOutputParser(
                pydantic_object=CharacterResponse
            ).get_format_instructions()
        )

        # Configure chains for each character
        self.chains: Dict[
            str, RunnableSerializable[SystemPromptTemplateVars, CharacterResponse]
        ] = {
            char_id: (self.prompt | self.llms[char_id])
            for char_id in self.scene.config.characters_config.keys()
        }

        # Start the conversation loop
        asyncio.create_task(self._conversation_loop())

    def initialize_scene(
        self, scene_id: int, scene_config: SceneConfig, visitor_count: int = 0
    ) -> SceneState:
        """Initialize the scene."""
        logger.info("Initializing scene")
        started_at = time.time()
        return SceneState(
            scene_id=scene_id,
            scene_config_id=scene_config.id,
            characters=self.initialize_characters(
                scene_config.characters_config, started_at
            ),
            messages=[],
            started_at=started_at,
            conversation_active=visitor_count > 0,
            conversation_ended=False,
            visitor_count=visitor_count,
        )  # Initial State

    def initialize_characters(
        self, characters_config: Dict[str, CharacterConfig], started_at: float
    ) -> Dict[str, CharacterState]:
        """Initialize characters from `characters` dict with more detailed context"""
        return {
            char_id: CharacterState(
                id=char_config.id,
                name=char_config.name,
                color=char_config.color,
                role=char_config.role,
                visual=char_config.visual,
                llm_config=char_config.llm_config,
                position=char_config.initial_position,
                direction=char_config.initial_direction,
                action=char_config.initial_action,
                action_started_at=started_at,
                current_mood=char_config.initial_mood,
            )
            for char_id, char_config in characters_config.items()
        }

    async def set_socket_instance(self, sio: SocketIO) -> None:
        """Set the socket instance for emitting updates."""
        self.sio = sio

    async def emit_scene_update(
        self, sid: Optional[str] = None, save_snapshot: bool = True
    ) -> None:
        """Emit scene state update to all connected visitors."""
        if save_snapshot:
            await self._save_scene_state_snapshot()
        if self.sio:
            state = self.get_scene_state()
            await self.sio.emit("scene_state", state.model_dump(), room=sid)  # type: ignore

    def get_scene_state(self) -> SceneState:
        """Get the current state of the scene."""
        if self.scene is None:
            raise ValueError("Scene not found")
        return self.scene.state

    async def add_visitor(self, sid: str) -> None:
        """Add a new visitor to the scene.

        Arg
            sid: The socket ID of the visitor
        """
        self.active_visitors.add(sid)
        if self.scene:
            self.scene.state.visitor_count = len(self.active_visitors)
            # First visitor, start the conversation
            self.scene.state.conversation_active = len(self.active_visitors) > 0
            # Send current state to the new visitor
            await self.emit_scene_update(sid)

    async def remove_visitor(self, sid: str) -> None:
        """Remove a visitor from the scene."""
        self.active_visitors.remove(sid)
        if self.scene:
            self.scene.state.visitor_count = len(self.active_visitors)
            # No more visitors, pause the conversation
            self.scene.state.conversation_active = len(self.active_visitors) > 0
            # Update other visitors about the change
            await self.emit_scene_update()

    def _get_other_character(self, characterId: str) -> str:
        """Get another random character."""
        if self.scene is None:
            raise ValueError("Scene not found")
        char_ids = list(
            filter(
                lambda char_id: char_id != characterId,
                self.scene.state.characters.keys(),
            )
        )
        return random.choice(char_ids)

    def _calculate_speaking_time(self, message_length: int) -> float:
        """Calculate speaking time based on message length."""
        return self.base_speaking_time + (message_length * self.char_speaking_time)

    async def _set_character_action(
        self,
        characterId: str,
        action: CharacterAction,
        estimated_duration: Optional[float] = None,
    ) -> None:
        """Set the action of a character."""
        if self.scene is None:
            raise ValueError("Scene not found")
        self.scene.state.characters[characterId].action = action
        self.scene.state.characters[characterId].action_started_at = time.time()
        self.scene.state.characters[characterId].action_estimated_duration = (
            estimated_duration
        )
        await self.emit_scene_update()

    async def _set_character_speaking(
        self, characterId: str, recipient: Optional[str] = None
    ) -> None:
        """Set the character to speaking."""
        if self.scene is None:
            raise ValueError("Scene not found")

        message = await self._generate_message(characterId, recipient)

        self.scene.state.characters[characterId].action = "speaking"
        self.scene.state.characters[characterId].action_started_at = (
            message.unix_timestamp
        )
        self.scene.state.characters[characterId].action_estimated_duration = (
            message.calculated_speaking_time
        )

        self.scene.state.messages.append(message)

        # Emit update to all visitors
        await self.emit_scene_update()

        # Simulate speaking pause
        await asyncio.sleep(message.calculated_speaking_time)

    def _prepare_scene_description(self) -> str:
        """Prepare the scene description."""
        if self.scene is None:
            raise ValueError("Scene not found")
        characters_description = "\n".join(
            [f"- {char.visual}" for char in self.scene.state.characters.values()]
        )
        return f"You are in an ice cream shop. You are having a conversation with another character.\n\nCharacters:\n{characters_description}"

    def _prepare_system_message(
        self, character: str, message_recipient: Optional[str] = None
    ) -> SystemPromptTemplateVars:
        """Prepare the system message with character context."""
        if self.scene is None:
            raise ValueError("Scene not found")
        return {
            "character_name": self.scene.state.characters[character].name,
            "character_visual": self.scene.state.characters[character].visual,
            "character_role": self.scene.state.characters[character].role,
            "scene_description": self._prepare_scene_description(),
            "input": (
                "Start a conversation."
                if not self.scene.state.messages
                else "Continue the conversation naturally."
            ),
            "conversation_length": str(len(self.scene.state.messages)),
            "current_time": datetime.now().strftime("%I:%M %p"),
        }

    def _prepare_conversation_history(
        self, character: str
    ) -> List[HumanMessage | AIMessage]:
        """Prepare the conversation history."""
        if self.scene is None:
            raise ValueError("Scene not found")
        history: List[HumanMessage | AIMessage] = []
        for msg in self.scene.state.messages[
            -self.context_window :
        ]:  # Last N messages for context
            if msg.character != character:
                history.append(HumanMessage(content=msg.content or "..."))
            else:
                history.append(AIMessage(content=msg.content or "..."))
        return history

    async def _generate_message(
        self, characterId: str, recipient: Optional[str] = None
    ) -> Message:
        """Generate a message for the current speaker."""
        if self.scene is None:
            raise ValueError("Scene not found")
        # Set character to thinking
        await self._set_character_action(characterId, "thinking")

        # Prepare system message with enhanced context
        system_vars = self._prepare_system_message(characterId, recipient)

        # Prepare conversation history
        history = self._prepare_conversation_history(characterId)

        max_retries = 3
        retry_count = 0
        backoff_time = 0.5  # Start with 0.5s delay
        last_raw_response = None

        while retry_count < max_retries:
            try:
                # Generate response with structured output
                response = await self.chains[characterId].ainvoke(
                    {
                        **system_vars,
                        "history": history,
                    }
                )

                # Update character's mood
                self.scene.state.characters[characterId].current_mood = response.mood

                # Update character's end conversation request
                end_conversation = response.end_conversation
                if end_conversation:
                    self.scene.state.characters[
                        characterId
                    ].end_conversation_requested = end_conversation
                    self.scene.state.characters[
                        characterId
                    ].end_conversation_requested_at = time.time()
                    self.scene.state.characters[
                        characterId
                    ].end_conversation_requested_validity_duration = (
                        self.end_conversation_request_validity
                    )

                # Simulate thinking pause
                speaking_time = self._calculate_speaking_time(
                    len(response.content or "")
                )
                await asyncio.sleep(speaking_time)

                # Create message
                return Message(
                    character=characterId,
                    timestamp=datetime.now().isoformat(),
                    unix_timestamp=time.time(),
                    calculated_speaking_time=speaking_time,
                    # From response
                    content=response.content,
                    recipient=response.recipient,
                    thoughts=response.thoughts,
                    mood=response.mood,
                    mood_emoji=response.mood_emoji,
                    reaction_on_previous_message=response.reaction_on_previous_message,
                    conversation_rating=response.conversation_rating,
                    end_conversation=end_conversation,
                )

            except Exception as e:
                retry_count += 1
                error_type = type(e).__name__

                # Log structured error information
                logger.error(
                    "Error generating message",
                    extra={
                        "error_type": error_type,
                        "attempt": retry_count,
                        "max_retries": max_retries,
                        "character": characterId,
                        "raw_response": last_raw_response,
                        "error_details": str(e),
                    },
                )

                if retry_count >= max_retries:
                    logger.warning(
                        "All retries failed",
                        str(e),
                        extra={
                            "character": characterId,
                            "last_error": str(e),
                            "last_raw_response": last_raw_response,
                        },
                    )
                    break

                # Exponential backoff with jitter
                jitter = random.uniform(0, 0.1)
                await asyncio.sleep(backoff_time + jitter)
                backoff_time *= 2  # Double the backoff time for next retry

        raise RuntimeError(f"Failed to generate message after {max_retries} retries")

    def _get_next_speaker(self) -> str:
        """Determine the next speaker based on conversation state."""
        if self.scene is None:
            raise ValueError("Scene not found")
        if not self.scene.state.messages:
            return self.scene.config.start_character_id

        # Get the last speaker
        last_speaker = self.scene.state.messages[-1].character

        # Switch speakers
        return self._get_other_character(last_speaker)

    async def _conversation_loop(self) -> None:
        """Main conversation loop between AI characters."""
        if self.scene is None:
            raise ValueError("Scene not found")
        while True:
            # Check if a new conversation shall be started
            if (
                self.scene.state.conversation_ended
                and (self.scene.state.ended_at or 0) + self.new_conversation_cooldown
                < time.time()
            ):
                # Load new scene (same scene config)
                logger.info(f"[{time.time()}]: Loading new scene")
                await self.load_new_scene()
                await self.emit_scene_update(save_snapshot=False)

            if (
                self.scene.state.conversation_active
                and not self.scene.state.conversation_ended
            ):
                try:
                    # Wait until all characters completed speaking
                    await self._wait_until_all_characters_completed_speaking()

                    # Get next speaker to start new message
                    next_speaker = self._get_next_speaker()
                    recipient = self._get_other_character(next_speaker)
                    await self._set_character_speaking(next_speaker, recipient)

                    # Handle end conversation requests
                    await self._handle_end_conversation_requests()

                    # Short sleep to prevent CPU spinning
                    await asyncio.sleep(0.1)

                except Exception as e:
                    logger.error(f"Error in conversation loop: {e}")
                    await asyncio.sleep(5)
            else:
                # Conversation paused, check every second
                await asyncio.sleep(1)

    async def _wait_until_all_characters_completed_speaking(self):
        """Wait until all characters completed speaking."""
        # "Speaking Loop": Wait until all characters completed speaking
        # logger.info(f"[{current_time}]: Speaking loop started")
        # loop through all characters and check if they have completed speaking
        if self.scene is None:
            raise ValueError("Scene not found")
        for charId, character in self.scene.state.characters.items():
            if character.action != "speaking":
                continue

            current_time = time.time()
            logger.info(f"[{current_time}]: Speaking character: {charId}")
            if (
                character.action_estimated_duration is not None
                and current_time - character.action_started_at
                < character.action_estimated_duration
            ):
                # Wait until the character has completed speaking
                await asyncio.sleep(
                    character.action_estimated_duration
                    - (current_time - character.action_started_at)
                )

            # Set the character action to idle
            await self._set_character_action(charId, "idle")

            # Pause time for engagement after speaking
            await asyncio.sleep(self.base_pause_time)

    async def _handle_end_conversation_requests(self):
        """Handle end conversation requests."""
        current_time = time.time()
        all_characters_agreed_to_end = True
        is_changed = False
        if self.scene is None:
            raise ValueError("Scene not found")
        for _charId, character in self.scene.state.characters.items():
            if (
                character.end_conversation_requested
                and character.end_conversation_requested_at is not None
                and current_time - character.end_conversation_requested_at
                > self.end_conversation_request_validity
            ):
                # clean expired end conversation requests
                character.end_conversation_requested = False
                character.end_conversation_requested_at = None
                character.end_conversation_requested_validity_duration = None
                is_changed = True
            if not character.end_conversation_requested:
                all_characters_agreed_to_end = False
        if all_characters_agreed_to_end:
            self.scene.state.conversation_active = False
            self.scene.state.conversation_ended = True
            self.scene.state.ended_at = time.time()
            is_changed = True
            logger.info("All characters agreed to end conversation")
        # Emit update if state changed
        if is_changed:
            await self.emit_scene_update()

    async def _load_latest_scene_state_snapshot(self) -> SceneState | None:
        """Load the latest state from the database."""
        try:
            async with async_session() as session:
                # Query for latest state snapshot with eager loading of config
                query = (
                    select(DBSceneStateSnapshot)
                    .options(selectinload(DBSceneStateSnapshot.config))
                    .order_by(DBSceneStateSnapshot.timestamp.desc())
                    .limit(1)
                )
                result = await session.execute(query)
                snapshot = result.scalar_one_or_none()

                if snapshot:
                    # Convert the stored state dict back to SceneState
                    self.scene = Scene(
                        id=snapshot.scene_id,
                        config=SceneConfig.model_validate(snapshot.config.config),
                        state=SceneState.model_validate(snapshot.state),
                    )
                    return self.scene.state

                return None

        except Exception as e:
            logger.error(f"Error loading latest state: {e}")
            return None

    async def _save_scene_state_snapshot(self) -> None:
        """Save the current state to the database."""
        if self.scene is None:
            raise ValueError("Scene not found")
        try:
            async with async_session() as session:
                # Create new snapshot
                snapshot = DBSceneStateSnapshot(
                    state=self.scene.state,
                )
                session.add(snapshot)
                await session.commit()
        except Exception as e:
            logger.error(f"Error saving state snapshot: {e}")
