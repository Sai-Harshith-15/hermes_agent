from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.services.hermes.state_adapter import HermesStateAdapter
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter()
adapter = HermesStateAdapter()

@router.get("/")
async def get_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    return await adapter.get_recent_sessions(limit)

@router.get("/search")
async def search_sessions(q: str, limit: int = 50) -> List[Dict[str, Any]]:
    return await adapter.search_sessions(q, limit)

@router.get("/{session_id}")
async def get_session_detail(session_id: str) -> Dict[str, Any]:
    return await adapter.get_session_detail(session_id)

@router.get("/{session_id}/messages")
async def get_messages(session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    return await adapter.get_messages(session_id, limit)

class MessageEditRequest(BaseModel):
    content: str

@router.put("/{session_id}/messages/{message_id}")
async def edit_message(session_id: str, message_id: str, payload: MessageEditRequest):
    success = await adapter.edit_message(message_id, payload.content)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to edit message")
    return {"status": "success"}

@router.delete("/{session_id}/messages/{message_id}")
async def delete_message(session_id: str, message_id: str):
    success = await adapter.delete_message(message_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete message")
    return {"status": "success"}

@router.post("/{session_id}/rewind")
async def rewind_session(session_id: str, payload: Dict[str, Any]):
    success = await adapter.rewind_session(session_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to rewind session")
    return {"status": "success"}

@router.websocket("/{session_id}/stream")
async def session_stream(websocket: WebSocket, session_id: str):
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
        
        while True:
            data = await websocket.receive_text()
            # Simple echo/ack for the stream placeholder
            await websocket.send_text(f"ACK: {data}")
    except Exception:
        try:
            await websocket.close(code=1008)
        except Exception:
            pass
