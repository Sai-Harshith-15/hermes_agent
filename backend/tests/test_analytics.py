import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_daily_analytics(client: AsyncClient):
    response = await client.get("/api/v1/analytics/daily")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
