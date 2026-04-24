from contextlib import asynccontextmanager

import socketio  # type: ignore
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter, _rate_limit_exceeded_handler  # type: ignore[import-untyped]
from slowapi.errors import RateLimitExceeded  # type: ignore[import-untyped]
from slowapi.util import get_remote_address  # type: ignore[import-untyped]

from app.api.endpoints import characters, config, scenes, socket_events
from app.client import SocketIOClient
from app.core.config import settings
from app.core.logging import configure_logging
from app.harness import Harness

configure_logging()
logger = structlog.get_logger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# Harness is process-singleton: it owns in-memory scene state and the
# tick loop, so it must outlive every request.
harness = Harness()


@asynccontextmanager
async def lifespan(app: FastAPI):
    harness.start()
    logger.info("app.startup", env=settings.ENV, db_type=settings.DB_TYPE)
    yield
    logger.info("app.shutdown")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

app.include_router(config.router, prefix=settings.API_V1_STR, tags=["config"])
app.include_router(characters.router, prefix=settings.API_V1_STR, tags=["characters"])
app.include_router(scenes.router, prefix=settings.API_V1_STR, tags=["scenes"])
app.include_router(socket_events.router, prefix=settings.API_V1_STR, tags=["socket-events"])

Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=settings.cors_origins)
app.state.socket_server = sio
socket_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)

# Wire the Client layer: the SocketIOClient subscribes to World events
# and registers Socket.IO connect/disconnect handlers internally. Held
# at module scope so the registration outlives this import.
socketio_client = SocketIOClient(sio, harness.world, harness)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
