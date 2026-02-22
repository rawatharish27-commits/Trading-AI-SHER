"""
Database Configuration - Simplified for Single Admin
SQLAlchemy Async Engine with Session Management
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, Any
import time

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.core.admin_config import admin_config

# Create async engine
engine = create_async_engine(
    admin_config.DATABASE_URL,
    echo=admin_config.LOG_LEVEL == "DEBUG",
    future=True,
    connect_args={
        "check_same_thread": False,  # SQLite only
    } if "sqlite" in admin_config.DATABASE_URL else {},
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database session"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables"""
    # Import models to register them
    from app.models.swing_trade import SwingTrade, HistoricalAnalysis, MarketDataCache
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections"""
    await engine.dispose()


async def check_db_health() -> Dict[str, Any]:
    """Check database health status"""
    start_time = time.time()
    
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        
        latency = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "database": "sqlite" if "sqlite" in admin_config.DATABASE_URL else "postgresql",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }
