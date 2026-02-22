"""
Database Configuration
SQLAlchemy Async Engine with Session Management
Production-grade connection pooling and health checks
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

from app.core.config import settings

# Create async engine with production-grade configuration
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    # Connection pooling
    pool_size=20,  # Number of connections to keep in pool
    max_overflow=10,  # Additional connections beyond pool_size
    pool_timeout=30,  # Seconds to wait for a connection from pool
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Check connection health before using
    # For SQLite, these settings don't apply but won't cause errors
    connect_args={
        "check_same_thread": False,  # SQLite only
    } if "sqlite" in settings.database_url else {},
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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections"""
    await engine.dispose()


async def check_db_health() -> Dict[str, Any]:
    """
    Check database health status.
    Returns connection status, latency, and pool statistics.
    """
    start_time = time.time()
    
    try:
        # Execute a simple query to check connectivity
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        
        latency = (time.time() - start_time) * 1000  # Convert to ms
        
        # Get pool statistics
        pool = engine.pool
        pool_status = {
            "size": pool.size() if hasattr(pool, 'size') else 0,
            "checked_in": pool.checkedin() if hasattr(pool, 'checkedin') else 0,
            "checked_out": pool.checkedout() if hasattr(pool, 'checkedout') else 0,
            "overflow": pool.overflow() if hasattr(pool, 'overflow') else 0,
            "invalid": pool.invalidatedcount() if hasattr(pool, 'invalidatedcount') else 0,
        }
        
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "database": "sqlite" if "sqlite" in settings.database_url else "postgresql",
            "pool": pool_status,
        }
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        return {
            "status": "unhealthy",
            "error": str(e),
            "latency_ms": round(latency, 2),
        }


async def get_db_stats() -> Dict[str, Any]:
    """Get database statistics for monitoring"""
    try:
        async with async_session_maker() as session:
            # Get table row counts
            stats = {}
            
            try:
                # Users count
                result = await session.execute(text("SELECT COUNT(*) FROM users"))
                stats["users_count"] = result.scalar() or 0
            except:
                stats["users_count"] = "table_not_found"
            
            try:
                # Signals count
                result = await session.execute(text("SELECT COUNT(*) FROM signals"))
                stats["signals_count"] = result.scalar() or 0
            except:
                stats["signals_count"] = "table_not_found"
            
            try:
                # Orders count
                result = await session.execute(text("SELECT COUNT(*) FROM orders"))
                stats["orders_count"] = result.scalar() or 0
            except:
                stats["orders_count"] = "table_not_found"
            
            try:
                # Positions count
                result = await session.execute(text("SELECT COUNT(*) FROM positions"))
                stats["positions_count"] = result.scalar() or 0
            except:
                stats["positions_count"] = "table_not_found"
            
            return stats
    except Exception as e:
        return {"error": str(e)}
