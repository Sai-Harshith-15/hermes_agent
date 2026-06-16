import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch

client = TestClient(app)

@pytest.fixture
def mock_config_adapter():
    with patch("app.api.v1.profiles.adapter") as mock_adapter:
        yield mock_adapter

def test_update_soul_endpoint(mock_config_adapter):
    mock_config_adapter.update_soul.return_value = True
    
    response = client.put("/api/v1/profiles/test_agent/soul", json={
        "content": "You are a test agent."
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_config_adapter.update_soul.assert_called_once_with("test_agent", "You are a test agent.")

def test_update_taste_endpoint(mock_config_adapter):
    mock_config_adapter.update_taste.return_value = True
    
    response = client.put("/api/v1/profiles/test_agent/taste", json={
        "content": "Always write clean code."
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_config_adapter.update_taste.assert_called_once_with("test_agent", "Always write clean code.")

def test_update_soul_failure(mock_config_adapter):
    mock_config_adapter.update_soul.return_value = False
    
    response = client.put("/api/v1/profiles/test_agent/soul", json={
        "content": "You are a test agent."
    })
    
    assert response.status_code == 500
    assert "Failed" in response.json()["detail"]
