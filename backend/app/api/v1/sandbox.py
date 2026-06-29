from fastapi import APIRouter, WebSocket
from typing import Dict, Any
from app.services.hermes.sandbox_service import SandboxService
import asyncio

router = APIRouter()
sandbox_svc = SandboxService()

@router.get("/diff")
def get_sandbox_diff() -> Dict[str, Any]:
    diff = sandbox_svc.get_git_diff()
    return {"diff": diff}

@router.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket, container_id: str = "hermes-agent"):
    await websocket.accept()
    process = await sandbox_svc.get_pty_bridge(container_id)
    
    async def read_stdout():
        while True:
            data = await process.stdout.read(1024)
            if not data:
                break
            await websocket.send_text(data.decode())
            
    async def write_stdin():
        while True:
            data = await websocket.receive_text()
            process.stdin.write(data.encode())
            await process.stdin.drain()
            
    try:
        await asyncio.gather(read_stdout(), write_stdin())
    except Exception:
        pass
    finally:
        if process.returncode is None:
            process.terminate()
        await websocket.close()
