import os
import subprocess
import uuid
from datetime import datetime
from app.core.config import settings

class HermesControlAdapter:
    def __init__(self, hermes_dir: str = None):
        self.hermes_dir = hermes_dir or getattr(settings, "HERMES_DIR", os.path.expanduser("~/.hermes/"))

    def _run_cli(self, args: list) -> dict:
        intent_id = str(uuid.uuid4())
        cmd = ["python", "-m", "hermes", *args]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return {
                "id": intent_id,
                "status": "success",
                "output": result.stdout
            }
        except subprocess.CalledProcessError as e:
            return {
                "id": intent_id,
                "status": "error",
                "error": e.stderr
            }

    def inject_task(self, task_spec: str, priority: str = "normal") -> dict:
        return self._run_cli(["task", "add", f"--priority={priority}", task_spec])

    def steer_agent(self, agent_name: str, message: str) -> dict:
        return self._run_cli(["agent", "steer", agent_name, message])

    def pause_agent(self, agent_name: str) -> dict:
        return self._run_cli(["agent", "pause", agent_name])
