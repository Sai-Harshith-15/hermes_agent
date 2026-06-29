import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_sandbox_diff(client: AsyncClient):
    response = await client.get("/api/v1/sandbox/diff")
    assert response.status_code == 200
    assert "diff" in response.json()
