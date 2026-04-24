"""World layer — server-authoritative scene state.

The :class:`World` wraps a :class:`Scene` (state + config) and exposes a
mutation API used by the Harness. Every mutation fires a corresponding
:class:`WorldEvent`; subscribers (Clients, snapshotters, …) receive events
without the World knowing who's listening.
"""

from app.world.events import (
    CharacterActionChanged,
    CharacterMessageAdded,
    CharacterMoodChanged,
    ConversationEnded,
    EndConversationRequested,
    EndConversationRequestsExpired,
    VisitorCountChanged,
    WorldEvent,
)
from app.world.state import World

__all__ = [
    "CharacterActionChanged",
    "CharacterMessageAdded",
    "CharacterMoodChanged",
    "ConversationEnded",
    "EndConversationRequested",
    "EndConversationRequestsExpired",
    "VisitorCountChanged",
    "World",
    "WorldEvent",
]
