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
