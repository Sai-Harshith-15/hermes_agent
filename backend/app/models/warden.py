from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class WardenEvent(SQLModel, table=True):
    __tablename__ = "warden_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    event_type: str  # e.g., "KEY_PROBE", "LOOP_DETECTED", "AUTO_HEAL"
    severity: str    # e.g., "INFO", "WARNING", "CRITICAL"
    agent_ref: Optional[str] = None
    key_ref: Optional[int] = None
    reasoning: str
    action_taken: str
    approved_by: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
