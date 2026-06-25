from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import re

def redact_secrets(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: redact_secrets(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [redact_secrets(i) for i in data]
    elif isinstance(data, str):
        # Mask sk-..., xai-... etc
        return re.sub(r'(sk-[a-zA-Z0-9]{4})[a-zA-Z0-9]+', r'\1...[REDACTED]', data)
    return data

class BaseRedactedModel(BaseModel):
    def model_dump(self, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(**kwargs)
        return redact_secrets(data)
        
class AgentResponse(BaseRedactedModel):
    id: str
    agent_name: str
    status: str
    task: str
    last_active: Optional[str]

class MemorySearchResponse(BaseRedactedModel):
    content: str
    rank: float
    session_id: Optional[str]
