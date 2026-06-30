from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import secrets
from typing import Optional

def _get_or_create_secret(env_var_name: str, is_fernet: bool = False) -> str:
    val = os.environ.get(env_var_name)
    if val:
        return val
    
    # Try to read from .env if it wasn't loaded into environ yet
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if line.startswith(f"{env_var_name}="):
                    return line.strip().split("=", 1)[1].strip().strip('"\'')
    
    # Generate and append to .env
    if is_fernet:
        from cryptography.fernet import Fernet
        new_val = Fernet.generate_key().decode()
    else:
        new_val = secrets.token_urlsafe(32)
        
    with open(env_file, "a") as f:
        f.write(f"\n{env_var_name}={new_val}\n")
    return new_val

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hermes Mission Control"
    
    SECRET_KEY: str = _get_or_create_secret("SECRET_KEY", False)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Fernet symmetric encryption key for the Vault (must be 32 url-safe base64-encoded bytes)
    MASTER_KEY: str = _get_or_create_secret("MASTER_KEY", True)
    
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def DATABASE_URL(self) -> str:
        # Resolve to standard hermes_state.db path with async driver
        hermes_dir = os.environ.get("HERMES_DIR", "~/.hermes")
        db_path = os.path.expanduser(f"{hermes_dir}/hermes_state.db")
        return f"sqlite+aiosqlite:///{db_path}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
