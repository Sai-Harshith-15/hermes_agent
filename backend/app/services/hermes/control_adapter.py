import os
import shutil
import subprocess
import uuid
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Detect hermes availability once at import time so startup logs warn early.
_HERMES_AVAILABLE = shutil.which("hermes") is not None or bool(
    subprocess.run(
        ["python", "-m", "hermes", "--version"],
        capture_output=True,
        timeout=5,
    ).returncode == 0
    if True else False
)

if not _HERMES_AVAILABLE:
    logger.warning(
        "Hermes binary not found in PATH and 'python -m hermes' is unavailable. "
        "Control adapter will operate in QUEUED mode — intents are accepted but not executed. "
        "Install the hermes package to enable live agent control."
    )


class HermesControlAdapter:
    def __init__(self, hermes_dir: str = None):
        self.hermes_dir = hermes_dir or getattr(settings, "HERMES_DIR", os.path.expanduser("~/.hermes/"))
        self._available = _HERMES_AVAILABLE

    def _run_cli(self, args: list) -> dict:
        intent_id = str(uuid.uuid4())

        # Graceful degradation: if hermes is not installed, queue the intent
        # rather than crashing with an unhandled FileNotFoundError.
        if not self._available:
            logger.warning(
                "Intent %s queued (hermes binary unavailable): %s",
                intent_id,
                " ".join(args),
            )
            return {
                "id": intent_id,
                "status": "queued",
                "message": (
                    "Hermes binary is not installed in this environment. "
                    "Intent has been recorded but not executed. "
                    "Install the 'hermes' package to enable live control."
                ),
            }

        cmd = ["python", "-m", "hermes", *args]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
            return {
                "id": intent_id,
                "status": "success",
                "output": result.stdout,
            }
        except subprocess.CalledProcessError as e:
            return {
                "id": intent_id,
                "status": "error",
                "error": e.stderr,
            }
        except FileNotFoundError:
            # Binary disappeared after startup check — re-enter queued mode.
            self._available = False
            return {
                "id": intent_id,
                "status": "queued",
                "message": "Hermes binary no longer found. Intent queued.",
            }
        except Exception as e:
            return {
                "id": intent_id,
                "status": "error",
                "error": f"Hermes process failed to start: {str(e)}",
            }

    def inject_task(self, task_spec: str, priority: str = "normal") -> dict:
        return self._run_cli(["task", "add", f"--priority={priority}", task_spec])

    def steer_agent(self, agent_name: str, message: str) -> dict:
        return self._run_cli(["agent", "steer", agent_name, message])

    def pause_agent(self, agent_name: str) -> dict:
        return self._run_cli(["agent", "pause", agent_name])

    def resume_agent(self, agent_name: str) -> dict:
        return self._run_cli(["agent", "resume", agent_name])

    def kill_agent(self, agent_name: str) -> dict:
        return self._run_cli(["agent", "kill", agent_name])
