"""The :class:`World` — wraps :class:`Scene` with a mutation API + events.

The Harness calls :meth:`World.set_character_action`, :meth:`add_message`,
etc. instead of poking ``scene.state.characters[...]`` directly. Every
mutation fires a :class:`WorldEvent`; subscribers (Clients, snapshot
persistence, …) handle them.

Event delivery is sequential and async-aware: subscribers may register
sync or async callables; both are awaited in registration order. Errors
in one subscriber do not block the others (logged + swallowed) so a
flaky Client adapter cannot freeze the simulation.
"""

from __future__ import annotations

import asyncio
import contextlib
import time
from collections.abc import Awaitable, Callable
from typing import Any

import structlog

from app.models.character import CharacterAction
from app.models.conversation import Message
from app.models.scene import Scene, SceneState
from app.world.events import (
    CharacterActionChanged,
    CharacterMessageAdded,
    CharacterMoodChanged,
    ConversationEnded,
    EndConversationRequested,
    EndConversationRequestsExpired,
    MessageStreamCompleted,
    MessageStreamStarted,
    MessageStreamUpdated,
    VisitorCountChanged,
    WorldEvent,
)

logger = structlog.get_logger(__name__)

# Subscribers may be sync or async — both are accepted; async ones are awaited.
type WorldEventCallback = Callable[[WorldEvent], Awaitable[None] | None]


