"""
Signal Model
AI-generated trading signals
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
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
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class SignalAction(str, enum.Enum):
    """Signal actions"""
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class SignalDirection(str, enum.Enum):
    """Signal directions"""
    LONG = "LONG"
    SHORT = "SHORT"
    NEUTRAL = "NEUTRAL"


class SignalStatus(str, enum.Enum):
    """Signal status"""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    HIT_TARGET = "HIT_TARGET"
    STOPPED_OUT = "STOPPED_OUT"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class ConfidenceLevel(str, enum.Enum):
    """Confidence levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RiskLevel(str, enum.Enum):
    """Risk levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class MarketRegime(str, enum.Enum):
    """Market regimes"""
    TRENDING = "TRENDING"
    MEAN_REVERTING = "MEAN_REVERTING"
    CHOPPY = "CHOPPY"
    PANIC = "PANIC"


class Signal(Base):
    """AI-generated trading signal"""

    __tablename__ = "signals"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Signal Identification
    trace_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    # Symbol Information
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")
    token: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Signal Details
    action: Mapped[SignalAction] = mapped_column(Enum(SignalAction), nullable=False)
    direction: Mapped[SignalDirection] = mapped_column(Enum(SignalDirection), default=SignalDirection.NEUTRAL)
    status: Mapped[SignalStatus] = mapped_column(Enum(SignalStatus), default=SignalStatus.PENDING)

    # Probability & Confidence
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_level: Mapped[ConfidenceLevel] = mapped_column(
        Enum(ConfidenceLevel),
        default=ConfidenceLevel.MEDIUM
    )

    # Risk Assessment
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    risk_warning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Price Targets
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    stop_loss: Mapped[float] = mapped_column(Float, nullable=False)
    target_1: Mapped[float] = mapped_column(Float, nullable=False)
    target_2: Mapped[float] = mapped_column(Float, nullable=False)
    target_3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Market Context
    market_regime: Mapped[MarketRegime] = mapped_column(
        Enum(MarketRegime),
        default=MarketRegime.CHOPPY
    )
    smart_money_flow: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    trap_detected: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Strategy Information
    strategy: Mapped[str] = mapped_column(String(100), default="ensemble")

    # SMC Components (for SMC-based signals)
    market_structure: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    liquidity_sweep: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    order_block: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    fair_value_gap: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    mtf_confirmation: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)

    # Signal Versioning
    setup_version: Mapped[Optional[str]] = mapped_column(String(20), default="1.0", nullable=True)

    # Performance Tracking
    exit_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    realized_pnl: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pnl_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    holding_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_favorable_excursion: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_adverse_excursion: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    performance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Evidence & Reasoning
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    evidence_list: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # SEBI Compliance
    disclaimer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    audit_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    previous_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Execution Details
    quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    allocated_capital: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Timestamps
    signal_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiry_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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
    user: Mapped["User"] = relationship("User", back_populates="signals")

    def __repr__(self) -> str:
        return f"<Signal(id={self.id}, symbol='{self.symbol}', action={self.action}, prob={self.probability})>"

    @property
    def risk_reward_ratio(self) -> float:
        """Calculate risk-reward ratio"""
        if self.action == SignalAction.BUY:
            risk = self.entry_price - self.stop_loss
            reward = self.target_1 - self.entry_price
        else:
            risk = self.stop_loss - self.entry_price
            reward = self.entry_price - self.target_1

        if risk <= 0:
            return 0.0
        return round(reward / risk, 2)

    @property
    def is_high_probability(self) -> bool:
        """Check if signal has high probability"""
        return self.probability >= 0.75

    @property
    def is_safe_risk(self) -> bool:
        """Check if risk level is acceptable"""
        return self.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM]
