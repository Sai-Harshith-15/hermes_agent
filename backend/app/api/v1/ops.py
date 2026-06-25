from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import subprocess
import asyncio
from jose import jwt, JWTError
from app.core.config import settings

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

@router.websocket("/ws")
async def ops_websocket(websocket: WebSocket, token: str, op: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    allowed_ops = {
        "doctor": "hermes doctor",
        "audit": "hermes audit",
        "backup": "hermes backup"
    }

    if op not in allowed_ops:
        await websocket.send_text(f"Error: Unknown operation '{op}'")
        await websocket.close()
        return

    cmd = allowed_ops[op]
    await websocket.send_text(f"Executing: {cmd}...\n")

    try:
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )

        if process.stdout:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                await websocket.send_text(line.decode().rstrip('\n'))

        await process.wait()
        await websocket.send_text(f"\n[Process completed with exit code {process.returncode}]")
    except Exception as e:
        await websocket.send_text(f"\n[Operation failed: {str(e)}]")
    finally:
        await websocket.close()
