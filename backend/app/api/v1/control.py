from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.hermes.control_adapter import HermesControlAdapter
from app.core.rbac import RequireRole

router = APIRouter(dependencies=[Depends(RequireRole(["owner", "admin"]))])
adapter = HermesControlAdapter()

class InjectTaskRequest(BaseModel):
    task_spec: str
    priority: str = "normal"

class SteerAgentRequest(BaseModel):
    agent_name: str
    message: str

class PauseAgentRequest(BaseModel):
    agent_name: str

class ResumeAgentRequest(BaseModel):
    agent_name: str

class KillAgentRequest(BaseModel):
    agent_name: str

@router.post("/inject-task")
async def inject_task(req: InjectTaskRequest):
    intent = adapter.inject_task(req.task_spec, req.priority)
    return {"status": "success", "intent": intent}

@router.post("/steer-agent")
async def steer_agent(req: SteerAgentRequest):
    intent = adapter.steer_agent(req.agent_name, req.message)
    return {"status": "success", "intent": intent}

@router.post("/pause-agent")
async def pause_agent(req: PauseAgentRequest):
    intent = adapter.pause_agent(req.agent_name)
    return {"status": "success", "intent": intent}

@router.post("/resume-agent")
async def resume_agent(req: ResumeAgentRequest):
    intent = adapter.resume_agent(req.agent_name)
    return {"status": "success", "intent": intent}

@router.post("/kill-agent")
async def kill_agent(req: KillAgentRequest):
    intent = adapter.kill_agent(req.agent_name)
    return {"status": "success", "intent": intent}
