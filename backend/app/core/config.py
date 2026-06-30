from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import secrets
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hermes Mission Control"
    
    SECRET_KEY: str = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Fernet symmetric encryption key for the Vault (must be 32 url-safe base64-encoded bytes)
    MASTER_KEY: str = os.environ.get("MASTER_KEY", secrets.token_urlsafe(32))
    
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def DATABASE_URL(self) -> str:
        # Resolve to standard hermes_state.db path with async driver
        hermes_dir = os.environ.get("HERMES_DIR", "~/.hermes")
        db_path = os.path.expanduser(f"{hermes_dir}/hermes_state.db")
        return f"sqlite+aiosqlite:///{db_path}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
