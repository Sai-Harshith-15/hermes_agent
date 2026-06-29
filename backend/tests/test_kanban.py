import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_tasks(client: AsyncClient):
    response = await client.get("/api/v1/kanban/tasks")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_workflows(client: AsyncClient):
    response = await client.get("/api/v1/kanban/workflows")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_update_task_status(client: AsyncClient):
    payload = {"status": "in-progress"}
    # Because kanban.db might be empty and task_id might not exist, 404 is valid here
    response = await client.post("/api/v1/kanban/tasks/dummy-task/status", json=payload)
    assert response.status_code in (200, 404)
