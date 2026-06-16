import os
import time
import pytest
from pathlib import Path
from app.services.warden.backup_service import HermesBackupService

@pytest.fixture
def setup_backup_env(tmp_path):
    # Create fake db and hermes dir
    db_path = tmp_path / "hermes_state.db"
    db_path.write_text("dummy database content")
    
    hermes_dir = tmp_path / ".hermes"
    hermes_dir.mkdir()
    (hermes_dir / "config.txt").write_text("dummy config")
    
    backup_dir = tmp_path / "backups"
    
    return db_path, hermes_dir, backup_dir

def test_backup_creation(setup_backup_env):
    db_path, hermes_dir, backup_dir = setup_backup_env
    
    service = HermesBackupService(
        db_path=str(db_path),
        hermes_dir=str(hermes_dir),
        backup_dir=str(backup_dir),
        max_backups=2
    )
    
    service.run_backup()
    
    # Verify zip was created
    zips = list(backup_dir.glob("*.zip"))
    assert len(zips) == 1
    
    # Run two more times to test retention (wait for 1 sec to ensure distinct timestamps)
    time.sleep(1.1)
    service.run_backup()
    time.sleep(1.1)
    service.run_backup()
    
    zips = list(backup_dir.glob("*.zip"))
    assert len(zips) == 2 # Max is 2
