"""
Signal Repository
Signal-specific database operations
"""

from typing import List, Optional
from datetime import datetime

from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.signal import (
    Signal,
    SignalAction,
    SignalDirection,
    SignalStatus,
    ConfidenceLevel,
    RiskLevel,
    MarketRegime,
)


class SignalRepository(BaseRepository[Signal]):
    """Repository for Signal model operations"""

    def __init__(self, session: AsyncSession):
        super().__init__(Signal, session)

    async def get_by_trace_id(self, trace_id: str) -> Optional[Signal]:
        """Get signal by trace ID"""
        return await self.get_by_field("trace_id", trace_id, load_relations=["user"])

    async def get_user_signals(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get all signals for a user"""
        return await self.filter(
            {"user_id": user_id},
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True,
            load_relations=["user"]
        )

    async def get_active_signals(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get all active signals"""
        filters = {"status": SignalStatus.ACTIVE}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="signal_time",
            order_desc=True
        )

    async def get_signals_by_symbol(
        self,
        symbol: str,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get signals for a specific symbol"""
        filters = {"symbol": symbol}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def get_signals_by_action(
        self,
        action: SignalAction,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get signals by action (BUY/SELL/HOLD)"""
        filters = {"action": action}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def get_high_probability_signals(
        self,
        min_probability: float = 0.75,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get signals with high probability"""
        query = select(Signal).where(Signal.probability >= min_probability)

        if user_id:
            query = query.where(Signal.user_id == user_id)

        query = (
            query
            .order_by(desc(Signal.probability))
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_signals_by_risk_level(
        self,
        risk_level: RiskLevel,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get signals by risk level"""
        filters = {"risk_level": risk_level}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def get_signals_by_date_range(
        self,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
        skip: int = 0,
        limit: int = 100
    ) -> List[Signal]:
        """Get signals within a date range"""
        return await self.get_by_date_range(
            date_field="signal_time",
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit
        )

    async def update_signal_status(
        self,
        signal_id: int,
        status: SignalStatus
    ) -> Optional[Signal]:
        """Update signal status"""
        return await self.update(signal_id, {"status": status})

    async def hit_target(self, signal_id: int) -> Optional[Signal]:
        """Mark signal as target hit"""
        return await self.update_signal_status(signal_id, SignalStatus.HIT_TARGET)

    async def stop_loss_hit(self, signal_id: int) -> Optional[Signal]:
        """Mark signal as stopped out"""
        return await self.update_signal_status(signal_id, SignalStatus.STOPPED_OUT)

    async def expire_signal(self, signal_id: int) -> Optional[Signal]:
        """Mark signal as expired"""
        return await self.update_signal_status(signal_id, SignalStatus.EXPIRED)

    async def cancel_signal(self, signal_id: int) -> Optional[Signal]:
        """Cancel a signal"""
        return await self.update_signal_status(signal_id, SignalStatus.CANCELLED)

    async def get_pending_signals(self, skip: int = 0, limit: int = 100) -> List[Signal]:
        """Get all pending signals"""
        return await self.filter(
            {"status": SignalStatus.PENDING},
            skip=skip,
            limit=limit,
            order_by="signal_time",
            order_desc=True
        )

    async def get_expired_signals(self) -> List[Signal]:
        """Get signals that have expired but not marked as expired"""
        query = (
            select(Signal)
            .where(
                and_(
                    Signal.status.in_([
                        SignalStatus.PENDING,
                        SignalStatus.ACTIVE
                    ]),
                    Signal.expiry_time < datetime.utcnow()
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_signals_by_status(
        self,
        status: SignalStatus,
        user_id: int = None
    ) -> int:
        """Count signals by status"""
        filters = {"status": status}
        if user_id:
            filters["user_id"] = user_id
        return await self.count(filters)

    async def get_signal_stats(self, user_id: int) -> dict:
        """Get signal statistics for a user"""
        total = await self.count({"user_id": user_id})
        active = await self.count({"user_id": user_id, "status": SignalStatus.ACTIVE})
        hit_target = await self.count({"user_id": user_id, "status": SignalStatus.HIT_TARGET})
        stopped_out = await self.count({"user_id": user_id, "status": SignalStatus.STOPPED_OUT})

        win_rate = (hit_target / total * 100) if total > 0 else 0.0

        return {
            "total": total,
            "active": active,
            "hit_target": hit_target,
            "stopped_out": stopped_out,
            "win_rate": round(win_rate, 2),
        }
