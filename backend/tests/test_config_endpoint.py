"""GET /api/v1/config returns the static option lists."""

from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_get_config_options():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/config")

    assert response.status_code == 200
    data = response.json()
    assert "llm_providers" in data
    assert "colors" in data
    assert isinstance(data["llm_providers"], list)
    assert len(data["llm_providers"]) > 0
    assert isinstance(data["colors"], list)
    assert len(data["colors"]) > 0