class World:
    """Per-scene state container with mutation API + event bus.

    The active :class:`Scene` is stored in :attr:`scene`. ``None`` means
    no scene is currently loaded — the Harness is expected to call
    :meth:`set_scene` before issuing mutations.
    """

    def __init__(self, scene: Scene | None = None) -> None:
        self._scene: Scene | None = scene
        self._subscribers: list[WorldEventCallback] = []

    # ---------------------------------------------------------------- scene

    @property
    def scene(self) -> Scene | None:
        """The active scene or ``None`` if not yet loaded."""
        return self._scene

    def set_scene(self, scene: Scene) -> None:
        """Replace the active scene (e.g. on conversation rollover).

        Does not fire an event — the Harness drives scene lifecycle and
        emits its own scene-update once the new scene is wired up.
        """
        self._scene = scene

    def require_scene(self) -> Scene:
        """Return the active scene or raise — convenience for callers."""
        if self._scene is None:
            raise ValueError("Scene not found")
        return self._scene

    @property
    def state(self) -> SceneState:
        """Shortcut to :attr:`scene.state` — raises if no scene loaded."""
        return self.require_scene().state

    # ---------------------------------------------------------------- subs

    def subscribe(self, callback: WorldEventCallback) -> None:
        """Register a callback for every future :class:`WorldEvent`."""
        self._subscribers.append(callback)

    def unsubscribe(self, callback: WorldEventCallback) -> None:
        """Remove a previously-registered subscriber. No-op if absent."""
        with contextlib.suppress(ValueError):
            self._subscribers.remove(callback)

    async def _emit(self, event: WorldEvent) -> None:
        """Deliver an event to every subscriber; failures are logged + swallowed."""
        for cb in list(self._subscribers):
            try:
                result: Any = cb(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                logger.exception("world.subscriber_failed", event_type=type(event).__name__)

    # ---------------------------------------------------------------- mutations

    async def set_character_action(
        self,
        character_id: str,
        action: CharacterAction,
        started_at: float | None = None,
        estimated_duration: float | None = None,
    ) -> None:
        """Update a character's pose. Fires :class:`CharacterActionChanged`."""
        scene = self.require_scene()
        ts = time.time() if started_at is None else started_at
        char = scene.state.characters[character_id]
        char.action = action
        char.action_started_at = ts
        char.action_estimated_duration = estimated_duration
        await self._emit(
            CharacterActionChanged(
                character_id=character_id,
                action=action,
                started_at=ts,
                estimated_duration=estimated_duration,
            )
        )

    async def add_message(self, message: Message) -> None:
        """Append a message to the conversation log and flip the speaker
        to ``speaking``. Fires :class:`CharacterMessageAdded` followed by
        :class:`CharacterActionChanged` for the speaker.
        """
        scene = self.require_scene()
        speaker_id = message.character
        char = scene.state.characters[speaker_id]
        char.action = "speaking"
        char.action_started_at = message.unix_timestamp
        char.action_estimated_duration = message.calculated_speaking_time
        scene.state.messages.append(message)
        await self._emit(CharacterMessageAdded(character_id=speaker_id, message=message))
        await self._emit(
            CharacterActionChanged(
                character_id=speaker_id,
                action="speaking",
                started_at=message.unix_timestamp,
                estimated_duration=message.calculated_speaking_time,
            )
        )

    async def start_streaming_message(self, character_id: str, recipient: str = "") -> None:
        """Begin an in-progress streamed utterance.

        Flips the speaker to ``speaking`` immediately (with unknown duration —
        the read-time portion is not known until the stream completes) and
        seeds ``scene.state.streaming_message`` with an empty placeholder so
        late-joining viewers can render the bubble shell. Fires
        :class:`MessageStreamStarted` and :class:`CharacterActionChanged`.
        """
        scene = self.require_scene()
        ts = time.time()
        char = scene.state.characters[character_id]
        char.action = "speaking"
        char.action_started_at = ts
        char.action_estimated_duration = None
        scene.state.streaming_message = Message(
            character=character_id,
            content="",
            recipient=recipient,
            thoughts="",
            mood="neutral",
            mood_emoji="",
            reaction_on_previous_message=None,
            timestamp=str(ts),
            unix_timestamp=ts,
            calculated_speaking_time=0.0,
            conversation_rating=None,
            end_conversation=False,
        )
        await self._emit(MessageStreamStarted(character_id=character_id, recipient=recipient))
        await self._emit(
            CharacterActionChanged(
                character_id=character_id,
                action="speaking",
                started_at=ts,
                estimated_duration=None,
            )
        )

    async def update_streaming_message(self, message: Message) -> None:
        """Replace the in-progress utterance snapshot with ``message``.

        Fires :class:`MessageStreamUpdated`. Caller is the Harness — see
        :meth:`ConversationManager._partial_to_message`.
        """
        scene = self.require_scene()
        if scene.state.streaming_message is None:
            raise ValueError("No streaming message in progress")
        if message.character != scene.state.streaming_message.character:
            raise ValueError(
                f"Streaming message character mismatch: "
                f"{message.character} vs {scene.state.streaming_message.character}"
            )
        scene.state.streaming_message = message
        await self._emit(MessageStreamUpdated(character_id=message.character, message=message))

    async def complete_streaming_message(self, message: Message) -> None:
        """Finalize the in-progress utterance.

        Appends ``message`` to ``scene.state.messages``, clears
        ``streaming_message``, and refreshes the speaker's
        :class:`CharacterActionChanged` with a new ``started_at`` (= now,
        i.e. the start of the read-time window) and
        ``estimated_duration`` = ``message.calculated_speaking_time``.
        Fires :class:`MessageStreamCompleted` followed by
        :class:`CharacterActionChanged`.
        """
        scene = self.require_scene()
        if scene.state.streaming_message is None:
            raise ValueError("No streaming message to complete")
        speaker_id = message.character
        ts = time.time()
        char = scene.state.characters[speaker_id]
        char.action = "speaking"
        char.action_started_at = ts
        char.action_estimated_duration = message.calculated_speaking_time
        scene.state.messages.append(message)
        scene.state.streaming_message = None
        await self._emit(MessageStreamCompleted(character_id=speaker_id, message=message))
        await self._emit(
            CharacterActionChanged(
                character_id=speaker_id,
                action="speaking",
                started_at=ts,
                estimated_duration=message.calculated_speaking_time,
            )
        )

    async def set_character_mood(self, character_id: str, mood: str) -> None:
        """Update a character's current mood. Fires :class:`CharacterMoodChanged`."""
        scene = self.require_scene()
        scene.state.characters[character_id].current_mood = mood
        await self._emit(CharacterMoodChanged(character_id=character_id, mood=mood))

    async def request_end_conversation(self, character_id: str, validity_duration: float) -> None:
        """Record that a character wants to end the conversation.

        Fires :class:`EndConversationRequested`.
        """
        scene = self.require_scene()
        now = time.time()
        char = scene.state.characters[character_id]
        char.end_conversation_requested = True
        char.end_conversation_requested_at = now
        char.end_conversation_requested_validity_duration = validity_duration
        await self._emit(
            EndConversationRequested(
                character_id=character_id,
                requested_at=now,
                validity_duration=validity_duration,
            )
        )

    async def clear_expired_end_conversation_requests(
        self, now: float, validity_duration: float
    ) -> tuple[str, ...]:
        """Drop any end-conversation requests older than ``validity_duration``.

        Returns the ids of characters whose requests were cleared. Fires a
        single :class:`EndConversationRequestsExpired` if anything was
        cleared.
        """
        scene = self.require_scene()
        cleared: list[str] = []
        for char_id, char in scene.state.characters.items():
            if (
                char.end_conversation_requested
                and char.end_conversation_requested_at is not None
                and now - char.end_conversation_requested_at > validity_duration
            ):
                char.end_conversation_requested = False
                char.end_conversation_requested_at = None
                char.end_conversation_requested_validity_duration = None
                cleared.append(char_id)
        if cleared:
            await self._emit(EndConversationRequestsExpired(character_ids=tuple(cleared)))
        return tuple(cleared)

    async def end_conversation(self, ended_at: float | None = None) -> None:
        """Mark the active conversation as ended.

        Fires :class:`ConversationEnded`.
        """
        scene = self.require_scene()
        ts = time.time() if ended_at is None else ended_at
        scene.state.conversation_active = False
        scene.state.conversation_ended = True
        scene.state.ended_at = ts
        await self._emit(ConversationEnded(ended_at=ts))

    async def set_visitor_count(self, visitor_count: int) -> None:
        """Record audience size; flips ``conversation_active`` accordingly.

        Fires :class:`VisitorCountChanged`.
        """
        scene = self.require_scene()
        scene.state.visitor_count = visitor_count
        scene.state.conversation_active = visitor_count > 0
        await self._emit(
            VisitorCountChanged(
                visitor_count=visitor_count,
                conversation_active=scene.state.conversation_active,
            )
        )
