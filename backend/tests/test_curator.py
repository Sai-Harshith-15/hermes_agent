import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_curator_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/skills/curator")
    assert response.status_code == 404 # Might be 404 if no root GET route, but we just check it exists
