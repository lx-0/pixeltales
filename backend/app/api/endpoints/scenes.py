from functools import lru_cache

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ValidationError

from app.models.scene import CreateSceneConfig, SceneConfig
from app.services.scene_config_service import SceneConfigService
from app.utils.error_handling import format_validation_errors

logger = structlog.get_logger(__name__)

router = APIRouter()


@lru_cache(maxsize=1)
def get_scene_config_service() -> SceneConfigService:
    """Singleton-via-cache: SceneConfigService is stateless, so one instance
    is fine. FastAPI re-uses the cached return value across requests."""
    return SceneConfigService()


SceneConfigDep = Depends(get_scene_config_service)


class VotePayload(BaseModel):
    vote: int


@router.get("/scenes/proposed", response_model=list[SceneConfig])
async def get_proposed_scenes(svc: SceneConfigService = SceneConfigDep):
    return await svc.get_proposals()


@router.get("/scenes/{scene_config_id}", response_model=SceneConfig)
async def get_scene_config(scene_config_id: str, svc: SceneConfigService = SceneConfigDep):
    scene = await svc.get_by_id(int(scene_config_id))
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.post("/scenes/propose", response_model=SceneConfig)
async def propose_scene(scene_config: CreateSceneConfig, svc: SceneConfigService = SceneConfigDep):
    try:
        return await svc.create_scene_config_proposal(scene_config)
    except ValidationError as e:
        formatted_errors = format_validation_errors(e)
        raise HTTPException(
            status_code=422,
            detail={"message": "Invalid scene configuration", "errors": formatted_errors},
        ) from e
    except Exception as e:
        logger.exception("scene.propose_failed")
        raise HTTPException(status_code=500, detail=f"Failed to propose scene: {e!s}") from e


@router.post("/scenes/{scene_config_id}/vote")
async def vote_scene(
    scene_config_id: str,
    payload: VotePayload,
    svc: SceneConfigService = SceneConfigDep,
) -> SceneConfig:
    if payload.vote not in [-1, 1]:
        raise HTTPException(status_code=400, detail="Vote must be -1 or 1")

    try:
        return await svc.increment_votes(int(scene_config_id), payload.vote)
    except Exception as e:
        logger.exception("scene.vote_failed", scene_config_id=scene_config_id)
        raise HTTPException(status_code=500, detail=f"Failed to vote on scene: {e!s}") from e


@router.post("/scenes/{scene_config_id}/reject")
async def reject_scene(scene_config_id: str, svc: SceneConfigService = SceneConfigDep):
    return await svc.reject_proposal(int(scene_config_id))


@router.post("/scenes/{scene_config_id}/comment")
async def add_comment(
    scene_config_id: str, user: str, comment: str, svc: SceneConfigService = SceneConfigDep
):
    return await svc.add_comment_on_proposal(int(scene_config_id), user, comment)
