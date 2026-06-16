import logging
import httpx
import threading

class HermesLogShim(logging.Handler):
    def __init__(self, endpoint="http://localhost:8000/api/v1/telemetry/log", agent_name="unknown"):
        super().__init__()
        self.endpoint = endpoint
        self.agent_name = agent_name
        self._client = httpx.Client()

    def emit(self, record):
        log_entry = self.format(record)
        payload = {
            "agent_name": self.agent_name,
            "message": log_entry,
            "level": record.levelname,
            "task_id": getattr(record, "task_id", None)
        }
        
        def _post():
            try:
                self._client.post(self.endpoint, json=payload, timeout=2.0)
            except Exception:
                pass
                
        threading.Thread(target=_post, daemon=True).start()

def setup_hermes_logging(agent_name="default", hmc_url="http://localhost:8000"):
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    hmc_handler = HermesLogShim(endpoint=f"{hmc_url}/api/v1/telemetry/log", agent_name=agent_name)
    hmc_handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(hmc_handler)
