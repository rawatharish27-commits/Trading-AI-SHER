"""
Position Model
Active trading positions
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class PositionSide(str, enum.Enum):
    """Position sides"""
    LONG = "LONG"
    SHORT = "SHORT"


class PositionStatus(str, enum.Enum):
    """Position status"""
    OPEN = "OPEN"
    PARTIALLY_CLOSED = "PARTIALLY_CLOSED"
    CLOSED = "CLOSED"
    LIQUIDATED = "LIQUIDATED"


class Position(Base):
    """Trading position model"""

    __tablename__ = "positions"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Symbol Information
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")
    token: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    isin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Position Details
    side: Mapped[PositionSide] = mapped_column(Enum(PositionSide), nullable=False)
    status: Mapped[PositionStatus] = mapped_column(Enum(PositionStatus), default=PositionStatus.OPEN)
    product: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Quantity
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    open_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    closed_quantity: Mapped[int] = mapped_column(Integer, default=0)

    # Price
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)
    exit_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_exit_price: Mapped[float] = mapped_column(Float, default=0.0)

    # Stop Loss & Target
    stop_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trailing_sl: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # P&L
    realized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_percent: Mapped[float] = mapped_column(Float, default=0.0)

    # Additional Info
    sector: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    strategy: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    signal_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Broker Info
    broker: Mapped[str] = mapped_column(String(50), default="ANGEL_ONE")

    # Timestamps
    entry_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    exit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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
    user: Mapped["User"] = relationship("User", back_populates="positions")

    def __repr__(self) -> str:
        return f"<Position(id={self.id}, symbol='{self.symbol}', side={self.side}, pnl={self.unrealized_pnl})>"

    @property
    def is_open(self) -> bool:
        """Check if position is open"""
        return self.status == PositionStatus.OPEN

    @property
    def total_pnl(self) -> float:
        """Calculate total P&L"""
        return self.realized_pnl + self.unrealized_pnl

    @property
    def market_value(self) -> float:
        """Calculate current market value"""
        return self.open_quantity * self.current_price

    @property
    def cost_basis(self) -> float:
        """Calculate cost basis"""
        return self.open_quantity * self.entry_price

    def update_pnl(self, current_price: float) -> None:
        """Update P&L based on current price"""
        self.current_price = current_price

        if self.side == PositionSide.LONG:
            self.unrealized_pnl = (current_price - self.entry_price) * self.open_quantity
        else:
            self.unrealized_pnl = (self.entry_price - current_price) * self.open_quantity

        if self.cost_basis > 0:
            self.pnl_percent = (self.unrealized_pnl / self.cost_basis) * 100
