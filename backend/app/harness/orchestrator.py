import asyncio
import random
import time

import structlog

from app.core.metrics import messages_total
from app.harness.conversation import ConversationManager, Message
from app.harness.scene_config_loader import SceneConfigService
from app.harness.scene_loader import SceneService
from app.models.character import CharacterAction
from app.models.scene import (
    Scene,
    SceneConfig,
    SceneState,
)
from app.services.llm_manager import LLMManager
from app.world import World
from app.world.persistence.snapshots import SceneStateSnapshotService

logger = structlog.get_logger(__name__)


class Harness:
    """Per-scene orchestrator: owns the agentic loop.

    Drives turn-taking, paces character output, persists snapshots,
    retries on transient errors. Reads from :class:`World` for
    perception; writes back through :class:`World` mutation methods.
    Channel-agnostic — the Socket.IO bridge lives in ``app/client/``.
    Every World mutation fires a :class:`WorldEvent` that subscribed
    Clients translate into wire-format broadcasts; the Harness itself
    knows nothing about who's listening.
    """

    def __init__(self) -> None:
        """Initialize the harness."""

        # Configs
        self.base_pause_time = (
            5.0  # Base pause time for engagement (between speaking and thinking), in seconds
        )
        self.new_conversation_cooldown = 600.0  # 10 minutes in seconds

        # World owns scene state + fires events; the Harness mutates
        # state through World rather than poking attributes directly.
        self.world = World()
        self.scene_service = SceneService()
        self.scene_config_service = SceneConfigService()
        self.scene_state_snapshot_service = SceneStateSnapshotService()
        self.llm_manager = LLMManager()
        self.conversation_manager = ConversationManager(self.llm_manager)

        # Internal states
        self.active_visitors: set[str] = set()

        # Background tasks — held as attributes to satisfy RUF006 and so
        # `start()` is idempotent (no double-spawn).
        self._loop_task: asyncio.Task[None] | None = None
        self._conversation_task: asyncio.Task[None] | None = None

    # Compatibility shim — existing callers + tests read/write `sm.scene`.
    # Reads delegate to the World; writes propagate to the World too so
    # there is exactly one source of truth.
    @property
    def scene(self) -> Scene | None:
        return self.world.scene

    @scene.setter
    def scene(self, value: Scene | None) -> None:
        if value is None:
            # Reset path: build a fresh World rather than carrying over
            # subscribers tied to a stale scene.
            self.world = World()
        else:
            self.world.set_scene(value)

    def start(self) -> None:
        """Start the conversation tick loop. Must be called from a running event loop."""
        if self._loop_task is None or self._loop_task.done():
            self._loop_task = asyncio.create_task(self._load_and_run())

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
        return snapshot.state

    async def load_new_scene(self, scene_config_id: int | None = None) -> None:
        """Load a new scene."""
        scene_config: SceneConfig | None = None
        if scene_config_id is None:
            scene_config = await self.get_next_scene_config()
        else:
            scene_config = await self.scene_config_service.get_by_id(scene_config_id)
            if scene_config is None:
                raise ValueError(f"Scene config with id {scene_config_id} not found")
        self.scene = await self.scene_service.create_scene(scene_config, len(self.active_visitors))
        self.conversation_manager.init_conversation()
        await self._persist_state()

    async def _load_and_run(self) -> None:
        """Initialize the harness."""
        # Load latest scene state snapshot
        latest_snapshot = await self._load_latest_scene_state_snapshot()
        if latest_snapshot is None:
            await self.load_new_scene()

        scene = self.world.require_scene()

        # Initialize LLMs for the scene
        self.llm_manager.init_scene(scene.config)

        # Start the conversation loop (held as attribute so the task is
        # not garbage-collected mid-flight — see RUF006).
        self._conversation_task = asyncio.create_task(self._conversation_loop())

    async def _persist_state(self) -> None:
        """Snapshot the current scene state. Pure persistence — no broadcast.

        Broadcast is handled by Client adapters subscribed to the World;
        the Harness's only Client-facing concern is "make sure the latest
        state is durable so a fresh viewer sees the right thing on join."
        """
        if self.world.scene is None:
            return
        await self.scene_state_snapshot_service.create_snapshot(self.world.scene.state)

    def get_scene_state(self) -> SceneState:
        """Get the current state of the scene."""
        return self.world.require_scene().state

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
        if self.world.scene is not None:
            await self.world.set_visitor_count(len(self.active_visitors))
            await self._persist_state()

    async def remove_visitor(self, sid: str) -> None:
        """Remove a visitor from the scene."""
        self.active_visitors.remove(sid)
        if self.world.scene is not None:
            await self.world.set_visitor_count(len(self.active_visitors))
            await self._persist_state()

    def _get_other_character(self, characterId: str) -> str:
        """Get another random character."""
        scene = self.world.require_scene()
        char_ids = list(
            filter(
                lambda char_id: char_id != characterId,
                scene.state.characters.keys(),
            )
        )
        return random.choice(char_ids)

    async def _set_character_action(
        self,
        characterId: str,
        action: CharacterAction,
        estimated_duration: float | None = None,
    ) -> None:
        """Set the action of a character."""
        await self.world.set_character_action(
            characterId, action, estimated_duration=estimated_duration
        )
        await self._persist_state()

    async def _set_character_speaking(self, characterId: str, recipient: str | None = None) -> None:
        """Set the character to speaking."""
        message = await self._generate_message(characterId, recipient)

        # SceneState.messages is the source of truth; ConversationManager
        # reads it via `self.conversation.messages = scene.state.messages`
        # at the top of generate_message() each turn, so appending here
        # is fine. World.add_message also flips the speaker to "speaking".
        await self.world.add_message(message)
        messages_total.labels(character=characterId).inc()

        await self._persist_state()

        # Simulate speaking pause
        await asyncio.sleep(message.calculated_speaking_time)

    async def _generate_message(self, characterId: str, recipient: str | None = None) -> Message:
        """Generate a message for the current speaker."""
        scene = self.world.require_scene()

        # Set character to thinking
        await self._set_character_action(characterId, "thinking")

        # Generate message
        message = await self.conversation_manager.generate_message(scene, characterId, recipient)

        # Update character's mood
        await self.world.set_character_mood(characterId, message.mood)

        # Update character's end conversation request
        if message.end_conversation:
            await self.world.request_end_conversation(
                characterId,
                self.conversation_manager.get_end_conversation_request_validity(),
            )

        # Simulate speaking pause
        await asyncio.sleep(message.calculated_speaking_time)

        return message

    def _get_next_speaker(self) -> str:
        """Determine the next speaker based on conversation state."""
        scene = self.world.require_scene()
        if not scene.state.messages:
            return scene.config.start_character_id

        # Get the last speaker
        last_speaker = scene.state.messages[-1].character

        # Switch speakers
        return self._get_other_character(last_speaker)

    async def _conversation_loop(self) -> None:
        """Main conversation loop between AI characters."""
        scene = self.world.require_scene()
        while True:
            # Check if a new conversation shall be started
            if (
                scene.state.conversation_ended
                and (scene.state.ended_at or 0) + self.new_conversation_cooldown < time.time()
            ):
                # Load new scene (same scene config) — load_new_scene
                # snapshots the fresh state itself, so no extra persist
                # call here.
                logger.info(f"[{time.time()}]: Loading new scene")
                await self.load_new_scene()
                scene = self.world.require_scene()

            if scene.state.conversation_active and not scene.state.conversation_ended:
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
        scene = self.world.require_scene()
        for charId, character in scene.state.characters.items():
            if character.action != "speaking":
                continue

            current_time = time.time()
            logger.info(f"[{current_time}]: Speaking character: {charId}")
            if (
                character.action_estimated_duration is not None
                and current_time - character.action_started_at < character.action_estimated_duration
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
        scene = self.world.require_scene()
        validity = self.conversation_manager.get_end_conversation_request_validity()

        # Drop expired requests; World fires an event if anything was cleared.
        cleared = await self.world.clear_expired_end_conversation_requests(current_time, validity)

        # Re-evaluate after expirations.
        all_characters_agreed_to_end = all(
            char.end_conversation_requested for char in scene.state.characters.values()
        )
        is_changed = bool(cleared)
        if all_characters_agreed_to_end and scene.state.characters:
            await self.world.end_conversation()
            is_changed = True
            logger.info("All characters agreed to end conversation")
        # Persist if state changed
        if is_changed:
            await self._persist_state()
