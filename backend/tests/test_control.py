import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.hermes.control_adapter import HermesControlAdapter
from unittest.mock import patch

client = TestClient(app)

@pytest.fixture
def mock_control_adapter():
    with patch("app.api.v1.control.adapter") as mock_adapter:
        yield mock_adapter

def test_inject_task_endpoint(mock_control_adapter):
    mock_control_adapter.inject_task.return_value = {"id": "123", "status": "success", "output": ""}
    
    response = client.post("/api/v1/control/inject-task", json={
        "task_spec": "Build a new feature",
        "priority": "high"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_control_adapter.inject_task.assert_called_once_with("Build a new feature", "high")

def test_steer_agent_endpoint(mock_control_adapter):
    mock_control_adapter.steer_agent.return_value = {"id": "124", "status": "success", "output": ""}
    
    response = client.post("/api/v1/control/steer-agent", json={
        "agent_name": "swe_lead",
        "message": "Use the existing utility"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_control_adapter.steer_agent.assert_called_once_with("swe_lead", "Use the existing utility")

def test_pause_agent_endpoint(mock_control_adapter):
    mock_control_adapter.pause_agent.return_value = {"id": "125", "status": "success", "output": ""}
    
    response = client.post("/api/v1/control/pause-agent", json={
        "agent_name": "swe_lead"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_control_adapter.pause_agent.assert_called_once_with("swe_lead")

def test_resume_agent_endpoint(mock_control_adapter):
    mock_control_adapter.resume_agent.return_value = {"id": "126", "status": "success", "output": ""}
    
    response = client.post("/api/v1/control/resume-agent", json={
        "agent_name": "swe_lead"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_control_adapter.resume_agent.assert_called_once_with("swe_lead")

def test_kill_agent_endpoint(mock_control_adapter):
    mock_control_adapter.kill_agent.return_value = {"id": "127", "status": "success", "output": ""}
    
    response = client.post("/api/v1/control/kill-agent", json={
        "agent_name": "swe_lead"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_control_adapter.kill_agent.assert_called_once_with("swe_lead")

def test_control_adapter_subprocess(tmp_path):
    adapter = HermesControlAdapter(hermes_dir=str(tmp_path))
    
    with patch("subprocess.run") as mock_run:
        mock_run.return_value.stdout = "Task injected"
        mock_run.return_value.returncode = 0
        
        intent = adapter.inject_task("Fix bug", "high")
        
        assert intent["status"] == "success"
        assert "id" in intent
        assert intent["output"] == "Task injected"
        mock_run.assert_called_once()
