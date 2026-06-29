import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_shell_hooks(client: AsyncClient):
    response = await client.get("/api/v1/ops/hooks/shell")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_shell_hook(client: AsyncClient):
    payload = {
        "event": "npm_install",
        "command": "npm install",
        "matcher": "npm",
        "timeout": 30,
        "approved": False
    }
    response = await client.post("/api/v1/ops/hooks/shell", json=payload)
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_get_webhooks(client: AsyncClient):
    response = await client.get("/api/v1/ops/hooks/webhooks")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_webhook(client: AsyncClient):
    payload = {
        "name": "test_hook",
        "target_url": "http://localhost:8080",
        "event_filter": "*"
    }
    response = await client.post("/api/v1/ops/hooks/webhooks", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "hook" in data
    assert "one_time_secret" in data
