from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import subprocess
import asyncio
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter()

async def execute_command(cmd: str) -> str:
    try:
        process = await asyncio.create_subprocess_shell(
            cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        return (stdout.decode() if stdout else "") + "\n" + (stderr.decode() if stderr else "")
    except Exception as e:
        return str(e)

@router.post("/doctor")
async def run_doctor():
    logs = await execute_command("hermes doctor")
    return {"status": "success", "logs": logs or "Executed hermes doctor."}

@router.post("/audit")
async def run_audit():
    logs = await execute_command("hermes audit")
    return {"status": "success", "logs": logs or "Executed hermes audit."}

@router.post("/backup")
async def run_backup():
    logs = await execute_command("hermes backup")
    return {"status": "success", "logs": logs or "Executed hermes backup."}

@router.websocket("/ws")
async def ops_websocket(websocket: WebSocket, op: str):
    await websocket.accept()
    try:
        auth_data = await websocket.receive_json()
        token = auth_data.get("token")
        if not token:
            await websocket.close(code=1008)
            return
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

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
