"""
Portfolio Repository
Portfolio-specific database operations
"""

from typing import List, Optional
from datetime import datetime, date

from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.portfolio import Portfolio, PortfolioSnapshot, PortfolioStatus


class PortfolioRepository(BaseRepository[Portfolio]):
    """Repository for Portfolio model operations"""

    def __init__(self, session: AsyncSession):
        super().__init__(Portfolio, session)

    async def get_user_portfolio(self, user_id: int) -> Optional[Portfolio]:
        """Get user's portfolio"""
        return await self.get_by_field("user_id", user_id)

    async def update_capital(
        self,
        portfolio_id: int,
        current_capital: float,
        available_capital: float = None
    ) -> Optional[Portfolio]:
        """Update portfolio capital"""
        update_data = {"current_capital": current_capital}
        if available_capital is not None:
            update_data["available_capital"] = available_capital
        return await self.update(portfolio_id, update_data)

    async def update_pnl(
        self,
        portfolio_id: int,
        realized_pnl: float,
        unrealized_pnl: float
    ) -> Optional[Portfolio]:
        """Update portfolio P&L"""
        portfolio = await self.get_by_id(portfolio_id)
        if portfolio:
            total_pnl = realized_pnl + unrealized_pnl
            total_return = (
                (total_pnl / portfolio.initial_capital * 100)
                if portfolio.initial_capital > 0 else 0.0
            )
            return await self.update(portfolio_id, {
                "realized_pnl": realized_pnl,
                "unrealized_pnl": unrealized_pnl,
                "total_pnl": total_pnl,
                "total_return_percent": total_return
            })
        return None

    async def update_holdings_value(
        self,
        portfolio_id: int,
        holdings_value: float
    ) -> Optional[Portfolio]:
        """Update holdings value"""
        return await self.update(portfolio_id, {"holdings_value": holdings_value})

    async def record_trade(
        self,
        portfolio_id: int,
        pnl: float,
        is_winner: bool
    ) -> Optional[Portfolio]:
        """Record a trade in portfolio stats"""
        portfolio = await self.get_by_id(portfolio_id)
        if portfolio:
            total_trades = portfolio.total_trades + 1
            winning_trades = portfolio.winning_trades + (1 if is_winner else 0)
            losing_trades = portfolio.losing_trades + (0 if is_winner else 1)

            # Update averages
            if is_winner:
                avg_win = (
                    (portfolio.avg_win * portfolio.winning_trades + pnl) /
                    winning_trades
                )
            else:
                avg_loss = (
                    (portfolio.avg_loss * portfolio.losing_trades + abs(pnl)) /
                    losing_trades
                )

            win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0.0

            update_data = {
                "total_trades": total_trades,
                "winning_trades": winning_trades,
                "losing_trades": losing_trades,
                "win_rate": win_rate,
            }

            if is_winner:
                update_data["avg_win"] = avg_win
            else:
                update_data["avg_loss"] = avg_loss

            return await self.update(portfolio_id, update_data)
        return None

    async def update_drawdown(
        self,
        portfolio_id: int,
        current_value: float
    ) -> Optional[Portfolio]:
        """Update max drawdown if new low"""
        portfolio = await self.get_by_id(portfolio_id)
        if portfolio:
            # Calculate drawdown from peak
            peak = max(portfolio.initial_capital, portfolio.current_capital)
            drawdown = peak - current_value
            drawdown_percent = (drawdown / peak * 100) if peak > 0 else 0.0

            if drawdown > portfolio.max_drawdown:
                return await self.update(portfolio_id, {
                    "max_drawdown": drawdown,
                    "max_drawdown_percent": drawdown_percent
                })
        return None

    async def set_auto_trade(
        self,
        portfolio_id: int,
        enabled: bool
    ) -> Optional[Portfolio]:
        """Enable/disable auto trading"""
        return await self.update(portfolio_id, {"auto_trade_enabled": enabled})

    async def update_settings(
        self,
        portfolio_id: int,
        risk_per_trade: float = None,
        max_positions: int = None
    ) -> Optional[Portfolio]:
        """Update portfolio settings"""
        update_data = {}
        if risk_per_trade is not None:
            update_data["risk_per_trade"] = risk_per_trade
        if max_positions is not None:
            update_data["max_positions"] = max_positions
        if update_data:
            return await self.update(portfolio_id, update_data)
        return None


class PortfolioSnapshotRepository(BaseRepository[PortfolioSnapshot]):
    """Repository for PortfolioSnapshot model operations"""

    def __init__(self, session: AsyncSession):
        super().__init__(PortfolioSnapshot, session)

    async def get_portfolio_snapshots(
        self,
        portfolio_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PortfolioSnapshot]:
        """Get snapshots for a portfolio"""
        return await self.filter(
            {"portfolio_id": portfolio_id},
            skip=skip,
            limit=limit,
            order_by="snapshot_date",
            order_desc=True
        )

    async def get_snapshot_by_date(
        self,
        portfolio_id: int,
        snapshot_date: date
    ) -> Optional[PortfolioSnapshot]:
        """Get snapshot for a specific date"""
        query = select(PortfolioSnapshot).where(
            and_(
                PortfolioSnapshot.portfolio_id == portfolio_id,
                PortfolioSnapshot.snapshot_date == snapshot_date
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def create_daily_snapshot(
        self,
        portfolio: Portfolio,
        daily_pnl: float
    ) -> PortfolioSnapshot:
        """Create daily portfolio snapshot"""
        today = date.today()

        # Check if snapshot already exists
        existing = await self.get_snapshot_by_date(portfolio.id, today)
        if existing:
            return existing

        snapshot = await self.create({
            "portfolio_id": portfolio.id,
            "snapshot_date": today,
            "capital": portfolio.current_capital,
            "holdings_value": portfolio.holdings_value,
            "cash_balance": portfolio.cash_balance,
            "total_value": portfolio.current_capital + portfolio.holdings_value,
            "daily_pnl": daily_pnl,
            "cumulative_pnl": portfolio.total_pnl,
            "daily_return_percent": (
                daily_pnl / portfolio.current_capital * 100
                if portfolio.current_capital > 0 else 0.0
            ),
            "positions_count": await self._count_positions(portfolio.id)
        })

        return snapshot

    async def _count_positions(self, portfolio_id: int) -> int:
        """Count open positions for portfolio"""
        from app.models.position import Position, PositionStatus
        from app.models.portfolio import Portfolio

        # Get user_id from portfolio
        portfolio = await self.session.execute(
            select(Portfolio.user_id).where(Portfolio.id == portfolio_id)
        )
        user_id = portfolio.scalar_one()

        query = select(func.count(Position.id)).where(
            and_(
                Position.user_id == user_id,
                Position.status == PositionStatus.OPEN
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one()

    async def get_snapshots_by_range(
        self,
        portfolio_id: int,
        start_date: date,
        end_date: date
    ) -> List[PortfolioSnapshot]:
        """Get snapshots within a date range"""
        query = (
            select(PortfolioSnapshot)
            .where(
                and_(
                    PortfolioSnapshot.portfolio_id == portfolio_id,
                    PortfolioSnapshot.snapshot_date >= start_date,
                    PortfolioSnapshot.snapshot_date <= end_date
                )
            )
            .order_by(PortfolioSnapshot.snapshot_date)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
