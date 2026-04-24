"""Character library API.

GET  /api/v1/characters       — list every character in the library
POST /api/v1/characters       — create a new character (writes to data dir)

Library is the single source of truth for character identity. Scene
proposals reference characters by id; create the identity here first.
"""

import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError
from slowapi import Limiter  # type: ignore[import-untyped]
from slowapi.util import get_remote_address  # type: ignore[import-untyped]

from app.agent.characters import load_all, write_character
from app.models.character import CharacterIdentity
from app.utils.error_handling import format_validation_errors

logger = structlog.get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


@router.get("/characters", response_model=list[CharacterIdentity])
async def list_characters() -> list[CharacterIdentity]:
    """Return every character in the library, sorted by id for stability."""
    library = load_all()
    return [library[cid] for cid in sorted(library)]


@router.post("/characters", response_model=CharacterIdentity, status_code=201)
@limiter.limit("10/minute")
async def create_character(request: Request, identity: CharacterIdentity) -> CharacterIdentity:
    """Persist a new character to the runtime data dir.

    409 if the id already exists in the library (seed or data).
    422 if the payload fails Pydantic validation.
    """
    try:
        write_character(identity)
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={"message": "Invalid character", "errors": format_validation_errors(e)},
        ) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    logger.info("character.created", id=identity.id)
    return identity
