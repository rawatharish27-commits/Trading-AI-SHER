"""
Trade Monitoring Service
Monitors active swing trades and makes exit decisions
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
from enum import Enum
import asyncio
from loguru import logger

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.swing_trade import (
    SwingTrade, SwingTradeStatus, SwingTradeSignal,
    ExitReason, Timeframe
)
from app.engines.swing_trading_engine import swing_trading_engine, TradeSignal
from app.services.historical_data_service import historical_data_service


class MonitoringAction(str, Enum):
    """Actions from monitoring"""
    HOLD = "HOLD"
    BOOK_PROFIT = "BOOK_PROFIT"
    EXIT_STOP_LOSS = "EXIT_STOP_LOSS"
    EXIT_TIME_LIMIT = "EXIT_TIME_LIMIT"
    EXIT_ANALYSIS = "EXIT_ANALYSIS"
    UPDATE_TARGETS = "UPDATE_TARGETS"
    ACTIVATE_TRAILING = "ACTIVATE_TRAILING"
    WARNING = "WARNING"


@dataclass
class MonitoringResult:
    """Result from trade monitoring"""
    trade_id: int
    symbol: str
    action: MonitoringAction
    current_price: float
    unrealized_pnl: float
    pnl_percent: float
    
    # Analysis data
    current_analysis_score: float
    analysis_trend: str  # IMPROVING, DETERIORATING, NEUTRAL
    momentum_status: str
    
    # Exit recommendation
    exit_recommended: bool
    exit_reason: Optional[ExitReason]
    exit_price: Optional[float]
    
    # Target status
    targets_achieved: List[str]
    distance_to_target: float
    distance_to_stop: float
    
    # Time status
    days_held: int
    days_remaining: int
    
    # Risk status
    risk_level: str
    warnings: List[str]
    
    # Trailing stop
    trailing_sl_activated: bool
    new_trailing_sl: Optional[float]
    
    reasoning: str
    monitoring_time: datetime = field(default_factory=datetime.now)


class TradeMonitorService:
    """
    Trade Monitoring Service
    
    Monitors active swing trades and makes intelligent exit decisions:
    - Target achievement detection
    - Stop loss monitoring
    - Time-based exit
    - Analysis-based exit (deteriorating conditions)
    - Trailing stop management
    """
    
    # Monitoring thresholds
    ANALYSIS_EXIT_THRESHOLD = -15  # Score drop to trigger exit
    MOMENTUM_REVERSAL_THRESHOLD = -30  # Momentum reversal threshold
    TIME_EXIT_DAYS = 3  # Max holding days
    
    # Trailing stop parameters
    TRAILING_STOP_TRIGGER = 1.5  # % profit to activate trailing
    TRAILING_STOP_DISTANCE = 1.0  # % distance for trailing stop
    
    def __init__(self):
        """Initialize trade monitor"""
        self.monitoring_interval = 300  # 5 minutes
        self.active_monitors: Dict[int, asyncio.Task] = {}
        
        logger.info("👁️ Trade Monitor Service initialized")

    async def monitor_trade(
        self,
        trade: SwingTrade,
        db: AsyncSession,
        current_price: float,
        historical_data: Dict[str, List] = None
    ) -> MonitoringResult:
        """
        Monitor a single swing trade
        
        Args:
            trade: SwingTrade to monitor
            db: Database session
            current_price: Current market price
            historical_data: Multi-timeframe historical data
            
        Returns:
            MonitoringResult with action recommendation
        """
        logger.info(f"👁️ Monitoring trade #{trade.id} - {trade.symbol}")
        
        # Update trade P&L
        trade.update_pnl(current_price)
        trade.monitoring_count += 1
        trade.last_monitoring_time = datetime.now()
        
        # 1. Check target achievement
        target_hit = trade.check_targets(current_price)
        if target_hit:
            return await self._handle_target_hit(trade, target_hit, current_price)
        
        # 2. Check stop loss
        if trade.check_stop_loss(current_price):
            return await self._handle_stop_loss(trade, current_price)
        
        # 3. Check time limit
        if trade.should_exit_time:
            return await self._handle_time_exit(trade, current_price)
        
        # 4. Perform analysis-based monitoring
        analysis_result = await self._analyze_trade_conditions(
            trade, current_price, historical_data
        )
        
        # 5. Check for analysis-based exit
        if analysis_result["exit_recommended"]:
            return await self._handle_analysis_exit(trade, current_price, analysis_result)
        
        # 6. Check trailing stop activation
        trailing_result = self._check_trailing_stop(trade, current_price)
        
        # 7. Build monitoring result
        result = MonitoringResult(
            trade_id=trade.id,
            symbol=trade.symbol,
            action=MonitoringAction.HOLD,
            current_price=current_price,
            unrealized_pnl=trade.unrealized_pnl,
            pnl_percent=trade.pnl_percent,
            current_analysis_score=analysis_result["current_score"],
            analysis_trend=analysis_result["trend"],
            momentum_status=analysis_result["momentum_status"],
            exit_recommended=False,
            exit_reason=None,
            exit_price=None,
            targets_achieved=self._get_achieved_targets(trade),
            distance_to_target=trade.distance_to_target_1,
            distance_to_stop=trade.distance_to_stop_loss,
            days_held=trade.days_held,
            days_remaining=max(0, trade.max_holding_days - trade.days_held),
            risk_level=trade.risk_level,
            warnings=analysis_result.get("warnings", []),
            trailing_sl_activated=trade.trailing_sl_activated,
            new_trailing_sl=trailing_result.get("new_sl"),
            reasoning=analysis_result["reasoning"]
        )
        
        # 8. Update trade with monitoring data
        await self._update_trade_monitoring(trade, result, db)
        
        return result

    async def _handle_target_hit(
        self,
        trade: SwingTrade,
        target: str,
        current_price: float
    ) -> MonitoringResult:
        """Handle target achievement"""
        
        # Update trade
        if target == "TARGET_1":
            trade.target_1_hit = True
            trade.target_1_hit_time = datetime.now()
            exit_reason = ExitReason.TARGET_1_HIT
        elif target == "TARGET_2":
            trade.target_2_hit = True
            trade.target_2_hit_time = datetime.now()
            exit_reason = ExitReason.TARGET_2_HIT
        else:
            trade.target_3_hit = True
            trade.target_3_hit_time = datetime.now()
            exit_reason = ExitReason.TARGET_3_HIT
        
        logger.info(f"🎯 {target} hit for {trade.symbol} @ {current_price}")
        
        return MonitoringResult(
            trade_id=trade.id,
            symbol=trade.symbol,
            action=MonitoringAction.BOOK_PROFIT,
            current_price=current_price,
            unrealized_pnl=trade.unrealized_pnl,
            pnl_percent=trade.pnl_percent,
            current_analysis_score=trade.current_analysis_score,
            analysis_trend="NEUTRAL",
            momentum_status="TARGET_ACHIEVED",
            exit_recommended=True,
            exit_reason=exit_reason,
            exit_price=current_price,
            targets_achieved=self._get_achieved_targets(trade),
            distance_to_target=0,
            distance_to_stop=trade.distance_to_stop_loss,
            days_held=trade.days_held,
            days_remaining=max(0, trade.max_holding_days - trade.days_held),
            risk_level="LOW",
            warnings=[],
            trailing_sl_activated=trade.trailing_sl_activated,
            new_trailing_sl=None,
            reasoning=f"{target} achieved at {current_price}"
        )

    async def _handle_stop_loss(
        self,
        trade: SwingTrade,
        current_price: float
    ) -> MonitoringResult:
        """Handle stop loss hit"""
        
        trade.status = SwingTradeStatus.STOP_LOSS
        
        exit_reason = ExitReason.TRAILING_STOP_HIT if trade.trailing_sl_activated else ExitReason.STOP_LOSS_HIT
        
        logger.warning(f"🛑 Stop loss hit for {trade.symbol} @ {current_price}")
        
        return MonitoringResult(
            trade_id=trade.id,
            symbol=trade.symbol,
            action=MonitoringAction.EXIT_STOP_LOSS,
            current_price=current_price,
            unrealized_pnl=trade.unrealized_pnl,
            pnl_percent=trade.pnl_percent,
            current_analysis_score=trade.current_analysis_score,
            analysis_trend="DETERIORATING",
            momentum_status="STOP_LOSS",
            exit_recommended=True,
            exit_reason=exit_reason,
            exit_price=current_price,
            targets_achieved=[],
            distance_to_target=trade.distance_to_target_1,
            distance_to_stop=0,
            days_held=trade.days_held,
            days_remaining=0,
            risk_level="HIGH",
            warnings=["Stop loss triggered"],
            trailing_sl_activated=trade.trailing_sl_activated,
            new_trailing_sl=None,
            reasoning=f"Stop loss hit at {current_price}"
        )

    async def _handle_time_exit(
        self,
        trade: SwingTrade,
        current_price: float
    ) -> MonitoringResult:
        """Handle time-based exit"""
        
        trade.status = SwingTradeStatus.TIME_EXIT
        
        logger.info(f"⏰ Time limit reached for {trade.symbol}")
        
        return MonitoringResult(
            trade_id=trade.id,
            symbol=trade.symbol,
            action=MonitoringAction.EXIT_TIME_LIMIT,
            current_price=current_price,
            unrealized_pnl=trade.unrealized_pnl,
            pnl_percent=trade.pnl_percent,
            current_analysis_score=trade.current_analysis_score,
            analysis_trend="NEUTRAL",
            momentum_status="TIME_EXIT",
            exit_recommended=True,
            exit_reason=ExitReason.TIME_LIMIT_EXIT,
            exit_price=current_price,
            targets_achieved=self._get_achieved_targets(trade),
            distance_to_target=trade.distance_to_target_1,
            distance_to_stop=trade.distance_to_stop_loss,
            days_held=trade.days_held,
            days_remaining=0,
            risk_level="MEDIUM",
            warnings=[],
            trailing_sl_activated=trade.trailing_sl_activated,
            new_trailing_sl=None,
            reasoning=f"Max holding period ({trade.max_holding_days} days) reached"
        )

    async def _analyze_trade_conditions(
        self,
        trade: SwingTrade,
        current_price: float,
        historical_data: Dict[str, List] = None
    ) -> Dict:
        """Analyze current trade conditions"""
        
        result = {
            "exit_recommended": False,
            "current_score": trade.current_analysis_score,
            "trend": "NEUTRAL",
            "momentum_status": "NEUTRAL",
            "warnings": [],
            "reasoning": ""
        }
        
        if not historical_data:
            return result
        
        try:
            # Perform multi-timeframe analysis
            analysis = await swing_trading_engine.analyze(
                symbol=trade.symbol,
                historical_data=historical_data,
                current_price=current_price
            )
            
            # Update scores
            current_score = analysis.overall_score
            entry_score = trade.entry_analysis_score
            
            # Calculate score change
            score_change = current_score - entry_score
            trade.current_analysis_score = current_score
            
            # Determine trend
            if score_change > 10:
                trade.analysis_trend = "IMPROVING"
                result["trend"] = "IMPROVING"
            elif score_change < -10:
                trade.analysis_trend = "DETERIORATING"
                result["trend"] = "DETERIORATING"
            else:
                trade.analysis_trend = "NEUTRAL"
                result["trend"] = "NEUTRAL"
            
            # Check for exit conditions
            if trade.side == "LONG":
                # For long positions
                if analysis.overall_signal in [TradeSignal.SELL, TradeSignal.STRONG_SELL]:
                    result["exit_recommended"] = True
                    result["warnings"].append("Signal reversed to SELL")
                
                if analysis.pre_momentum_score < 30:
                    result["warnings"].append("Pre-momentum lost")
                
                if score_change < self.ANALYSIS_EXIT_THRESHOLD:
                    result["exit_recommended"] = True
                    result["warnings"].append(f"Analysis score dropped {abs(score_change):.0f} points")
                
            else:  # SHORT
                # For short positions
                if analysis.overall_signal in [TradeSignal.BUY, TradeSignal.STRONG_BUY]:
                    result["exit_recommended"] = True
                    result["warnings"].append("Signal reversed to BUY")
                
                if score_change > -self.ANALYSIS_EXIT_THRESHOLD:
                    result["warnings"].append("Analysis improving against position")
            
            # Check momentum
            momentum = analysis.timeframe_analyses.get("1D")
            if momentum:
                result["momentum_status"] = "BULLISH" if momentum.momentum > 20 else (
                    "BEARISH" if momentum.momentum < -20 else "NEUTRAL"
                )
                
                # Momentum reversal check
                if trade.side == "LONG" and momentum.momentum < self.MOMENTUM_REVERSAL_THRESHOLD:
                    result["exit_recommended"] = True
                    result["warnings"].append("Strong momentum reversal detected")
            
            # Volume check
            if momentum and momentum.volume_strength < 30:
                result["warnings"].append("Volume drying up")
            
            # Build reasoning
            result["reasoning"] = f"Score: {current_score:.0f} ({score_change:+.0f}), " \
                                 f"Trend: {result['trend']}, " \
                                 f"Momentum: {result['momentum_status']}"
            
        except Exception as e:
            logger.error(f"Error analyzing trade conditions: {e}")
            result["reasoning"] = f"Analysis error: {str(e)}"
        
        return result

    async def _handle_analysis_exit(
        self,
        trade: SwingTrade,
        current_price: float,
        analysis_result: Dict
    ) -> MonitoringResult:
        """Handle analysis-based exit"""
        
        trade.status = SwingTradeStatus.ANALYSIS_EXIT
        
        # Determine specific exit reason
        warnings = analysis_result.get("warnings", [])
        
        if any("momentum" in w.lower() for w in warnings):
            exit_reason = ExitReason.MOMENTUM_REVERSAL
        elif any("volume" in w.lower() for w in warnings):
            exit_reason = ExitReason.VOLUME_DRY_UP
        elif any("signal" in w.lower() for w in warnings):
            exit_reason = ExitReason.TREND_REVERSAL
        else:
            exit_reason = ExitReason.ANALYSIS_DETERIORATED
        
        logger.warning(f"📉 Analysis exit for {trade.symbol}: {exit_reason.value}")
        
        return MonitoringResult(
            trade_id=trade.id,
            symbol=trade.symbol,
            action=MonitoringAction.EXIT_ANALYSIS,
            current_price=current_price,
            unrealized_pnl=trade.unrealized_pnl,
            pnl_percent=trade.pnl_percent,
            current_analysis_score=analysis_result["current_score"],
            analysis_trend=analysis_result["trend"],
            momentum_status=analysis_result["momentum_status"],
            exit_recommended=True,
            exit_reason=exit_reason,
            exit_price=current_price,
            targets_achieved=self._get_achieved_targets(trade),
            distance_to_target=trade.distance_to_target_1,
            distance_to_stop=trade.distance_to_stop_loss,
            days_held=trade.days_held,
            days_remaining=max(0, trade.max_holding_days - trade.days_held),
            risk_level="HIGH",
            warnings=warnings,
            trailing_sl_activated=trade.trailing_sl_activated,
            new_trailing_sl=None,
            reasoning=f"Analysis exit: {'; '.join(warnings)}"
        )

    def _check_trailing_stop(
        self,
        trade: SwingTrade,
        current_price: float
    ) -> Dict:
        """Check and update trailing stop"""
        
        result = {"activated": False, "new_sl": None}
        
        # Check if profit threshold reached
        pnl_percent = trade.pnl_percent
        
        if not trade.trailing_sl_activated and pnl_percent >= self.TRAILING_STOP_TRIGGER:
            # Activate trailing stop
            trade.update_trailing_stop(current_price, self.TRAILING_STOP_DISTANCE)
            result["activated"] = True
            result["new_sl"] = trade.trailing_sl
            logger.info(f"📈 Trailing stop activated for {trade.symbol} at {trade.trailing_sl}")
            
        elif trade.trailing_sl_activated:
            # Update trailing stop if profit increased
            old_sl = trade.trailing_sl
            trade.update_trailing_stop(current_price, self.TRAILING_STOP_DISTANCE)
            
            if trade.trailing_sl != old_sl:
                result["new_sl"] = trade.trailing_sl
                logger.info(f"📈 Trailing stop updated for {trade.symbol} to {trade.trailing_sl}")
        
        return result

    def _get_achieved_targets(self, trade: SwingTrade) -> List[str]:
        """Get list of achieved targets"""
        achieved = []
        if trade.target_1_hit:
            achieved.append("TARGET_1")
        if trade.target_2_hit:
            achieved.append("TARGET_2")
        if trade.target_3_hit:
            achieved.append("TARGET_3")
        return achieved

    async def _update_trade_monitoring(
        self,
        trade: SwingTrade,
        result: MonitoringResult,
        db: AsyncSession
    ) -> None:
        """Update trade with monitoring data"""
        
        # Update monitoring log
        if not trade.monitoring_log:
            trade.monitoring_log = []
        
        trade.monitoring_log.append({
            "time": datetime.now().isoformat(),
            "price": result.current_price,
            "pnl": result.unrealized_pnl,
            "pnl_percent": result.pnl_percent,
            "analysis_score": result.current_analysis_score,
            "action": result.action.value,
        })
        
        # Keep only last 100 monitoring entries
        if len(trade.monitoring_log) > 100:
            trade.monitoring_log = trade.monitoring_log[-100:]
        
        # Update warnings
        if result.warnings:
            trade.warning_flags = {
                "warnings": result.warnings,
                "last_updated": datetime.now().isoformat()
            }
        
        await db.commit()

    async def monitor_all_active_trades(
        self,
        db: AsyncSession,
        user_id: int
    ) -> List[MonitoringResult]:
        """
        Monitor all active trades for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of MonitoringResults
        """
        # Get all active trades
        result = await db.execute(
            select(SwingTrade).where(
                and_(
                    SwingTrade.user_id == user_id,
                    SwingTrade.status == SwingTradeStatus.ACTIVE
                )
            )
        )
        active_trades = result.scalars().all()
        
        results = []
        
        for trade in active_trades:
            try:
                # Get current price (mock for now)
                current_price = trade.current_price or trade.entry_price
                
                # Get historical data
                historical_data = await historical_data_service.get_multi_timeframe_data(
                    db=db,
                    symbol=trade.symbol
                )
                
                # Monitor trade
                monitoring_result = await self.monitor_trade(
                    trade=trade,
                    db=db,
                    current_price=current_price,
                    historical_data=historical_data
                )
                
                results.append(monitoring_result)
                
            except Exception as e:
                logger.error(f"Error monitoring trade {trade.id}: {e}")
        
        return results

    def get_monitoring_summary(self, results: List[MonitoringResult]) -> Dict:
        """Get summary of monitoring results"""
        
        summary = {
            "total_monitored": len(results),
            "hold": 0,
            "exit_recommended": 0,
            "targets_achieved": 0,
            "warnings": 0,
            "total_unrealized_pnl": 0,
            "avg_analysis_score": 0,
        }
        
        for r in results:
            if r.action == MonitoringAction.HOLD:
                summary["hold"] += 1
            else:
                summary["exit_recommended"] += 1
            
            if r.targets_achieved:
                summary["targets_achieved"] += 1
            
            if r.warnings:
                summary["warnings"] += 1
            
            summary["total_unrealized_pnl"] += r.unrealized_pnl
            summary["avg_analysis_score"] += r.current_analysis_score
        
        if results:
            summary["avg_analysis_score"] /= len(results)
        
        return summary


# Singleton instance
trade_monitor_service = TradeMonitorService()
