import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.services.hermes.sandbox_service import HermesSandboxService
from unittest.mock import patch

client = TestClient(app)

@pytest.fixture
def temp_sandbox(tmp_path):
    base_dir = tmp_path / ".hermes"
    base_dir.mkdir()
    
    # Create some dummy files
    (base_dir / "test1.txt").write_text("Hello World")
    
    sub_dir = base_dir / "src"
    sub_dir.mkdir()
    (sub_dir / "main.py").write_text("print('test')")
    
    return base_dir

def test_sandbox_list_files(temp_sandbox):
    service = HermesSandboxService(base_dir=str(temp_sandbox))
    files = service.list_files("")
    
    assert len(files) == 2
    # Check that src is a dir and is sorted first
    assert files[0]["name"] == "src"
    assert files[0]["is_dir"] is True
    assert files[1]["name"] == "test1.txt"
    assert files[1]["is_dir"] is False

def test_sandbox_read_file(temp_sandbox):
    service = HermesSandboxService(base_dir=str(temp_sandbox))
    content = service.read_file("test1.txt")
    assert content == "Hello World"

def test_sandbox_write_file(temp_sandbox):
    service = HermesSandboxService(base_dir=str(temp_sandbox))
    service.write_file("new_file.txt", "New Content")
    
    assert (temp_sandbox / "new_file.txt").exists()
    assert (temp_sandbox / "new_file.txt").read_text() == "New Content"

def test_sandbox_path_traversal(temp_sandbox):
    service = HermesSandboxService(base_dir=str(temp_sandbox))
    with pytest.raises(ValueError):
        service.read_file("../outside.txt")

@patch("app.api.v1.sandbox.sandbox_service")
def test_api_list_files(mock_service):
    mock_service.list_files.return_value = [{"name": "test.txt", "path": "test.txt", "is_dir": False}]
    
    response = client.get("/api/v1/sandbox/files")
    assert response.status_code == 200
    assert response.json()[0]["name"] == "test.txt"

@patch("app.api.v1.sandbox.sandbox_service")
def test_api_read_file(mock_service):
    mock_service.read_file.return_value = "Mocked content"
    
    response = client.get("/api/v1/sandbox/file?path=test.txt")
    assert response.status_code == 200
    assert response.json()["content"] == "Mocked content"

@patch("app.api.v1.sandbox.sandbox_service")
def test_api_write_file(mock_service):
    mock_service.write_file.return_value = True
    
    response = client.put("/api/v1/sandbox/file?path=test.txt", json={"content": "New data"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    mock_service.write_file.assert_called_once_with("test.txt", "New data")
