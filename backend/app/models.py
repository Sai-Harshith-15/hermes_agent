from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

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

class ApiKeyPool(SQLModel, table=True):
    __tablename__ = "api_key_pool"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    provider: str
    model_name: str
    api_key_masked: str
    rpm_limit: int = 60
    current_usage_pct: float = 0.00
    status: str = "Active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    usages: List["ApiKeyUsages"] = Relationship(back_populates="key")

class ApiKeyUsages(SQLModel, table=True):
    __tablename__ = "api_key_usages"
    
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

class AgentRuns(SQLModel, table=True):
    __tablename__ = "agent_runs"
    
    id: str = Field(primary_key=True)
    profile_name: str
    role: str
    model_route: str
    status: str = "Active"
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    
    tasks: List["Tasks"] = Relationship(back_populates="run")
    logs: List["AgentLogs"] = Relationship(back_populates="run")

class Tasks(SQLModel, table=True):
    __tablename__ = "tasks"
    
    id: str = Field(primary_key=True)
    run_id: Optional[str] = Field(default=None, foreign_key="agent_runs.id")
    title: str
    agent_name: Optional[str] = None
    status: str = "Backlog"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    run: Optional[AgentRuns] = Relationship(back_populates="tasks")
    logs: List["AgentLogs"] = Relationship(back_populates="task")

class AgentLogs(SQLModel, table=True):
    __tablename__ = "agent_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[str] = Field(default=None, foreign_key="agent_runs.id")
    task_id: Optional[str] = Field(default=None, foreign_key="tasks.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str
    message: str
    log_level: str = "INFO"
    
    run: Optional[AgentRuns] = Relationship(back_populates="logs")
    task: Optional[Tasks] = Relationship(back_populates="logs")
