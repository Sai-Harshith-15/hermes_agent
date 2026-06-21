import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ShellHook(BaseModel):
    event: str
    command: str
    matcher: str
    timeout: int = 30

def get_hooks_file_path() -> str:
    path = os.path.expanduser("~/.hermes/shell-hooks-allowlist.json")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump([], f)
    return path

@router.get("/", response_model=List[ShellHook])
async def get_hooks():
    path = get_hooks_file_path()
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_hook(hook: ShellHook):
    path = get_hooks_file_path()
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
        hooks.append(hook.model_dump())
        with open(path, "w") as f:
            json.dump(hooks, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{event}")
async def delete_hook(event: str):
    path = get_hooks_file_path()
    try:
        with open(path, "r") as f:
            hooks = json.load(f)
        hooks = [h for h in hooks if h.get("event") != event]
        with open(path, "w") as f:
            json.dump(hooks, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
