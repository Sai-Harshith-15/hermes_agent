from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class AgentRuns(SQLModel, table=True):
    __tablename__ = "agent_runs"
    
    id: str = Field(primary_key=True)
    profile_name: str
    role: str
    model_route: str
    
    supervisor_id: Optional[str] = None
    backend_type: str = "local"
    layer: Optional[int] = None
    
    status: str = "Active"
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    
    tasks: List["Tasks"] = Relationship(back_populates="run")
    logs: List["AgentLogs"] = Relationship(back_populates="run")
