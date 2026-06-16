import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_agents_endpoint():
    response = client.get("/api/v1/agents/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_sessions_endpoint():
    response = client.get("/api/v1/sessions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_skills_endpoint():
    response = client.get("/api/v1/skills/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_memory_endpoint():
    response = client.get("/api/v1/memory/search?q=test")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_profiles_endpoint():
    response = client.get("/api/v1/profiles/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_config_endpoint():
    response = client.get("/api/v1/profiles/config")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
