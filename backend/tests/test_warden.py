import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_events(client: AsyncClient):
    response = await client.get("/api/v1/warden/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_trigger_probe(client: AsyncClient):
    response = await client.post("/api/v1/warden/trigger_probe")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_trigger_loop_detection(client: AsyncClient):
    response = await client.post("/api/v1/warden/trigger_loop_detection")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_heal_not_found(client: AsyncClient):
    payload = {"event_id": 9999, "action": "Suggested Key Rotation"}
    response = await client.post("/api/v1/warden/heal", json=payload)
    # The API returns {"status": "error", "reason": "Event not found"} with 200 OK right now
    assert response.status_code == 200
    assert response.json()["status"] == "error"
