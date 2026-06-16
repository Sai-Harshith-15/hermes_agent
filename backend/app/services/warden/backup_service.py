import os
import shutil
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

class HermesBackupService:
    def __init__(self, db_path: str = "hermes_state.db", hermes_dir: str = "~/.hermes", backup_dir: str = "./backups", max_backups: int = 5):
        self.db_path = Path(db_path)
        self.hermes_dir = Path(os.path.expanduser(hermes_dir)).resolve()
        self.backup_dir = Path(backup_dir).resolve()
        self.max_backups = max_backups

    def run_backup(self):
        """
        Zips the hermes_state.db and ~/.hermes/ directory, keeping only the last N backups.
        """
        try:
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

            # Create a temporary staging directory
            staging_dir = self.backup_dir / f"staging_{timestamp}"
            staging_dir.mkdir(parents=True, exist_ok=True)

            # Copy DB if it exists
            if self.db_path.exists():
                shutil.copy2(self.db_path, staging_dir / self.db_path.name)

            # Copy config dir if it exists
            if self.hermes_dir.exists():
                shutil.copytree(self.hermes_dir, staging_dir / "config", dirs_exist_ok=True)

            # Zip the staging directory
            archive_path = self.backup_dir / f"hermes_backup_{timestamp}"
            shutil.make_archive(str(archive_path), 'zip', staging_dir)

            # Clean up staging
            shutil.rmtree(staging_dir)
            
            logger.info(f"Backup created: {archive_path}.zip")
            
            self._cleanup_old_backups()
            
        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")

    def _cleanup_old_backups(self):
        """Keeps only the most recent `max_backups` zip files."""
        backups = sorted(self.backup_dir.glob("hermes_backup_*.zip"), key=lambda x: x.stat().st_mtime)
        
        while len(backups) > self.max_backups:
            oldest = backups.pop(0)
            try:
                oldest.unlink()
                logger.info(f"Deleted old backup: {oldest.name}")
            except Exception as e:
                logger.error(f"Failed to delete old backup {oldest.name}: {str(e)}")
