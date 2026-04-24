"""Schemas-only endpoint that documents Socket.IO event payloads.

The endpoint is never actually called over HTTP — it exists so that
OpenAPI codegen picks up the payload shapes for the typed frontend
Socket.IO client.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.scene import SceneState

router = APIRouter()


class ServerToClientEvents(BaseModel):
    """Events the server emits over Socket.IO."""

    scene_state: SceneState


@router.get(
    "/socket-events/server-to-client",
    response_model=ServerToClientEvents,
    summary="Socket.IO server→client event catalog (codegen only)",
)
async def socket_events_catalog() -> ServerToClientEvents:
    raise HTTPException(status_code=501, detail="schemas-only endpoint")
