from typing import Set, Optional
import time
import logging
import random
import asyncio
from socket import SocketIO

from app.services.conversation_manager import ConversationManager, Message
from app.services.scene_config_service import SceneConfigService
from app.services.scene_service import SceneService
from app.services.scene_state_snapshot_service import SceneStateSnapshotService
from app.services.llm_manager import LLMManager
from app.models.character import CharacterAction
from app.models.scene import (
    Scene,
    SceneConfig,
    SceneState,
)

# Set up logger
logger = logging.getLogger(__name__)


class SceneManager:
    """Scene manager."""

    def __init__(self) -> None:
        """Initialize the scene manager."""

        # Configs
        self.base_pause_time = 5.0  # Base pause time for engagement (between speaking and thinking), in seconds
        self.new_conversation_cooldown = 600.0  # 10 minutes in seconds

        # Scene incl state and config
        self.scene: Scene | None = None  # active scene
        self.scene_service = SceneService()
        self.scene_config_service = SceneConfigService()
        self.scene_state_snapshot_service = SceneStateSnapshotService()
        self.llm_manager = LLMManager()
        self.conversation_manager = ConversationManager(self.llm_manager)

        # Internal states
        self.active_visitors: Set[str] = set()

        # Technical
        self.sio: Optional[SocketIO] = None  # Will be set by the socket manager

        # Start the conversation loop
        asyncio.create_task(self._load_and_run())

    async def get_next_scene_config(self) -> SceneConfig:
        """Get the next scene config."""
        highest_voted_scene_config = (
            await self.scene_config_service.get_highest_voted_scene_config()
        )
        if highest_voted_scene_config is None:
            return await self.scene_config_service.get_default_scene_config()
        await self.scene_config_service.activate_proposal(highest_voted_scene_config.id)
        return highest_voted_scene_config

    async def _load_latest_scene_state_snapshot(self) -> SceneState | None:
        """Load the latest state from the database."""
        snapshot = await self.scene_state_snapshot_service.get_latest_snapshot()
        if not snapshot:
            return None
        self.scene = snapshot
        # load conversation from snapshot
        self.conversation_manager.init_conversation(snapshot.state.messages)
        return self.scene.state

    async def load_new_scene(self, scene_config_id: int | None = None) -> None:
        """Load a new scene."""
        scene_config: SceneConfig | None = None
        if scene_config_id is None:
            scene_config = await self.get_next_scene_config()
        else:
            scene_config = await self.scene_config_service.get_by_id(scene_config_id)
            if scene_config is None:
                raise ValueError(f"Scene config with id {scene_config_id} not found")
        self.scene = await self.scene_service.create_scene(
            scene_config, len(self.active_visitors)
        )
        self.conversation_manager.init_conversation()
        await self.scene_state_snapshot_service.create_snapshot(self.scene.state)

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

        # Initialize LLMs for the scene
        self.llm_manager.init_scene(self.scene.config)

        # Start the conversation loop
        asyncio.create_task(self._conversation_loop())

    async def set_socket_instance(self, sio: SocketIO) -> None:
        """Set the socket instance for emitting updates."""
        self.sio = sio

    async def emit_scene_update(
        self, sid: Optional[str] = None, save_snapshot: bool = True
    ) -> None:
        """Emit scene state update to all connected visitors."""
        state = self.get_scene_state()
        if save_snapshot:
            await self.scene_state_snapshot_service.create_snapshot(state)
        if self.sio:
            await self.sio.emit("scene_state", state.model_dump(), room=sid)  # type: ignore

    def get_scene_state(self) -> SceneState:
        """Get the current state of the scene."""
        if self.scene is None:
            raise ValueError("Scene not found")
        return self.scene.state

    def _set_visitors(self, visitor_count: int, state: SceneState) -> SceneState:
        """Set the number of visitors in the scene state."""
        state.visitor_count = visitor_count
        state.conversation_active = visitor_count > 0
        return state

    async def add_visitor(self, sid: str) -> None:
        """Add a new visitor to the scene.

        Args:
            sid: The socket ID of the visitor
        """
        self.active_visitors.add(sid)
        if self.scene:
            self.scene.state = self._set_visitors(
                len(self.active_visitors), self.scene.state
            )
            await self.emit_scene_update(sid)

    async def remove_visitor(self, sid: str) -> None:
        """Remove a visitor from the scene."""
        self.active_visitors.remove(sid)
        if self.scene:
            self.scene.state = self._set_visitors(
                len(self.active_visitors), self.scene.state
            )
            await self.emit_scene_update(sid)

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

        self.scene.state.messages.append(message)  ## TODO use conversation manager

        # Emit update to all visitors
        await self.emit_scene_update()

        # Simulate speaking pause
        await asyncio.sleep(message.calculated_speaking_time)

    async def _generate_message(
        self, characterId: str, recipient: Optional[str] = None
    ) -> Message:
        """Generate a message for the current speaker."""
        if self.scene is None:
            raise ValueError("Scene not found")

        # Set character to thinking
        await self._set_character_action(characterId, "thinking")

        # Generate message
        message = await self.conversation_manager.generate_message(
            self.scene, characterId, recipient
        )

        # Update character's mood
        self.scene.state.characters[characterId].current_mood = message.mood

        # Update character's end conversation request
        end_conversation = message.end_conversation
        if end_conversation:
            self.scene.state.characters[characterId].end_conversation_requested = (
                end_conversation
            )
            self.scene.state.characters[characterId].end_conversation_requested_at = (
                time.time()
            )
            self.scene.state.characters[
                characterId
            ].end_conversation_requested_validity_duration = (
                self.conversation_manager.get_end_conversation_request_validity()
            )

        # Simulate speaking pause
        await asyncio.sleep(message.calculated_speaking_time)

        return message

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
                > self.conversation_manager.get_end_conversation_request_validity()
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
