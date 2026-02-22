"""
Database Models Package - Simplified for Single Admin
Only essential models for trading system
"""

from app.models.simple_admin import (
    AdminState,
    CapitalState,
    PnLState,
    PositionState,
    RiskState,
    TradeStats,
    MarketSession,
    RiskStatus,
    admin_state,
)

from app.models.swing_trade import (
    SwingTrade,
    SwingTradeStatus,
    SwingTradeSignal,
    Timeframe,
    ExitReason,
    HistoricalAnalysis,
    MarketDataCache,
)

__all__ = [
    # Admin State (Single User)
    "AdminState",
    "CapitalState",
    "PnLState",
    "PositionState",
    "RiskState",
    "TradeStats",
    "MarketSession",
    "RiskStatus",
    "admin_state",
    # Swing Trade
    "SwingTrade",
    "SwingTradeStatus",
    "SwingTradeSignal",
    "Timeframe",
    "ExitReason",
    "HistoricalAnalysis",
    "MarketDataCache",
]
