from typing import Any, Dict
import socketio  # type: ignore

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.services.scene_manager import SceneManager
from app.api.endpoints import config, scenes


# Initialize scene manager
scene_manager = SceneManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app."""
    # Startup
    sio = app.state.socket_server
    await scene_manager.set_socket_instance(sio)
    yield
    # Shutdown
    # Add cleanup code here if needed


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(config.router, prefix=settings.API_V1_STR, tags=["config"])
app.include_router(scenes.router, prefix=settings.API_V1_STR, tags=["scenes"])

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode="asgi", cors_allowed_origins=settings.cors_origins
)

# Store socket server in app state
app.state.socket_server = sio

# Create Socket.IO app
socket_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)


# Socket.IO event handlers
@sio.event  # type: ignore
async def connect(sid: str, environ: Dict[str, Any]):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    # Inform scene manager about new visitor
    await scene_manager.add_visitor(sid)


@sio.event  # type: ignore
async def disconnect(sid: str):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    await scene_manager.remove_visitor(sid)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
