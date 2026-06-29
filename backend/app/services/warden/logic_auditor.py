import asyncio
import logging
from app.db.database import async_session_maker
from app.models.warden import WardenEvent
from app.services.warden.webhook_service import fire_webhook

logger = logging.getLogger(__name__)

async def audit_agent_logs(container_id: str):
    """
    Monitors a container for infinite hallucination loops or tool failures.
    In a real system, this would stream `docker logs --tail 50 -f container_id`.
    """
    logger.info(f"Started logic auditor for agent: {container_id}")
    
    try:
        # Mock logic to represent scanning logs for "Traceback" or "Error"
        process = await asyncio.create_subprocess_shell(
            f"docker logs --tail 20 {container_id}",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        logs = stdout.decode() + stderr.decode()
        error_count = logs.lower().count("error") + logs.lower().count("traceback")
        
        if error_count > 5:
            async with async_session_maker() as session:
                event = WardenEvent(
                    event_type="LOGIC_LOOP",
                    severity="CRITICAL",
                    agent_ref=container_id,
                    reasoning=f"Detected {error_count} consecutive errors in logs. Suspect hallucination loop.",
                    action_taken="Pause Agent" # Triggers healer.py to restart
                )
                session.add(event)
                await session.commit()
                fire_webhook(event)
                logger.warning(f"Auditor flagged loop for {container_id}")
    except Exception as e:
        logger.error(f"Auditor failed for {container_id}: {e}")
