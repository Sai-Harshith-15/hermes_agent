from fastapi import APIRouter, HTTPException, Depends
from app.models.users import User
from app.core.rbac import RequireRole
from pydantic import BaseModel
from typing import Dict, Any, List
import asyncio
import httpx
import subprocess
from app.services.hermes.config_adapter import HermesConfigAdapter
from ruamel.yaml import YAML

router = APIRouter()
adapter = HermesConfigAdapter()
ryaml = YAML()
ryaml.preserve_quotes = True

class MCPCreateRequest(BaseModel):
    name: str
    type: str # 'stdio' or 'sse'
    command_or_url: str

class MCPTestRequest(BaseModel):
    type: str
    command_or_url: str

@router.get("")
async def get_mcp_servers() -> List[Dict[str, Any]]:
    config = adapter.read_config()
    mcp_servers = config.get("mcp_servers", {})
    # Convert dict to list
    return [{"name": k, **v} for k, v in mcp_servers.items()]

@router.post("")
async def add_mcp_server(req: MCPCreateRequest, _user: User = Depends(RequireRole(["owner", "admin"]))):
    raw_config = adapter.get_raw_config()
    if not raw_config:
        raw_config = "mcp_servers: {}\n"
    
    try:
        data = ryaml.load(raw_config)
        if "mcp_servers" not in data or data["mcp_servers"] is None:
            data["mcp_servers"] = {}
            
        data["mcp_servers"][req.name] = {
            "type": req.type,
            "command_or_url": req.command_or_url
        }
        
        # Save back
        import io
        buf = io.StringIO()
        ryaml.dump(data, buf)
        adapter.update_raw_config(buf.getvalue())
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{server_name}")
async def delete_mcp_server(server_name: str, _user: User = Depends(RequireRole(["owner", "admin"]))):
    raw_config = adapter.get_raw_config()
    if not raw_config:
        return {"status": "not_found"}
        
    try:
        data = ryaml.load(raw_config)
        if "mcp_servers" in data and server_name in data["mcp_servers"]:
            del data["mcp_servers"][server_name]
            import io
            buf = io.StringIO()
            ryaml.dump(data, buf)
            adapter.update_raw_config(buf.getvalue())
            return {"status": "success"}
        else:
            raise HTTPException(status_code=404, detail="Server not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test")
async def test_mcp_server(req: MCPTestRequest, _user: User = Depends(RequireRole(["owner", "admin"]))):
    if req.type == "sse":
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(req.command_or_url)
                if res.status_code == 200:
                    return {"status": "success", "message": "Connection verified"}
                else:
                    return {"status": "error", "message": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    elif req.type == "stdio":
        try:
            import shlex
            cmd = shlex.split(req.command_or_url)
            # Just test if the executable exists and can be spawned
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # Give it a second to see if it instantly crashes
            await asyncio.sleep(1)
            if proc.poll() is not None:
                if proc.returncode != 0:
                    err = proc.stderr.read().decode('utf-8') if proc.stderr else ''
                    return {"status": "error", "message": f"Process exited with {proc.returncode}: {err}"}
            proc.kill()
            return {"status": "success", "message": "Executable spawned successfully"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    else:
        raise HTTPException(status_code=400, detail="Invalid type")
