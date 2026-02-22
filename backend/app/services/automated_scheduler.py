"""
Automated Trading Scheduler
Fully automated trading with scheduled tasks
"""

from datetime import datetime, time, timedelta
from typing import Dict, List, Optional, Set
import asyncio
from enum import Enum
from dataclasses import dataclass, field

from loguru import logger
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.swing_trade import SwingTrade, SwingTradeStatus
from app.models.user import User
from app.engines.swing_trading_engine import swing_trading_engine, TradeSignal
from app.services.historical_data_service import historical_data_service
from app.services.trade_monitor_service import trade_monitor_service


class MarketSession(str, Enum):
    """Market session types"""
    PRE_MARKET = "PRE_MARKET"
    MARKET_OPEN = "MARKET_OPEN"
    POST_MARKET = "POST_MARKET"
    CLOSED = "CLOSED"


@dataclass
class ScheduledTask:
    """Scheduled task configuration"""
    name: str
    interval_seconds: int
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    enabled: bool = True
    running: bool = False


class AutomatedTradingScheduler:
    """
    Fully Automated Trading Scheduler
    
    Handles:
    - Historical data updates (daily at 6:00 AM)
    - Signal generation (every 15 minutes during market hours)
    - Trade execution (automatic when signal confidence > threshold)
    - Trade monitoring (every 5 minutes)
    - Risk checks (continuous)
    - Notifications (on events)
    """

    # Market timings (IST)
    PRE_MARKET_START = time(9, 0)
    MARKET_OPEN = time(9, 15)
    MARKET_CLOSE = time(15, 30)
    POST_MARKET_END = time(16, 0)

    # Trading configuration
    AUTO_TRADE_ENABLED = True
    AUTO_TRADE_CONFIDENCE_THRESHOLD = 0.75
    AUTO_TRADE_MAX_POSITIONS = 5
    AUTO_TRADE_CAPITAL_PER_TRADE = 0.05  # 5% per trade

    # Symbols to track
    TRACKED_SYMBOLS = [
        "RELIANCE", "TCS", "HDFC", "INFY", "ICICI",
        "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT",
        "HINDUNILVR", "AXISBANK", "BAJFINANCE", "MARUTI", "ASIANPAINT",
    ]

    def __init__(self):
        """Initialize automated trading scheduler"""
        self.tasks: Dict[str, ScheduledTask] = {}
        self._running = False
        self._tasks: Set[asyncio.Task] = set()

        # State tracking
        self.daily_data_updated = False
        self.last_signal_check = None
        self.active_positions: Dict[str, Dict] = {}
        self.daily_pnl = 0.0

        # Initialize tasks
        self._init_tasks()

        logger.info("🤖 Automated Trading Scheduler initialized")

    def _init_tasks(self):
        """Initialize scheduled tasks"""
        self.tasks = {
            "update_historical_data": ScheduledTask(
                name="update_historical_data",
                interval_seconds=3600,  # 1 hour
                enabled=True,
            ),
            "generate_signals": ScheduledTask(
                name="generate_signals",
                interval_seconds=900,  # 15 minutes
                enabled=True,
            ),
            "monitor_trades": ScheduledTask(
                name="monitor_trades",
                interval_seconds=300,  # 5 minutes
                enabled=True,
            ),
            "risk_check": ScheduledTask(
                name="risk_check",
                interval_seconds=60,  # 1 minute
                enabled=True,
            ),
            "cleanup": ScheduledTask(
                name="cleanup",
                interval_seconds=3600,  # 1 hour
                enabled=True,
            ),
        }

    def get_market_session(self) -> MarketSession:
        """Get current market session"""
        now = datetime.now().time()

        if self.PRE_MARKET_START <= now < self.MARKET_OPEN:
            return MarketSession.PRE_MARKET
        elif self.MARKET_OPEN <= now < self.MARKET_CLOSE:
            return MarketSession.MARKET_OPEN
        elif self.MARKET_CLOSE <= now < self.POST_MARKET_END:
            return MarketSession.POST_MARKET
        else:
            return MarketSession.CLOSED

    def is_market_open(self) -> bool:
        """Check if market is open"""
        return self.get_market_session() == MarketSession.MARKET_OPEN

    async def start(self):
        """Start the automated trading scheduler"""
        if self._running:
            logger.warning("Scheduler already running")
            return

        self._running = True
        logger.info("🚀 Starting Automated Trading Scheduler")

        # Start main scheduler loop
        task = asyncio.create_task(self._scheduler_loop())
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

        logger.info("✅ Automated Trading Scheduler started")

    async def stop(self):
        """Stop the automated trading scheduler"""
        self._running = False
        logger.info("🛑 Stopping Automated Trading Scheduler")

        # Cancel all tasks
        for task in self._tasks:
            task.cancel()

        self._tasks.clear()
        logger.info("✅ Automated Trading Scheduler stopped")

    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self._running:
            try:
                session = self.get_market_session()
                now = datetime.now()

                # Update historical data (daily at 6 AM)
                if now.hour == 6 and now.minute < 5 and not self.daily_data_updated:
                    await self._run_task("update_historical_data")

                # Generate signals during market hours
                if self.is_market_open():
                    await self._run_task("generate_signals")
                    await self._run_task("monitor_trades")

                # Risk check (always)
                await self._run_task("risk_check")

                # Cleanup (hourly)
                await self._run_task("cleanup")

                # Sleep for 1 minute
                await asyncio.sleep(60)

            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(60)

    async def _run_task(self, task_name: str):
        """Run a scheduled task"""
        task = self.tasks.get(task_name)
        if not task or not task.enabled or task.running:
            return

        now = datetime.now()

        # Check if it's time to run
        if task.last_run:
            next_run = task.last_run + timedelta(seconds=task.interval_seconds)
            if now < next_run:
                return

        task.running = True
        try:
            logger.info(f"⏰ Running task: {task_name}")

            if task_name == "update_historical_data":
                await self._update_historical_data()
            elif task_name == "generate_signals":
                await self._generate_signals()
            elif task_name == "monitor_trades":
                await self._monitor_trades()
            elif task_name == "risk_check":
                await self._risk_check()
            elif task_name == "cleanup":
                await self._cleanup()

            task.last_run = now
            logger.info(f"✅ Task completed: {task_name}")

        except Exception as e:
            logger.error(f"Task {task_name} failed: {e}")
        finally:
            task.running = False

    async def _update_historical_data(self):
        """Update historical data for all tracked symbols"""
        async for db in get_db():
            try:
                stats = await historical_data_service.update_all_symbols(db)
                self.daily_data_updated = True

                logger.info(f"📊 Historical data updated: {stats}")

                # Send notification
                await self._send_notification(
                    level="INFO",
                    title="Data Updated",
                    message=f"Historical data updated for {len(stats)} symbols"
                )

            except Exception as e:
                logger.error(f"Failed to update historical data: {e}")

    async def _generate_signals(self):
        """Generate signals and execute trades automatically"""
        if not self.AUTO_TRADE_ENABLED:
            logger.debug("Auto trading disabled")
            return

        async for db in get_db():
            try:
                # Check current positions
                result = await db.execute(
                    select(SwingTrade).where(
                        SwingTrade.status == SwingTradeStatus.ACTIVE
                    )
                )
                active_trades = result.scalars().all()

                if len(active_trades) >= self.AUTO_TRADE_MAX_POSITIONS:
                    logger.debug(f"Max positions reached: {len(active_trades)}")
                    return

                # Generate signals for each symbol
                for symbol in self.TRACKED_SYMBOLS:
                    # Skip if already has position
                    if any(t.symbol == symbol for t in active_trades):
                        continue

                    try:
                        # Get historical data
                        historical_data = await historical_data_service.get_multi_timeframe_data(
                            db=db, symbol=symbol
                        )

                        if not historical_data.get("1D"):
                            continue

                        current_price = historical_data["1D"][-1].close

                        # Generate signal
                        analysis = await swing_trading_engine.analyze(
                            symbol=symbol,
                            historical_data=historical_data,
                            current_price=current_price
                        )

                        # Check confidence threshold
                        if analysis.confidence >= self.AUTO_TRADE_CONFIDENCE_THRESHOLD:
                            if analysis.recommended_action in ["BUY", "CONDITIONAL_BUY"]:
                                await self._execute_trade(db, analysis, symbol, current_price)
                            elif analysis.recommended_action in ["SELL", "CONDITIONAL_SELL"]:
                                await self._execute_trade(db, analysis, symbol, current_price, side="SHORT")

                    except Exception as e:
                        logger.error(f"Error generating signal for {symbol}: {e}")
                        continue

                self.last_signal_check = datetime.now()

            except Exception as e:
                logger.error(f"Signal generation failed: {e}")

    async def _execute_trade(self, db: AsyncSession, analysis, symbol: str, price: float, side: str = "LONG"):
        """Execute a trade automatically"""
        try:
            # Calculate position size
            capital = 100000  # Get from user settings
            position_value = capital * self.AUTO_TRADE_CAPITAL_PER_TRADE
            quantity = int(position_value / price)

            if quantity <= 0:
                return

            # Create trade
            trade = SwingTrade(
                user_id=1,  # Default user for auto trading
                symbol=symbol,
                exchange="NSE",
                side=side,
                status=SwingTradeStatus.ACTIVE,
                quantity=quantity,
                entry_price=price,
                current_price=price,
                stop_loss=analysis.stop_loss,
                target_1=analysis.target_1,
                target_2=analysis.target_2,
                target_3=analysis.target_3,
                max_holding_days=analysis.recommended_holding_days,
                entry_date=datetime.now().date(),
                entry_time=datetime.now(),
                entry_analysis_score=analysis.overall_score,
                current_analysis_score=analysis.overall_score,
                signal_probability=analysis.confidence,
                signal_type=analysis.recommended_action,
                strategy_name="AUTO_SWING",
                risk_reward_ratio=analysis.risk_reward_ratio,
            )

            db.add(trade)
            await db.commit()
            await db.refresh(trade)

            logger.info(f"🤖 AUTO TRADE EXECUTED: {side} {symbol} @ {price}")

            # Send notification
            await self._send_notification(
                level="TRADE",
                title=f"Auto Trade Executed: {symbol}",
                message=f"{side} {quantity} shares @ ₹{price:.2f}\n"
                       f"Target: ₹{analysis.target_1:.2f}\n"
                       f"Stop: ₹{analysis.stop_loss:.2f}\n"
                       f"Confidence: {analysis.confidence:.0%}"
            )

        except Exception as e:
            logger.error(f"Failed to execute auto trade: {e}")

    async def _monitor_trades(self):
        """Monitor all active trades"""
        async for db in get_db():
            try:
                results = await trade_monitor_service.monitor_all_active_trades(
                    db=db, user_id=1
                )

                for result in results:
                    if result.exit_recommended:
                        await self._handle_exit(db, result)

                # Update daily P&L
                self.daily_pnl = sum(r.unrealized_pnl for r in results)

            except Exception as e:
                logger.error(f"Trade monitoring failed: {e}")

    async def _handle_exit(self, db: AsyncSession, monitoring_result):
        """Handle trade exit"""
        try:
            # Get trade
            result = await db.execute(
                select(SwingTrade).where(SwingTrade.id == monitoring_result.trade_id)
            )
            trade = result.scalar_one_or_none()

            if not trade:
                return

            # Close trade
            trade.status = SwingTradeStatus.CLOSED
            trade.exit_time = datetime.now()
            trade.exit_date = datetime.now().date()
            trade.exit_price = monitoring_result.current_price
            trade.realized_pnl = monitoring_result.unrealized_pnl
            trade.exit_reason = monitoring_result.exit_reason

            await db.commit()

            pnl_str = f"+₹{monitoring_result.unrealized_pnl:.2f}" if monitoring_result.unrealized_pnl >= 0 else f"-₹{abs(monitoring_result.unrealized_pnl):.2f}"

            logger.info(f"📤 TRADE EXITED: {trade.symbol} @ {monitoring_result.current_price} | P&L: {pnl_str}")

            # Send notification
            await self._send_notification(
                level="EXIT",
                title=f"Trade Exited: {trade.symbol}",
                message=f"Exit @ ₹{monitoring_result.current_price:.2f}\n"
                       f"P&L: {pnl_str}\n"
                       f"Reason: {monitoring_result.exit_reason.value if monitoring_result.exit_reason else 'N/A'}"
            )

        except Exception as e:
            logger.error(f"Failed to handle exit: {e}")

    async def _risk_check(self):
        """Perform risk checks"""
        try:
            # Check daily loss limit
            max_daily_loss = 2000  # ₹2000 max daily loss

            if self.daily_pnl < -max_daily_loss:
                await self._send_notification(
                    level="WARNING",
                    title="⚠️ Daily Loss Limit Alert",
                    message=f"Daily P&L: ₹{self.daily_pnl:.2f}\nConsider stopping trading for today."
                )

                # Optionally disable auto trading
                # self.AUTO_TRADE_ENABLED = False

        except Exception as e:
            logger.error(f"Risk check failed: {e}")

    async def _cleanup(self):
        """Cleanup old data and logs"""
        try:
            # This would clean up old records, logs, etc.
            logger.debug("Cleanup completed")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")

    async def _send_notification(self, level: str, title: str, message: str):
        """Send notification (Telegram, Email, Push)"""
        # This would integrate with notification service
        logger.info(f"📢 [{level}] {title}: {message}")

        # TODO: Integrate with actual notification service
        # - Telegram bot
        # - Email notifications
        # - Push notifications
        # - Webhook callbacks

    def get_status(self) -> Dict:
        """Get scheduler status"""
        return {
            "running": self._running,
            "market_session": self.get_market_session().value,
            "is_market_open": self.is_market_open(),
            "auto_trade_enabled": self.AUTO_TRADE_ENABLED,
            "tracked_symbols": len(self.TRACKED_SYMBOLS),
            "daily_pnl": self.daily_pnl,
            "tasks": {
                name: {
                    "enabled": task.enabled,
                    "running": task.running,
                    "last_run": task.last_run.isoformat() if task.last_run else None,
                }
                for name, task in self.tasks.items()
            }
        }

    async def enable_auto_trading(self, enabled: bool = True):
        """Enable or disable auto trading"""
        self.AUTO_TRADE_ENABLED = enabled
        logger.info(f"Auto trading {'enabled' if enabled else 'disabled'}")

    async def add_tracked_symbol(self, symbol: str):
        """Add symbol to tracking list"""
        if symbol not in self.TRACKED_SYMBOLS:
            self.TRACKED_SYMBOLS.append(symbol)
            logger.info(f"Added {symbol} to tracking list")

    async def remove_tracked_symbol(self, symbol: str):
        """Remove symbol from tracking list"""
        if symbol in self.TRACKED_SYMBOLS:
            self.TRACKED_SYMBOLS.remove(symbol)
            logger.info(f"Removed {symbol} from tracking list")


# Singleton instance
automated_scheduler = AutomatedTradingScheduler()
