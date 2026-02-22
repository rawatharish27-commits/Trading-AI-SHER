"""
Swing Trade Model - Simplified for Single Admin
2-3 Day Holding Period Trades with Multi-Timeframe Analysis
No user_id - Single Admin System
"""

from datetime import datetime, date
from typing import Optional, Dict, Any
import enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
    Text,
    JSON,
    func,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SwingTradeStatus(str, enum.Enum):
    """Swing trade status"""
    PENDING = "PENDING"           # Signal generated, not executed
    ACTIVE = "ACTIVE"             # Trade is active
    TARGET_HIT = "TARGET_HIT"     # Target achieved
    STOP_LOSS = "STOP_LOSS"       # Stop loss hit
    TIME_EXIT = "TIME_EXIT"       # Exit due to time (3 days)
    ANALYSIS_EXIT = "ANALYSIS_EXIT"  # Exit based on analysis
    MANUAL_EXIT = "MANUAL_EXIT"   # Manual exit by admin
    CLOSED = "CLOSED"             # Trade fully closed


class SwingTradeSignal(str, enum.Enum):
    """Swing trade signal strength"""
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    WEAK_BUY = "WEAK_BUY"
    HOLD = "HOLD"
    WEAK_SELL = "WEAK_SELL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"


class Timeframe(str, enum.Enum):
    """Analysis timeframes"""
    WEEKLY = "WEEKLY"
    DAILY = "DAILY"
    FOUR_HOUR = "4H"
    ONE_HOUR = "1H"
    FIFTEEN_MIN = "15M"


class ExitReason(str, enum.Enum):
    """Exit reason codes"""
    TARGET_1_HIT = "TARGET_1_HIT"
    TARGET_2_HIT = "TARGET_2_HIT"
    TARGET_3_HIT = "TARGET_3_HIT"
    STOP_LOSS_HIT = "STOP_LOSS_HIT"
    TRAILING_STOP_HIT = "TRAILING_STOP_HIT"
    TIME_LIMIT_EXIT = "TIME_LIMIT_EXIT"
    ANALYSIS_DETERIORATED = "ANALYSIS_DETERIORATED"
    MOMENTUM_REVERSAL = "MOMENTUM_REVERSAL"
    VOLUME_DRY_UP = "VOLUME_DRY_UP"
    TREND_REVERSAL = "TREND_REVERSAL"
    MANUAL_EXIT = "MANUAL_EXIT"
    RISK_MANAGEMENT = "RISK_MANAGEMENT"


