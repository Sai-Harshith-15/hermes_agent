from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlmodel import select

from app.db.database import get_db
from app.models.keys import ApiKeyPool, ApiKeyUsages

router = APIRouter()

@router.get("/daily")
async def get_daily_analytics(session: AsyncSession = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    stmt = (
        select(
            func.date(ApiKeyUsages.timestamp).label("day"),
            ApiKeyPool.model_name.label("model_id"),
            func.sum(ApiKeyUsages.prompt_tokens).label("input"),
            func.sum(ApiKeyUsages.completion_tokens).label("output"),
            func.sum(ApiKeyUsages.cost_usd).label("total_cost")
        )
        .join(ApiKeyPool, ApiKeyUsages.key_id == ApiKeyPool.id)
        .where(ApiKeyUsages.timestamp >= thirty_days_ago)
        .group_by(func.date(ApiKeyUsages.timestamp), ApiKeyPool.model_name)
    )
    
    result = await session.execute(stmt)
    rows = result.all()
    
    # Format for recharts: group by day, then have keys for each model
    formatted_data = {}
    for row in rows:
        day = row.day
        if day not in formatted_data:
            formatted_data[day] = {"day": day, "total_cost": 0.0}
        
        model_id = row.model_id
        formatted_data[day][f"{model_id}_input"] = row.input
        formatted_data[day][f"{model_id}_output"] = row.output
        formatted_data[day]["total_cost"] += row.total_cost
    
    return list(formatted_data.values())
