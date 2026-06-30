import subprocess
import psutil
from fastapi import APIRouter, HTTPException, Depends
from app.models.users import User
from app.core.rbac import RequireRole

router = APIRouter()

def is_curator_running() -> bool:
    for proc in psutil.process_iter(['name', 'cmdline']):
        try:
            # Check if "hermes-curator" is in the command line arguments
            if proc.info['cmdline'] and any("hermes-curator" in arg for arg in proc.info['cmdline']):
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

@router.get("")
async def get_curator_status():
    status = "running" if is_curator_running() else "paused"
    return {"status": status}

@router.post("/toggle")
async def toggle_curator(action: str, _user: User = Depends(RequireRole(["owner", "admin"]))):
    """
    Action should be 'pause' or 'resume'.
    """
    if action == "pause":
        try:
            subprocess.Popen(['pkill', '-STOP', '-f', 'hermes-curator'])
            return {"status": "paused"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    elif action == "resume":
        try:
            subprocess.Popen(['pkill', '-CONT', '-f', 'hermes-curator'])
            return {"status": "running"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail="Invalid action, must be 'pause' or 'resume'")
