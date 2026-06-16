from cryptography.fernet import Fernet
from app.core.config import settings

# Initialize Fernet suite with the master key from settings
# The master key MUST be 32 url-safe base64-encoded bytes
f = Fernet(settings.MASTER_KEY.encode())

def encrypt_secret(plaintext: str) -> str:
    """Encrypts a plaintext secret (like an API key) before storing it in the DB."""
    return f.encrypt(plaintext.encode()).decode()

def decrypt_secret(ciphertext: str) -> str:
    """Decrypts a ciphertext secret from the DB back into plaintext."""
    return f.decrypt(ciphertext.encode()).decode()

def mask_secret(plaintext: str) -> str:
    """Returns a masked version of the secret for safe UI display (e.g. sk-xxxx...xxxx)."""
    if not plaintext:
        return ""
    if len(plaintext) <= 8:
        return "***"
    return f"{plaintext[:4]}...{plaintext[-4:]}"
