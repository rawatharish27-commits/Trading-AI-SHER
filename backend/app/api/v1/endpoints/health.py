"""
Health Check Endpoint
Production-grade health monitoring
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
import time
import platform

from app.core.database import check_db_health, get_db_stats
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    Returns 200 if service is running.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check with all dependencies.
    Includes database, cache, and system metrics.
    """
    start_time = time.time()
    
    # Check database
    db_health = await check_db_health()
    
    # Check Redis (if configured)
    redis_health = {"status": "not_configured"}
    if settings.redis_host:
        try:
            from app.cache.redis_client import RedisClient
            # Try to ping Redis
            client = RedisClient.get_client()
            if client:
                await client.ping()
                redis_health = {"status": "healthy"}
        except Exception as e:
            redis_health = {"status": "unhealthy", "error": str(e)}
    
    total_latency = (time.time() - start_time) * 1000
    
    # Determine overall status
    all_healthy = (
        db_health["status"] == "healthy" and
        redis_health["status"] in ["healthy", "not_configured"]
    )
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "latency_ms": round(total_latency, 2),
        "dependencies": {
            "database": db_health,
            "redis": redis_health,
        },
        "system": {
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "machine": platform.machine(),
        },
    }


@router.get("/health/database")
async def database_health() -> Dict[str, Any]:
    """
    Database-specific health check.
    Returns detailed database connection information.
    """
    return await check_db_health()


@router.get("/health/stats")
async def database_stats() -> Dict[str, Any]:
    """
    Database statistics for monitoring.
    Returns table counts and other metrics.
    """
    return await get_db_stats()


@router.get("/health/ready")
async def readiness_check() -> Dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.
    Returns 200 only if service can handle requests.
    """
    db_health = await check_db_health()
    
    if db_health["status"] == "healthy":
        return {"status": "ready"}
    
    return {
        "status": "not_ready",
        "reason": "database_unhealthy",
        "details": db_health,
    }


@router.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.
    Returns 200 if service is alive (even if dependencies are down).
    """
    return {"status": "alive"}
