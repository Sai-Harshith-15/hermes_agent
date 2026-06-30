from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.users import User
from app.core.rbac import RequireRole
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

class TaskStatusUpdate(BaseModel):
    status: str

@router.post("/tasks/{task_id}/status")
async def update_task_status(task_id: str, payload: TaskStatusUpdate, _user: User = Depends(RequireRole(["owner", "admin"]))) -> Dict[str, Any]:
    success = await adapter.update_task_status(task_id, payload.status)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found or update failed")
    return {"status": "success", "task_id": task_id, "new_status": payload.status}
