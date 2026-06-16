import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.hermes.control_adapter import HermesControlAdapter
from unittest.mock import patch, MagicMock

client = TestClient(app)

@pytest.fixture
def mock_control_adapter():
    with patch("app.api.v1.control.adapter") as mock_adapter:
        yield mock_adapter

def test_inject_task_endpoint(mock_control_adapter):
    mock_control_adapter.inject_task.return_value = {"id": "123", "type": "inject_task"}
    
    response = client.post("/api/v1/control/inject-task", json={
        "task_spec": "Build a new feature",
        "priority": "high"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["intent"]["id"] == "123"
    mock_control_adapter.inject_task.assert_called_once_with("Build a new feature", "high")

def test_steer_agent_endpoint(mock_control_adapter):
    mock_control_adapter.steer_agent.return_value = {"id": "124", "type": "steer_agent"}
    
    response = client.post("/api/v1/control/steer-agent", json={
        "agent_name": "swe_lead",
        "message": "Use the existing utility"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["intent"]["id"] == "124"
    mock_control_adapter.steer_agent.assert_called_once_with("swe_lead", "Use the existing utility")

def test_pause_agent_endpoint(mock_control_adapter):
    mock_control_adapter.pause_agent.return_value = {"id": "125", "type": "pause_agent"}
    
    response = client.post("/api/v1/control/pause-agent", json={
        "agent_name": "swe_lead"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["intent"]["id"] == "125"
    mock_control_adapter.pause_agent.assert_called_once_with("swe_lead")

def test_control_adapter_file_writing(tmp_path):
    adapter = HermesControlAdapter(hermes_dir=str(tmp_path))
    
    intent = adapter.steer_agent("swe_lead", "Test message")
    
    assert intent["type"] == "steer_agent"
    assert intent["payload"]["agent_name"] == "swe_lead"
    assert intent["payload"]["message"] == "Test message"
    
    # Verify file was written
    inbox_dir = tmp_path / "control" / "inbox"
    files = list(inbox_dir.glob("steer_agent_*.json"))
    assert len(files) == 1
