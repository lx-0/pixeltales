"""Client layer — I/O adapters between :class:`World` and the outside.

Each Client subscribes to :class:`WorldEvent`-s and translates them into
its wire format (Socket.IO emits today; REST cache busts, Twitch chat
lines, Discord webhooks tomorrow). Multiple Clients can serve the same
World simultaneously without coupling to each other or to the Harness.
"""

from app.client.socketio import SocketIOClient

__all__ = ["SocketIOClient"]
