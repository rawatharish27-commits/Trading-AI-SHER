"""
Risk Service
Business logic for risk management
"""

from typing import Dict, List, Optional
from datetime import datetime

from loguru import logger

from app.engines import risk_system, TradeRequest, RiskAudit, RiskLevel


class RiskService:
    """
    Risk Management Service
    
    Provides:
    - Pre-trade risk checks
    - Portfolio risk monitoring
    - Kill switch management
    - Risk analytics
    """

    async def audit_trade(
        self,
        symbol: str,
        side: str,
        quantity: int,
        price: float,
        stop_loss: Optional[float] = None,
        user_id: Optional[int] = None
    ) -> Dict:
        """
        Perform risk audit for a trade
        
        Args:
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Trade quantity
            price: Trade price
            stop_loss: Stop loss price
            user_id: User ID
            
        Returns:
            Risk audit result
        """
        request = TradeRequest(
            symbol=symbol,
            exchange="NSE",
            side=side,
            quantity=quantity,
            price=price,
            stop_loss=stop_loss
        )
        
        audit = await risk_system.audit_trade(request)
        
        return {
            "allowed": audit.allowed,
            "reason": audit.reason,
            "risk_rating": audit.risk_rating.value,
            "suggested_quantity": audit.suggested_quantity,
            "firewall_code": audit.firewall_code,
            "layers": {
                "position_sizing": {
                    "passed": audit.layers['position_sizing'].passed,
                    "score": audit.layers['position_sizing'].score,
                    "reason": audit.layers['position_sizing'].reason
                },
                "stop_loss": {
                    "passed": audit.layers['stop_loss'].passed,
                    "score": audit.layers['stop_loss'].score,
                    "reason": audit.layers['stop_loss'].reason
                },
                "correlation": {
                    "passed": audit.layers['correlation'].passed,
                    "score": audit.layers['correlation'].score,
                    "reason": audit.layers['correlation'].reason
                },
                "firm_risk": {
                    "passed": audit.layers['firm_risk'].passed,
                    "score": audit.layers['firm_risk'].score,
                    "reason": audit.layers['firm_risk'].reason
                },
                "survival_guard": {
                    "passed": audit.layers['survival_guard'].passed,
                    "score": audit.layers['survival_guard'].score,
                    "reason": audit.layers['survival_guard'].reason
                }
            }
        }

    async def get_risk_state(self, user_id: int) -> Dict:
        """Get current risk state for a user"""
        return {
            "daily_pnl": risk_system.state.daily_pnl,
            "weekly_pnl": risk_system.state.weekly_pnl,
            "daily_trades": risk_system.state.daily_trades,
            "open_positions": risk_system.state.open_positions,
            "used_margin": risk_system.state.used_margin,
            "available_margin": risk_system.state.available_margin,
            "current_drawdown": risk_system.state.current_drawdown,
            "kill_switch_active": risk_system.state.kill_switch_active,
            "kill_switch_reason": risk_system.state.kill_switch_reason,
        }

    async def activate_kill_switch(self, user_id: int, reason: str) -> Dict:
        """Activate kill switch"""
        await risk_system._activate_kill_switch(reason)
        
        logger.critical(f"🚨 Kill switch activated for user {user_id}: {reason}")
        
        return {
            "status": "activated",
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def deactivate_kill_switch(self, user_id: int) -> Dict:
        """Deactivate kill switch"""
        risk_system.state.kill_switch_active = False
        risk_system.state.kill_switch_reason = None
        
        logger.info(f"✅ Kill switch deactivated for user {user_id}")
        
        return {
            "status": "deactivated",
            "timestamp": datetime.utcnow().isoformat()
        }

    async def get_risk_metrics(self, user_id: int) -> Dict:
        """Get comprehensive risk metrics"""
        return {
            "portfolio": {
                "total_capital": risk_system.total_capital,
                "available_capital": risk_system.state.available_margin,
                "used_margin": risk_system.state.used_margin,
                "margin_utilization": round(
                    risk_system.state.used_margin / max(risk_system.state.available_margin, 1) * 100, 2
                )
            },
            "pnl": {
                "daily_pnl": risk_system.state.daily_pnl,
                "weekly_pnl": risk_system.state.weekly_pnl,
                "daily_pnl_percent": round(
                    risk_system.state.daily_pnl / risk_system.total_capital * 100, 2
                )
            },
            "limits": {
                "max_daily_loss": risk_system.config['max_daily_loss'] * risk_system.total_capital,
                "max_weekly_loss": risk_system.config['max_weekly_loss'] * risk_system.total_capital,
                "max_drawdown": risk_system.config['max_drawdown'] * risk_system.total_capital,
                "current_drawdown": risk_system.state.current_drawdown * risk_system.total_capital
            },
            "positions": {
                "open_count": risk_system.state.open_positions,
                "max_positions": risk_system.config['max_open_positions'],
                "daily_trades": risk_system.state.daily_trades,
                "max_daily_trades": risk_system.config['max_daily_trades']
            },
            "status": {
                "kill_switch_active": risk_system.state.kill_switch_active,
                "health_score": self._calculate_health_score()
            }
        }

    def _calculate_health_score(self) -> int:
        """Calculate account health score (0-100)"""
        score = 100
        
        # Deduct for drawdown
        if risk_system.state.current_drawdown > 0:
            score -= int(risk_system.state.current_drawdown / risk_system.config['max_drawdown'] * 30)
        
        # Deduct for daily losses
        if risk_system.state.daily_pnl < 0:
            daily_loss_pct = abs(risk_system.state.daily_pnl) / risk_system.total_capital
            score -= int(daily_loss_pct / risk_system.config['max_daily_loss'] * 25)
        
        # Deduct for margin utilization
        margin_util = risk_system.state.used_margin / max(risk_system.state.available_margin, 1)
        score -= int(margin_util * 20)
        
        return max(0, min(100, score))

    async def update_position(
        self,
        symbol: str,
        quantity: int,
        entry_price: float,
        side: str
    ) -> None:
        """Update risk system with new position"""
        from app.engines import PositionInfo
        
        position = PositionInfo(
            symbol=symbol,
            exchange="NSE",
            quantity=quantity,
            entry_price=entry_price,
            current_price=entry_price,
            pnl=0,
        )
        
        risk_system.add_position(position)

    async def remove_position(self, symbol: str) -> None:
        """Remove position from risk tracking"""
        risk_system.remove_position(symbol)


# Singleton instance
risk_service = RiskService()
