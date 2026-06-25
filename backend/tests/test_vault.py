import pytest
from app.core.vault import encrypt_secret, decrypt_secret, mask_secret

def test_vault_encryption():
    plaintext = "sk-test-super-secret-key-12345"
    encrypted = encrypt_secret(plaintext)
    
    # Ensure it's encrypted
    assert encrypted != plaintext
    assert len(encrypted) > len(plaintext)
    
    # Ensure decryption works
    decrypted = decrypt_secret(encrypted)
    assert decrypted == plaintext

def test_vault_mask_secret():
    assert mask_secret("sk-1234567890abcdef") == "sk-1...cdef"
    assert mask_secret("short") == "***"
    assert mask_secret("") == ""

from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch

client = TestClient(app)

def test_vault_rotate_endpoint():
    response = client.post("/api/v1/vault/rotate", json={"key_id": "TEST_KEY_1"})
    assert response.status_code == 200
    assert "Rotation requested" in response.json()["message"]

@patch("app.api.v1.vault.get_key")
def test_vault_reveal_endpoint(mock_get_key):
    mock_get_key.return_value = "sk-test-real-key"
    
    with patch("pathlib.Path.exists") as mock_exists:
        mock_exists.return_value = True
        response = client.post("/api/v1/vault/reveal", json={"key_id": "TEST_KEY_1"})
        
    assert response.status_code == 200
    assert response.json()["key"] == "sk-test-real-key"
