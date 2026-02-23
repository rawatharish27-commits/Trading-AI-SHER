"""
Backtesting Framework for SMC Strategies
Comprehensive historical testing and optimization for Smart Money Concept trading
"""

import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
import json
import os
from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp

from loguru import logger
from sqlalchemy import and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.market_data import OHLCV
from app.models.signal import Signal, SignalAction, SignalStatus
from app.engines.smc_engine import smc_engine, SMCSetup
from app.services.market_data_service import market_data_service


class BacktestMode(Enum):
    """Backtesting modes"""
    SINGLE_RUN = "SINGLE_RUN"
    WALK_FORWARD = "WALK_FORWARD"
    OPTIMIZATION = "OPTIMIZATION"


class TradeResult(Enum):
    """Trade outcome"""
    WIN = "WIN"
    LOSS = "LOSS"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"


@dataclass
class Trade:
    """Individual trade record"""
    symbol: str
    entry_time: datetime
    entry_price: float
    exit_time: Optional[datetime] = None
    exit_price: Optional[float] = None
    quantity: int = 1
    direction: str = "BUY"  # BUY or SELL
    stop_loss: float = 0.0
    target_price: float = 0.0
    result: TradeResult = TradeResult.ACTIVE
    pnl: float = 0.0
    pnl_percentage: float = 0.0
    holding_period: int = 0  # in minutes
    max_favorable_excursion: float = 0.0
    max_adverse_excursion: float = 0.0
    signal_quality: float = 0.0
    setup_type: str = "SMC"


@dataclass
class BacktestResult:
    """Backtesting result summary"""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    total_pnl: float = 0.0
    total_pnl_percentage: float = 0.0
    max_drawdown: float = 0.0
    max_drawdown_percentage: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    profit_factor: float = 0.0
    sharpe_ratio: float = 0.0
    expectancy: float = 0.0
    avg_holding_period: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    recovery_factor: float = 0.0
    calmar_ratio: float = 0.0
    trades: List[Trade] = field(default_factory=list)
    equity_curve: List[float] = field(default_factory=list)
    monthly_returns: Dict[str, float] = field(default_factory=dict)
    symbol_performance: Dict[str, Dict] = field(default_factory=dict)


@dataclass
class BacktestConfig:
    """Backtesting configuration"""
    symbol: str
    start_date: date
    end_date: date
    timeframe: str = "15m"
    initial_capital: float = 100000.0
    risk_per_trade: float = 0.01  # 1% risk per trade
    max_trades_per_day: int = 2
    min_quality_score: float = 0.7
    max_holding_period: int = 1440  # 1 day in minutes
    commission_per_trade: float = 0.0
    slippage: float = 0.001  # 0.1% slippage
    mode: BacktestMode = BacktestMode.SINGLE_RUN
    walk_forward_window: int = 30  # days for walk-forward
    optimization_params: Dict[str, List] = field(default_factory=dict)


