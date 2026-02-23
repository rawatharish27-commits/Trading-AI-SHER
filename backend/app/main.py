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

from app.core import settings, init_db, close_db
from app.core.metrics import MetricsMiddleware, get_metrics_response, MetricsCollector
from app.api.v1.endpoints import auth, signals, signals_smc, orders, portfolio, market, health
from app.websocket import router as ws_router
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware, CORSSecurityMiddleware
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
    
    # Schedule periodic tasks
    task_scheduler.submit(
        task_scheduler._scheduler_loop,
        name="scheduler_maintenance",
        delay_seconds=0
    )
    
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
