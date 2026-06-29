from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.hermes.config_adapter import HermesConfigAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = HermesConfigAdapter()

class ProfileUpdateRequest(BaseModel):
    content: str

@router.get("/")
def get_profiles() -> List[Dict[str, Any]]:
    return adapter.get_profiles()

@router.put("/{agent_name}/config")
def update_profile_config(agent_name: str, req: ProfileUpdateRequest):
    success = adapter.update_profile_config(agent_name, req.content)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update config.yaml")
    return {"status": "success"}

@router.get("/config")
def get_config() -> Dict[str, Any]:
    return adapter.read_config()
