"""Unit tests for SceneConfigService against an in-memory SQLite DB."""

import pytest

from app.services.scene_config_service import SceneConfigService


@pytest.mark.usefixtures("session_factory")
class TestSceneConfigService:
    async def test_get_proposals_empty(self):
        svc = SceneConfigService()
        proposals = await svc.get_proposals()
        assert proposals == []

    async def test_get_by_id_missing(self):
        svc = SceneConfigService()
        result = await svc.get_by_id(99999)
        assert result is None
