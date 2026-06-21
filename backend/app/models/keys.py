from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class ApiKeyPool(SQLModel, table=True):
    __tablename__ = "api_key_pool"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    provider: str
    model_name: str
    api_key_masked: str
    
    encrypted_secret: Optional[str] = None
    provider_type: Optional[str] = None
    tpm_limit: Optional[int] = None
    daily_budget: Optional[float] = None
    predicted_exhaustion: Optional[datetime] = None
    last_probe_status: Optional[str] = None
    assigned_agents: Optional[str] = None
    
    rpm_limit: int = 60
    current_usage_pct: float = 0.00
    status: str = "Active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    usages: List["ModelUsage"] = Relationship(back_populates="key")

class ModelUsage(SQLModel, table=True):
    __tablename__ = "model_usage"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key_id: int = Field(foreign_key="api_key_pool.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.000000
    latency_ms: int = 0
    status_code: int = 200
    
    key: ApiKeyPool = Relationship(back_populates="usages")
