import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_warden_events_endpoint():
    response = client.get("/api/v1/warden/events")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_trigger_probe_endpoint():
    response = client.post("/api/v1/warden/trigger_probe")
    assert response.status_code == 200
    assert response.json()["status"] == "Key probe triggered"

def test_trigger_loop_detection_endpoint():
    response = client.post("/api/v1/warden/trigger_loop_detection")
    assert response.status_code == 200
    assert response.json()["status"] == "Loop detection triggered"
