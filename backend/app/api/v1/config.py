from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.hermes.config_adapter import HermesConfigAdapter

router = APIRouter()
adapter = HermesConfigAdapter()

class ConfigUpdateRequest(BaseModel):
    content: str

@router.get("/yaml")
def get_config_yaml():
    return {"content": adapter.get_raw_config()}

@router.put("/yaml")
def update_config_yaml(req: ConfigUpdateRequest):
    if not adapter.update_raw_config(req.content):
        raise HTTPException(status_code=400, detail="Invalid YAML or write failed")
    return {"status": "success"}

@router.get("/env")
def get_env():
    return {"content": adapter.get_raw_env()}

@router.put("/env")
def update_env(req: ConfigUpdateRequest):
    if not adapter.update_raw_env(req.content):
        raise HTTPException(status_code=400, detail="Write failed")
    return {"status": "success"}
