from fastapi import APIRouter
from app.services.hermes.skills_adapter import HermesSkillsAdapter
from typing import List, Dict, Any

router = APIRouter()
adapter = HermesSkillsAdapter()

@router.get("/")
def get_skills() -> List[Dict[str, Any]]:
    return adapter.get_skills()
