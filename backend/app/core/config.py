from pydantic_settings import BaseSettings
import os
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hermes Mission Control"
    DB_NAME: str = "sample-db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str
    DB_HOST: str = "127.0.0.1"
    DB_PORT: str = "5432"
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Fernet symmetric encryption key for the Vault
    MASTER_KEY: str

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"

settings = Settings()
