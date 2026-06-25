from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

# Stub since Agents data comes partly from telemetry DB and partly from config/state.
from app.services.hermes.state_adapter import HermesStateAdapter

@router.get("/")
async def get_agents() -> List[Dict[str, Any]]:
    adapter = HermesStateAdapter()
    sessions = await adapter.get_recent_sessions(limit=10)
    # Deduplicate agents from recent sessions
    agents_map = {}
    for sess in sessions:
        agent_name = sess.get("agent_name") or "unknown_agent"
        if agent_name not in agents_map:
            agents_map[agent_name] = {
                "id": sess.get("id") or sess.get("session_id"),
                "agent_name": agent_name,
                "status": sess.get("status", "Active"),
                "task": sess.get("task", "Unknown Task"),
                "last_active": sess.get("created_at")
            }
    
    # In a full implementation, we'd also merge kanban tasks here if kanban.db adapter exists
    return list(agents_map.values())
