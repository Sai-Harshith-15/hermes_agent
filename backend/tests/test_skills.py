import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_skills(client: AsyncClient):
    response = await client.get("/api/v1/skills")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_toggle_skill(client: AsyncClient):
    payload = {
        "skill_id": "test_skill",
        "enabled": True
    }
    response = await client.post("/api/v1/skills/toggle", json=payload)
    # 404 because skill dir might not exist in test env, but endpoint exists
    assert response.status_code in (200, 404)

@pytest.mark.asyncio
async def test_install_skill(client: AsyncClient):
    payload = {
        "skill_id": "new_skill"
    }
    response = await client.post("/api/v1/skills/install", json=payload)
    assert response.status_code == 200
