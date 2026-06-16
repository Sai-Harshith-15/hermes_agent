import logging

logger = logging.getLogger(__name__)

from app.db.database import async_session_maker
from sqlmodel import select
from app.models.keys import ApiKeyPool
from app.models.warden import WardenEvent

async def apply_healing_action(event_id: int, action: str):
    """Applies healing actions based on event."""
    logger.info(f"Applying healing action: {action} for event_id: {event_id}")
    async with async_session_maker() as session:
        event = await session.get(WardenEvent, event_id)
        if not event:
            return {"status": "error", "reason": "Event not found"}
            
        if action == "Suggested Key Rotation" and event.key_ref:
            key = await session.get(ApiKeyPool, event.key_ref)
            if key:
                key.is_active = False
                key.notes = f"Disabled by Warden: {event.reasoning}"
                event.action_taken = "Key Disabled"
                await session.commit()
                return {"status": "success", "action": "Key Disabled"}
        elif action == "Pause Agent" and event.agent_ref:
            # Here we would interface with control_adapter to stop the container
            event.action_taken = "Agent Paused"
            await session.commit()
            return {"status": "success", "action": "Agent Paused"}
            
    return {"status": "success", "action": action}
