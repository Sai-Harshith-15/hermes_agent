import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import select
from app.db.database import async_session_maker
from app.models.users import User
from app.core.security import get_password_hash

async def create_admin():
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.username == "admin"))
        user = result.scalars().first()
        if not user:
            print("Creating admin user...")
            new_user = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role="owner"
            )
            session.add(new_user)
            await session.commit()
            print("Admin user created successfully. Password is 'admin123'")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(create_admin())
