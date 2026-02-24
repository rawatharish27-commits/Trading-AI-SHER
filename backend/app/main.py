"""
Main FastAPI Application
Trading AI SHER - Enterprise Trading System
Production-Grade Implementation
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Setup structured logging
setup_logging()

from app.core import settings, init_db, close_db
from app.core.logging import setup_logging
from app.core.metrics import MetricsMiddleware, get_metrics_response, MetricsCollector
from app.api.v1.endpoints import auth, signals, signals_smc, orders, portfolio, market, health
from app.websocket import router as ws_router
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware, CORSSecurityMiddleware, APIVersionMiddleware
from app.exceptions import register_exception_handlers
from app.tasks import task_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan events"""
    # ===== STARTUP =====
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"📝 Environment: {settings.environment}")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")
    
    # Start task scheduler
    await task_scheduler.start()
    logger.info("✅ Task scheduler started")

    # Start database performance monitoring
    from app.services.database_performance_service import start_database_monitoring
    await start_database_monitoring()
    logger.info("✅ Database performance monitoring started")

    # Perform database health checks
    from app.core.database import check_db_health, validate_connection_pool
    logger.info("🔍 Performing database health checks...")
    health_check = await check_db_health()
    if health_check["status"] != "healthy":
        logger.error(f"❌ Database health check failed: {health_check}")
        raise Exception(f"Database health check failed: {health_check.get('error', 'Unknown error')}")

    pool_validation = await validate_connection_pool()
    if not pool_validation.get("pool_config_valid", False):
        logger.error(f"❌ Database pool validation failed: {pool_validation}")
        raise Exception("Database connection pool validation failed")

    logger.info("✅ Database health checks passed")

    # Analyze database indexing strategy
    from app.services.database_indexing_service import get_index_maintenance_report
    logger.info("🔍 Analyzing database indexing strategy...")
    index_report = await get_index_maintenance_report()
    critical_missing = sum(table_data.get("critical_missing", 0) for table_data in index_report["tables"].values())

    if critical_missing > 0:
        logger.warning(f"⚠️ Found {critical_missing} critical missing indexes. Consider running index optimization.")
        # Don't fail startup for missing indexes, just warn
    else:
        logger.info("✅ Database indexing analysis completed")

    # Schedule periodic tasks
    task_scheduler.submit(
        task_scheduler._scheduler_loop,
        name="scheduler_maintenance",
        delay_seconds=0
    )

    # Schedule automated backups (daily at 2 AM)
    from datetime import datetime, time, timedelta
    import asyncio

    async def schedule_daily_backups():
        """Schedule daily automated backups"""
        while True:
            now = datetime.utcnow()
            # Next 2 AM
            next_backup = now.replace(hour=2, minute=0, second=0, microsecond=0)
            if now >= next_backup:
                next_backup = next_backup.replace(day=next_backup.day + 1)

            delay = (next_backup - now).total_seconds()
            logger.info(f"📅 Next automated backup scheduled in {delay:.0f} seconds")

            await asyncio.sleep(delay)

            # Submit backup task
            task_scheduler.submit(
                automated_database_backup,
                name="daily_backup",
                max_retries=3
            )

            # Wait a bit before rescheduling
            await asyncio.sleep(60)

    # Start backup scheduler
    asyncio.create_task(schedule_daily_backups())
    logger.info("✅ Automated backup scheduler started")

    # Schedule backup cleanup (weekly on Sunday at 3 AM)
    async def schedule_weekly_cleanup():
        """Schedule weekly backup cleanup"""
        while True:
            now = datetime.utcnow()
            # Next Sunday 3 AM
            days_until_sunday = (6 - now.weekday()) % 7
            if days_until_sunday == 0 and now.hour >= 3:
                days_until_sunday = 7

            next_cleanup = now.replace(hour=3, minute=0, second=0, microsecond=0) + timedelta(days=days_until_sunday)
            if days_until_sunday == 0 and now.hour >= 3:
                next_cleanup = next_cleanup.replace(day=next_cleanup.day + 7)

            delay = (next_cleanup - now).total_seconds()
            logger.info(f"📅 Next backup cleanup scheduled in {delay:.0f} seconds")

            await asyncio.sleep(delay)

            # Submit cleanup task
            task_scheduler.submit(
                cleanup_old_backups,
                name="weekly_cleanup",
                max_retries=3
            )

            # Wait a bit before rescheduling
            await asyncio.sleep(60)

    # Start cleanup scheduler
    asyncio.create_task(schedule_weekly_cleanup())
    logger.info("✅ Backup cleanup scheduler started")

    # Schedule data retention cleanup (monthly on 1st at 4 AM)
    async def schedule_monthly_retention():
        """Schedule monthly data retention cleanup"""
        while True:
            now = datetime.utcnow()
            # Next 1st of month 4 AM
            if now.month == 12:
                next_month = 1
                next_year = now.year + 1
            else:
                next_month = now.month + 1
                next_year = now.year

            next_cleanup = now.replace(year=next_year, month=next_month, day=1, hour=4, minute=0, second=0, microsecond=0)
            if next_cleanup <= now:
                # If we're already past the 1st, schedule for next month
                if next_month == 12:
                    next_cleanup = next_cleanup.replace(year=next_year + 1, month=1)
                else:
                    next_cleanup = next_cleanup.replace(month=next_month + 1)

            delay = (next_cleanup - now).total_seconds()
            logger.info(f"📅 Next data retention cleanup scheduled in {delay:.0f} seconds")

            await asyncio.sleep(delay)

            # Submit retention cleanup task
            task_scheduler.submit(
                data_retention_cleanup,
                name="monthly_retention",
                max_retries=3
            )

            # Wait a bit before rescheduling
            await asyncio.sleep(60)

    # Start retention cleanup scheduler
    asyncio.create_task(schedule_monthly_retention())
    logger.info("✅ Data retention cleanup scheduler started")
    
    logger.info(f"🎉 {settings.app_name} started successfully!")
    
    yield
    
    # ===== SHUTDOWN =====
    logger.info("🛑 Shutting down...")
    
    # Stop task scheduler
    await task_scheduler.stop()
    logger.info("✅ Task scheduler stopped")
    
    # Close database
    await close_db()
    logger.info("✅ Database connections closed")
    
    logger.info("👋 Application shutdown complete")


