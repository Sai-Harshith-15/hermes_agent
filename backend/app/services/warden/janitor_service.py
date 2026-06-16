import logging
from datetime import datetime, timedelta
from app.db.database import async_session_maker
from sqlmodel import select, delete
from app.models.logs import AgentLogs

logger = logging.getLogger(__name__)

class HermesJanitorService:
    def __init__(self, retention_days: int = 7):
        self.retention_days = retention_days

    async def run_cleanup(self):
        """
        Deletes telemetry older than `retention_days`.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=self.retention_days)
        
        try:
            async with async_session_maker() as db:
                result = await db.execute(delete(AgentLogs).where(AgentLogs.timestamp < cutoff_date))
                await db.commit()
                deleted_count = result.rowcount
                
                if deleted_count > 0:
                    logger.info(f"Janitor: Deleted {deleted_count} log records older than {cutoff_date.isoformat()}")
                else:
                    logger.debug("Janitor: No old logs to clean up.")
                
        except Exception as e:
            logger.error(f"Janitor error: {str(e)}")
