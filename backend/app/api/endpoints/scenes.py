from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from app.models.scene import SceneConfig, SceneStatus, CreateSceneConfig
from app.services.scene_config_manager import SceneConfigManager
from app.utils.error_handling import format_validation_errors


router = APIRouter()
scene_config_manager = SceneConfigManager()


class VotePayload(BaseModel):
    vote: int


@router.post("/scenes/propose", response_model=SceneConfig)
async def propose_scene(scene: CreateSceneConfig):
    """Propose a new scene."""
    try:
        return await scene_config_manager.propose_scene(scene)
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


@router.post("/scenes/{scene_id}/vote")
async def vote_scene(scene_id: str, payload: VotePayload):
    """Vote on a scene proposal."""
    if payload.vote not in [-1, 1]:
        raise HTTPException(status_code=400, detail="Vote must be -1 or 1")

    scene = await scene_config_manager.vote_proposal(int(scene_id), payload.vote)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.post("/scenes/{scene_id}/reject")
async def reject_scene(scene_id: str):
    """Reject a proposed scene."""
    scene = await scene_config_manager.reject_proposal(int(scene_id))
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.post("/scenes/{scene_id}/comment")
async def add_comment(scene_id: str, user: str, comment: str):
    """Add a comment to a scene proposal."""
    scene = await scene_config_manager.add_comment_on_proposal(
        int(scene_id), user, comment
    )
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.get("/scenes/proposed", response_model=list[SceneConfig])
async def get_proposed_scenes():
    """Get all proposed scenes."""
    return await scene_config_manager.get_proposals(SceneStatus.PROPOSED)


@router.get("/scenes/{scene_id}", response_model=SceneConfig)
async def get_scene_config(scene_id: str):
    """Get a scene config by ID."""
    scene = await scene_config_manager.get_scene_config(int(scene_id))
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene
