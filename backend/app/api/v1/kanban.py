from fastapi import APIRouter
from app.services.hermes.kanban_adapter import KanbanAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = KanbanAdapter()

@router.get("/tasks")
async def get_tasks(limit: int = 100) -> List[Dict[str, Any]]:
    return await adapter.get_tasks(limit)

@router.get("/workflows")
async def get_workflows(limit: int = 50) -> List[Dict[str, Any]]:
    return await adapter.get_workflows(limit)
