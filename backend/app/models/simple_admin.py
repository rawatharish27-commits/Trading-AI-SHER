"""
Simple Admin State Model
Single Admin - No Multi-User Complexity
All trading state in one place
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
import json


class MarketSession(str, Enum):
    """Market session types"""
    PRE_MARKET = "PRE_MARKET"
    MARKET_OPEN = "MARKET_OPEN"
    POST_MARKET = "POST_MARKET"
    CLOSED = "CLOSED"


class RiskStatus(str, Enum):
    """Risk status"""
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    KILL_SWITCH = "KILL_SWITCH"


@dataclass
class CapitalState:
    """Capital management state"""
    total_capital: float = 1000000.0  # 10 Lakh default
    available_capital: float = 1000000.0
    used_capital: float = 0.0
    reserved_capital: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            "total": self.total_capital,
            "available": self.available_capital,
            "used": self.used_capital,
            "reserved": self.reserved_capital,
            "utilization_percent": round((self.used_capital / self.total_capital) * 100, 2) if self.total_capital > 0 else 0,
        }


@dataclass
class PnLState:
    """P&L tracking state"""
    daily_pnl: float = 0.0
    weekly_pnl: float = 0.0
    monthly_pnl: float = 0.0
    total_realized: float = 0.0
    total_unrealized: float = 0.0
    peak_pnl: float = 0.0
    current_drawdown: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            "daily": round(self.daily_pnl, 2),
            "weekly": round(self.weekly_pnl, 2),
            "monthly": round(self.monthly_pnl, 2),
            "total_realized": round(self.total_realized, 2),
            "total_unrealized": round(self.total_unrealized, 2),
            "peak": round(self.peak_pnl, 2),
            "drawdown": round(self.current_drawdown, 2),
            "drawdown_percent": round((self.current_drawdown / (self.peak_pnl + abs(self.total_realized) + 1)) * 100, 2) if self.peak_pnl > 0 else 0,
        }


@dataclass
class PositionState:
    """Position tracking state"""
    open_positions: int = 0
    max_positions: int = 5
    total_quantity: int = 0
    long_positions: int = 0
    short_positions: int = 0
    
    def to_dict(self) -> Dict:
        return {
            "open": self.open_positions,
            "max": self.max_positions,
            "available_slots": self.max_positions - self.open_positions,
            "total_quantity": self.total_quantity,
            "long": self.long_positions,
            "short": self.short_positions,
        }


@dataclass
class RiskState:
    """Risk management state"""
    status: RiskStatus = RiskStatus.NORMAL
    daily_loss_limit: float = 0.05  # 5%
    weekly_loss_limit: float = 0.10  # 10%
    max_drawdown: float = 0.20  # 20%
    kill_switch_active: bool = False
    kill_switch_reason: Optional[str] = None
    kill_switch_time: Optional[datetime] = None
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "status": self.status.value,
            "kill_switch_active": self.kill_switch_active,
            "kill_switch_reason": self.kill_switch_reason,
            "daily_loss_limit_percent": self.daily_loss_limit * 100,
            "weekly_loss_limit_percent": self.weekly_loss_limit * 100,
            "max_drawdown_percent": self.max_drawdown * 100,
            "warnings": self.warnings,
        }


@dataclass
class TradeStats:
    """Trade statistics"""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    avg_holding_days: float = 0.0
    
    def to_dict(self) -> Dict:
        win_rate = (self.winning_trades / self.total_trades * 100) if self.total_trades > 0 else 0
        return {
            "total": self.total_trades,
            "wins": self.winning_trades,
            "losses": self.losing_trades,
            "win_rate_percent": round(win_rate, 2),
            "avg_win": round(self.avg_win, 2),
            "avg_loss": round(self.avg_loss, 2),
            "largest_win": round(self.largest_win, 2),
            "largest_loss": round(self.largest_loss, 2),
            "avg_holding_days": round(self.avg_holding_days, 2),
        }


@dataclass
class AdminState:
    """
    Complete Admin State - Single User System
    
    All trading state managed in memory with database persistence
    """
    # Admin Info
    admin_name: str = "Admin"
    admin_email: str = "admin@sher.trading"
    admin_mobile: str = "+91-9999999999"
    
    # State Components
    capital: CapitalState = field(default_factory=CapitalState)
    pnl: PnLState = field(default_factory=PnLState)
    positions: PositionState = field(default_factory=PositionState)
    risk: RiskState = field(default_factory=RiskState)
    stats: TradeStats = field(default_factory=TradeStats)
    
    # Trading Settings
    auto_trade_enabled: bool = False
    tracked_symbols: List[str] = field(default_factory=lambda: [
        "RELIANCE", "TCS", "INFY", "HDFC", "ICICIBANK",
        "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT"
    ])
    
    # Timestamps
    last_updated: datetime = field(default_factory=datetime.now)
    trading_start_date: Optional[date] = None
    
    def get_state(self) -> Dict[str, Any]:
        """Get complete state as dictionary"""
        return {
            "admin": {
                "name": self.admin_name,
                "email": self.admin_email,
                "mobile": self.admin_mobile,
            },
            "capital": self.capital.to_dict(),
            "pnl": self.pnl.to_dict(),
            "positions": self.positions.to_dict(),
            "risk": self.risk.to_dict(),
            "stats": self.stats.to_dict(),
            "trading": {
                "auto_enabled": self.auto_trade_enabled,
                "tracked_symbols": self.tracked_symbols,
            },
            "last_updated": self.last_updated.isoformat(),
        }
    
    def can_trade(self) -> tuple[bool, str]:
        """Check if trading is allowed"""
        if self.risk.kill_switch_active:
            return False, "Kill switch is active"
        
        if self.positions.open_positions >= self.positions.max_positions:
            return False, "Maximum positions reached"
        
        if self.capital.available_capital <= 0:
            return False, "No available capital"
        
        # Check daily loss limit
        daily_loss_percent = abs(self.pnl.daily_pnl) / self.capital.total_capital
        if self.pnl.daily_pnl < 0 and daily_loss_percent >= self.risk.daily_loss_limit:
            return False, f"Daily loss limit reached ({daily_loss_percent*100:.1f}%)"
        
        return True, "OK"
    
    def update_pnl(self, realized: float = 0.0, unrealized: float = 0.0):
        """Update P&L"""
        if realized != 0:
            self.pnl.total_realized += realized
            self.pnl.daily_pnl += realized
            self.pnl.weekly_pnl += realized
            self.pnl.monthly_pnl += realized
            
            # Update stats
            self.stats.total_trades += 1
            if realized > 0:
                self.stats.winning_trades += 1
                self.stats.largest_win = max(self.stats.largest_win, realized)
            else:
                self.stats.losing_trades += 1
                self.stats.largest_loss = min(self.stats.largest_loss, realized)
        
        self.pnl.total_unrealized = unrealized
        
        # Update peak and drawdown
        total = self.pnl.total_realized + unrealized
        if total > self.pnl.peak_pnl:
            self.pnl.peak_pnl = total
        
        if total < self.pnl.peak_pnl:
            self.pnl.current_drawdown = self.pnl.peak_pnl - total
        
        self.last_updated = datetime.now()
    
    def activate_kill_switch(self, reason: str):
        """Activate kill switch"""
        self.risk.kill_switch_active = True
        self.risk.kill_switch_reason = reason
        self.risk.kill_switch_time = datetime.now()
        self.risk.status = RiskStatus.KILL_SWITCH
        self.auto_trade_enabled = False
    
    def deactivate_kill_switch(self):
        """Deactivate kill switch"""
        self.risk.kill_switch_active = False
        self.risk.kill_switch_reason = None
        self.risk.kill_switch_time = None
        self.risk.status = RiskStatus.NORMAL
    
    def reset_daily(self):
        """Reset daily counters (call at market open)"""
        self.pnl.daily_pnl = 0.0
        self.risk.warnings = []
    
    def reset_weekly(self):
        """Reset weekly counters (call on Monday open)"""
        self.pnl.weekly_pnl = 0.0
    
    def reset_monthly(self):
        """Reset monthly counters (call on 1st of month)"""
        self.pnl.monthly_pnl = 0.0


# Global instance - Single Admin State
admin_state = AdminState()
