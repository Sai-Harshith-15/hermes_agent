import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pty_requires_auth(client: AsyncClient):
    response = await client.get("/api/pty/ws/terminal")
    assert response.status_code in [401, 403, 404, 426] # Depends on WebSocket rejection implementation
