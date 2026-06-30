from fastapi import APIRouter
from app.services.hermes.state_adapter import HermesStateAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = HermesStateAdapter()

@router.get("/search")
async def search_memory(q: str) -> List[Dict[str, Any]]:
    return await adapter.search_memory(q)

import os
from pydantic import BaseModel

class MemoryContent(BaseModel):
    content: str

@router.get("/file")
async def read_memory_file(filename: str = "MEMORY.md") -> Dict[str, Any]:
    if filename not in ["MEMORY.md", "USER.md"]:
        filename = "MEMORY.md"
    path = os.path.expanduser(f"~/.hermes/{filename}")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": ""}

@router.post("/file")
async def write_memory_file(payload: MemoryContent, filename: str = "MEMORY.md") -> Dict[str, Any]:
    if filename not in ["MEMORY.md", "USER.md"]:
        filename = "MEMORY.md"
    path = os.path.expanduser(f"~/.hermes/{filename}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload.content)
    return {"status": "success"}
