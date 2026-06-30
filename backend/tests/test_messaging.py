import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_messaging_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/messaging")
    assert response.status_code == 401
