import os
import json
import secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models.users import User
from app.core.rbac import RequireRole
from typing import List, Optional

router = APIRouter()

class ShellHook(BaseModel):
    event: str
    command: str
    matcher: str
    timeout: int = 30
    approved: bool = False

class WebhookCreateRequest(BaseModel):
    name: str
    target_url: str
    event_filter: Optional[str] = "*"

def get_shell_hooks_file_path() -> str:
    path = os.path.expanduser("~/.hermes/shell-hooks-allowlist.json")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump([], f)
    return path

def get_webhooks_file_path() -> str:
    path = os.path.expanduser("~/.hermes/webhooks.json")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump([], f)
    return path

# --- Shell Hooks ---

@router.get("/shell", response_model=List[ShellHook])
async def get_shell_hooks():
    path = get_shell_hooks_file_path()
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shell")
async def create_shell_hook(hook: ShellHook, _user: User = Depends(RequireRole(["owner", "admin"]))):
    path = get_shell_hooks_file_path()
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
        hooks.append(hook.model_dump())
        with open(path, "w") as f:
            json.dump(hooks, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/shell/{event}")
async def delete_shell_hook(event: str, _user: User = Depends(RequireRole(["owner", "admin"]))):
    path = get_shell_hooks_file_path()
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
        hooks = [h for h in hooks if h.get("event") != event]
        with open(path, "w") as f:
            json.dump(hooks, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shell/{event}/approve")
async def approve_shell_hook(event: str, _user: User = Depends(RequireRole(["owner", "admin"]))):
    path = get_shell_hooks_file_path()
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
        for h in hooks:
            if h.get("event") == event:
                h["approved"] = True
        with open(path, "w") as f:
            json.dump(hooks, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Webhooks ---

@router.get("/webhooks")
def get_webhooks():
    path = get_webhooks_file_path()
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return []

@router.post("/webhooks")
def create_webhook(req: WebhookCreateRequest, _user: User = Depends(RequireRole(["owner", "admin"]))):
    path = get_webhooks_file_path()
    hooks = []
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
    except Exception:
        pass
        
    secret = secrets.token_hex(32)
    new_hook = {
        "id": secrets.token_hex(4),
        "name": req.name,
        "target_url": req.target_url,
        "event_filter": req.event_filter,
        "hmac_secret": secret,
        "enabled": True
    }
    
    hooks.append(new_hook)
    
    with open(path, "w") as f:
        json.dump(hooks, f, indent=2)
        
    return {"status": "success", "hook": new_hook, "one_time_secret": secret}

@router.post("/webhooks/{hook_id}/toggle")
def toggle_webhook(hook_id: str, _user: User = Depends(RequireRole(["owner", "admin"]))):
    path = get_webhooks_file_path()
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
        for h in hooks:
            if h.get("id") == hook_id:
                h["enabled"] = not h.get("enabled", True)
        with open(path, "w") as f:
            json.dump(hooks, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
