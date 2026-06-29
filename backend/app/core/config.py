from pydantic_settings import BaseSettings
import os
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hermes Mission Control"
    DB_NAME: str = "sample-db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "dummy_password"
    DB_HOST: str = "127.0.0.1"
    DB_PORT: str = "5432"
    
    SECRET_KEY: str = "default_secret_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Fernet symmetric encryption key for the Vault (must be 32 url-safe base64-encoded bytes)
    MASTER_KEY: str = "ZGVmYXVsdF9tYXN0ZXJfa2V5X2NoYW5nZV9tZV9ub3c="
    
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def DATABASE_URL(self) -> str:
        # Resolve to standard hermes_state.db path with async driver
        hermes_dir = os.environ.get("HERMES_DIR", "~/.hermes")
        db_path = os.path.expanduser(f"{hermes_dir}/hermes_state.db")
        return f"sqlite+aiosqlite:///{db_path}"

    class Config:
        env_file = ".env"

settings = Settings()
