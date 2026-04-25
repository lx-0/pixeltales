"""Domain events fired by the :class:`World`.

Every state mutation produces an event; Client adapters subscribe and
translate events into wire formats (Socket.IO emits, REST cache busts,
Twitch chat lines, …). The World does not know who is listening.

Events are plain dataclasses for ergonomics — :class:`WorldEvent` is the
common base type used in :meth:`World.subscribe` callbacks.
"""

from dataclasses import dataclass

from app.models.character import CharacterAction
from app.models.conversation import Message


@dataclass(frozen=True)
class WorldEvent:
    """Base type for all world events.

    Subclasses carry their own payload; subscribers are typed against the
    union of all subclasses.
    """


@dataclass(frozen=True)
class CharacterActionChanged(WorldEvent):
    """A character's pose / state changed (idle, thinking, speaking, ...)."""

    character_id: str
    action: CharacterAction
    started_at: float
    estimated_duration: float | None


@dataclass(frozen=True)
class CharacterMessageAdded(WorldEvent):
    """A character produced a new utterance and it was appended to the log.

    The character's action also flips to ``speaking`` as part of this
    mutation; subscribers that want pose updates should also watch
    :class:`CharacterActionChanged`.
    """

    character_id: str
    message: Message


@dataclass(frozen=True)
class CharacterMoodChanged(WorldEvent):
    """A character's current mood was updated."""

    character_id: str
    mood: str


@dataclass(frozen=True)
class EndConversationRequested(WorldEvent):
    """A character signalled they want to end the conversation."""

    character_id: str
    requested_at: float
    validity_duration: float


@dataclass(frozen=True)
class EndConversationRequestsExpired(WorldEvent):
    """One or more pending end-conversation requests timed out and were cleared."""

    character_ids: tuple[str, ...]


@dataclass(frozen=True)
class ConversationEnded(WorldEvent):
    """All characters agreed to end; the active conversation has stopped."""

    ended_at: float


@dataclass(frozen=True)
class VisitorCountChanged(WorldEvent):
    """The audience size changed (viewer joined/left)."""

    visitor_count: int
    conversation_active: bool


@dataclass(frozen=True)
class MessageStreamStarted(WorldEvent):
    """A character started streaming an utterance.

    Fired alongside :class:`CharacterActionChanged` (action=speaking,
    estimated_duration=None) so the bubble can appear empty before any
    content arrives.
    """

    character_id: str
    recipient: str


@dataclass(frozen=True)
class MessageStreamUpdated(WorldEvent):
    """A streaming utterance got more content. ``message`` is the cumulative
    snapshot — frontend should replace, not append."""

    character_id: str
    message: Message


@dataclass(frozen=True)
class MessageStreamCompleted(WorldEvent):
    """A streaming utterance finished. ``message`` is the canonical final
    Message; it has also been appended to ``scene.state.messages`` and
    ``scene.state.streaming_message`` cleared. The character action stays
    speaking with a refreshed estimated_duration covering the read-time
    portion."""

    character_id: str
    message: Message
