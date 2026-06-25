import os
import pytest
from httpx import AsyncClient
from app.main import app
from app.api.deps import get_current_user

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient):
    response = await client.get(
        "/api/v1/auth/me"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "owner"

@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    # Temporarily remove the dependency override for this test
    original_override = app.dependency_overrides.get(get_current_user)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
    try:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
    finally:
        if original_override:
            app.dependency_overrides[get_current_user] = original_override
