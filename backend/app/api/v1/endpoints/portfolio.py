"""
Portfolio Endpoints
Holdings, positions, and P&L
"""

from typing import Annotated, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import User, Position, PositionStatus
from app.api.v1.endpoints.auth import get_admin_user

router = APIRouter()


@router.get("")
async def get_portfolio(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio summary"""
    # Get all open positions
    result = await db.execute(
        select(Position).where(Position.status == PositionStatus.OPEN)
    )
    positions = result.scalars().all()
    
    # Calculate summary
    total_investment = sum(p.open_quantity * p.entry_price for p in positions)
    total_current_value = sum(p.open_quantity * p.current_price for p in positions)
    total_pnl = sum(p.unrealized_pnl for p in positions)
    
    return {
        "id": 1,
        "user_id": 1,
        "name": "Main Portfolio",
        "initial_capital": 1000000.0,  # 10 Lakhs default
        "current_capital": 1000000.0 + total_pnl,
        "available_capital": 1000000.0 - total_investment,
        "invested_capital": total_investment,
        "total_pnl": total_pnl,
        "realized_pnl": sum(p.realized_pnl for p in positions),
        "unrealized_pnl": total_pnl,
        "total_return_percent": (total_pnl / 1000000.0 * 100) if total_pnl else 0,
        "max_drawdown": 0,
        "max_drawdown_percent": 0,
        "win_rate": 0,
        "total_trades": 0,
        "winning_trades": 0,
        "losing_trades": 0,
        "risk_per_trade": 2.0,
        "max_positions": 10,
        "auto_trade_enabled": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/stats")
async def get_portfolio_stats(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio statistics"""
    # Get open positions
    result = await db.execute(
        select(Position).where(Position.status == PositionStatus.OPEN)
    )
    positions = result.scalars().all()
    
    # Get today's P&L (simplified - would need historical data for real calculation)
    today_pnl = sum(p.unrealized_pnl for p in positions) * 0.1  # Placeholder
    
    return {
        "portfolio": {
            "id": 1,
            "user_id": 1,
            "name": "Main Portfolio",
            "initial_capital": 1000000.0,
            "current_capital": 1000000.0 + sum(p.unrealized_pnl for p in positions),
            "available_capital": 800000.0,
            "invested_capital": sum(p.open_quantity * p.entry_price for p in positions),
            "total_pnl": sum(p.unrealized_pnl for p in positions),
            "realized_pnl": 0,
            "unrealized_pnl": sum(p.unrealized_pnl for p in positions),
            "total_return_percent": 0,
            "max_drawdown": 0,
            "max_drawdown_percent": 0,
            "win_rate": 0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "risk_per_trade": 2.0,
            "max_positions": 10,
            "auto_trade_enabled": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        },
        "positions": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "symbol": p.symbol,
                "exchange": p.exchange,
                "side": p.side.value if p.side else "LONG",
                "status": p.status.value,
                "quantity": p.quantity,
                "open_quantity": p.open_quantity,
                "closed_quantity": p.closed_quantity,
                "entry_price": p.entry_price,
                "current_price": p.current_price,
                "exit_price": p.exit_price,
                "avg_exit_price": p.avg_exit_price,
                "stop_loss": p.stop_loss,
                "trailing_sl": p.trailing_sl,
                "target": p.target,
                "realized_pnl": p.realized_pnl,
                "unrealized_pnl": p.unrealized_pnl,
                "pnl_percent": p.pnl_percent,
                "entry_time": p.entry_time.isoformat() if p.entry_time else None,
                "exit_time": p.exit_time.isoformat() if p.exit_time else None,
                "broker": p.broker,
            }
            for p in positions
        ],
        "daily_pnl": today_pnl,
        "weekly_pnl": today_pnl * 5,
        "monthly_pnl": today_pnl * 22,
        "open_positions": len(positions),
        "active_signals": 0,
        "pending_orders": 0,
    }


@router.get("/positions")
async def get_positions(
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's positions"""
    query = select(Position)
    
    if status == "OPEN":
        query = query.where(Position.status == PositionStatus.OPEN)
    elif status == "CLOSED":
        query = query.where(Position.status == PositionStatus.CLOSED)
    else:
        query = query.where(Position.status == PositionStatus.OPEN)
    
    query = query.order_by(desc(Position.created_at))
    
    result = await db.execute(query)
    positions = result.scalars().all()
    
    return {
        "positions": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "symbol": p.symbol,
                "exchange": p.exchange,
                "side": p.side.value if p.side else "LONG",
                "status": p.status.value,
                "quantity": p.quantity,
                "open_quantity": p.open_quantity,
                "closed_quantity": p.closed_quantity,
                "entry_price": p.entry_price,
                "current_price": p.current_price,
                "exit_price": p.exit_price,
                "avg_exit_price": p.avg_exit_price,
                "stop_loss": p.stop_loss,
                "trailing_sl": p.trailing_sl,
                "target": p.target,
                "realized_pnl": p.realized_pnl,
                "unrealized_pnl": p.unrealized_pnl,
                "pnl_percent": p.pnl_percent,
                "entry_time": p.entry_time.isoformat() if p.entry_time else None,
                "exit_time": p.exit_time.isoformat() if p.exit_time else None,
                "broker": p.broker,
            }
            for p in positions
        ],
        "total": len(positions),
        "total_pnl": sum(p.unrealized_pnl for p in positions),
        "total_invested": sum(p.open_quantity * p.entry_price for p in positions),
    }


