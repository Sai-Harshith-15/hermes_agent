from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from app.services.hermes.sandbox_service import HermesSandboxService
from typing import List, Dict, Any
from app.core.rbac import RequireRole

router = APIRouter()
sandbox_service = HermesSandboxService()

class FileUpdateRequest(BaseModel):
    content: str

@router.get("/files")
def list_files(path: str = "") -> List[Dict[str, Any]]:
    try:
        return sandbox_service.list_files(path)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/file")
def read_file(path: str = Query(..., description="Path to the file to read")):
    try:
        content = sandbox_service.read_file(path)
        return {"content": content}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/file")
def write_file(path: str, req: FileUpdateRequest):
    try:
        success = sandbox_service.write_file(path, req.content)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to write file")
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
