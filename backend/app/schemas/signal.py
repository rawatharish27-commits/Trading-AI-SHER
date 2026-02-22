"""
Signal Schemas
Pydantic models for signal-related API operations
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field


class SignalAction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class SignalDirection(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"
    NEUTRAL = "NEUTRAL"


class SignalStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    HIT_TARGET = "HIT_TARGET"
    STOPPED_OUT = "STOPPED_OUT"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class ConfidenceLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class MarketRegime(str, Enum):
    TRENDING = "TRENDING"
    MEAN_REVERTING = "MEAN_REVERTING"
    CHOPPY = "CHOPPY"
    PANIC = "PANIC"


# Base Schemas
class SignalBase(BaseModel):
    """Base signal schema"""
    symbol: str = Field(..., max_length=50)
    exchange: str = Field(default="NSE", max_length=20)


class SignalCreate(SignalBase):
    """Schema for creating a signal"""
    action: SignalAction
    direction: SignalDirection = SignalDirection.NEUTRAL
    probability: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    entry_price: float = Field(..., gt=0)
    stop_loss: float = Field(..., gt=0)
    target_1: float = Field(..., gt=0)
    target_2: float = Field(..., gt=0)
    target_3: Optional[float] = Field(None, gt=0)
    risk_level: RiskLevel = RiskLevel.MEDIUM
    market_regime: MarketRegime = MarketRegime.CHOPPY
    strategy: str = Field(default="ensemble", max_length=100)
    reasoning: Optional[str] = None
    quantity: Optional[int] = None
    allocated_capital: Optional[float] = None


class SignalUpdate(BaseModel):
    """Schema for updating a signal"""
    status: Optional[SignalStatus] = None
    stop_loss: Optional[float] = None
    target_1: Optional[float] = None
    target_2: Optional[float] = None
    target_3: Optional[float] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None


class SignalResponse(SignalBase):
    """Schema for signal response"""
    id: int
    user_id: int
    trace_id: str
    action: SignalAction
    direction: SignalDirection
    status: SignalStatus
    probability: float
    confidence: float
    confidence_level: ConfidenceLevel
    risk_level: RiskLevel
    risk_warning: Optional[str] = None
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: float
    target_3: Optional[float] = None
    market_regime: MarketRegime
    smart_money_flow: Optional[str] = None
    trap_detected: Optional[str] = None
    strategy: str
    evidence_count: int
    evidence_list: Optional[Dict[str, Any]] = None
    reasoning: Optional[str] = None
    quantity: Optional[int] = None
    allocated_capital: Optional[float] = None
    signal_time: datetime
    expiry_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @property
    def risk_reward_ratio(self) -> float:
        """Calculate risk-reward ratio"""
        if self.action == SignalAction.BUY:
            risk = self.entry_price - self.stop_loss
            reward = self.target_1 - self.entry_price
        else:
            risk = self.stop_loss - self.entry_price
            reward = self.entry_price - self.target_1
        return round(reward / risk, 2) if risk > 0 else 0.0


class SignalListResponse(BaseModel):
    """Schema for signal list response"""
    signals: List[SignalResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class SignalStatsResponse(BaseModel):
    """Schema for signal statistics"""
    total: int
    active: int
    hit_target: int
    stopped_out: int
    expired: int
    win_rate: float
    avg_probability: float
    avg_confidence: float
    by_strategy: Dict[str, int]
    by_symbol: Dict[str, int]


class SignalFilter(BaseModel):
    """Schema for signal filtering"""
    status: Optional[SignalStatus] = None
    action: Optional[SignalAction] = None
    symbol: Optional[str] = None
    min_probability: Optional[float] = None
    max_probability: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    strategy: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# Order Schemas
class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOPLOSS_LIMIT = "STOPLOSS_LIMIT"
    STOPLOSS_MARKET = "STOPLOSS_MARKET"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ProductType(str, Enum):
    DELIVERY = "DELIVERY"
    INTRADAY = "INTRADAY"
    MARGIN = "MARGIN"
    BO = "BO"
    CO = "CO"


class OrderCreate(BaseModel):
    """Schema for creating an order"""
    symbol: str = Field(..., max_length=50)
    exchange: str = Field(default="NSE", max_length=20)
    side: OrderSide
    order_type: OrderType = OrderType.MARKET
    product_type: ProductType = ProductType.INTRADAY
    quantity: int = Field(..., gt=0)
    price: float = Field(default=0, ge=0)
    trigger_price: Optional[float] = None
    stop_loss: Optional[float] = None
    square_off: Optional[float] = None
    trailing_sl: Optional[float] = None
    signal_id: Optional[int] = None
    strategy: Optional[str] = None


class OrderResponse(BaseModel):
    """Schema for order response"""
    id: int
    user_id: int
    order_id: Optional[str] = None
    client_order_id: Optional[str] = None
    symbol: str
    exchange: str
    side: OrderSide
    order_type: OrderType
    product_type: ProductType
    quantity: int
    filled_quantity: int
    pending_quantity: int
    price: float
    trigger_price: Optional[float] = None
    average_price: float
    stop_loss: Optional[float] = None
    square_off: Optional[float] = None
    trailing_sl: Optional[float] = None
    status: OrderStatus
    rejection_reason: Optional[str] = None
    broker: str
    broker_order_id: Optional[str] = None
    broker_message: Optional[str] = None
    signal_id: Optional[int] = None
    strategy: Optional[str] = None
    order_time: datetime
    execution_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Schema for order list response"""
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


