import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_profiles(client: AsyncClient):
    response = await client.get("/api/v1/profiles/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_update_profile_config(client: AsyncClient):
    payload = {"content": "system_prompt: test prompt"}
    response = await client.put("/api/v1/profiles/test_agent/config", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
