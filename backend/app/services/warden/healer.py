import logging
import asyncio

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
            # Interface with Docker CLI to pause/restart the container
            # In a real setup we might just restart the container to unstick it
            try:
                process = await asyncio.create_subprocess_shell(
                    f"docker restart {event.agent_ref}",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                if process.returncode == 0:
                    event.action_taken = "Agent Restarted via Docker"
                else:
                    event.action_taken = f"Docker Restart Failed: {stderr.decode()}"
            except Exception as e:
                event.action_taken = f"Docker Error: {str(e)}"
            await session.commit()
            return {"status": "success", "action": event.action_taken}
            
    return {"status": "success", "action": action}
