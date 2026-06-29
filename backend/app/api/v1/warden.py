from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.models.warden import WardenEvent

router = APIRouter()

@router.get("/events", response_model=List[WardenEvent])
async def get_warden_events(session: AsyncSession = Depends(get_db), limit: int = 50):
    result = await session.execute(select(WardenEvent).order_by(WardenEvent.timestamp.desc()).limit(limit))
    return result.scalars().all()

@router.post("/trigger_probe")
async def trigger_key_probe():
    from app.services.warden.key_probe import probe_all_keys
    import asyncio
    asyncio.create_task(probe_all_keys())
    return {"status": "Key probe triggered"}

@router.post("/trigger_loop_detection")
async def trigger_loop_detection():
    from app.services.warden.loop_detector import detect_loops
    import asyncio
    asyncio.create_task(detect_loops())
    return {"status": "Loop detection triggered"}

from pydantic import BaseModel
class HealPayload(BaseModel):
    event_id: int
    action: str

@router.post("/heal")
async def trigger_healing(payload: HealPayload):
    from app.services.warden.healer import apply_healing_action
    result = await apply_healing_action(payload.event_id, payload.action)
    return result
