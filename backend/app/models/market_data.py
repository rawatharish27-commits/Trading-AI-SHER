"""
Market Data Model
Cached market data and quotes
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
    Integer,
    String,
    Text,
    JSON,
    func,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MarketSession(str, enum.Enum):
    """Market session types"""
    PRE_MARKET = "PRE_MARKET"
    NORMAL = "NORMAL"
    POST_MARKET = "POST_MARKET"
    CLOSED = "CLOSED"


class MarketData(Base):
    """Real-time market data cache"""

    __tablename__ = "market_data"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Symbol Info
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")
    token: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    isin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Company Info
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Prices
    ltp: Mapped[float] = mapped_column(Float, default=0.0)  # Last traded price
    open: Mapped[float] = mapped_column(Float, default=0.0)
    high: Mapped[float] = mapped_column(Float, default=0.0)
    low: Mapped[float] = mapped_column(Float, default=0.0)
    close: Mapped[float] = mapped_column(Float, default=0.0)
    prev_close: Mapped[float] = mapped_column(Float, default=0.0)

    # Price Changes
    change: Mapped[float] = mapped_column(Float, default=0.0)
    change_percent: Mapped[float] = mapped_column(Float, default=0.0)

    # Volume
    volume: Mapped[int] = mapped_column(Integer, default=0)
    total_buy_qty: Mapped[int] = mapped_column(Integer, default=0)
    total_sell_qty: Mapped[int] = mapped_column(Integer, default=0)

    # Value
    value: Mapped[float] = mapped_column(Float, default=0.0)  # Total traded value

    # 52 Week
    high_52week: Mapped[float] = mapped_column(Float, default=0.0)
    low_52week: Mapped[float] = mapped_column(Float, default=0.0)

    # Circuit Limits
    upper_circuit: Mapped[float] = mapped_column(Float, default=0.0)
    lower_circuit: Mapped[float] = mapped_column(Float, default=0.0)

    # Market Depth (Top 5 bids/asks)
    bids: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    asks: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Session
    session: Mapped[MarketSession] = mapped_column(Enum(MarketSession), default=MarketSession.CLOSED)

    # Metadata
    lot_size: Mapped[int] = mapped_column(Integer, default=1)
    tick_size: Mapped[float] = mapped_column(Float, default=0.05)
    is_tradeable: Mapped[bool] = mapped_column(Boolean, default=True)
    is_derivatives: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    trade_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Indexes
    __table_args__ = (
        Index('ix_market_data_symbol_exchange', 'symbol', 'exchange', unique=True),
    )

    def __repr__(self) -> str:
        return f"<MarketData(symbol='{self.symbol}', ltp={self.ltp})>"

    @property
    def is_positive(self) -> bool:
        """Check if price is positive"""
        return self.change >= 0

    @property
    def circuit_percent(self) -> float:
        """Calculate circuit percentage"""
        if self.prev_close > 0:
            return round((self.ltp - self.prev_close) / self.prev_close * 100, 2)
        return 0.0


class OHLCV(Base):
    """Historical OHLCV data"""

    __tablename__ = "ohlcv_data"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Symbol
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")

    # Time
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    interval: Mapped[str] = mapped_column(String(10), default="1D")  # 1m, 5m, 15m, 1h, 1D

    # OHLCV
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(Integer, default=0)

    # Additional
    vwap: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trades: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('ix_ohlcv_symbol_date', 'symbol', 'date'),
        Index('ix_ohlcv_symbol_interval_date', 'symbol', 'interval', 'date'),
    )

    def __repr__(self) -> str:
        return f"<OHLCV(symbol='{self.symbol}', date={self.date}, close={self.close})>"
