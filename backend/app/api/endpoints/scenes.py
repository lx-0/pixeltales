import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from app.models.scene import SceneConfig, CreateSceneConfig
from app.services.scene_config_service import SceneConfigService
from app.utils.error_handling import format_validation_errors

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()
scene_config_service = SceneConfigService()


class VotePayload(BaseModel):
    vote: int


@router.get("/scenes/proposed", response_model=list[SceneConfig])
async def get_proposed_scenes():
    """Get all proposed scene configs."""
    return await scene_config_service.get_proposals()


@router.get("/scenes/{scene_config_id}", response_model=SceneConfig)
async def get_scene_config(scene_config_id: str):
    """Get a scene config by ID."""
    scene = await scene_config_service.get_by_id(int(scene_config_id))
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.post("/scenes/propose", response_model=SceneConfig)
async def propose_scene(scene_config: CreateSceneConfig):
    """Propose a new scene config."""
    try:
        return await scene_config_service.create_scene_config_proposal(scene_config)
    except ValidationError as e:
        formatted_errors = format_validation_errors(e)
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Invalid scene configuration",
                "errors": formatted_errors,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to propose scene: {str(e)}"
        )


@router.post("/scenes/{scene_config_id}/vote")
async def vote_scene(scene_config_id: str, payload: VotePayload) -> SceneConfig:
    """Vote on a scene config proposal."""
    if payload.vote not in [-1, 1]:
        raise HTTPException(status_code=400, detail="Vote must be -1 or 1")

    try:
        return await scene_config_service.increment_votes(
            int(scene_config_id), payload.vote
        )
    except Exception as e:
        logger.error(f"Error voting on scene config {scene_config_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to vote on scene: {str(e)}"
        )


@router.post("/scenes/{scene_config_id}/reject")
async def reject_scene(scene_config_id: str):
    """Reject a proposed scene config."""
    return await scene_config_service.reject_proposal(int(scene_config_id))


@router.post("/scenes/{scene_config_id}/comment")
async def add_comment(scene_config_id: str, user: str, comment: str):
    """Add a comment to a scene config proposal."""
    return await scene_config_service.add_comment_on_proposal(
        int(scene_config_id), user, comment
    )
