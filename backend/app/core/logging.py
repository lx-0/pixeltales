"""Structured logging configuration via structlog."""

import logging
import sys
from typing import Any

import structlog

from app.core.config import settings


def configure_logging() -> None:
    """Configure structlog + stdlib logging with env-aware renderers.

    Dev: pretty console output with colors.
    Prod: JSON for machine ingestion.
    """
    is_dev = settings.ENV == "development"
    level = logging.DEBUG if is_dev else logging.INFO

    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        timestamper,
    ]

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    renderer: Any = (
        structlog.dev.ConsoleRenderer(colors=True)
        if is_dev
        else structlog.processors.JSONRenderer()
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)

    # Quiet down chatty libs
    for noisy in ("uvicorn.access", "engineio.server", "socketio.server"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
