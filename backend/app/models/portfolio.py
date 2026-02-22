"""
Portfolio Model
User portfolio and performance tracking
"""

from datetime import datetime, date
from typing import TYPE_CHECKING, Any, Dict, Optional
import enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    func,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PortfolioStatus(str, enum.Enum):
    """Portfolio status"""
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"


class Portfolio(Base):
    """User portfolio"""

    __tablename__ = "portfolios"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Portfolio Info
    name: Mapped[str] = mapped_column(String(100), default="Main Portfolio")
    status: Mapped[PortfolioStatus] = mapped_column(Enum(PortfolioStatus), default=PortfolioStatus.ACTIVE)

    # Capital
    initial_capital: Mapped[float] = mapped_column(Float, default=0.0)
    current_capital: Mapped[float] = mapped_column(Float, default=0.0)
    available_capital: Mapped[float] = mapped_column(Float, default=0.0)
    invested_capital: Mapped[float] = mapped_column(Float, default=0.0)

    # Performance
    total_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    realized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    total_return_percent: Mapped[float] = mapped_column(Float, default=0.0)

    # Risk Metrics
    max_drawdown: Mapped[float] = mapped_column(Float, default=0.0)
    max_drawdown_percent: Mapped[float] = mapped_column(Float, default=0.0)
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sortino_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    win_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # Trade Stats
    total_trades: Mapped[int] = mapped_column(Integer, default=0)
    winning_trades: Mapped[int] = mapped_column(Integer, default=0)
    losing_trades: Mapped[int] = mapped_column(Integer, default=0)
    avg_win: Mapped[float] = mapped_column(Float, default=0.0)
    avg_loss: Mapped[float] = mapped_column(Float, default=0.0)
    profit_factor: Mapped[float] = mapped_column(Float, default=0.0)

    # Holdings Value
    holdings_value: Mapped[float] = mapped_column(Float, default=0.0)
    cash_balance: Mapped[float] = mapped_column(Float, default=0.0)
    margin_used: Mapped[float] = mapped_column(Float, default=0.0)

    # Daily Snapshot
    last_snapshot_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    snapshot_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Settings
    risk_per_trade: Mapped[float] = mapped_column(Float, default=2.0)  # Percentage
    max_positions: Mapped[int] = mapped_column(Integer, default=10)
    auto_trade_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Portfolio(user_id={self.user_id}, capital={self.current_capital}, pnl={self.total_pnl})>"

    @property
    def is_profitable(self) -> bool:
        """Check if portfolio is profitable"""
        return self.total_pnl > 0

    @property
    def capital_at_risk(self) -> float:
        """Calculate capital at risk"""
        return self.invested_capital


class PortfolioSnapshot(Base):
    """Daily portfolio snapshot for analytics"""

    __tablename__ = "portfolio_snapshots"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    portfolio_id: Mapped[int] = mapped_column(Integer, ForeignKey("portfolios.id"), nullable=False)

    # Date
    snapshot_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)

    # Values
    capital: Mapped[float] = mapped_column(Float, nullable=False)
    holdings_value: Mapped[float] = mapped_column(Float, default=0.0)
    cash_balance: Mapped[float] = mapped_column(Float, default=0.0)
    total_value: Mapped[float] = mapped_column(Float, nullable=False)

    # P&L
    daily_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    cumulative_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    daily_return_percent: Mapped[float] = mapped_column(Float, default=0.0)

    # Positions
    positions_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('ix_portfolio_snapshots_portfolio_date', 'portfolio_id', 'snapshot_date', unique=True),
    )

    def __repr__(self) -> str:
        return f"<PortfolioSnapshot(portfolio_id={self.portfolio_id}, date={self.snapshot_date})>"
