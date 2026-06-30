import os
import asyncio
import subprocess
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

from jose import jwt, JWTError
from app.core.config import settings

@router.websocket("")
async def pty_endpoint(websocket: WebSocket):
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
    
    # Check if we're on Windows where pty is not available
    if os.name == 'nt':
        await websocket.send_text("PTY is not supported on Windows natively. Please run via Docker as per the Master Plan.\r\n")
        await websocket.close()
        return

    import pty

    # Fork a PTY
    master_fd, slave_fd = pty.openpty()
    
    # Start the hermes TUI process
    try:
        process = subprocess.Popen(
            ["hermes", "--tui"],
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            preexec_fn=os.setsid
        )
    except FileNotFoundError:
        # Fallback to bash if hermes command is not found in PATH
        process = subprocess.Popen(
            ["bash"],
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            preexec_fn=os.setsid
        )
        
    os.close(slave_fd)

    async def read_from_pty():
        loop = asyncio.get_running_loop()
        while True:
            try:
                data = await loop.run_in_executor(None, os.read, master_fd, 1024)
                if not data:
                    break
                await websocket.send_text(data.decode('utf-8', errors='replace'))
            except Exception:
                break

    async def read_from_ws():
        while True:
            try:
                data = await websocket.receive_text()
                os.write(master_fd, data.encode('utf-8'))
            except WebSocketDisconnect:
                break
            except Exception:
                break

    # Run both tasks concurrently
    try:
        await asyncio.gather(
            read_from_pty(),
            read_from_ws()
        )
    finally:
        # Cleanup
        try:
            os.close(master_fd)
        except OSError:
            pass
        if process.poll() is None:
            process.terminate()
            process.wait()