class SMCBacktester:
    """
    SMC Strategy Backtester

    Features:
    - Historical data backtesting for SMC strategies
    - Walk-forward analysis for robust validation
    - Parameter optimization framework
    - Comprehensive performance metrics
    - Multi-symbol portfolio backtesting
    """

    def __init__(self, config: BacktestConfig):
        self.config = config
        self.results = BacktestResult()
        self.historical_data = {}
        self.active_trades = []
        logger.info(f"🎯 SMC Backtester initialized for {config.symbol}")

    async def run_backtest(self) -> BacktestResult:
        """
        Run the backtest based on configuration

        Returns:
            BacktestResult with comprehensive metrics
        """
        logger.info(f"🚀 Starting backtest for {self.config.symbol} from {self.config.start_date} to {self.config.end_date}")

        try:
            if self.config.mode == BacktestMode.SINGLE_RUN:
                return await self._run_single_backtest()
            elif self.config.mode == BacktestMode.WALK_FORWARD:
                return await self._run_walk_forward_analysis()
            elif self.config.mode == BacktestMode.OPTIMIZATION:
                return await self._run_parameter_optimization()
            else:
                raise ValueError(f"Unsupported backtest mode: {self.config.mode}")

        except Exception as e:
            logger.error(f"❌ Backtest failed: {e}")
            raise

    async def _run_single_backtest(self) -> BacktestResult:
        """Run a single backtest over the entire period"""
        logger.info("📊 Running single backtest...")

        # Load historical data
        data = await self._load_historical_data()
        if data.empty:
            logger.warning("No historical data available")
            return self.results

        # Run SMC analysis and simulate trading
        await self._simulate_trading(data)

        # Calculate performance metrics
        self._calculate_performance_metrics()

        logger.info(f"✅ Single backtest completed - {self.results.total_trades} trades, Win Rate: {self.results.win_rate:.1%}")
        return self.results

    async def _run_walk_forward_analysis(self) -> BacktestResult:
        """Run walk-forward analysis for robust validation"""
        logger.info("🔄 Running walk-forward analysis...")

        window_days = self.config.walk_forward_window
        current_date = self.config.start_date

        walk_forward_results = []

        while current_date < self.config.end_date:
            # Define training and testing periods
            train_end = current_date + timedelta(days=window_days)
            test_end = min(train_end + timedelta(days=window_days), self.config.end_date)

            if test_end > self.config.end_date:
                break

            logger.info(f"Walk-forward: Train {current_date} to {train_end}, Test {train_end} to {test_end}")

            # Create config for this window
            window_config = BacktestConfig(
                symbol=self.config.symbol,
                start_date=train_end,
                end_date=test_end,
                timeframe=self.config.timeframe,
                initial_capital=self.config.initial_capital,
                risk_per_trade=self.config.risk_per_trade,
                max_trades_per_day=self.config.max_trades_per_day,
                min_quality_score=self.config.min_quality_score,
                mode=BacktestMode.SINGLE_RUN
            )

            # Run backtest for testing period
            window_backtester = SMCBacktester(window_config)
            window_result = await window_backtester.run_backtest()
            walk_forward_results.append(window_result)

            current_date = test_end

        # Aggregate walk-forward results
        return self._aggregate_walk_forward_results(walk_forward_results)

    async def _run_parameter_optimization(self) -> BacktestResult:
        """Run parameter optimization to find best SMC settings"""
        logger.info("🎛️ Running parameter optimization...")

        if not self.config.optimization_params:
            # Default parameters to optimize
            self.config.optimization_params = {
                'min_quality_score': [0.6, 0.7, 0.8, 0.9],
                'risk_per_trade': [0.005, 0.01, 0.015, 0.02],
                'max_holding_period': [720, 1440, 2880]  # 12h, 1d, 2d
            }

        # Generate parameter combinations
        param_combinations = self._generate_parameter_combinations()

        logger.info(f"Testing {len(param_combinations)} parameter combinations...")

        # Run backtests for each combination (in parallel if possible)
        optimization_results = []

        for i, params in enumerate(param_combinations):
            logger.info(f"Testing combination {i+1}/{len(param_combinations)}: {params}")

            # Create config with these parameters
            opt_config = BacktestConfig(
                symbol=self.config.symbol,
                start_date=self.config.start_date,
                end_date=self.config.end_date,
                timeframe=self.config.timeframe,
                initial_capital=self.config.initial_capital,
                **params,
                mode=BacktestMode.SINGLE_RUN
            )

            # Run backtest
            opt_backtester = SMCBacktester(opt_config)
            result = await opt_backtester.run_backtest()
            result.metadata = params  # Store parameters with result

            optimization_results.append(result)

        # Find best result
        best_result = max(optimization_results, key=lambda x: x.sharpe_ratio)
        logger.info(f"✅ Optimization completed. Best Sharpe: {best_result.sharpe_ratio:.2f}")

        return best_result

    async def _load_historical_data(self) -> pd.DataFrame:
        """Load historical OHLCV data from database"""
        async with get_db_session() as session:
            try:
                # Query OHLCV data
                query = await session.execute(
                    select(OHLCV).where(
                        and_(
                            OHLCV.symbol == self.config.symbol,
                            OHLCV.interval == self.config.timeframe,
                            OHLCV.date >= self.config.start_date,
                            OHLCV.date <= self.config.end_date
                        )
                    ).order_by(OHLCV.date)
                )

                records = query.scalars().all()

                if not records:
                    logger.warning(f"No historical data found for {self.config.symbol}")
                    return pd.DataFrame()

                # Convert to DataFrame
                data = []
                for record in records:
                    data.append({
                        'timestamp': pd.Timestamp.combine(record.date, datetime.min.time()),
                        'open': record.open,
                        'high': record.high,
                        'low': record.low,
                        'close': record.close,
                        'volume': record.volume
                    })

                df = pd.DataFrame(data)
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df = df.set_index('timestamp').sort_index()

                logger.info(f"📊 Loaded {len(df)} candles for {self.config.symbol}")
                return df

            except Exception as e:
                logger.error(f"Failed to load historical data: {e}")
                return pd.DataFrame()

    async def _simulate_trading(self, data: pd.DataFrame):
        """Simulate trading based on SMC signals"""
        logger.info("🎲 Starting trade simulation...")

        # Process data in windows for SMC analysis
        window_size = 200  # Minimum candles for SMC analysis
        step_size = 50    # Move window every 50 candles

        capital = self.config.initial_capital
        equity_curve = [capital]
        daily_trades = {}

        for i in range(window_size, len(data), step_size):
            window_data = data.iloc[i-window_size:i]

            try:
                # Run SMC analysis
                setup = await smc_engine.analyze_symbol(
                    symbol=self.config.symbol,
                    ohlcv_data=window_data,
                    timeframes=['15m', '1h', '4h']
                )

                if setup and setup.quality_score >= self.config.min_quality_score:
                    # Check daily trade limit
                    current_date = window_data.index[-1].date()
                    if current_date not in daily_trades:
                        daily_trades[current_date] = 0

                    if daily_trades[current_date] >= self.config.max_trades_per_day:
                        continue

                    # Calculate position size
                    risk_amount = capital * self.config.risk_per_trade
                    stop_distance = abs(setup.entry_price - setup.stop_loss)
                    quantity = int(risk_amount / stop_distance)

                    if quantity <= 0:
                        continue

                    # Create trade
                    trade = Trade(
                        symbol=self.config.symbol,
                        entry_time=window_data.index[-1],
                        entry_price=setup.entry_price,
                        quantity=quantity,
                        direction=setup.direction,
                        stop_loss=setup.stop_loss,
                        target_price=setup.target_price,
                        signal_quality=setup.quality_score,
                        setup_type="SMC"
                    )

                    # Simulate trade execution with slippage
                    actual_entry = setup.entry_price * (1 + self.config.slippage if setup.direction == "BUY" else 1 - self.config.slippage)
                    trade.entry_price = actual_entry

                    # Add to active trades
                    self.active_trades.append(trade)
                    daily_trades[current_date] += 1

                    logger.debug(f"📈 Opened {setup.direction} trade for {self.config.symbol} @ {actual_entry}")

            except Exception as e:
                logger.error(f"Error in trade simulation: {e}")
                continue

            # Check for trade closures
            await self._check_trade_exits(data.iloc[:i+1], capital)

            # Update equity curve
            current_equity = capital + sum(trade.pnl for trade in self.results.trades if trade.result != TradeResult.ACTIVE)
            equity_curve.append(current_equity)

        # Close any remaining trades at the end
        await self._close_all_trades(data.iloc[-1]['close'], data.index[-1])

        self.results.equity_curve = equity_curve
        logger.info(f"🎲 Trade simulation completed - {len(self.results.trades)} total trades")

    async def _check_trade_exits(self, data: pd.DataFrame, current_capital: float):
        """Check if any trades should be closed"""
        current_price = data.iloc[-1]['close']
        current_time = data.index[-1]

        trades_to_close = []

        for trade in self.active_trades:
            holding_minutes = (current_time - trade.entry_time).total_seconds() / 60

            # Check stop loss
            if trade.direction == "BUY" and current_price <= trade.stop_loss:
                trade.result = TradeResult.LOSS
                trade.exit_price = trade.stop_loss
                trade.exit_time = current_time
                trades_to_close.append(trade)
                continue

            if trade.direction == "SELL" and current_price >= trade.stop_loss:
                trade.result = TradeResult.LOSS
                trade.exit_price = trade.stop_loss
                trade.exit_time = current_time
                trades_to_close.append(trade)
                continue

            # Check target
            if trade.direction == "BUY" and current_price >= trade.target_price:
                trade.result = TradeResult.WIN
                trade.exit_price = trade.target_price
                trade.exit_time = current_time
                trades_to_close.append(trade)
                continue

            if trade.direction == "SELL" and current_price <= trade.target_price:
                trade.result = TradeResult.WIN
                trade.exit_price = trade.target_price
                trade.exit_time = current_time
                trades_to_close.append(trade)
                continue

            # Check max holding period
            if holding_minutes >= self.config.max_holding_period:
                trade.result = TradeResult.EXPIRED
                trade.exit_price = current_price
                trade.exit_time = current_time
                trades_to_close.append(trade)
                continue

            # Update MFE/MAE
            price_change = current_price - trade.entry_price
            if trade.direction == "SELL":
                price_change = -price_change

            trade.max_favorable_excursion = max(trade.max_favorable_excursion, price_change)
            trade.max_adverse_excursion = min(trade.max_adverse_excursion, price_change)

        # Process closed trades
        for trade in trades_to_close:
            self._calculate_trade_pnl(trade)
            self.results.trades.append(trade)
            self.active_trades.remove(trade)

    async def _close_all_trades(self, exit_price: float, exit_time: datetime):
        """Close all remaining active trades"""
        for trade in self.active_trades:
            trade.result = TradeResult.EXPIRED
            trade.exit_price = exit_price
            trade.exit_time = exit_time
            self._calculate_trade_pnl(trade)
            self.results.trades.append(trade)

        self.active_trades.clear()

    def _calculate_trade_pnl(self, trade: Trade):
        """Calculate P&L for a closed trade"""
        if trade.exit_price is None:
            return

        # Calculate gross P&L
        if trade.direction == "BUY":
            gross_pnl = (trade.exit_price - trade.entry_price) * trade.quantity
        else:
            gross_pnl = (trade.entry_price - trade.exit_price) * trade.quantity

        # Subtract commissions
        commission = self.config.commission_per_trade * 2  # Entry and exit
        trade.pnl = gross_pnl - commission

        # Calculate percentage return
        risk_amount = abs(trade.entry_price - trade.stop_loss) * trade.quantity
        if risk_amount > 0:
            trade.pnl_percentage = (trade.pnl / risk_amount) * 100

        # Calculate holding period
        if trade.exit_time and trade.entry_time:
            trade.holding_period = int((trade.exit_time - trade.entry_time).total_seconds() / 60)

    def _calculate_performance_metrics(self):
        """Calculate comprehensive performance metrics"""
        trades = self.results.trades

        if not trades:
            return

        # Basic counts
        self.results.total_trades = len(trades)
        self.results.winning_trades = len([t for t in trades if t.result == TradeResult.WIN])
        self.results.losing_trades = len([t for t in trades if t.result == TradeResult.LOSS])

        # Win rate
        if self.results.total_trades > 0:
            self.results.win_rate = self.results.winning_trades / self.results.total_trades

        # P&L calculations
        winning_trades = [t for t in trades if t.result == TradeResult.WIN]
        losing_trades = [t for t in trades if t.result == TradeResult.LOSS]

        if winning_trades:
            self.results.avg_win = np.mean([t.pnl for t in winning_trades])
            self.results.largest_win = max([t.pnl for t in winning_trades])

        if losing_trades:
            self.results.avg_loss = np.mean([t.pnl for t in losing_trades])
            self.results.largest_loss = min([t.pnl for t in losing_trades])

        # Total P&L
        self.results.total_pnl = sum([t.pnl for t in trades])
        self.results.total_pnl_percentage = (self.results.total_pnl / self.config.initial_capital) * 100

        # Profit factor
        total_wins = sum([t.pnl for t in winning_trades])
        total_losses = abs(sum([t.pnl for t in losing_trades]))

        if total_losses > 0:
            self.results.profit_factor = total_wins / total_losses

        # Expectancy
        if self.results.total_trades > 0:
            self.results.expectancy = self.results.total_pnl / self.results.total_trades

        # Average holding period
        completed_trades = [t for t in trades if t.holding_period > 0]
        if completed_trades:
            self.results.avg_holding_period = np.mean([t.holding_period for t in completed_trades])

        # Drawdown calculations
        self._calculate_drawdown_metrics()

        # Sharpe ratio (simplified - assuming daily returns)
        self._calculate_sharpe_ratio()

        # Monthly returns
        self._calculate_monthly_returns()

        # Symbol performance
        self._calculate_symbol_performance()

    def _calculate_drawdown_metrics(self):
        """Calculate maximum drawdown"""
        equity_curve = self.results.equity_curve

        if len(equity_curve) < 2:
            return

        peak = equity_curve[0]
        max_drawdown = 0
        max_drawdown_pct = 0

        for equity in equity_curve:
            if equity > peak:
                peak = equity

            drawdown = peak - equity
            drawdown_pct = (drawdown / peak) * 100 if peak > 0 else 0

            max_drawdown = max(max_drawdown, drawdown)
            max_drawdown_pct = max(max_drawdown_pct, drawdown_pct)

        self.results.max_drawdown = max_drawdown
        self.results.max_drawdown_percentage = max_drawdown_pct

        # Recovery factor
        if max_drawdown > 0:
            self.results.recovery_factor = self.results.total_pnl / max_drawdown

        # Calmar ratio (annualized return / max drawdown)
        if max_drawdown_pct > 0:
            # Simplified: assume the backtest period represents 1 year
            self.results.calmar_ratio = (self.results.total_pnl_percentage / 100) / (max_drawdown_pct / 100)

    def _calculate_sharpe_ratio(self):
        """Calculate Sharpe ratio (simplified)"""
        if len(self.results.equity_curve) < 2:
            return

        # Calculate daily returns
        equity = np.array(self.results.equity_curve)
        returns = np.diff(equity) / equity[:-1]

        if len(returns) == 0 or np.std(returns) == 0:
            self.results.sharpe_ratio = 0
            return

        # Assume risk-free rate of 0 for simplicity
        avg_return = np.mean(returns)
        std_return = np.std(returns)

        self.results.sharpe_ratio = avg_return / std_return * np.sqrt(252)  # Annualized

    def _calculate_monthly_returns(self):
        """Calculate monthly returns"""
        # Group trades by month
        monthly_pnl = {}

        for trade in self.results.trades:
            if trade.exit_time:
                month_key = trade.exit_time.strftime("%Y-%m")
                if month_key not in monthly_pnl:
                    monthly_pnl[month_key] = 0
                monthly_pnl[month_key] += trade.pnl

        # Convert to percentage returns
        for month, pnl in monthly_pnl.items():
            self.results.monthly_returns[month] = (pnl / self.config.initial_capital) * 100

    def _calculate_symbol_performance(self):
        """Calculate performance by symbol"""
        symbol_trades = {}

        for trade in self.results.trades:
            if trade.symbol not in symbol_trades:
                symbol_trades[trade.symbol] = []
            symbol_trades[trade.symbol].append(trade)

        for symbol, trades in symbol_trades.items():
            wins = len([t for t in trades if t.result == TradeResult.WIN])
            total = len(trades)
            pnl = sum([t.pnl for t in trades])

            self.results.symbol_performance[symbol] = {
                'total_trades': total,
                'win_rate': wins / total if total > 0 else 0,
                'total_pnl': pnl,
                'avg_pnl': pnl / total if total > 0 else 0
            }

    def _aggregate_walk_forward_results(self, results: List[BacktestResult]) -> BacktestResult:
        """Aggregate multiple backtest results from walk-forward analysis"""
        if not results:
            return BacktestResult()

        aggregated = BacktestResult()

        # Sum up all trades
        all_trades = []
        for result in results:
            all_trades.extend(result.trades)

        aggregated.trades = all_trades
        aggregated.total_trades = len(all_trades)

        # Recalculate metrics
        self.results = aggregated
        self._calculate_performance_metrics()

        return aggregated

    def _generate_parameter_combinations(self) -> List[Dict]:
        """Generate all combinations of optimization parameters"""
        import itertools

        keys = list(self.config.optimization_params.keys())
        values = list(self.config.optimization_params.values())

        combinations = itertools.product(*values)

        return [dict(zip(keys, combo)) for combo in combinations]

    async def save_results(self, filename: str):
        """Save backtest results to file"""
        try:
            result_dict = {
                'config': {
                    'symbol': self.config.symbol,
                    'start_date': self.config.start_date.isoformat(),
                    'end_date': self.config.end_date.isoformat(),
                    'timeframe': self.config.timeframe,
                    'initial_capital': self.config.initial_capital,
                    'risk_per_trade': self.config.risk_per_trade,
                    'mode': self.config.mode.value
                },
                'metrics': {
                    'total_trades': self.results.total_trades,
                    'win_rate': self.results.win_rate,
                    'total_pnl': self.results.total_pnl,
                    'total_pnl_percentage': self.results.total_pnl_percentage,
                    'max_drawdown': self.results.max_drawdown,
                    'max_drawdown_percentage': self.results.max_drawdown_percentage,
                    'sharpe_ratio': self.results.sharpe_ratio,
                    'profit_factor': self.results.profit_factor,
                    'expectancy': self.results.expectancy
                },
                'trades': [
                    {
                        'symbol': t.symbol,
                        'entry_time': t.entry_time.isoformat(),
                        'entry_price': t.entry_price,
                        'exit_time': t.exit_time.isoformat() if t.exit_time else None,
                        'exit_price': t.exit_price,
                        'direction': t.direction,
                        'pnl': t.pnl,
                        'result': t.result.value,
                        'signal_quality': t.signal_quality
                    } for t in self.results.trades
                ]
            }

            # Ensure directory exists
            os.makedirs(os.path.dirname(filename), exist_ok=True)

            with open(filename, 'w') as f:
                json.dump(result_dict, f, indent=2)

            logger.info(f"💾 Results saved to {filename}")

        except Exception as e:
            logger.error(f"Failed to save results: {e}")

    @staticmethod
    def load_results(filename: str) -> Optional[BacktestResult]:
        """Load backtest results from file"""
        try:
            with open(filename, 'r') as f:
                data = json.load(f)

            result = BacktestResult()
            result.total_trades = data['metrics']['total_trades']
            result.win_rate = data['metrics']['win_rate']
            result.total_pnl = data['metrics']['total_pnl']
            result.total_pnl_percentage = data['metrics']['total_pnl_percentage']
            result.max_drawdown = data['metrics']['max_drawdown']
            result.max_drawdown_percentage = data['metrics']['max_drawdown_percentage']
            result.sharpe_ratio = data['metrics']['sharpe_ratio']
            result.profit_factor = data['metrics']['profit_factor']
            result.expectancy = data['metrics']['expectancy']

            # Load trades
            for trade_data in data['trades']:
                trade = Trade(
                    symbol=trade_data['symbol'],
                    entry_time=datetime.fromisoformat(trade_data['entry_time']),
                    entry_price=trade_data['entry_price'],
                    exit_time=datetime.fromisoformat(trade_data['exit_time']) if trade_data['exit_time'] else None,
                    exit_price=trade_data['exit_price'],
                    direction=trade_data['direction'],
                    pnl=trade_data['pnl'],
                    result=TradeResult(trade_data['result']),
                    signal_quality=trade_data['signal_quality']
                )
                result.trades.append(trade)

            return result

        except Exception as e:
            logger.error(f"Failed to load results: {e}")
            return None


