"""
Position Repository
Position-specific database operations
"""

from typing import List, Optional
from datetime import datetime, date

from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.position import Position, PositionSide, PositionStatus


class PositionRepository(BaseRepository[Position]):
    """Repository for Position model operations"""

    def __init__(self, session: AsyncSession):
        super().__init__(Position, session)

    async def get_user_positions(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get all positions for a user"""
        return await self.filter(
            {"user_id": user_id},
            skip=skip,
            limit=limit,
            order_by="entry_time",
            order_desc=True
        )

    async def get_open_positions(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get all open positions"""
        filters = {"status": PositionStatus.OPEN}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="entry_time",
            order_desc=True
        )

    async def get_positions_by_symbol(
        self,
        symbol: str,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get positions for a specific symbol"""
        filters = {"symbol": symbol}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="entry_time",
            order_desc=True
        )

    async def get_positions_by_side(
        self,
        side: PositionSide,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get positions by side (LONG/SHORT)"""
        filters = {"side": side}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="entry_time",
            order_desc=True
        )

    async def get_positions_by_status(
        self,
        status: PositionStatus,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get positions by status"""
        filters = {"status": status}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="entry_time",
            order_desc=True
        )

    async def get_today_positions(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get positions opened today"""
        today = date.today()
        query = select(Position).where(
            func.date(Position.entry_time) == today
        )

        if user_id:
            query = query.where(Position.user_id == user_id)

        query = (
            query
            .order_by(desc(Position.entry_time))
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.scalars().all()

    async def update_pnl(
        self,
        position_id: int,
        current_price: float
    ) -> Optional[Position]:
        """Update position P&L"""
        position = await self.get_by_id(position_id)
        if position:
            position.update_pnl(current_price)
            await self.session.flush()
            await self.session.refresh(position)
        return position

    async def close_position(
        self,
        position_id: int,
        exit_price: float,
        realized_pnl: float
    ) -> Optional[Position]:
        """Close a position"""
        return await self.update(position_id, {
            "status": PositionStatus.CLOSED,
            "exit_price": exit_price,
            "exit_time": datetime.utcnow(),
            "open_quantity": 0,
            "closed_quantity": (await self.get_by_id(position_id)).quantity,
            "realized_pnl": realized_pnl,
            "unrealized_pnl": 0.0
        })

    async def partial_close(
        self,
        position_id: int,
        close_quantity: int,
        exit_price: float,
        realized_pnl: float
    ) -> Optional[Position]:
        """Partially close a position"""
        position = await self.get_by_id(position_id)
        if position:
            return await self.update(position_id, {
                "status": PositionStatus.PARTIALLY_CLOSED,
                "open_quantity": position.open_quantity - close_quantity,
                "closed_quantity": position.closed_quantity + close_quantity,
                "avg_exit_price": exit_price,
                "realized_pnl": position.realized_pnl + realized_pnl
            })
        return None

    async def set_stop_loss(
        self,
        position_id: int,
        stop_loss: float
    ) -> Optional[Position]:
        """Set stop loss for position"""
        return await self.update(position_id, {"stop_loss": stop_loss})

    async def set_target(
        self,
        position_id: int,
        target: float
    ) -> Optional[Position]:
        """Set target for position"""
        return await self.update(position_id, {"target": target})

    async def set_trailing_stop(
        self,
        position_id: int,
        trailing_sl: float
    ) -> Optional[Position]:
        """Set trailing stop loss"""
        return await self.update(position_id, {"trailing_sl": trailing_sl})

    async def get_profitable_positions(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get positions with positive P&L"""
        query = select(Position).where(Position.unrealized_pnl > 0)

        if user_id:
            query = query.where(Position.user_id == user_id)

        query = (
            query
            .order_by(desc(Position.unrealized_pnl))
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_losing_positions(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Position]:
        """Get positions with negative P&L"""
        query = select(Position).where(Position.unrealized_pnl < 0)

        if user_id:
            query = query.where(Position.user_id == user_id)

        query = (
            query
            .order_by(Position.unrealized_pnl)
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_open_positions(self, user_id: int = None) -> int:
        """Count open positions"""
        filters = {"status": PositionStatus.OPEN}
        if user_id:
            filters["user_id"] = user_id
        return await self.count(filters)

    async def get_position_summary(self, user_id: int) -> dict:
        """Get position summary for a user"""
        open_positions = await self.get_open_positions(user_id)

        total_invested = sum(p.cost_basis for p in open_positions)
        total_pnl = sum(p.unrealized_pnl for p in open_positions)
        total_value = sum(p.market_value for p in open_positions)

        winning = [p for p in open_positions if p.unrealized_pnl > 0]
        losing = [p for p in open_positions if p.unrealized_pnl < 0]

        return {
            "open_count": len(open_positions),
            "total_invested": total_invested,
            "total_pnl": total_pnl,
            "total_value": total_value,
            "winning_count": len(winning),
            "losing_count": len(losing),
            "total_winning_pnl": sum(p.unrealized_pnl for p in winning),
            "total_losing_pnl": sum(p.unrealized_pnl for p in losing),
        }
