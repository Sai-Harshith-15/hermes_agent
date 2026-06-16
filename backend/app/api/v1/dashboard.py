from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.database import get_db
from app.models import (
    HostMetrics, ApiKeyPool, AgentRuns, Tasks, AgentLogs
)

router = APIRouter()

@router.get("/state")
async def get_dashboard_state(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(HostMetrics).order_by(HostMetrics.timestamp.desc()).limit(1))
    host_metrics = result.scalars().first()
    
    result = await session.execute(select(ApiKeyPool))
    keys = result.scalars().all()
    
    result = await session.execute(select(AgentRuns))
    runs = result.scalars().all()
    
    result = await session.execute(select(Tasks))
    tasks = result.scalars().all()
    
    result = await session.execute(select(AgentLogs).order_by(AgentLogs.timestamp.desc()).limit(100))
    logs = result.scalars().all()
    
    return {
        "host_metrics": host_metrics,
        "api_keys": keys,
        "agent_runs": runs,
        "tasks": tasks,
        "logs": sorted(logs, key=lambda x: x.timestamp)
    }
