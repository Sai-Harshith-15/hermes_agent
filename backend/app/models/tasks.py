from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Tasks(SQLModel, table=True):
    __tablename__ = "tasks"
    
    id: str = Field(primary_key=True)
    run_id: Optional[str] = Field(default=None, foreign_key="agent_runs.id")
    title: str
    agent_name: Optional[str] = None
    status: str = "Backlog"
    
    parent_task_id: Optional[str] = None
    priority: str = "Normal"
    error_count: int = 0
    loop_score: float = 0.0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    run: Optional["AgentRuns"] = Relationship(back_populates="tasks")
    logs: List["AgentLogs"] = Relationship(back_populates="task")
