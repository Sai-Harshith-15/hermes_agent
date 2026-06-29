from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db.database import get_db
from app.models.extra import PairingRequest
import os
import json
import secrets
from pathlib import Path
from dotenv import set_key
import subprocess
from app.services.hermes.config_adapter import HermesConfigAdapter

router = APIRouter()
adapter = HermesConfigAdapter()

class MessagingSetupRequest(BaseModel):
    platform: str
    bot_token: str

class PairingApproveRequest(BaseModel):
    user_id: str

@router.post("/setup")
async def setup_messaging(req: MessagingSetupRequest):
    env_path = adapter.hermes_dir / ".env"
    if not env_path.exists():
        env_path.touch()
        
    env_var_name = f"{req.platform.upper()}_BOT_TOKEN"
    set_key(str(env_path), env_var_name, req.bot_token)
    
    # Try to restart gateway safely in docker
    try:
        subprocess.Popen(['pkill', '-f', 'hermes-gateway'])
    except Exception:
        pass # Ignore restart errors in dev environment
        
    return {"status": "success", "message": f"{req.platform} configured successfully"}

@router.post("/restart")
async def restart_gateway():
    try:
        subprocess.Popen(['pkill', '-f', 'hermes-gateway'])
        return {"status": "success", "message": "Gateway restart triggered successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to restart gateway: {str(e)}"}

@router.get("/pairing")
async def get_pairing_requests(session: AsyncSession = Depends(get_db)):
    stmt = select(PairingRequest).where(PairingRequest.status == "pending")
    result = await session.execute(stmt)
    requests = result.scalars().all()
    return [{"user_id": req.user_id, "platform": req.platform, "username": req.username, "status": req.status} for req in requests]

@router.post("/pairing/{user_id}/approve")
async def approve_pairing(user_id: str, session: AsyncSession = Depends(get_db)):
    stmt = select(PairingRequest).where(PairingRequest.user_id == user_id)
    result = await session.execute(stmt)
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Pairing request not found")
    
    req.status = "approved"
    session.add(req)
    await session.commit()
    
    return {"status": "success", "message": f"User {user_id} approved"}

@router.get("/themes")
async def get_themes():
    themes_dir = adapter.hermes_dir / "dashboard-themes"
    themes_dir.mkdir(parents=True, exist_ok=True)
    themes = []
    
    # Check if there are yaml files, otherwise provide a default theme list
    for entry in themes_dir.glob("*.yaml"):
        # We would parse CSS vars here
        themes.append({"id": entry.stem, "name": entry.stem.replace('-', ' ').title()})
        
    if not themes:
        themes = [
            {"id": "cyberpunk", "name": "Cyberpunk Neon", "bg_color": "#09090b", "accent": "#10b981"},
            {"id": "dracula", "name": "Dracula Deep", "bg_color": "#282a36", "accent": "#bd93f9"}
        ]
        
    return themes


