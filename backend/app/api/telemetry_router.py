from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict, Any

from app.db.database import get_session
from app.websocket_manager import manager
from app.models import (
    HostMetrics, ApiKeyPool, ApiKeyUsages, AgentRuns, Tasks, AgentLogs
)

router = APIRouter()

# 1. Host Metrics POST
@router.post("/metrics/host", response_model=HostMetrics)
async def create_host_metrics(metrics: HostMetrics, session: Session = Depends(get_session)):
    session.add(metrics)
    session.commit()
    session.refresh(metrics)
    
    # Broadcast to websocket
    await manager.broadcast({
        "type": "host_metrics",
        "data": metrics.model_dump(mode="json")
    })
    return metrics

# 2. Agent Logs POST
@router.post("/telemetry/log", response_model=AgentLogs)
async def create_agent_log(log: AgentLogs, session: Session = Depends(get_session)):
    session.add(log)
    session.commit()
    session.refresh(log)
    
    # Broadcast to websocket
    await manager.broadcast({
        "type": "agent_log",
        "data": log.model_dump(mode="json")
    })
    return log

# 3. API Key pool manager POST
@router.post("/telemetry/key", response_model=ApiKeyPool)
async def create_or_update_key(key: ApiKeyPool, session: Session = Depends(get_session)):
    existing = session.exec(select(ApiKeyPool).where(ApiKeyPool.api_key_masked == key.api_key_masked)).first()
    if existing:
        existing.status = key.status
        existing.current_usage_pct = key.current_usage_pct
        existing.rpm_limit = key.rpm_limit
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        key = existing
    else:
        session.add(key)
        session.commit()
        session.refresh(key)
        
    await manager.broadcast({
        "type": "api_key_status",
        "data": key.model_dump(mode="json")
    })
    return key

# 4. API Key usages POST
@router.post("/telemetry/key-usage", response_model=ApiKeyUsages)
async def create_key_usage(usage: ApiKeyUsages, session: Session = Depends(get_session)):
    session.add(usage)
    session.commit()
    session.refresh(usage)
    
    # Update current usage pct for key
    key = session.get(ApiKeyPool, usage.key_id)
    if key:
        # Simple usage update logic: calculate recent usage
        # This is mock telemetry logic - we update usage slightly
        key.current_usage_pct = min(100.00, key.current_usage_pct + 5.0)
        session.add(key)
        session.commit()
        
    await manager.broadcast({
        "type": "api_key_usage",
        "data": usage.model_dump(mode="json")
    })
    return usage

# 5. Agent Run session start/stop POST
@router.post("/telemetry/agent-run", response_model=AgentRuns)
async def create_or_update_run(run: AgentRuns, session: Session = Depends(get_session)):
    existing = session.get(AgentRuns, run.id)
    if existing:
        existing.status = run.status
        if run.end_time:
            existing.end_time = run.end_time
        session.add(existing)
        session.commit()
        session.refresh(existing)
        run = existing
    else:
        session.add(run)
        session.commit()
        session.refresh(run)
        
    await manager.broadcast({
        "type": "agent_run",
        "data": run.model_dump(mode="json")
    })
    return run

# 6. Tasks POST
@router.post("/telemetry/task", response_model=Tasks)
async def create_or_update_task(task: Tasks, session: Session = Depends(get_session)):
    existing = session.get(Tasks, task.id)
    if existing:
        existing.status = task.status
        existing.agent_name = task.agent_name
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        task = existing
    else:
        session.add(task)
        session.commit()
        session.refresh(task)
        
    await manager.broadcast({
        "type": "task_status",
        "data": task.model_dump(mode="json")
    })
    return task

# 7. Dashboard overall state fetch (GET)
@router.get("/dashboard/state")
async def get_dashboard_state(session: Session = Depends(get_session)):
    host_metrics = session.exec(select(HostMetrics).order_by(HostMetrics.timestamp.desc()).limit(1)).first()
    keys = session.exec(select(ApiKeyPool)).all()
    runs = session.exec(select(AgentRuns)).all()
    tasks = session.exec(select(Tasks)).all()
    logs = session.exec(select(AgentLogs).order_by(AgentLogs.timestamp.desc()).limit(100)).all()
    
    return {
        "host_metrics": host_metrics,
        "api_keys": keys,
        "agent_runs": runs,
        "tasks": tasks,
        "logs": sorted(logs, key=lambda x: x.timestamp)
    }
