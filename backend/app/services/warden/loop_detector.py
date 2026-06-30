import logging
from app.db.database import async_session_maker
from app.models.warden import WardenEvent
from app.services.hermes.state_adapter import HermesStateAdapter
from app.core.config import settings
from app.services.warden.webhook_service import fire_webhook

logger = logging.getLogger(__name__)

async def detect_loops():
    """Deterministic loop detection logic."""
    hermes_dir = settings.HERMES_DIR if hasattr(settings, "HERMES_DIR") else "~/.hermes/"
    adapter = HermesStateAdapter(hermes_dir)
    
    tasks = await adapter.get_recent_tasks()
    
    async with async_session_maker() as session:
        for task in tasks:
            # Deterministic heuristic: If error count > 5, flag it.
            if task.get("error_count", 0) > 5:
                event = WardenEvent(
                    event_type="LOOP_DETECTED",
                    severity="WARNING",
                    agent_ref=task.get("agent_name", "Unknown"),
                    reasoning=f"Task {task.get('id')} has accumulated >5 errors recently.",
                    action_taken="Suggested Steer or Pause"
                )
                session.add(event)
                fire_webhook(event)
        await session.commit()
    logger.info("Warden completed loop detection cycle.")
