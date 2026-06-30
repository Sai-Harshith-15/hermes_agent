from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.database import get_db
from app.websocket_manager import manager
from app.models import (
    HostMetrics, ApiKeyPool, ModelUsage, AgentRuns, Tasks, AgentLogs
)

router = APIRouter()

# 1. Host Metrics POST
@router.post("/metrics/host", response_model=HostMetrics)
async def create_host_metrics(metrics: HostMetrics, session: AsyncSession = Depends(get_db)):
    session.add(metrics)
    await session.commit()
    await session.refresh(metrics)
    
    await manager.broadcast({
        "type": "host_metrics",
        "data": metrics.model_dump(mode="json")
    })
    return metrics

# 2. Agent Logs POST
@router.post("/log", response_model=AgentLogs)
async def create_agent_log(log: AgentLogs, session: AsyncSession = Depends(get_db)):
    session.add(log)
    await session.commit()
    await session.refresh(log)
    
    await manager.broadcast({
        "type": "agent_log",
        "data": log.model_dump(mode="json")
    })
    return log

# 3. API Key pool manager POST
@router.post("/key", response_model=ApiKeyPool)
async def create_or_update_key(key: ApiKeyPool, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(ApiKeyPool).where(ApiKeyPool.api_key_masked == key.api_key_masked))
    existing = result.scalars().first()
    if existing:
        existing.status = key.status
        existing.current_usage_pct = key.current_usage_pct
        existing.rpm_limit = key.rpm_limit
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        key = existing
    else:
        session.add(key)
        await session.commit()
        await session.refresh(key)
        
    await manager.broadcast({
        "type": "api_key_status",
        "data": key.model_dump(mode="json")
    })
    return key

# 4. API Key usages POST
@router.post("/key-usage", response_model=ModelUsage)
async def create_key_usage(usage: ModelUsage, session: AsyncSession = Depends(get_db)):
    session.add(usage)
    await session.commit()
    await session.refresh(usage)
    
    key = await session.get(ApiKeyPool, usage.key_id)
    if key:
        key.current_usage_pct = min(100.00, key.current_usage_pct + 5.0)
        session.add(key)
        await session.commit()
        
    await manager.broadcast({
        "type": "api_key_usage",
        "data": usage.model_dump(mode="json")
    })
    return usage

# 5. Agent Run session start/stop POST
@router.post("/agent-run", response_model=AgentRuns)
async def create_or_update_run(run: AgentRuns, session: AsyncSession = Depends(get_db)):
    existing = await session.get(AgentRuns, run.id)
    if existing:
        existing.status = run.status
        if run.end_time:
            existing.end_time = run.end_time
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        run = existing
    else:
        session.add(run)
        await session.commit()
        await session.refresh(run)
        
    await manager.broadcast({
        "type": "agent_run",
        "data": run.model_dump(mode="json")
    })
    return run

# 6. Tasks POST
@router.post("/task", response_model=Tasks)
async def create_or_update_task(task: Tasks, session: AsyncSession = Depends(get_db)):
    existing = await session.get(Tasks, task.id)
    if existing:
        existing.status = task.status
        existing.agent_name = task.agent_name
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        task = existing
    else:
        session.add(task)
        await session.commit()
        await session.refresh(task)
        
    await manager.broadcast({
        "type": "task_status",
        "data": task.model_dump(mode="json")
    })
    return task

# 7. Analytics GET
@router.get("/analytics")
async def get_analytics():
    return {
        "status": "success",
        "data": {
            "summary": "Analytics data placeholder"
        }
    }
