"""
Trade Journal Model
Trade journal and analysis
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


class TradeEmotion(str, enum.Enum):
    """Trade emotions"""
    CONFIDENT = "CONFIDENT"
    NEUTRAL = "NEUTRAL"
    ANXIOUS = "ANXIOUS"
    FEARFUL = "FEARFUL"
    GREEDY = "GREEDY"
    REVENGE = "REVENGE"
    FOMO = "FOMO"


class TradeOutcome(str, enum.Enum):
    """Trade outcomes"""
    WINNER = "WINNER"
    LOSER = "LOSER"
    BREAKEVEN = "BREAKEVEN"
    OPEN = "OPEN"


class TradeJournal(Base):
    """Trade journal entry"""

    __tablename__ = "trade_journal"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    signal_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("signals.id"), nullable=True)
    order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("orders.id"), nullable=True)
    position_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("positions.id"), nullable=True)

    # Trade Info
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")
    trade_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)

    # Entry
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    entry_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Exit
    exit_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    exit_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Position
    side: Mapped[str] = mapped_column(String(10), nullable=False)  # LONG, SHORT
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    # P&L
    gross_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    brokerage: Mapped[float] = mapped_column(Float, default=0.0)
    taxes: Mapped[float] = mapped_column(Float, default=0.0)
    net_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_percent: Mapped[float] = mapped_column(Float, default=0.0)
    r_multiple: Mapped[float] = mapped_column(Float, default=0.0)  # Risk multiple

    # Risk
    stop_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_per_share: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Outcome
    outcome: Mapped[TradeOutcome] = mapped_column(Enum(TradeOutcome), default=TradeOutcome.OPEN)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Strategy
    strategy: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    setup_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timeframe: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Psychology
    emotion_before: Mapped[Optional[TradeEmotion]] = mapped_column(Enum(TradeEmotion), nullable=True)
    emotion_after: Mapped[Optional[TradeEmotion]] = mapped_column(Enum(TradeEmotion), nullable=True)
    confidence_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-10
    followed_plan: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Analysis
    lessons_learned: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mistakes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    what_went_well: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    what_to_improve: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Tags & Notes
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Comma-separated tags
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Market Context
    market_condition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    market_trend: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    volatility: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Screenshots
    chart_screenshot: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Metadata
    metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

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

    # Indexes
    __table_args__ = (
        Index('ix_trade_journal_user_date', 'user_id', 'trade_date'),
        Index('ix_trade_journal_user_symbol', 'user_id', 'symbol'),
    )

    def __repr__(self) -> str:
        return f"<TradeJournal(id={self.id}, symbol='{self.symbol}', outcome={self.outcome})>"

    @property
    def is_winner(self) -> bool:
        """Check if trade is a winner"""
        return self.outcome == TradeOutcome.WINNER

    @property
    def holding_period(self) -> int:
        """Calculate holding period in minutes"""
        if self.exit_time and self.entry_time:
            delta = self.exit_time - self.entry_time
            return int(delta.total_seconds() / 60)
        return 0

    @property
    def risk_reward_ratio(self) -> float:
        """Calculate risk-reward ratio"""
        if self.risk_amount and self.net_pnl:
            return round(self.net_pnl / self.risk_amount, 2) if self.risk_amount != 0 else 0.0
        return 0.0
