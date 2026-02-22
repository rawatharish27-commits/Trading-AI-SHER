"""
Admin Only API Endpoints - Simplified
Single User - No Authentication Required
Direct access for admin
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
import asyncio

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from loguru import logger

from app.core.admin_config import admin_config
from app.models.simple_admin import admin_state
from app.models.swing_trade import SwingTrade, SwingTradeStatus, ExitReason
from app.core.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter(tags=["🤖 Admin Panel"])


# ==================== REQUEST MODELS ====================

class UpdateCapitalRequest(BaseModel):
    """Update trading capital"""
    total_capital: float = Field(..., gt=0)


class UpdateSymbolsRequest(BaseModel):
    """Update tracked symbols"""
    symbols: List[str]


class TradeRequest(BaseModel):
    """Manual trade request"""
    symbol: str
    side: str  # LONG, SHORT
    quantity: int
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: Optional[float] = None
    target_3: Optional[float] = None


class UpdateConfigRequest(BaseModel):
    """Update admin config"""
    auto_trade_enabled: Optional[bool] = None
    confidence_threshold: Optional[float] = None
    max_positions: Optional[int] = None
    capital_per_trade: Optional[float] = None


# ==================== DASHBOARD ====================

@router.get("/dashboard")
async def get_dashboard():
    """
    Get complete dashboard data
    
    All-in-one endpoint for admin dashboard
    """
    return {
        "admin": {
            "name": admin_config.ADMIN_NAME,
            "email": admin_config.ADMIN_EMAIL,
            "mobile": admin_config.ADMIN_MOBILE,
        },
        "capital": admin_state.capital.to_dict(),
        "pnl": admin_state.pnl.to_dict(),
        "positions": admin_state.positions.to_dict(),
        "risk": admin_state.risk.to_dict(),
        "stats": admin_state.stats.to_dict(),
        "trading": {
            "auto_enabled": admin_state.auto_trade_enabled,
            "tracked_symbols": admin_state.tracked_symbols,
        },
        "last_updated": admin_state.last_updated.isoformat(),
    }


# ==================== CAPITAL MANAGEMENT ====================

@router.get("/capital")
async def get_capital():
    """Get current capital status"""
    return admin_state.capital.to_dict()


@router.post("/capital")
async def update_capital(request: UpdateCapitalRequest):
    """Update total trading capital"""
    admin_state.capital.total_capital = request.total_capital
    admin_state.capital.available_capital = request.total_capital - admin_state.capital.used_capital
    return {
        "status": "updated",
        "capital": admin_state.capital.to_dict(),
    }


# ==================== AUTO TRADING CONTROL ====================

@router.get("/auto/status")
async def get_auto_status():
    """Get auto trading status"""
    return {
        "enabled": admin_state.auto_trade_enabled,
        "can_trade": admin_state.can_trade(),
        "tracked_symbols": admin_state.tracked_symbols,
        "positions": admin_state.positions.open_positions,
        "max_positions": admin_state.positions.max_positions,
    }


@router.post("/auto/enable")
async def enable_auto_trading():
    """Enable auto trading"""
    can_trade, reason = admin_state.can_trade()
    if not can_trade:
        raise HTTPException(status_code=400, detail=reason)
    
    admin_state.auto_trade_enabled = True
    return {"status": "enabled", "message": "Auto trading enabled"}


@router.post("/auto/disable")
async def disable_auto_trading():
    """Disable auto trading"""
    admin_state.auto_trade_enabled = False
    return {"status": "disabled", "message": "Auto trading disabled"}


# ==================== SYMBOLS MANAGEMENT ====================

@router.get("/symbols")
async def get_symbols():
    """Get tracked symbols"""
    return {
        "symbols": admin_state.tracked_symbols,
        "count": len(admin_state.tracked_symbols),
    }


@router.post("/symbols")
async def update_symbols(request: UpdateSymbolsRequest):
    """Update tracked symbols"""
    admin_state.tracked_symbols = [s.upper() for s in request.symbols]
    return {
        "status": "updated",
        "symbols": admin_state.tracked_symbols,
    }


@router.post("/symbols/{symbol}/add")
async def add_symbol(symbol: str):
    """Add a symbol to tracking"""
    symbol = symbol.upper()
    if symbol not in admin_state.tracked_symbols:
        admin_state.tracked_symbols.append(symbol)
    return {"status": "added", "symbol": symbol}


@router.delete("/symbols/{symbol}")
async def remove_symbol(symbol: str):
    """Remove a symbol from tracking"""
    symbol = symbol.upper()
    if symbol in admin_state.tracked_symbols:
        admin_state.tracked_symbols.remove(symbol)
    return {"status": "removed", "symbol": symbol}


# ==================== TRADES MANAGEMENT ====================

@router.get("/trades/active")
async def get_active_trades():
    """Get all active trades"""
    async for db in get_db():
        result = await db.execute(
            select(SwingTrade).where(
                SwingTrade.status == SwingTradeStatus.ACTIVE
            ).order_by(SwingTrade.entry_time.desc())
        )
        trades = result.scalars().all()
        
        return {
            "count": len(trades),
            "trades": [
                {
                    "id": t.id,
                    "symbol": t.symbol,
                    "side": t.side,
                    "quantity": t.quantity,
                    "entry_price": t.entry_price,
                    "current_price": t.current_price,
                    "stop_loss": t.stop_loss,
                    "target_1": t.target_1,
                    "target_2": t.target_2,
                    "target_3": t.target_3,
                    "unrealized_pnl": round(t.unrealized_pnl, 2),
                    "pnl_percent": round(t.pnl_percent, 2),
                    "days_held": t.days_held,
                    "entry_time": t.entry_time.isoformat() if t.entry_time else None,
                }
                for t in trades
            ]
        }


@router.get("/trades/history")
async def get_trade_history(limit: int = 50):
    """Get trade history"""
    async for db in get_db():
        result = await db.execute(
            select(SwingTrade).order_by(SwingTrade.created_at.desc()).limit(limit)
        )
        trades = result.scalars().all()
        
        return {
            "count": len(trades),
            "trades": [
                {
                    "id": t.id,
                    "symbol": t.symbol,
                    "side": t.side,
                    "status": t.status.value,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "realized_pnl": round(t.realized_pnl, 2) if t.realized_pnl else 0,
                    "entry_date": t.entry_date.isoformat() if t.entry_date else None,
                    "exit_date": t.exit_date.isoformat() if t.exit_date else None,
                    "exit_reason": t.exit_reason.value if t.exit_reason else None,
                }
                for t in trades
            ]
        }


@router.post("/trades/manual")
async def execute_manual_trade(request: TradeRequest):
    """Execute a manual trade"""
    async for db in get_db():
        # Check if can trade
        can_trade, reason = admin_state.can_trade()
        if not can_trade:
            raise HTTPException(status_code=400, detail=reason)
        
        # Calculate risk
        trade_value = request.quantity * request.entry_price
        if trade_value > admin_state.capital.available_capital:
            raise HTTPException(status_code=400, detail="Insufficient capital")
        
        # Create trade
        trade = SwingTrade(
            symbol=request.symbol.upper(),
            exchange="NSE",
            side=request.side.upper(),
            status=SwingTradeStatus.ACTIVE,
            quantity=request.quantity,
            entry_price=request.entry_price,
            current_price=request.entry_price,
            stop_loss=request.stop_loss,
            target_1=request.target_1,
            target_2=request.target_2,
            target_3=request.target_3,
            max_holding_days=admin_config.AUTO_TRADE_Holding_DAYS,
            entry_date=date.today(),
            entry_time=datetime.now(),
            strategy_name="MANUAL",
        )
        
        db.add(trade)
        await db.commit()
        await db.refresh(trade)
        
        # Update state
        admin_state.positions.open_positions += 1
        admin_state.stats.total_trades += 1
        admin_state.capital.used_capital += trade_value
        admin_state.capital.available_capital -= trade_value
        
        logger.info(f"📝 Manual trade executed: {request.side} {request.symbol} @ {request.entry_price}")
        
        return {
            "status": "executed",
            "trade_id": trade.id,
            "symbol": trade.symbol,
            "side": trade.side,
            "quantity": trade.quantity,
            "entry_price": trade.entry_price,
        }


@router.post("/trades/{trade_id}/exit")
async def exit_trade(trade_id: int, reason: str = "MANUAL_EXIT"):
    """Exit a trade manually"""
    async for db in get_db():
        result = await db.execute(
            select(SwingTrade).where(SwingTrade.id == trade_id)
        )
        trade = result.scalar_one_or_none()
        
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        if trade.status != SwingTradeStatus.ACTIVE:
            raise HTTPException(status_code=400, detail=f"Trade is {trade.status.value}")
        
        # Close trade
        trade.status = SwingTradeStatus.CLOSED
        trade.exit_time = datetime.now()
        trade.exit_date = date.today()
        trade.exit_price = trade.current_price
        trade.realized_pnl = trade.unrealized_pnl
        trade.exit_reason = ExitReason.MANUAL_EXIT
        
        await db.commit()
        
        # Update state
        trade_value = trade.quantity * trade.entry_price
        admin_state.positions.open_positions -= 1
        admin_state.capital.used_capital -= trade_value
        admin_state.capital.available_capital += trade_value
        
        # Update P&L
        admin_state.update_pnl(realized=trade.realized_pnl)
        
        logger.info(f"📤 Trade exited: {trade.symbol} @ {trade.exit_price} | P&L: {trade.realized_pnl}")
        
        return {
            "status": "exited",
            "trade_id": trade.id,
            "exit_price": trade.exit_price,
            "realized_pnl": round(trade.realized_pnl, 2),
        }


# ==================== RISK MANAGEMENT ====================

@router.get("/risk")
async def get_risk_status():
    """Get risk status"""
    return admin_state.risk.to_dict()


@router.post("/risk/kill-switch/activate")
async def activate_kill_switch(reason: str = "Manual activation"):
    """Activate kill switch - Stop all trading"""
    admin_state.activate_kill_switch(reason)
    
    logger.critical(f"🚨 KILL SWITCH ACTIVATED: {reason}")
    
    return {
        "status": "activated",
        "reason": reason,
        "trading_disabled": True,
    }


@router.post("/risk/kill-switch/deactivate")
async def deactivate_kill_switch():
    """Deactivate kill switch - Resume trading"""
    admin_state.deactivate_kill_switch()
    
    logger.info("✅ Kill switch deactivated")
    
    return {
        "status": "deactivated",
        "trading_enabled": True,
    }


# ==================== CONFIGURATION ====================

@router.get("/config")
async def get_config():
    """Get current configuration"""
    return {
        "admin": {
            "name": admin_config.ADMIN_NAME,
            "email": admin_config.ADMIN_EMAIL,
            "mobile": admin_config.ADMIN_MOBILE,
        },
        "trading": {
            "auto_trade_enabled": admin_state.auto_trade_enabled,
            "confidence_threshold": admin_config.AUTO_TRADE_CONFIDENCE_THRESHOLD,
            "max_positions": admin_config.AUTO_TRADE_MAX_POSITIONS,
            "capital_per_trade": f"{admin_config.AUTO_TRADE_CAPITAL_PER_TRADE * 100}%",
            "max_holding_days": admin_config.AUTO_TRADE_Holding_DAYS,
        },
        "risk": {
            "max_risk_per_trade": f"{admin_config.MAX_RISK_PER_TRADE * 100}%",
            "max_daily_loss": f"{admin_config.MAX_DAILY_LOSS * 100}%",
            "max_weekly_loss": f"{admin_config.MAX_WEEKLY_LOSS * 100}%",
            "max_drawdown": f"{admin_config.MAX_DRAWDOWN * 100}%",
        },
        "capital": {
            "total_capital": admin_config.TOTAL_CAPITAL,
            "available": admin_state.capital.available_capital,
        },
        "notifications": {
            "telegram_enabled": bool(admin_config.TELEGRAM_BOT_TOKEN),
            "email_enabled": admin_config.EMAIL_ENABLED,
        },
    }


@router.post("/config")
async def update_config(request: UpdateConfigRequest):
    """Update configuration"""
    if request.auto_trade_enabled is not None:
        admin_state.auto_trade_enabled = request.auto_trade_enabled
    
    return {
        "status": "updated",
        "config": await get_config(),
    }


# ==================== STATISTICS ====================

@router.get("/statistics")
async def get_statistics():
    """Get trading statistics"""
    async for db in get_db():
        # Get trade statistics from DB
        result = await db.execute(
            select(SwingTrade).where(
                SwingTrade.status == SwingTradeStatus.CLOSED
            )
        )
        closed_trades = result.scalars().all()
        
        if closed_trades:
            wins = sum(1 for t in closed_trades if t.realized_pnl and t.realized_pnl > 0)
            losses = sum(1 for t in closed_trades if t.realized_pnl and t.realized_pnl <= 0)
            total_pnl = sum(t.realized_pnl for t in closed_trades if t.realized_pnl)
            avg_pnl = total_pnl / len(closed_trades)
            
            biggest_win = max((t.realized_pnl for t in closed_trades if t.realized_pnl), default=0)
            biggest_loss = min((t.realized_pnl for t in closed_trades if t.realized_pnl), default=0)
        else:
            wins = losses = total_pnl = avg_pnl = biggest_win = biggest_loss = 0
        
        return {
            "summary": {
                "total_trades": len(closed_trades),
                "winning_trades": wins,
                "losing_trades": losses,
                "win_rate": f"{wins / max(1, len(closed_trades)) * 100:.1f}%",
            },
            "pnl": {
                "total_realized": round(total_pnl, 2),
                "average_per_trade": round(avg_pnl, 2),
                "biggest_win": round(biggest_win, 2),
                "biggest_loss": round(biggest_loss, 2),
                "daily_pnl": admin_state.pnl.daily_pnl,
                "weekly_pnl": admin_state.pnl.weekly_pnl,
            },
            "current": {
                "open_positions": admin_state.positions.open_positions,
                "available_capital": admin_state.capital.available_capital,
                "current_drawdown": admin_state.pnl.current_drawdown,
            }
        }


# ==================== STATE RESET ====================

@router.post("/reset/daily")
async def reset_daily():
    """Reset daily counters (call at market open)"""
    admin_state.reset_daily()
    return {"status": "reset", "message": "Daily counters reset"}


@router.post("/reset/weekly")
async def reset_weekly():
    """Reset weekly counters (call on Monday)"""
    admin_state.reset_weekly()
    return {"status": "reset", "message": "Weekly counters reset"}


@router.post("/reset/monthly")
async def reset_monthly():
    """Reset monthly counters (call on 1st)"""
    admin_state.reset_monthly()
    return {"status": "reset", "message": "Monthly counters reset"}
