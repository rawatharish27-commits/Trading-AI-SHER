"""
Order Repository
Order-specific database operations
"""

from typing import List, Optional
from datetime import datetime, date

from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.order import Order, OrderType, OrderStatus, ProductType, OrderSide


class OrderRepository(BaseRepository[Order]):
    """Repository for Order model operations"""

    def __init__(self, session: AsyncSession):
        super().__init__(Order, session)

    async def get_by_order_id(self, order_id: str) -> Optional[Order]:
        """Get order by order ID"""
        return await self.get_by_field("order_id", order_id, load_relations=["user"])

    async def get_user_orders(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get all orders for a user"""
        return await self.filter(
            {"user_id": user_id},
            skip=skip,
            limit=limit,
            order_by="order_time",
            order_desc=True
        )

    async def get_orders_by_symbol(
        self,
        symbol: str,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get orders for a specific symbol"""
        filters = {"symbol": symbol}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="order_time",
            order_desc=True
        )

    async def get_active_orders(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get active orders (PENDING, SUBMITTED, PARTIALLY_FILLED)"""
        query = select(Order).where(
            Order.status.in_([
                OrderStatus.PENDING,
                OrderStatus.SUBMITTED,
                OrderStatus.PARTIALLY_FILLED
            ])
        )

        if user_id:
            query = query.where(Order.user_id == user_id)

        query = (
            query
            .order_by(desc(Order.order_time))
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_orders_by_status(
        self,
        status: OrderStatus,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get orders by status"""
        filters = {"status": status}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="order_time",
            order_desc=True
        )

    async def get_orders_by_side(
        self,
        side: OrderSide,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get orders by side (BUY/SELL)"""
        filters = {"side": side}
        if user_id:
            filters["user_id"] = user_id
        return await self.filter(
            filters,
            skip=skip,
            limit=limit,
            order_by="order_time",
            order_desc=True
        )

    async def get_today_orders(
        self,
        user_id: int = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get today's orders"""
        today = date.today()
        query = select(Order).where(
            func.date(Order.order_time) == today
        )

        if user_id:
            query = query.where(Order.user_id == user_id)

        query = (
            query
            .order_by(desc(Order.order_time))
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.scalars().all()

    async def update_order_status(
        self,
        order_id: int,
        status: OrderStatus,
        filled_quantity: int = None,
        average_price: float = None,
        rejection_reason: str = None
    ) -> Optional[Order]:
        """Update order status"""
        update_data = {
            "status": status,
            "execution_time": datetime.utcnow() if status == OrderStatus.FILLED else None
        }

        if filled_quantity is not None:
            update_data["filled_quantity"] = filled_quantity
            update_data["pending_quantity"] = (
                await self.get_by_id(order_id)
            ).quantity - filled_quantity

        if average_price is not None:
            update_data["average_price"] = average_price

        if rejection_reason is not None:
            update_data["rejection_reason"] = rejection_reason

        return await self.update(order_id, update_data)

    async def mark_filled(
        self,
        order_id: int,
        filled_quantity: int,
        average_price: float
    ) -> Optional[Order]:
        """Mark order as filled"""
        return await self.update_order_status(
            order_id,
            OrderStatus.FILLED,
            filled_quantity=filled_quantity,
            average_price=average_price
        )

    async def mark_cancelled(
        self,
        order_id: int,
        reason: str = None
    ) -> Optional[Order]:
        """Mark order as cancelled"""
        return await self.update_order_status(
            order_id,
            OrderStatus.CANCELLED,
            rejection_reason=reason
        )

    async def mark_rejected(
        self,
        order_id: int,
        reason: str
    ) -> Optional[Order]:
        """Mark order as rejected"""
        return await self.update_order_status(
            order_id,
            OrderStatus.REJECTED,
            rejection_reason=reason
        )

    async def get_orders_by_signal(
        self,
        signal_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """Get orders associated with a signal"""
        return await self.filter(
            {"signal_id": signal_id},
            skip=skip,
            limit=limit,
            order_by="order_time",
            order_desc=True
        )

    async def count_orders_by_status(
        self,
        status: OrderStatus,
        user_id: int = None
    ) -> int:
        """Count orders by status"""
        filters = {"status": status}
        if user_id:
            filters["user_id"] = user_id
        return await self.count(filters)

    async def get_order_stats(self, user_id: int) -> dict:
        """Get order statistics for a user"""
        total = await self.count({"user_id": user_id})
        filled = await self.count({"user_id": user_id, "status": OrderStatus.FILLED})
        cancelled = await self.count({"user_id": user_id, "status": OrderStatus.CANCELLED})
        rejected = await self.count({"user_id": user_id, "status": OrderStatus.REJECTED})

        fill_rate = (filled / total * 100) if total > 0 else 0.0

        return {
            "total": total,
            "filled": filled,
            "cancelled": cancelled,
            "rejected": rejected,
            "fill_rate": round(fill_rate, 2),
        }
