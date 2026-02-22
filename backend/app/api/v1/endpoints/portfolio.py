"""
Portfolio Endpoints
Holdings, positions, and P&L
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import User, Position, PositionStatus

router = APIRouter()


@router.get("/summary")
async def get_portfolio_summary(
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio summary"""
    # Get all open positions
    result = await db.execute(
        select(Position).where(and_(
            Position.user_id == current_user.id,
            Position.status == PositionStatus.OPEN
        ))
    )
    positions = result.scalars().all()
    
    # Calculate summary
    total_investment = sum(p.open_quantity * p.entry_price for p in positions)
    total_current_value = sum(p.open_quantity * p.current_price for p in positions)
    total_pnl = sum(p.total_pnl for p in positions)
    total_unrealized = sum(p.unrealized_pnl for p in positions)
    total_realized = sum(p.realized_pnl for p in positions)
    
    # Sector breakdown
    sectors = {}
    for p in positions:
        sector = p.sector or "OTHER"
        if sector not in sectors:
            sectors[sector] = {"value": 0, "pnl": 0, "count": 0}
        sectors[sector]["value"] += p.open_quantity * p.current_price
        sectors[sector]["pnl"] += p.unrealized_pnl
        sectors[sector]["count"] += 1
    
    return {
        "total_positions": len(positions),
        "total_investment": total_investment,
        "current_value": total_current_value,
        "total_pnl": total_pnl,
        "unrealized_pnl": total_unrealized,
        "realized_pnl": total_realized,
        "pnl_percent": (total_pnl / total_investment * 100) if total_investment > 0 else 0,
        "sector_breakdown": sectors,
    }


@router.get("/positions")
async def get_positions(
    status: Optional[str] = "OPEN",
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Get user's positions"""
    query = select(Position).where(Position.user_id == current_user.id)
    
    if status == "OPEN":
        query = query.where(Position.status == PositionStatus.OPEN)
    elif status == "CLOSED":
        query = query.where(Position.status == PositionStatus.CLOSED)
    
    query = query.order_by(desc(Position.created_at))
    
    result = await db.execute(query)
    positions = result.scalars().all()
    
    return {
        "positions": positions,
        "total": len(positions),
    }


@router.get("/positions/{position_id}")
async def get_position(
    position_id: int,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific position"""
    result = await db.execute(
        select(Position).where(and_(
            Position.id == position_id,
            Position.user_id == current_user.id
        ))
    )
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    return position


@router.post("/positions/{position_id}/update-stoploss")
async def update_stop_loss(
    position_id: int,
    stop_loss: float,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Update stop loss for a position"""
    result = await db.execute(
        select(Position).where(and_(
            Position.id == position_id,
            Position.user_id == current_user.id,
            Position.status == PositionStatus.OPEN
        ))
    )
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    position.stop_loss = stop_loss
    await db.commit()
    
    return {"message": "Stop loss updated", "stop_loss": stop_loss}


@router.get("/history")
async def get_trade_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Get closed positions history"""
    query = select(Position).where(and_(
        Position.user_id == current_user.id,
        Position.status == PositionStatus.CLOSED
    ))
    
    # Count
    count_query = select(func.count(Position.id)).where(and_(
        Position.user_id == current_user.id,
        Position.status == PositionStatus.CLOSED
    ))
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