class SwingTrade(Base):
    """
    Swing Trade Model - Single Admin System
    
    No user_id - All trades belong to admin
    Designed for 2-3 day holding periods with:
    - Multi-timeframe analysis
    - Dynamic target management
    - Continuous monitoring
    - Analysis-based exit decisions
    """

    __tablename__ = "swing_trades"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Symbol Information
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")
    token: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Trade Direction
    side: Mapped[str] = mapped_column(String(10), nullable=False)  # LONG, SHORT

    # Status
    status: Mapped[SwingTradeStatus] = mapped_column(
        Enum(SwingTradeStatus), 
        default=SwingTradeStatus.PENDING
    )
    signal_strength: Mapped[SwingTradeSignal] = mapped_column(
        Enum(SwingTradeSignal),
        default=SwingTradeSignal.HOLD
    )

    # Quantity & Entry
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)
    exit_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Targets (Multiple levels)
    target_1: Mapped[float] = mapped_column(Float, nullable=False)
    target_2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Stop Loss
    stop_loss: Mapped[float] = mapped_column(Float, nullable=False)
    trailing_sl: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trailing_sl_activated: Mapped[bool] = mapped_column(Boolean, default=False)

    # Risk Management
    risk_percent: Mapped[float] = mapped_column(Float, default=2.0)  # % of capital
    risk_reward_ratio: Mapped[float] = mapped_column(Float, default=0.0)

    # Time Management
    max_holding_days: Mapped[int] = mapped_column(Integer, default=3)
    holding_days: Mapped[int] = mapped_column(Integer, default=0)
    entry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    exit_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Analysis Score (stored at entry)
    entry_analysis_score: Mapped[float] = mapped_column(Float, default=0.0)
    current_analysis_score: Mapped[float] = mapped_column(Float, default=0.0)
    analysis_trend: Mapped[str] = mapped_column(String(20), default="NEUTRAL")  # IMPROVING, DETERIORATING, NEUTRAL

    # Multi-Timeframe Scores
    weekly_score: Mapped[float] = mapped_column(Float, default=0.0)
    daily_score: Mapped[float] = mapped_column(Float, default=0.0)
    four_hour_score: Mapped[float] = mapped_column(Float, default=0.0)
    one_hour_score: Mapped[float] = mapped_column(Float, default=0.0)
    timeframe_confluence: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100

    # Recommended Timeframe for this trade
    recommended_timeframe: Mapped[Timeframe] = mapped_column(
        Enum(Timeframe),
        default=Timeframe.DAILY
    )

    # P&L
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    realized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    pnl_percent: Mapped[float] = mapped_column(Float, default=0.0)
    max_profit_reached: Mapped[float] = mapped_column(Float, default=0.0)  # Track max profit for exit analysis
    max_loss_reached: Mapped[float] = mapped_column(Float, default=0.0)  # Track max loss

    # Exit Information
    exit_reason: Mapped[Optional[ExitReason]] = mapped_column(Enum(ExitReason), nullable=True)
    exit_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Targets Hit Tracking
    target_1_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    target_2_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    target_3_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    target_1_hit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    target_2_hit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    target_3_hit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Monitoring Data
    monitoring_count: Mapped[int] = mapped_column(Integer, default=0)  # Number of times monitored
    last_monitoring_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    monitoring_log: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # Array of monitoring snapshots

    # Signal Metadata
    signal_probability: Mapped[float] = mapped_column(Float, default=0.0)
    signal_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    signal_type: Mapped[str] = mapped_column(String(50), default="STANDARD")
    pre_momentum_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Strategy & Reason
    strategy_name: Mapped[str] = mapped_column(String(100), default="SWING_MOMENTUM")
    entry_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    exit_reason_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Risk Flags
    high_risk_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    warning_flags: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Timestamps
    entry_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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

    # Indexes
    __table_args__ = (
        Index('ix_swing_trades_status', 'status'),
        Index('ix_swing_trades_symbol_status', 'symbol', 'status'),
        Index('ix_swing_trades_entry_date', 'entry_date'),
    )

    def __repr__(self) -> str:
        return f"<SwingTrade(id={self.id}, symbol='{self.symbol}', status={self.status})>"

    @property
    def is_active(self) -> bool:
        """Check if trade is active"""
        return self.status == SwingTradeStatus.ACTIVE

    @property
    def days_held(self) -> int:
        """Calculate days held"""
        if self.entry_date:
            today = date.today()
            return (today - self.entry_date).days
        return 0

    @property
    def should_exit_time(self) -> bool:
        """Check if time-based exit is needed"""
        return self.days_held >= self.max_holding_days

    @property
    def current_risk_reward(self) -> float:
        """Calculate current risk/reward"""
        if self.entry_price and self.stop_loss:
            risk = abs(self.entry_price - self.stop_loss)
            if risk > 0:
                profit = abs(self.current_price - self.entry_price)
                return round(profit / risk, 2)
        return 0.0

    @property
    def distance_to_target_1(self) -> float:
        """Calculate % distance to target 1"""
        if self.current_price > 0 and self.target_1 > 0:
            return round((self.target_1 - self.current_price) / self.current_price * 100, 2)
        return 0.0

    @property
    def distance_to_stop_loss(self) -> float:
        """Calculate % distance to stop loss"""
        if self.current_price > 0 and self.stop_loss > 0:
            return round((self.current_price - self.stop_loss) / self.current_price * 100, 2)
        return 0.0

    def update_pnl(self, current_price: float) -> None:
        """Update P&L based on current price"""
        self.current_price = current_price

        if self.side == "LONG":
            self.unrealized_pnl = (current_price - self.entry_price) * self.quantity
        else:
            self.unrealized_pnl = (self.entry_price - current_price) * self.quantity

        cost = self.entry_price * self.quantity
        if cost > 0:
            self.pnl_percent = (self.unrealized_pnl / cost) * 100

        # Track max profit/loss
        if self.unrealized_pnl > self.max_profit_reached:
            self.max_profit_reached = self.unrealized_pnl
        if self.unrealized_pnl < self.max_loss_reached:
            self.max_loss_reached = self.unrealized_pnl

    def check_targets(self, current_price: float) -> Optional[str]:
        """Check if any target is hit"""
        if self.side == "LONG":
            if not self.target_1_hit and current_price >= self.target_1:
                return "TARGET_1"
            if self.target_2 and not self.target_2_hit and current_price >= self.target_2:
                return "TARGET_2"
            if self.target_3 and not self.target_3_hit and current_price >= self.target_3:
                return "TARGET_3"
        else:  # SHORT
            if not self.target_1_hit and current_price <= self.target_1:
                return "TARGET_1"
            if self.target_2 and not self.target_2_hit and current_price <= self.target_2:
                return "TARGET_2"
            if self.target_3 and not self.target_3_hit and current_price <= self.target_3:
                return "TARGET_3"
        return None

    def check_stop_loss(self, current_price: float) -> bool:
        """Check if stop loss is hit"""
        if self.trailing_sl_activated and self.trailing_sl:
            sl = self.trailing_sl
        else:
            sl = self.stop_loss

        if self.side == "LONG":
            return current_price <= sl
        else:
            return current_price >= sl

    def update_trailing_stop(self, current_price: float, trail_percent: float = 1.0) -> None:
        """Update trailing stop loss"""
        if self.side == "LONG":
            new_sl = current_price * (1 - trail_percent / 100)
            if not self.trailing_sl or new_sl > self.trailing_sl:
                self.trailing_sl = new_sl
                self.trailing_sl_activated = True
        else:
            new_sl = current_price * (1 + trail_percent / 100)
            if not self.trailing_sl or new_sl < self.trailing_sl:
                self.trailing_sl = new_sl
                self.trailing_sl_activated = True


