from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.db.database import get_db
from app.models.users import User
from app.core.security import verify_password, create_access_token, get_password_hash
from pydantic import BaseModel
from sqlalchemy import func
from app.api.deps import get_current_user
from fastapi import Request
from app.core.limiter import limiter

router = APIRouter()

class SetupRequest(BaseModel):
    username: str = "admin"
    password: str = "admin123"

@router.post("/setup")
async def setup_admin(req: SetupRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(func.count(User.id)))
    count = result.scalar()
    if count > 0:
        raise HTTPException(status_code=400, detail="Setup already complete")
    
    new_user = User(
        username=req.username,
        hashed_password=get_password_hash(req.password),
        role="owner"
    )
    session.add(new_user)
    await session.commit()
    return {"status": "success", "message": "Admin user created"}

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }
