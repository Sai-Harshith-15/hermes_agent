from fastapi import APIRouter
from app.services.hermes.state_adapter import HermesStateAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = HermesStateAdapter()

@router.get("/")
async def get_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    return await adapter.get_recent_sessions(limit)

@router.get("/{session_id}/messages")
async def get_messages(session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    return await adapter.get_messages(session_id, limit)
