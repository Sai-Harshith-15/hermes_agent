import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_dashboard_state_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/state")
    assert response.status_code == 401
