from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.db.database import get_db
from app.models.keys import ApiKeyPool
from app.models.users import User
from app.api.deps import get_current_user
from app.core.vault import encrypt_secret, decrypt_secret, mask_secret
from app.core.rbac import RequireRole

logger = logging.getLogger(__name__)

router = APIRouter()

class VaultAddRequest(BaseModel):
    provider: str
    key: str

@router.get("")
async def get_vault_keys(session: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    result = await session.execute(select(ApiKeyPool))
    db_keys = result.scalars().all()
    
    keys = []
    for k in db_keys:
        keys.append({
            "provider": k.provider,
            "key_id": str(k.id),
            "masked_key": k.api_key_masked,
            "status": k.status,
            "current_usage_pct": k.current_usage_pct,
            "rpm_limit": k.rpm_limit
        })
    return keys

@router.post("/add")
async def add_vault_key(
    req: VaultAddRequest,
    _user: User = Depends(RequireRole(["owner", "admin"])),
    session: AsyncSession = Depends(get_db),
):
    try:
        masked = mask_secret(req.key)
        enc = encrypt_secret(req.key)
        
        new_key = ApiKeyPool(
            provider=req.provider,
            model_name="default",
            api_key_masked=masked,
            encrypted_secret=enc,
            status="Active",
            current_usage_pct=0.0,
            rpm_limit=60
        )
        session.add(new_key)
        await session.commit()
        await session.refresh(new_key)
        
        return {"status": "success", "key_id": str(new_key.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VaultRevealRequest(BaseModel):
    key_id: str

@router.post("/reveal")
async def reveal_vault_key(
    req: VaultRevealRequest, 
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    if current_user.role != 'owner':
        raise HTTPException(status_code=403, detail="Only owners can reveal vault keys")
        
    try:
        key_id_int = int(req.key_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid key_id format")
        
    result = await session.execute(select(ApiKeyPool).where(ApiKeyPool.id == key_id_int))
    db_key = result.scalars().first()
    
    if not db_key or not db_key.encrypted_secret:
        raise HTTPException(status_code=404, detail="Key not found")
        
    val = decrypt_secret(db_key.encrypted_secret)
    logger.warning(f"AUDIT: User {current_user.username} revealed vault key ID {req.key_id} (Provider: {db_key.provider})")
    return {"status": "success", "key": val}

class VaultRotateRequest(BaseModel):
    key_id: str

@router.post("/rotate")
async def rotate_vault_key(
    req: VaultRotateRequest,
    _user: User = Depends(RequireRole(["owner"])),
    session: AsyncSession = Depends(get_db),
):
    return {"status": "success", "message": f"Rotation requested for {req.key_id}"}