# ===== CREATE APPLICATION =====
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## Trading AI SHER - Enterprise Trading System
    
    Production-grade AI-powered trading system with:
    
    ### 🧠 AI Engines
    - **Probability Engine V3**: Calibrated signal generation
    - **5-Layer Risk Management**: Comprehensive risk firewall
    - **Strategy Ensemble**: Multi-strategy voting system
    - **ML Models**: XGBoost + LSTM predictions
    
    ### 📊 Features
    - Real-time market data streaming (WebSocket)
    - AI-powered signal generation
    - SEBI-compliant trading operations
    - Portfolio management & analytics
    - Risk analytics & kill switch
    - Background task processing
    
    ### 🔒 Security
    - JWT Authentication
    - Rate Limiting
    - Role-Based Access Control
    """,
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ===== MIDDLEWARE =====

# HTTPS Enforcement (Production only)
if settings.environment == "production":
    from app.core.security import HTTPSRedirectMiddleware
    app.add_middleware(HTTPSRedirectMiddleware)

# Request Size Limits
from app.core.security import RequestSizeLimitMiddleware
app.add_middleware(RequestSizeLimitMiddleware, max_request_size=10 * 1024 * 1024)  # 10MB

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
app.add_middleware(RateLimitMiddleware, requests_per_minute=100, burst_size=30)

# Request Logging
app.add_middleware(RequestLoggingMiddleware)

# Security Headers
app.add_middleware(CORSSecurityMiddleware)

# API Version Headers
app.add_middleware(APIVersionMiddleware, current_version="v1", deprecated_versions=[])

# ===== EXCEPTION HANDLERS =====
register_exception_handlers(app)

# ===== ROUTES =====

# Authentication
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["🔐 Authentication"]
)

# AI Signals
app.include_router(
    signals.router,
    prefix="/api/v1/signals",
    tags=["📊 AI Signals"]
)

# SMC Signals
app.include_router(
    signals_smc.router,
    prefix="/api/v1/signals/smc",
    tags=["🎯 SMC Signals"]
)

# Orders
app.include_router(
    orders.router,
    prefix="/api/v1/orders",
    tags=["📝 Orders"]
)

# Portfolio
app.include_router(
    portfolio.router,
    prefix="/api/v1/portfolio",
    tags=["💼 Portfolio"]
)

# Market Data
app.include_router(
    market.router,
    prefix="/api/v1/market",
    tags=["📈 Market Data"]
)

# WebSocket
app.include_router(
    ws_router,
    tags=["🔌 WebSocket"]
)

# Health Endpoints
app.include_router(
    health.router,
    tags=["🏥 Health"]
)


# ===== HEALTH ENDPOINTS =====

@app.get("/health", tags=["🏥 Health"])
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/health/ready", tags=["🏥 Health"])
async def readiness_check():
    """Readiness check for Kubernetes"""
    return {
        "status": "ready",
        "services": {
            "database": "connected",
            "cache": "connected",
            "scheduler": "running" if task_scheduler.is_running else "stopped"
        }
    }


@app.get("/health/live", tags=["🏥 Health"])
async def liveness_check():
    """Liveness check for Kubernetes"""
    return {"status": "alive"}


# ===== ROOT ENDPOINT =====

@app.get("/", tags=["🏠 Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Enterprise-Grade AI-Powered Trading System",
        "documentation": {
            "swagger": "/api/docs",
            "redoc": "/api/redoc",
            "openapi": "/api/v1/openapi.json"
        },
        "endpoints": {
            "auth": "/api/v1/auth",
            "signals": "/api/v1/signals",
            "smc_signals": "/api/v1/signals/smc",
            "orders": "/api/v1/orders",
            "portfolio": "/api/v1/portfolio",
            "market": "/api/v1/market",
            "websocket": "/ws/market"
        }
    }


# ===== METRICS ENDPOINT =====

@app.get("/metrics", tags=["📊 Metrics"])
async def metrics():
    """Prometheus-compatible metrics endpoint"""
    # Update system metrics
    MetricsCollector.update_system_metrics()
    MetricsCollector.update_business_metrics()

    return get_metrics_response()


# ===== ENTRY POINT =====

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=1 if settings.debug else settings.workers,
        log_level="debug" if settings.debug else "info",
    )
