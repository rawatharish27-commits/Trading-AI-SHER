"""
Main FastAPI Application - Simplified for Single Admin
Trading AI SHER - Automated Swing Trading System
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

from app.core import init_db, close_db
from app.core.admin_config import admin_config
from app.api.v1.endpoints import admin
from app.models.simple_admin import admin_state


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan events"""
    # ===== STARTUP =====
    logger.info("🚀 Starting Trading AI SHER - Single Admin Mode")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")
    
    # Load admin state from config
    admin_state.capital.total_capital = admin_config.TOTAL_CAPITAL
    admin_state.capital.available_capital = admin_config.TOTAL_CAPITAL
    admin_state.positions.max_positions = admin_config.AUTO_TRADE_MAX_POSITIONS
    admin_state.auto_trade_enabled = admin_config.AUTO_TRADE_ENABLED
    admin_state.tracked_symbols = admin_config.tracked_symbols_list
    
    logger.info(f"✅ Admin state loaded - Capital: ₹{admin_config.TOTAL_CAPITAL:,.0f}")
    logger.info(f"✅ Tracking {len(admin_state.tracked_symbols)} symbols")
    logger.info("🎉 Trading AI SHER ready!")
    
    yield
    
    # ===== SHUTDOWN =====
    logger.info("🛑 Shutting down...")
    await close_db()
    logger.info("👋 Application shutdown complete")


# ===== CREATE APPLICATION =====
app = FastAPI(
    title="Trading AI SHER - Single Admin System",
    version="6.0.0",
    description="""
    ## 🤖 Trading AI SHER - Automated Swing Trading System
    
    **Single User System - Admin Only**
    
    ### Features:
    - ✅ Fully Automated Swing Trading (2-3 days holding)
    - ✅ Multi-Timeframe Analysis (Weekly, Daily, Hourly)
    - ✅ Pre-Momentum Detection
    - ✅ Smart Exit Decisions
    - ✅ Real-time Notifications (Telegram)
    - ✅ Risk Management with Kill Switch
    
    ### Quick Start:
    1. GET /admin/dashboard - See everything
    2. POST /admin/auto/enable - Start auto trading
    3. GET /admin/trades/active - View active trades
    4. GET /admin/statistics - View performance
    
    ### No Authentication Required
    This is a single-user system for admin only.
    """,
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ===== MIDDLEWARE =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== ROUTES =====
app.include_router(
    admin.router,
    prefix="/admin",
)


# ===== HEALTH ENDPOINTS =====

@app.get("/", tags=["🏠 Root"])
async def root():
    """Root endpoint - Admin Dashboard"""
    return {
        "name": "Trading AI SHER",
        "mode": "Single Admin User",
        "version": "6.0.0",
        "message": "Welcome Admin! Use /admin/* endpoints for all operations.",
        "quick_links": {
            "dashboard": "/admin/dashboard",
            "active_trades": "/admin/trades/active",
            "auto_status": "/admin/auto/status",
            "capital": "/admin/capital",
            "risk": "/admin/risk",
            "statistics": "/admin/statistics",
        },
        "documentation": {
            "swagger": "/api/docs",
            "redoc": "/api/redoc",
        }
    }


@app.get("/health", tags=["🏥 Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "Trading AI SHER",
        "version": "6.0.0",
        "mode": "Single Admin",
    }


@app.get("/health/ready", tags=["🏥 Health"])
async def readiness_check():
    """Readiness check"""
    return {
        "status": "ready",
        "database": "connected",
    }


@app.get("/health/live", tags=["🏥 Health"])
async def liveness_check():
    """Liveness check"""
    return {"status": "alive"}


# ===== ENTRY POINT =====

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
