"""
Database connection — Singleton pattern.
Shared across all microservices via volume mount.
"""
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://residencialo_user:residencialo_pass_2026@postgres:5432/residencialo"
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True, pool_size=5)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
