"""
Signal Endpoints - SMC Based
Smart Money Concept signal generation and management
"""

from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import User, Signal, SignalAction, SignalStatus
from app.schemas.signal import (
    SignalCreate, SignalResponse, SignalListResponse,
    SMCSignalGenerateRequest, SMCSignalGenerateResponse, SMCSignalResponse,
    SignalFilter, SignalStatsResponse, SMCAnalyticsResponse,
    SMCPerformanceMetrics, SMCSetupPerformance
)
from app.services.signal_service_smc import signal_service_smc
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


# ==================== SMC SIGNAL GENERATION ====================

@router.post("/generate", response_model=SMCSignalGenerateResponse)
async def generate_smc_signal(
    request: SMCSignalGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate SMC-based trading signal

    This endpoint:
    1. Fetches real market data from Angel One API
    2. Runs SMC analysis (Market Structure, Liquidity, Order Blocks, FVG)
    3. Performs multi-timeframe confirmation
    4. Returns rule-based SMC signal with quality score

    Parameters:
    - symbol: Trading symbol (e.g., "RELIANCE", "TCS")
    - exchange: Exchange (NSE, BSE, MCX)
    - ltf_timeframe: Lower timeframe for entry (5m, 15m)
    - htf_timeframe: Higher timeframe for bias (1h, 4h)
    """
    try:
        result = await signal_service_smc.generate_signal(
            symbol=request.symbol,
            exchange=request.exchange,
            ltf_timeframe=request.ltf_timeframe,
            htf_timeframe=request.htf_timeframe
        )

        # Convert to response format
        if result.get("action") == "HOLD":
            return SMCSignalGenerateResponse(
                signal=None,
                message=result.get("reason", "No valid SMC setup found"),
                trace_id=result.get("trace_id", "")
            )

        # Convert internal format to schema
        signal_data = {
            "symbol": result["symbol"],
            "exchange": result["exchange"],
            "trace_id": result["trace_id"],
            "action": result["action"],
            "direction": result["direction"],
            "quality_score": result["quality_score"],
            "confidence": result["confidence"],
            "risk_level": result["risk_level"],
            "approved": result["approved"],
            "market_structure": result["market_structure"],
            "liquidity_sweep": result.get("liquidity_sweep"),
            "order_block": result.get("order_block"),
            "fvg": result.get("fvg"),
            "mtf_confirmation": result["mtf_confirmation"],
            "entry_price": result["entry_price"],
            "stop_loss": result["stop_loss"],
            "target_price": result["target_price"],
            "risk_reward_ratio": result["risk_reward_ratio"],
            "risk_amount": result["risk_amount"],
            "reward_amount": result["reward_amount"],
            "signal_time": result["signal_time"],
            "setup_timestamp": result["setup_timestamp"],
            "risk_reasons": result["risk_reasons"]
        }

        return SMCSignalGenerateResponse(
            signal=SMCSignalResponse(**signal_data),
            message="SMC signal generated successfully",
            trace_id=result["trace_id"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMC signal generation failed: {str(e)}"
        )


# ==================== SMC SIGNAL MANAGEMENT ====================

@router.post("/save", response_model=SignalResponse)
async def save_smc_signal(
    smc_signal: SMCSignalResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save SMC signal to database for tracking and execution

    Converts SMC signal format to standard Signal model
    """
    try:
        # Convert SMC signal to standard Signal format
        signal = Signal(
            user_id=current_user.id,
            trace_id=smc_signal.trace_id,
            symbol=smc_signal.symbol,
            exchange=smc_signal.exchange,
            action=SignalAction(smc_signal.action),
            direction=smc_signal.direction,
            status=SignalStatus.ACTIVE if smc_signal.approved else SignalStatus.PENDING,
            probability=smc_signal.quality_score,  # Map quality score to probability
            confidence=smc_signal.quality_score,
            entry_price=smc_signal.entry_price,
            stop_loss=smc_signal.stop_loss,
            target_1=smc_signal.target_price,
            target_2=smc_signal.target_price * 1.5,  # Conservative target
            strategy="SMC",
            reasoning=f"SMC Setup - {smc_signal.confidence} confidence",
            signal_time=smc_signal.signal_time,
            quantity=None,  # Will be calculated based on risk
            allocated_capital=None
        )

        db.add(signal)
        await db.commit()
        await db.refresh(signal)

        return signal

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save SMC signal: {str(e)}"
        )


