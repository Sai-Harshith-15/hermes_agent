import os
import json
import uuid
from datetime import datetime
from app.core.config import settings

class HermesControlAdapter:
    def __init__(self, hermes_dir: str = None):
        self.hermes_dir = hermes_dir or getattr(settings, "HERMES_DIR", os.path.expanduser("~/.hermes/"))
        self.inbox_dir = os.path.join(self.hermes_dir, "control", "inbox")
        os.makedirs(self.inbox_dir, exist_ok=True)

    def _write_intent(self, intent_type: str, payload: dict) -> dict:
        intent_id = str(uuid.uuid4())
        intent = {
            "id": intent_id,
            "type": intent_type,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload
        }
        
        file_path = os.path.join(self.inbox_dir, f"{intent_type}_{intent_id}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(intent, f, indent=2)
            
        return intent

    def inject_task(self, task_spec: str, priority: str = "normal") -> dict:
        return self._write_intent("inject_task", {
            "task_spec": task_spec,
            "priority": priority
        })

    def steer_agent(self, agent_name: str, message: str) -> dict:
        return self._write_intent("steer_agent", {
            "agent_name": agent_name,
            "message": message
        })

    def pause_agent(self, agent_name: str) -> dict:
        return self._write_intent("pause_agent", {
            "agent_name": agent_name
        })
