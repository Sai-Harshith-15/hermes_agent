from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class AgentLogs(SQLModel, table=True):
    __tablename__ = "agent_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[str] = Field(default=None, foreign_key="agent_runs.id")
    task_id: Optional[str] = Field(default=None, foreign_key="tasks.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str
    message: str
    log_level: str = "INFO"
    
    tool_name: Optional[str] = None
    mcp_resource: Optional[str] = None
    token_cost: Optional[float] = None
    
    run: Optional["AgentRuns"] = Relationship(back_populates="logs")
    task: Optional["Tasks"] = Relationship(back_populates="logs")
