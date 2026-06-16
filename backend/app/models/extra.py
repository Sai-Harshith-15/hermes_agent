from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional

def utcnow():
    return datetime.now(timezone.utc)

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"
    id: Optional[int] = Field(default=None, primary_key=True)
    actor: str
    action: str
    target: str
    ip: Optional[str] = None
    result: str
    ts: datetime = Field(default_factory=utcnow)

class AgentProfile(SQLModel, table=True):
    __tablename__ = "agent_profiles"
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_name: str = Field(unique=True)
    role: str
    soul_md: str
    taste_md: str
    model_route: str
    enabled_tools: str
    version: int = Field(default=1)

class Skill(SQLModel, table=True):
    __tablename__ = "skills"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    source_tier: str
    owner_agent: str
    description: str
    file_ref: str
    usage_count: int = Field(default=0)

class SessionIndex(SQLModel, table=True):
    __tablename__ = "sessions_index"
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(unique=True)
    agent_name: str
    status: str
    start_time: datetime = Field(default_factory=utcnow)
    end_time: Optional[datetime] = None

class McpRegistry(SQLModel, table=True):
    __tablename__ = "mcp_registry"
    id: Optional[int] = Field(default=None, primary_key=True)
    resource: str
    constraint: str
    verdict: str
    hit_count: int = Field(default=0)

class Tunnel(SQLModel, table=True):
    __tablename__ = "tunnels"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    url: str
    target: str
    access_policy: str
    status: str
    token_ref: Optional[int] = None

class OutputChannel(SQLModel, table=True):
    __tablename__ = "output_channels"
    id: Optional[int] = Field(default=None, primary_key=True)
    platform: str
    account: str
    quota_used: int = Field(default=0)
    quota_limit: int
    next_run: Optional[datetime] = None
    status: str

class AgentMessage(SQLModel, table=True):
    __tablename__ = "agent_messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    from_agent: str
    to_agent: str
    task_id: Optional[int] = None
    content: str
    ts: datetime = Field(default_factory=utcnow)
