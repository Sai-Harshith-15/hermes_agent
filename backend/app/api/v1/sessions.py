from fastapi import APIRouter, WebSocket, WebSocketDisconnect
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
    # Placeholder for editing a message in state DB
    return {"status": "success"}

@router.delete("/{session_id}/messages/{message_id}")
async def delete_message(session_id: str, message_id: str):
    # Placeholder for deleting a message from state DB
    return {"status": "success"}

@router.post("/{session_id}/rewind")
async def rewind_session(session_id: str, payload: Dict[str, Any]):
    # payload: {"message_id": "...", "timestamp": "..."}
    # Placeholder for rewinding the agent state to a specific message timestamp
    return {"status": "success", "message": "Rewound successfully"}

@router.websocket("/{session_id}/stream")
async def session_stream(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        # In a real implementation, this subscribes to a pubsub channel or tail-reads the agent's scratchpad log.
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Streaming dummy token for {session_id}")
    except WebSocketDisconnect:
        pass