@router.get("/", response_model=SignalListResponse)
async def get_smc_signals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's SMC signals with pagination and filtering"""
    query = select(Signal).where(
        and_(
            Signal.user_id == current_user.id,
            Signal.strategy == "SMC"  # Filter for SMC signals only
        )
    )

    if symbol:
        query = query.where(Signal.symbol == symbol)
    if status:
        query = query.where(Signal.status == status)

    # Count total
    count_query = select(Signal.id).where(
        and_(
            Signal.user_id == current_user.id,
            Signal.strategy == "SMC"
        )
    )
    total_result = await db.execute(count_query)
    total = len(total_result.all())

    # Paginate
    query = query.order_by(desc(Signal.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    signals = result.scalars().all()

    return SignalListResponse(
        signals=list(signals),
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total
    )


@router.get("/stats", response_model=SignalStatsResponse)
async def get_smc_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get SMC signal statistics"""
    # Get all SMC signals for user
    result = await db.execute(
        select(Signal).where(
            and_(
                Signal.user_id == current_user.id,
                Signal.strategy == "SMC"
            )
        )
    )
    signals = result.scalars().all()

    if not signals:
        return SignalStatsResponse(
            total=0,
            active=0,
            hit_target=0,
            stopped_out=0,
            expired=0,
            win_rate=0.0,
            avg_probability=0.0,
            avg_confidence=0.0,
            by_strategy={"SMC": 0},
            by_symbol={}
        )

    # Calculate stats
    total = len(signals)
    active = sum(1 for s in signals if s.status == SignalStatus.ACTIVE)
    hit_target = sum(1 for s in signals if s.status == SignalStatus.HIT_TARGET)
    stopped_out = sum(1 for s in signals if s.status == SignalStatus.STOPPED_OUT)
    expired = sum(1 for s in signals if s.status == SignalStatus.EXPIRED)

    win_rate = (hit_target / total) if total > 0 else 0.0
    avg_probability = sum(s.probability for s in signals) / total
    avg_confidence = sum(s.confidence for s in signals) / total

    # Group by strategy (should all be SMC)
    by_strategy = {"SMC": total}

    # Group by symbol
    by_symbol = {}
    for signal in signals:
        by_symbol[signal.symbol] = by_symbol.get(signal.symbol, 0) + 1

    return SignalStatsResponse(
        total=total,
        active=active,
        hit_target=hit_target,
        stopped_out=stopped_out,
        expired=expired,
        win_rate=round(win_rate, 3),
        avg_probability=round(avg_probability, 3),
        avg_confidence=round(avg_confidence, 3),
        by_strategy=by_strategy,
        by_symbol=by_symbol
    )


@router.get("/analytics", response_model=SMCAnalyticsResponse)
async def get_smc_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive SMC analytics and performance metrics"""
    try:
        # Get all SMC signals for user
        result = await db.execute(
            select(Signal).where(
                and_(
                    Signal.user_id == current_user.id,
                    Signal.strategy == "SMC"
                )
            )
        )
        signals = result.scalars().all()

        if not signals:
            # Return empty analytics
            return SMCAnalyticsResponse(
                performance_metrics=SMCPerformanceMetrics(
                    total_signals=0,
                    active_signals=0,
                    completed_signals=0,
                    win_rate=0.0,
                    avg_win_rate=0.0,
                    avg_loss_rate=0.0,
                    profit_factor=0.0,
                    avg_rr_ratio=0.0,
                    avg_holding_period_days=0.0,
                    best_setup_type="N/A",
                    worst_setup_type="N/A"
                ),
                setup_performance=[],
                timeframe_performance={},
                symbol_performance={},
                monthly_performance={}
            )

        # Calculate performance metrics
        total_signals = len(signals)
        active_signals = sum(1 for s in signals if s.status == SignalStatus.ACTIVE)
        completed_signals = total_signals - active_signals

        winning_signals = [s for s in signals if s.status == SignalStatus.HIT_TARGET]
        losing_signals = [s for s in signals if s.status == SignalStatus.STOPPED_OUT]

        win_count = len(winning_signals)
        loss_count = len(losing_signals)
        win_rate = (win_count / completed_signals) if completed_signals > 0 else 0.0

        # Calculate average win/loss rates
        avg_win_rate = sum(s.realized_pnl for s in winning_signals if s.realized_pnl) / win_count if win_count > 0 else 0.0
        avg_loss_rate = sum(abs(s.realized_pnl) for s in losing_signals if s.realized_pnl) / loss_count if loss_count > 0 else 0.0

        # Profit factor
        total_wins = sum(s.realized_pnl for s in winning_signals if s.realized_pnl)
        total_losses = sum(abs(s.realized_pnl) for s in losing_signals if s.realized_pnl)
        profit_factor = total_wins / total_losses if total_losses > 0 else float('inf')

        # Average RR ratio
        rr_ratios = [s.risk_reward_ratio for s in signals if s.risk_reward_ratio]
        avg_rr_ratio = sum(rr_ratios) / len(rr_ratios) if rr_ratios else 0.0

        # Average holding period
        holding_periods = [s.holding_period_days for s in signals if s.holding_period_days]
        avg_holding_period = sum(holding_periods) / len(holding_periods) if holding_periods else 0.0

        # Setup performance analysis
        setup_performance = []
        setup_types = {}

        for signal in signals:
            setup_type = signal.market_structure or "UNKNOWN"
            if setup_type not in setup_types:
                setup_types[setup_type] = []
            setup_types[setup_type].append(signal)

        for setup_type, signals_list in setup_types.items():
            setup_wins = sum(1 for s in signals_list if s.status == SignalStatus.HIT_TARGET)
            setup_losses = sum(1 for s in signals_list if s.status == SignalStatus.STOPPED_OUT)
            setup_win_rate = setup_wins / len(signals_list) if signals_list else 0.0

            setup_pnls = [s.realized_pnl for s in signals_list if s.realized_pnl]
            avg_pnl = sum(setup_pnls) / len(setup_pnls) if setup_pnls else 0.0

            setup_rrs = [s.risk_reward_ratio for s in signals_list if s.risk_reward_ratio]
            avg_rr = sum(setup_rrs) / len(setup_rrs) if setup_rrs else 0.0

            setup_holdings = [s.holding_period_days for s in signals_list if s.holding_period_days]
            avg_holding = sum(setup_holdings) / len(setup_holdings) if setup_holdings else 0.0

            setup_performance.append(SMCSetupPerformance(
                setup_type=setup_type,
                total_signals=len(signals_list),
                win_count=setup_wins,
                loss_count=setup_losses,
                win_rate=round(setup_win_rate, 3),
                avg_pnl=round(avg_pnl, 2),
                avg_rr_ratio=round(avg_rr, 2),
                avg_holding_period=round(avg_holding, 1)
            ))

        # Find best and worst setup types
        if setup_performance:
            best_setup = max(setup_performance, key=lambda x: x.win_rate)
            worst_setup = min(setup_performance, key=lambda x: x.win_rate)
            best_setup_type = best_setup.setup_type
            worst_setup_type = worst_setup.setup_type
        else:
            best_setup_type = "N/A"
            worst_setup_type = "N/A"

        # Timeframe performance (simplified - based on setup_version or other logic)
        timeframe_performance = {}
        for signal in signals:
            tf = signal.setup_version or "1.0"
            if tf not in timeframe_performance:
                timeframe_performance[tf] = []
            if signal.status in [SignalStatus.HIT_TARGET, SignalStatus.STOPPED_OUT]:
                timeframe_performance[tf].append(1 if signal.status == SignalStatus.HIT_TARGET else 0)

        for tf, results in timeframe_performance.items():
            timeframe_performance[tf] = sum(results) / len(results) if results else 0.0

        # Symbol performance
        symbol_performance = {}
        for signal in signals:
            if signal.symbol not in symbol_performance:
                symbol_performance[signal.symbol] = []
            if signal.status in [SignalStatus.HIT_TARGET, SignalStatus.STOPPED_OUT]:
                symbol_performance[signal.symbol].append(1 if signal.status == SignalStatus.HIT_TARGET else 0)

        for symbol, results in symbol_performance.items():
            symbol_performance[symbol] = sum(results) / len(results) if results else 0.0

        # Monthly performance
        monthly_performance = {}
        for signal in signals:
            if signal.created_at:
                month_key = signal.created_at.strftime("%Y-%m")
                if month_key not in monthly_performance:
                    monthly_performance[month_key] = {"total": 0, "wins": 0, "losses": 0, "pnl": 0.0}

                monthly_performance[month_key]["total"] += 1
                if signal.status == SignalStatus.HIT_TARGET:
                    monthly_performance[month_key]["wins"] += 1
                    if signal.realized_pnl:
                        monthly_performance[month_key]["pnl"] += signal.realized_pnl
                elif signal.status == SignalStatus.STOPPED_OUT:
                    monthly_performance[month_key]["losses"] += 1
                    if signal.realized_pnl:
                        monthly_performance[month_key]["pnl"] += signal.realized_pnl

        # Convert to required format
        monthly_formatted = {}
        for month, data in monthly_performance.items():
            total = data["total"]
            win_rate = data["wins"] / total if total > 0 else 0.0
            monthly_formatted[month] = {
                "win_rate": round(win_rate, 3),
                "total_signals": total,
                "pnl": round(data["pnl"], 2)
            }

        return SMCAnalyticsResponse(
            performance_metrics=SMCPerformanceMetrics(
                total_signals=total_signals,
                active_signals=active_signals,
                completed_signals=completed_signals,
                win_rate=round(win_rate, 3),
                avg_win_rate=round(avg_win_rate, 2),
                avg_loss_rate=round(avg_loss_rate, 2),
                profit_factor=round(profit_factor, 2),
                avg_rr_ratio=round(avg_rr_ratio, 2),
                avg_holding_period_days=round(avg_holding_period, 1),
                best_setup_type=best_setup_type,
                worst_setup_type=worst_setup_type
            ),
            setup_performance=setup_performance,
            timeframe_performance=timeframe_performance,
            symbol_performance=symbol_performance,
            monthly_performance=monthly_formatted
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMC analytics generation failed: {str(e)}"
        )


@router.get("/metrics")
async def get_smc_metrics():
    """Get SMC engine performance metrics"""
    return await signal_service_smc.get_smc_metrics()


# ==================== HELPER ENDPOINTS ====================

@router.get("/health")
async def smc_health_check():
    """Health check for SMC components"""
    return {
        "status": "healthy",
        "engine": "SMC",
        "components": [
            "Market Structure Detection",
            "Liquidity Detection",
            "Order Block Detection",
            "Fair Value Gap Detection",
            "Multi-Timeframe Confirmation",
            "Risk Management"
        ],
        "logic_type": "Rule-Based Price Action",
        "ml_usage": "None"
    }


