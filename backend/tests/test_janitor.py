import pytest
import asyncio
from datetime import datetime, timedelta
from app.db.database import async_session_maker, engine
from sqlmodel import SQLModel, select
from app.models.logs import AgentLogs
from app.services.warden.janitor_service import HermesJanitorService

@pytest.mark.asyncio
async def test_janitor_cleanup():
    # Setup tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    async with async_session_maker() as db:
        # Cleanup any existing
        await db.execute(SQLModel.metadata.tables['agent_logs'].delete())
        
        # Insert old record
        old_time = datetime.utcnow() - timedelta(days=10)
        old_record = AgentLogs(timestamp=old_time, source="test", message="Old", log_level="INFO")
        db.add(old_record)
        
        # Insert new record
        new_time = datetime.utcnow() - timedelta(days=1)
        new_record = AgentLogs(timestamp=new_time, source="test", message="New", log_level="INFO")
        db.add(new_record)
        
        await db.commit()

    async with async_session_maker() as db:
        # Verify initial count is 2
        result = await db.execute(select(AgentLogs))
        records = result.scalars().all()
        assert len(records) >= 2
        
    # Run Janitor
    janitor = HermesJanitorService(retention_days=7)
    await janitor.run_cleanup()
    
    async with async_session_maker() as db:
        # Verify only new record remains
        result = await db.execute(select(AgentLogs))
        records = result.scalars().all()
        assert len(records) == 1
        assert records[0].message == "New"
        
        # Cleanup
        await db.execute(SQLModel.metadata.tables['agent_logs'].delete())
        await db.commit()
