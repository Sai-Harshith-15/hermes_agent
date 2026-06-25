import os
import json
import asyncio
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any
from app.websocket_manager import manager

router = APIRouter()

class ToggleSkillRequest(BaseModel):
    skill_id: str
    enabled: bool

class InstallSkillRequest(BaseModel):
    skill_id: str

def get_skills_dir() -> Path:
    d = Path(os.path.expanduser("~/.hermes/skills"))
    d.mkdir(parents=True, exist_ok=True)
    return d

@router.get("/local")
def get_local_skills() -> List[Dict[str, Any]]:
    skills_dir = get_skills_dir()
    skills = []
    for entry in skills_dir.iterdir():
        if entry.is_dir():
            manifest_path = entry / "manifest.json"
            if manifest_path.exists():
                try:
                    with open(manifest_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["id"] = entry.name
                        skills.append(data)
                except Exception:
                    pass
    return skills

@router.post("/toggle")
def toggle_skill(req: ToggleSkillRequest):
    manifest_path = get_skills_dir() / req.skill_id / "manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Skill not found")
        
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        data["enabled"] = req.enabled
        
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        return {"status": "success", "enabled": req.enabled}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def stream_install_process(skill_id: str):
    import shlex
    cmd = shlex.split(f"hermes skill install {skill_id}")
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        
        if proc.stdout:
            while True:
                line = await proc.stdout.readline()
                if not line:
                    break
                # Broadcast the line to websockets
                await manager.broadcast({
                    "type": "ops_log",
                    "data": {"skill_id": skill_id, "log": line.decode("utf-8")}
                })
        
        await proc.wait()
        await manager.broadcast({
            "type": "ops_log",
            "data": {"skill_id": skill_id, "log": f"\nProcess exited with code {proc.returncode}"}
        })
    except Exception as e:
        await manager.broadcast({
            "type": "ops_log",
            "data": {"skill_id": skill_id, "log": f"\nError: {str(e)}"}
        })

@router.post("/install")
async def install_skill(req: InstallSkillRequest, background_tasks: BackgroundTasks):
    # Triggers background subprocess and streams output via websocket
    background_tasks.add_task(stream_install_process, req.skill_id)
    return {"status": "installing"}

async def stream_update_all_process():
    import shlex
    cmd = shlex.split("hermes skills update")
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        
        if proc.stdout:
            while True:
                line = await proc.stdout.readline()
                if not line:
                    break
                await manager.broadcast({
                    "type": "ops_log",
                    "data": {"skill_id": "update-all", "log": line.decode("utf-8")}
                })
        
        await proc.wait()
        await manager.broadcast({
            "type": "ops_log",
            "data": {"skill_id": "update-all", "log": f"\nProcess exited with code {proc.returncode}"}
        })
    except Exception as e:
        await manager.broadcast({
            "type": "ops_log",
            "data": {"skill_id": "update-all", "log": f"\nError: {str(e)}"}
        })

@router.post("/update-all")
async def update_all_skills(background_tasks: BackgroundTasks):
    background_tasks.add_task(stream_update_all_process)
    return {"status": "updating"}

# To not break existing get_skills
@router.get("/")
def get_skills_legacy() -> List[Dict[str, Any]]:
    return get_local_skills()