# Utility functions for backtesting

async def run_smc_backtest(symbol: str, start_date: date, end_date: date,
                          initial_capital: float = 100000.0) -> BacktestResult:
    """
    Convenience function to run SMC backtest with default settings

    Args:
        symbol: Trading symbol
        start_date: Backtest start date
        end_date: Backtest end date
        initial_capital: Starting capital

    Returns:
        BacktestResult with performance metrics
    """
    config = BacktestConfig(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        initial_capital=initial_capital
    )

    backtester = SMCBacktester(config)
    return await backtester.run_backtest()


async def run_walk_forward_backtest(symbol: str, start_date: date, end_date: date,
                                   window_days: int = 30) -> BacktestResult:
    """
    Run walk-forward analysis for SMC strategy

    Args:
        symbol: Trading symbol
        start_date: Analysis start date
        end_date: Analysis end date
        window_days: Walk-forward window size in days

    Returns:
        Aggregated backtest results
    """
    config = BacktestConfig(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        mode=BacktestMode.WALK_FORWARD,
        walk_forward_window=window_days
    )

    backtester = SMCBacktester(config)
    return await backtester.run_backtest()


async def optimize_smc_parameters(symbol: str, start_date: date, end_date: date,
                                 optimization_params: Dict[str, List]) -> BacktestResult:
    """
    Optimize SMC strategy parameters

    Args:
        symbol: Trading symbol
        start_date: Optimization period start
        end_date: Optimization period end
        optimization_params: Parameters to optimize

    Returns:
        Best parameter combination results
    """
    config = BacktestConfig(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        mode=BacktestMode.OPTIMIZATION,
        optimization_params=optimization_params
    )

    backtester = SMCBacktester(config)
    return await backtester.run_backtest()


# Example usage and testing functions

async def example_backtest():
    """Example backtest execution"""
    logger.info("🎯 Running SMC Backtest Example")

    # Run backtest for RELIANCE
    start_date = date(2024, 1, 1)
    end_date = date(2024, 3, 31)

    result = await run_smc_backtest("RELIANCE", start_date, end_date)

    logger.info("📊 Backtest Results:")
    logger.info(f"Total Trades: {result.total_trades}")
    logger.info(f"Win Rate: {result.win_rate:.1%}")
    logger.info(f"Total P&L: ₹{result.total_pnl:,.0f}")
    logger.info(f"Max Drawdown: {result.max_drawdown_percentage:.1f}%")
    logger.info(f"Sharpe Ratio: {result.sharpe_ratio:.2f}")

    return result


if __name__ == "__main__":
    # Run example when executed directly
    asyncio.run(example_backtest())
