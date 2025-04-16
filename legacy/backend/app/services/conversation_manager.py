import logging
import random
import time
import asyncio
from datetime import datetime
from typing import List, Optional

from langchain.schema import AIMessage, HumanMessage

from app.models.scene import Scene
from app.services.llm_manager import LLMManager, SystemPromptTemplateVars
from app.models.conversation import Conversation, Message


# Set up logger
logger = logging.getLogger(__name__)


class ConversationManager:
    """Conversation manager."""

    def __init__(self, llm_manager: LLMManager):
        # Configs
        self.context_window = 20  # number of messages to keep in context
        self.base_speaking_time = 5.0  # Base speaking time in seconds
        self.char_speaking_time = 0.05  # Additional seconds per character
        self.end_conversation_request_validity = 180.0  # 3 minutes in seconds

        self.llm_manager = llm_manager
        self.conversation: Conversation | None = None

    def init_conversation(self, messages: List[Message] = []) -> None:
        self.conversation = Conversation(messages=messages)

    def get_end_conversation_request_validity(self) -> float:
        return self.end_conversation_request_validity

    def _prepare_conversation_history(
        self, characterId: str
    ) -> List[HumanMessage | AIMessage]:
        """Prepare the conversation history."""
        if self.conversation is None:
            raise ValueError("Conversation not set")
        history: List[HumanMessage | AIMessage] = []
        for msg in self.conversation.messages[
            -self.context_window :
        ]:  # Last N messages for context
            if msg.character != characterId:
                history.append(HumanMessage(content=msg.content or "..."))
            else:
                history.append(AIMessage(content=msg.content or "..."))
        return history

    def _prepare_scene_description(
        self, scene_description: str, characters_description: str
    ) -> str:
        """Prepare the scene description."""
        return f"{scene_description}\n\nCharacters:\n{characters_description}"

    def _prepare_system_message(
        self, scene: Scene, characterId: str, message_recipient: Optional[str] = None
    ) -> SystemPromptTemplateVars:
        """Prepare the system message for the scene with character context."""
        characters_description = "\n".join(
            [f"- {char.visual}" for char in scene.state.characters.values()]
        )
        return {
            "character_name": scene.state.characters[characterId].name,
            "character_visual": scene.state.characters[characterId].visual,
            "character_role": scene.state.characters[characterId].role,
            "message_recipient": message_recipient or "",
            "scene_description": self._prepare_scene_description(
                scene.config.description, characters_description
            ),
            "input": (
                "Start a conversation."
                if not scene.state.messages
                else "Continue the conversation naturally."
            ),
            "conversation_length": str(len(scene.state.messages)),
            "current_time": datetime.now().strftime("%I:%M %p"),
        }

    def _calculate_speaking_time(self, message_length: int) -> float:
        """Calculate speaking time based on message length."""
        return self.base_speaking_time + (message_length * self.char_speaking_time)

    async def generate_message(
        self, scene: Scene, characterId: str, recipient: Optional[str] = None
    ) -> Message:
        """Generate a message for the current speaker."""

        if self.conversation is None:
            raise ValueError("Conversation not set")

        # Load current messages into conversation from scene state
        self.conversation.messages = scene.state.messages

        # Prepare system message with enhanced context
        system_vars = self._prepare_system_message(scene, characterId, recipient)

        # Prepare conversation history
        history = self._prepare_conversation_history(characterId)

        max_retries = 3
        retry_count = 0
        backoff_time = 0.5  # Start with 0.5s delay
        last_raw_response = None

        while retry_count < max_retries:
            try:
                # Generate response with structured output
                response = await self.llm_manager.generate_response(
                    characterId,
                    {
                        **system_vars,
                        "history": history,
                    },
                )

                # Calculate speaking time
                calculated_speaking_time = self._calculate_speaking_time(
                    len(response.content or "")
                )

                # Create message
                return Message(
                    character=characterId,
                    timestamp=datetime.now().isoformat(),
                    unix_timestamp=time.time(),
                    calculated_speaking_time=calculated_speaking_time,
                    # From response
                    content=response.content,
                    recipient=response.recipient,
                    thoughts=response.thoughts,
                    mood=response.mood,
                    mood_emoji=response.mood_emoji,
                    reaction_on_previous_message=response.reaction_on_previous_message,
                    conversation_rating=response.conversation_rating,
                    end_conversation=response.end_conversation,
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