# Position Schemas
class PositionSide(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"


class PositionStatus(str, Enum):
    OPEN = "OPEN"
    PARTIALLY_CLOSED = "PARTIALLY_CLOSED"
    CLOSED = "CLOSED"
    LIQUIDATED = "LIQUIDATED"


class PositionResponse(BaseModel):
    """Schema for position response"""
    id: int
    user_id: int
    symbol: str
    exchange: str
    side: PositionSide
    status: PositionStatus
    quantity: int
    open_quantity: int
    closed_quantity: int
    entry_price: float
    current_price: float
    exit_price: Optional[float] = None
    avg_exit_price: float
    stop_loss: Optional[float] = None
    trailing_sl: Optional[float] = None
    target: Optional[float] = None
    realized_pnl: float
    unrealized_pnl: float
    pnl_percent: float
    entry_time: datetime
    exit_time: Optional[datetime] = None
    broker: str

    model_config = {"from_attributes": True}


class PositionListResponse(BaseModel):
    """Schema for position list response"""
    positions: List[PositionResponse]
    total: int
    total_pnl: float
    total_invested: float


# Portfolio Schemas
class PortfolioResponse(BaseModel):
    """Schema for portfolio response"""
    id: int
    user_id: int
    name: str
    initial_capital: float
    current_capital: float
    available_capital: float
    invested_capital: float
    total_pnl: float
    realized_pnl: float
    unrealized_pnl: float
    total_return_percent: float
    max_drawdown: float
    max_drawdown_percent: float
    win_rate: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    risk_per_trade: float
    max_positions: int
    auto_trade_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PortfolioStatsResponse(BaseModel):
    """Schema for portfolio statistics"""
    portfolio: PortfolioResponse
    positions: List[PositionResponse]
    daily_pnl: float
    weekly_pnl: float
    monthly_pnl: float
    open_positions: int
    active_signals: int
    pending_orders: int


# Market Data Schemas
class QuoteResponse(BaseModel):
    """Schema for market quote response"""
    symbol: str
    exchange: str
    ltp: float
    open: float
    high: float
    low: float
    close: float
    prev_close: float
    change: float
    change_percent: float
    volume: int
    value: float
    high_52week: float
    low_52week: float
    upper_circuit: float
    lower_circuit: float
    trade_time: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OHLCVResponse(BaseModel):
    """Schema for OHLCV data"""
    symbol: str
    interval: str
    data: List[Dict[str, Any]]
