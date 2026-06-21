from fastapi import APIRouter
import subprocess

router = APIRouter()

def execute_command(cmd: str) -> str:
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.stdout + "\n" + result.stderr
    except Exception as e:
        return str(e)

@router.post("/doctor")
def run_doctor():
    logs = execute_command("hermes doctor")
    return {"status": "success", "logs": logs or "Executed hermes doctor."}

@router.post("/audit")
def run_audit():
    logs = execute_command("hermes audit")
    return {"status": "success", "logs": logs or "Executed hermes audit."}

@router.post("/backup")
def run_backup():
    logs = execute_command("hermes backup")
    return {"status": "success", "logs": logs or "Executed hermes backup."}
