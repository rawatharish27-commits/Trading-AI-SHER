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
from loguru import logger

from app.core.config import settings

# Production-grade database connection pooling validation
def get_pool_config() -> Dict[str, Any]:
    """Get optimized connection pool configuration based on database type and environment"""
    is_postgres = "postgresql" in settings.effective_database_url
    is_production = settings.environment.lower() == "production"

    if is_postgres:
        if is_production:
            # Production PostgreSQL settings - optimized for high load
            return {
                "pool_size": 20,  # Core connection pool size
                "max_overflow": 30,  # Additional connections allowed
                "pool_timeout": 30,  # Connection acquisition timeout
                "pool_recycle": 1800,  # Recycle connections every 30 minutes
                "pool_pre_ping": True,  # Validate connections before use
                "pool_reset_on_return": "rollback",  # Reset connection state
                "echo": False,  # Disable SQL logging in production
            }
        else:
            # Development PostgreSQL settings
            return {
                "pool_size": 10,
                "max_overflow": 20,
                "pool_timeout": 30,
                "pool_recycle": 1800,
                "pool_pre_ping": True,
                "pool_reset_on_return": "rollback",
                "echo": settings.debug,
            }
    else:
        # SQLite settings (development only)
        return {
            "pool_size": 5,
            "max_overflow": 10,
            "connect_args": {"check_same_thread": False},
            "pool_pre_ping": True,
            "echo": settings.debug,
        }

# Create async engine with validated production-grade configuration and retry logic
def create_engine_with_retry(url: str, pool_config: Dict[str, Any], max_retries: int = 5, retry_delay: float = 1.0):
    """Create database engine with connection retry logic"""
    last_exception = None

    for attempt in range(max_retries):
        try:
            engine = create_async_engine(
                url,
                future=True,
                **pool_config
            )

            # Test the connection immediately
            import asyncio
            asyncio.run(test_connection_immediate(engine))
            logger.info(f"✅ Database connection established on attempt {attempt + 1}")
            return engine

        except Exception as e:
            last_exception = e
            logger.warning(f"Database connection attempt {attempt + 1}/{max_retries} failed: {e}")

            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
            else:
                logger.error(f"❌ All {max_retries} database connection attempts failed")

    raise last_exception or Exception("Database connection failed after all retries")


async def test_connection_immediate(engine):
    """Test database connection immediately"""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        raise


pool_config = get_pool_config()
engine = create_engine_with_retry(settings.effective_database_url, pool_config)

# Validate pool configuration on startup
async def validate_connection_pool() -> Dict[str, Any]:
    """
    Validate database connection pool configuration and performance
    """
    validation_results = {
        "pool_config_valid": True,
        "connection_test_passed": False,
        "pool_metrics_healthy": True,
        "recommendations": [],
        "warnings": []
    }

    try:
        # Test basic connectivity
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        validation_results["connection_test_passed"] = True
        logger.info("✅ Database connection test passed")

    except Exception as e:
        validation_results["connection_test_passed"] = False
        validation_results["pool_config_valid"] = False
        validation_results["warnings"].append(f"Connection test failed: {e}")
        logger.error(f"❌ Database connection test failed: {e}")
        return validation_results

    # Validate pool configuration
    pool = engine.pool

    # Check pool size appropriateness
    if hasattr(pool, 'size'):
        pool_size = pool.size()
        max_overflow = getattr(pool, '_max_overflow', 0)

        # Recommendations based on pool size
        if pool_size < 5:
            validation_results["warnings"].append("Pool size is very small, consider increasing for better performance")
        elif pool_size > 50:
            validation_results["warnings"].append("Pool size is very large, monitor for resource usage")

        # Check if overflow is reasonable (should be 1.5x pool_size max)
        if max_overflow > pool_size * 1.5:
            validation_results["recommendations"].append("Max overflow is high, consider reducing to improve resource management")

    # Test connection acquisition under load (simulate concurrent requests)
    await _test_connection_acquisition_under_load(validation_results)

    # Validate pool health monitoring
    pool_health = await check_db_health()
    if pool_health["status"] != "healthy":
        validation_results["pool_metrics_healthy"] = False
        validation_results["warnings"].append(f"Pool health check failed: {pool_health.get('error', 'Unknown error')}")

    # Environment-specific validations
    if settings.environment.lower() == "production":
        # Production-specific checks
        if pool_config.get("echo", False):
            validation_results["warnings"].append("SQL echo is enabled in production, consider disabling for performance")

        if pool_config.get("pool_pre_ping", False) == False:
            validation_results["recommendations"].append("Enable pool_pre_ping for better connection reliability")

        # Check connection timeout settings
        pool_timeout = pool_config.get("pool_timeout", 30)
        if pool_timeout > 60:
            validation_results["warnings"].append("Pool timeout is very high, may cause slow failure detection")

    # Log validation results
    if validation_results["warnings"]:
        logger.warning(f"⚠️ Pool validation warnings: {len(validation_results['warnings'])}")

    if validation_results["recommendations"]:
        logger.info(f"💡 Pool validation recommendations: {len(validation_results['recommendations'])}")

    if validation_results["pool_config_valid"] and validation_results["connection_test_passed"]:
        logger.info("✅ Database connection pool validation completed successfully")
    else:
        logger.error("❌ Database connection pool validation failed")

    return validation_results


async def _test_connection_acquisition_under_load(validation_results: Dict[str, Any]) -> None:
    """Test connection acquisition performance under simulated load"""
    import asyncio

    async def acquire_connection():
        try:
            async with async_session_maker() as session:
                await session.execute(text("SELECT 1"))
                await asyncio.sleep(0.01)  # Simulate brief usage
            return True
        except Exception as e:
            logger.warning(f"Connection acquisition failed: {e}")
            return False

    # Test concurrent connection acquisition (simulate 10 concurrent requests)
    tasks = [acquire_connection() for _ in range(10)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    successful_connections = sum(1 for r in results if r is True)
    failed_connections = len(results) - successful_connections

    if failed_connections > 0:
        validation_results["warnings"].append(f"{failed_connections} connection acquisitions failed under load test")
        validation_results["pool_metrics_healthy"] = False
    else:
        logger.info(f"✅ Connection acquisition test passed: {successful_connections}/10 successful")

    # Check pool statistics after load test
    pool = engine.pool
    if hasattr(pool, 'checkedout'):
        checked_out = pool.checkedout()
        if checked_out > 0:
            validation_results["warnings"].append(f"{checked_out} connections still checked out after load test")

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
            "database": "sqlite" if "sqlite" in settings.effective_database_url else "postgresql",
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
            except Exception as e:
                logger.warning(f"Failed to get users count: {e}")
                stats["users_count"] = "table_not_found"

            try:
                # Signals count
                result = await session.execute(text("SELECT COUNT(*) FROM signals"))
                stats["signals_count"] = result.scalar() or 0
            except Exception as e:
                logger.warning(f"Failed to get signals count: {e}")
                stats["signals_count"] = "table_not_found"

            try:
                # Orders count
                result = await session.execute(text("SELECT COUNT(*) FROM orders"))
                stats["orders_count"] = result.scalar() or 0
            except Exception as e:
                logger.warning(f"Failed to get orders count: {e}")
                stats["orders_count"] = "table_not_found"

            try:
                # Positions count
                result = await session.execute(text("SELECT COUNT(*) FROM positions"))
                stats["positions_count"] = result.scalar() or 0
            except Exception as e:
                logger.warning(f"Failed to get positions count: {e}")
                stats["positions_count"] = "table_not_found"
            
            return stats
    except Exception as e:
        return {"error": str(e)}
