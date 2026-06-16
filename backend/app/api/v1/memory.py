from fastapi import APIRouter
from app.services.hermes.state_adapter import HermesStateAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = HermesStateAdapter()

@router.get("/search")
async def search_memory(q: str) -> List[Dict[str, Any]]:
    return await adapter.search_memory(q)
