import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.hermes.sandbox_service import HermesSandboxService
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_sandbox_list_files():
    service = HermesSandboxService(container_name="test_container")
    with patch("subprocess.check_output") as mock_check_output:
        # Mock awk output: perms size name
        mock_check_output.return_value = "drwxr-xr-x 4096 src\n-rw-r--r-- 123 test1.txt\n"
        
        files = service.list_files("/")
        
        assert len(files) == 2
        assert files[0]["name"] == "src"
        assert files[0]["is_dir"] is True
        assert files[1]["name"] == "test1.txt"
        assert files[1]["is_dir"] is False

def test_sandbox_read_file():
    service = HermesSandboxService(container_name="test_container")
    with patch("subprocess.check_output") as mock_check_output:
        mock_check_output.return_value = "Hello World"
        
        content = service.read_file("test1.txt")
        assert content == "Hello World"

def test_sandbox_write_file():
    service = HermesSandboxService(container_name="test_container")
    with patch("subprocess.Popen") as mock_popen:
        mock_process = MagicMock()
        mock_process.communicate.return_value = ("stdout", "stderr")
        mock_process.returncode = 0
        mock_popen.return_value = mock_process
        
        assert service.write_file("new_file.txt", "New Content") is True

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
