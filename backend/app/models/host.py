from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class HostMetrics(SQLModel, table=True):
    __tablename__ = "host_metrics"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cpu_usage: float
    ram_used: float
    ram_total: float = 24.00
    storage_used: float
    storage_total: float = 200.00
    daemon_status: str = "Active"
