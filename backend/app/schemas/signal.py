"""
Signal Schemas
Pydantic models for signal-related API operations
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class SignalTargets(BaseModel):
    """Schema for signal price targets"""
    entry: float = Field(..., gt=0)
    stop_loss: float = Field(..., gt=0)
    target_1: float = Field(..., gt=0)
    target_2: float = Field(..., gt=0)
    target_3: Optional[float] = Field(None, gt=0)


class SignalBase(BaseModel):
    """Base signal schema"""
    symbol: str = Field(..., min_length=1, max_length=50)
    exchange: str = Field(default="NSE", max_length=20)
    action: str = Field(..., pattern="^(BUY|SELL|HOLD)$")
    probability: float = Field(..., ge=0, le=1)
    confidence: float = Field(default=0, ge=0, le=1)


class SignalCreate(SignalBase):
    """Schema for signal creation"""
    targets: SignalTargets
    strategy: str = Field(default="ensemble")
    reasoning: Optional[str] = None
    market_regime: str = Field(default="CHOPPY")
    evidence_list: Optional[List[Dict[str, Any]]] = None
    smart_money_flow: Optional[str] = None
    trap_detected: Optional[str] = None


class SignalResponse(SignalBase):
    """Schema for signal response"""
    id: int
    trace_id: str
    direction: str
    status: str
    confidence_level: str
    risk_level: str
    risk_warning: Optional[str]
    
    # Targets
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: float
    target_3: Optional[float]
    
    # Market Context
    market_regime: str
    smart_money_flow: Optional[str]
    trap_detected: Optional[str]
    
    # Strategy & Evidence
    strategy: str
    evidence_count: int
    
    # Risk Metrics
    risk_reward_ratio: float
    is_high_probability: bool
    is_safe_risk: bool
    
    # Timestamps
    signal_time: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SignalListResponse(BaseModel):
    """Schema for signal list response"""
    signals: List[SignalResponse]
    total: int
    page: int
    page_size: int


class SignalFilter(BaseModel):
    """Schema for signal filtering"""
    symbol: Optional[str] = None
    action: Optional[str] = None
    status: Optional[str] = None
    min_probability: Optional[float] = Field(None, ge=0, le=1)
    max_probability: Optional[float] = Field(None, ge=0, le=1)
    strategy: Optional[str] = None
    market_regime: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SignalStats(BaseModel):
    """Schema for signal statistics"""
    total_signals: int
    active_signals: int
    hit_target: int
    stopped_out: int
    win_rate: float
    avg_probability: float
    by_strategy: Dict[str, int]
    by_regime: Dict[str, int]