class HistoricalAnalysis(Base):
    """
    Historical Analysis Storage
    
    Stores analysis results for backtesting and improvement
    """

    __tablename__ = "historical_analysis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Symbol
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")

    # Time
    analysis_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    analysis_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Price Data
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(Integer, default=0)

    # Analysis Scores
    technical_score: Mapped[float] = mapped_column(Float, default=0.0)
    momentum_score: Mapped[float] = mapped_column(Float, default=0.0)
    trend_score: Mapped[float] = mapped_column(Float, default=0.0)
    volume_score: Mapped[float] = mapped_column(Float, default=0.0)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Signal
    signal: Mapped[str] = mapped_column(String(20), default="HOLD")
    probability: Mapped[float] = mapped_column(Float, default=0.0)

    # Actual Outcome (filled after the fact)
    next_day_change: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    three_day_change: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    five_day_change: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Was prediction correct?
    prediction_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Created
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('ix_historical_analysis_symbol_date', 'symbol', 'analysis_date'),
    )


class MarketDataCache(Base):
    """
    Cached Market Data
    Stores OHLCV data for all tracked symbols
    """

    __tablename__ = "market_data_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Symbol
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")

    # Timeframe
    timeframe: Mapped[str] = mapped_column(String(10), nullable=False)  # 1D, 1H, 15M, etc.

    # OHLCV
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(Integer, default=0)

    # Additional
    oi: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Open Interest

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('ix_market_data_symbol_tf_time', 'symbol', 'timeframe', 'timestamp'),
    )
