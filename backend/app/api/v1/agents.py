from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

# Stub since Agents data comes partly from telemetry DB and partly from config/state.
@router.get("/")
async def get_agents() -> List[Dict[str, Any]]:
    # In a full implementation, this will query the postgres DB for active agents
    return []
