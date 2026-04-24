"""Socket.IO bridge between the :class:`World` and Phaser viewers.

The :class:`SocketIOClient` subscribes to every :class:`WorldEvent` and
broadcasts the current scene state to all connected viewers. It also
forwards visitor connect/disconnect from the Socket.IO server into the
:class:`Harness` so the audience-size mutation flows back through the
World mutation API (which then re-fires an event the client itself
broadcasts — see ``_on_world_event``).

This is the Client layer in the 4-layer architecture: it knows about
Socket.IO wire formats; it does **not** know about scene loops, LLMs,
or persistence.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import socketio  # type: ignore
import structlog

from app.core.metrics import visitors_active
from app.world import World, WorldEvent

if TYPE_CHECKING:
    from app.harness import Harness

logger = structlog.get_logger(__name__)


class SocketIOClient:
    """Adapter that bridges a :class:`World` and a Socket.IO server.

    Lifecycle:
    1. ``__init__`` registers the world subscriber and the connect/
       disconnect handlers on the Socket.IO server.
    2. Any subsequent World mutation fires an event → the subscriber
       emits ``scene_state`` to every connected room.
    3. Visitor join/leave hits the connect/disconnect handlers, which
       call into the Harness; the Harness mutates the World, which fires
       another event, which causes the broadcast above. No direct
       wiring back from Harness to socket — every emit is event-driven.
    """

    def __init__(self, sio: socketio.AsyncServer, world: World, harness: Harness) -> None:
        self._sio = sio
        self._world = world
        self._harness = harness
        self._world.subscribe(self._on_world_event)
        self._register_handlers()

    def _register_handlers(self) -> None:
        """Bind the Socket.IO connect/disconnect events on the server.

        Wrapped in a private method so the registration is colocated
        with the client; ``app/main.py`` only instantiates the client
        and is otherwise oblivious to the Socket.IO surface.
        """

        @self._sio.event  # type: ignore[misc]
        async def connect(sid: str, environ: dict[str, Any]) -> None:
            logger.info("socket.connect", sid=sid)
            visitors_active.inc()
            await self._harness.add_visitor(sid)
            # Bootstrap the new viewer with the latest snapshot — the
            # World event already broadcast to the room, but the
            # join-time emit ensures the new sid sees the same payload
            # even if the event fired before the room was joined.
            await self._emit_to(sid)

        @self._sio.event  # type: ignore[misc]
        async def disconnect(sid: str) -> None:
            logger.info("socket.disconnect", sid=sid)
            visitors_active.dec()
            await self._harness.remove_visitor(sid)

    async def _on_world_event(self, event: WorldEvent) -> None:
        """Broadcast the full scene state on every mutation.

        Today every event fans out to a single ``scene_state`` emit —
        the frontend already replaces its full local state on each
        receive, so emitting deltas would just complicate the wire
        format without gaining anything. If that changes, dispatch on
        ``type(event)`` here.
        """
        if self._world.scene is None:
            return
        await self._emit_to(None)
        # Don't log the event payload — messages contain free-form text.
        logger.debug("client.scene_state.broadcast", event_type=type(event).__name__)

    async def _emit_to(self, sid: str | None) -> None:
        """Emit ``scene_state`` to a single sid (or to all rooms if ``None``)."""
        if self._world.scene is None:
            return
        state = self._world.scene.state
        await self._sio.emit("scene_state", state.model_dump(), room=sid)
