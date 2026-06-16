import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.warden.key_probe import probe_all_keys
from app.services.warden.loop_detector import detect_loops
from app.services.warden.janitor_service import HermesJanitorService
from app.services.warden.backup_service import HermesBackupService

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
janitor = HermesJanitorService()
backup = HermesBackupService()

async def warden_task():
    await probe_all_keys()
    await detect_loops()

async def janitor_task():
    logger.info("Running scheduled Janitor cleanup")
    await janitor.run_cleanup()

def backup_task():
    logger.info("Running scheduled Backup task")
    backup.run_backup()

def start_scheduler():
    scheduler.add_job(warden_task, 'interval', minutes=2, id='warden_tasks', replace_existing=True)
    scheduler.add_job(janitor_task, 'interval', hours=24, id='janitor_task', replace_existing=True)
    scheduler.add_job(backup_task, 'interval', hours=24, id='backup_task', replace_existing=True)
    
    scheduler.start()
    logger.info("Scheduler started with Warden, Janitor, and Backup tasks.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Warden scheduler stopped.")
