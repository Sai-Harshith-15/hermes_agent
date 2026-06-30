from fastapi import APIRouter, WebSocket, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.hermes.sandbox_service import SandboxService
import asyncio

class FileContent(BaseModel):
    content: str

router = APIRouter()
sandbox_svc = SandboxService()

@router.get("/diff")
def get_sandbox_diff() -> Dict[str, Any]:
    diff = sandbox_svc.get_git_diff()
    return {"diff": diff}

@router.get("/files")
def get_sandbox_files(path: str = ".") -> Dict[str, Any]:
    try:
        files = sandbox_svc.list_files(path)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/file")
def get_sandbox_file(path: str) -> Dict[str, Any]:
    try:
        content = sandbox_svc.read_file(path)
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/file")
def put_sandbox_file(path: str, body: FileContent) -> Dict[str, Any]:
    try:
        sandbox_svc.write_file(path, body.content)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket, container_id: str = "hermes-agent"):
    await websocket.accept()
    
    try:
        data = await websocket.receive_text()
        import json
        from jose import jwt, JWTError
        from app.core.config import settings
        payload = json.loads(data)
        token = payload.get("token")
        if not token:
            await websocket.close(code=1008)
            return
        try:
            jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except JWTError:
            await websocket.close(code=1008)
            return
    except Exception:
        try:
            await websocket.close(code=1008)
        except Exception:
            pass
        return

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
