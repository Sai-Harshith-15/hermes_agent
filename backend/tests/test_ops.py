import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from jose import jwt

client = TestClient(app)

def get_test_token():
    return jwt.encode({"sub": "admin"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def test_ops_websocket_unauthorized():
    with pytest.raises(Exception): # TestClient raises exception on websocket disconnect
        with client.websocket_connect("/api/v1/ops/ws?op=doctor&token=invalid") as websocket:
            websocket.receive_text()

def test_ops_websocket_unknown_op():
    token = get_test_token()
    with client.websocket_connect(f"/api/v1/ops/ws?op=unknown&token={token}") as websocket:
        msg = websocket.receive_text()
        assert "Unknown operation" in msg
