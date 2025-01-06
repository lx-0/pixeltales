from fastapi import APIRouter

from app.models.config import ConfigOptions
from app.config import CHARACTER_COLORS, LLM_PROVIDERS

router = APIRouter()


@router.get("/config", response_model=ConfigOptions)
async def get_config_options() -> ConfigOptions:
    """Get available configuration options."""
    return ConfigOptions(
        llm_providers=LLM_PROVIDERS,
        colors=CHARACTER_COLORS,
    )