@router.get("/positions/open")
async def get_open_positions(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get open positions only"""
    result = await db.execute(
        select(Position).where(Position.status == PositionStatus.OPEN)
    )
    positions = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "symbol": p.symbol,
            "exchange": p.exchange,
            "side": p.side.value if p.side else "LONG",
            "status": p.status.value,
            "quantity": p.quantity,
            "open_quantity": p.open_quantity,
            "entry_price": p.entry_price,
            "current_price": p.current_price,
            "stop_loss": p.stop_loss,
            "trailing_sl": p.trailing_sl,
            "target": p.target,
            "unrealized_pnl": p.unrealized_pnl,
            "pnl_percent": p.pnl_percent,
            "entry_time": p.entry_time.isoformat() if p.entry_time else None,
            "broker": p.broker,
        }
        for p in positions
    ]


@router.get("/positions/{position_id}")
async def get_position(
    position_id: int,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific position"""
    result = await db.execute(
        select(Position).where(Position.id == position_id)
    )
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    return {
        "id": position.id,
        "user_id": position.user_id,
        "symbol": position.symbol,
        "exchange": position.exchange,
        "side": position.side.value if position.side else "LONG",
        "status": position.status.value,
        "quantity": position.quantity,
        "open_quantity": position.open_quantity,
        "closed_quantity": position.closed_quantity,
        "entry_price": position.entry_price,
        "current_price": position.current_price,
        "exit_price": position.exit_price,
        "avg_exit_price": position.avg_exit_price,
        "stop_loss": position.stop_loss,
        "trailing_sl": position.trailing_sl,
        "target": position.target,
        "realized_pnl": position.realized_pnl,
        "unrealized_pnl": position.unrealized_pnl,
        "pnl_percent": position.pnl_percent,
        "entry_time": position.entry_time.isoformat() if position.entry_time else None,
        "exit_time": position.exit_time.isoformat() if position.exit_time else None,
        "broker": position.broker,
    }


@router.post("/positions/{position_id}/close")
async def close_position(
    position_id: int,
    quantity: Optional[int] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Close a position"""
    result = await db.execute(
        select(Position).where(and_(
            Position.id == position_id,
            Position.status == PositionStatus.OPEN
        ))
    )
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    close_qty = quantity or position.open_quantity
    
    if close_qty >= position.open_quantity:
        position.status = PositionStatus.CLOSED
        position.exit_time = datetime.utcnow()
    else:
        position.status = PositionStatus.PARTIALLY_CLOSED
    
    position.open_quantity -= close_qty
    position.closed_quantity += close_qty
    position.realized_pnl = (position.current_price - position.entry_price) * close_qty
    
    await db.commit()
    
    return {
        "message": "Position closed",
        "closed_quantity": close_qty,
        "realized_pnl": position.realized_pnl,
    }


@router.patch("/positions/{position_id}")
async def update_position(
    position_id: int,
    stop_loss: Optional[float] = None,
    target: Optional[float] = None,
    trailing_sl: Optional[float] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update position (stop loss, target, trailing SL)"""
    result = await db.execute(
        select(Position).where(and_(
            Position.id == position_id,
            Position.status == PositionStatus.OPEN
        ))
    )
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    if stop_loss is not None:
        position.stop_loss = stop_loss
    if target is not None:
        position.target = target
    if trailing_sl is not None:
        position.trailing_sl = trailing_sl
    
    await db.commit()
    
    return {
        "id": position.id,
        "stop_loss": position.stop_loss,
        "target": position.target,
        "trailing_sl": position.trailing_sl,
    }


@router.get("/history")
async def get_trade_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get closed positions history"""
    query = select(Position).where(Position.status == PositionStatus.CLOSED)
    
    # Count
    count_query = select(func.count(Position.id)).where(Position.status == PositionStatus.CLOSED)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Paginate
    query = query.order_by(desc(Position.exit_time))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    positions = result.scalars().all()
    
    return {
        "trades": positions,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/performance")
async def get_performance(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio performance metrics"""
    # Placeholder - would calculate from actual trade history
    return {
        "sharpe_ratio": 1.5,
        "sortino_ratio": 2.0,
        "max_drawdown": 50000,
        "win_rate": 65.0,
        "profit_factor": 1.8,
        "avg_win": 5000,
        "avg_loss": 2500,
        "largest_win": 25000,
        "largest_loss": 10000,
    }
