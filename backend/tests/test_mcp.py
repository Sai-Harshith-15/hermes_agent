import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_mcp_servers(client: AsyncClient):
    response = await client.get("/api/v1/mcp")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_add_mcp_server(client: AsyncClient):
    payload = {
        "name": "test_server",
        "type": "stdio",
        "command_or_url": "python -c 'print(1)'"
    }
    response = await client.post("/api/v1/mcp", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_delete_mcp_server(client: AsyncClient):
    response = await client.delete("/api/v1/mcp/test_server")
    # Even if not found or successful, check structure
    assert response.status_code in (200, 404)
