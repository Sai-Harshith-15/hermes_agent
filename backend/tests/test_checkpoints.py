import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_checkpoints_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/ops/checkpoints")
    assert response.status_code == 401
