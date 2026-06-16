from fastapi import APIRouter
from app.services.hermes.state_adapter import HermesStateAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = HermesStateAdapter()

@router.get("/")
async def get_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    return await adapter.get_recent_sessions(limit)
