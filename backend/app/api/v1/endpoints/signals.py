"""
Signal Endpoints
AI signal generation and management
"""

from datetime import datetime
from typing import Annotated, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import Signal, SignalAction, SignalStatus
from app.engines import probability_engine, strategy_ensemble, MarketRegime
from app.api.v1.endpoints.auth import get_admin_user

router = APIRouter()


# ==================== ENDPOINTS ====================

@router.get("")
async def get_signals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    min_probability: Optional[float] = None,
    max_probability: Optional[float] = None,
    risk_level: Optional[str] = None,
    strategy: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get signals with pagination and filtering"""
    query = select(Signal)
    
    if symbol:
        query = query.where(Signal.symbol == symbol)
    if action:
        query = query.where(Signal.action == action)
    if status:
        query = query.where(Signal.status == status)
    if min_probability:
        query = query.where(Signal.probability >= min_probability)
    if max_probability:
        query = query.where(Signal.probability <= max_probability)
    if risk_level:
        query = query.where(Signal.risk_level == risk_level)
    if strategy:
        query = query.where(Signal.strategy == strategy)
    
    # Count total
    count_query = select(func.count(Signal.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Paginate
    query = query.order_by(desc(Signal.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    signals = result.scalars().all()
    
    return {
        "signals": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "trace_id": s.trace_id,
                "symbol": s.symbol,
                "exchange": s.exchange,
                "action": s.action.value if s.action else "HOLD",
                "direction": s.direction,
                "status": s.status.value if s.status else "PENDING",
                "probability": s.probability,
                "confidence": s.confidence,
                "confidence_level": s.confidence_level,
                "risk_level": s.risk_level,
                "risk_warning": s.risk_warning,
                "entry_price": s.entry_price,
                "stop_loss": s.stop_loss,
                "target_1": s.target_1,
                "target_2": s.target_2,
                "target_3": s.target_3,
                "market_regime": s.market_regime,
                "strategy": s.strategy,
                "evidence_count": s.evidence_count,
                "reasoning": s.reasoning,
                "quantity": s.quantity,
                "allocated_capital": s.allocated_capital,
                "signal_time": s.signal_time.isoformat() if s.signal_time else None,
                "expiry_time": s.expiry_time.isoformat() if s.expiry_time else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in signals
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (page * page_size) < total,
    }


@router.get("/active")
async def get_active_signals(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all active signals"""
    result = await db.execute(
        select(Signal)
        .where(Signal.status == SignalStatus.ACTIVE)
        .order_by(desc(Signal.created_at))
        .limit(50)
    )
    signals = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "trace_id": s.trace_id,
            "symbol": s.symbol,
            "exchange": s.exchange,
            "action": s.action.value if s.action else "HOLD",
            "direction": s.direction,
            "status": s.status.value if s.status else "PENDING",
            "probability": s.probability,
            "confidence": s.confidence,
            "confidence_level": s.confidence_level,
            "risk_level": s.risk_level,
            "risk_warning": s.risk_warning,
            "entry_price": s.entry_price,
            "stop_loss": s.stop_loss,
            "target_1": s.target_1,
            "target_2": s.target_2,
            "target_3": s.target_3,
            "market_regime": s.market_regime,
            "strategy": s.strategy,
            "evidence_count": s.evidence_count,
            "reasoning": s.reasoning,
            "quantity": s.quantity,
            "allocated_capital": s.allocated_capital,
            "signal_time": s.signal_time.isoformat() if s.signal_time else None,
            "expiry_time": s.expiry_time.isoformat() if s.expiry_time else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in signals
    ]


@router.get("/stats")
async def get_signal_stats(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get signal statistics"""
    # Total signals
    total_result = await db.execute(select(func.count(Signal.id)))
    total = total_result.scalar() or 0
    
    # Active signals
    active_result = await db.execute(
        select(func.count(Signal.id)).where(Signal.status == SignalStatus.ACTIVE)
    )
    active = active_result.scalar() or 0
    
    # Hit target
    hit_target_result = await db.execute(
        select(func.count(Signal.id)).where(Signal.status == SignalStatus.HIT_TARGET)
    )
    hit_target = hit_target_result.scalar() or 0
    
    # Stopped out
    stopped_out_result = await db.execute(
        select(func.count(Signal.id)).where(Signal.status == SignalStatus.STOPPED_OUT)
    )
    stopped_out = stopped_out_result.scalar() or 0
    
    # Expired
    expired_result = await db.execute(
        select(func.count(Signal.id)).where(Signal.status == SignalStatus.EXPIRED)
    )
    expired = expired_result.scalar() or 0
    
    # Win rate
    win_rate = (hit_target / (hit_target + stopped_out) * 100) if (hit_target + stopped_out) > 0 else 0
    
    # Average probability
    avg_prob_result = await db.execute(
        select(func.avg(Signal.probability))
    )
    avg_probability = avg_prob_result.scalar() or 0
    
    # Average confidence
    avg_conf_result = await db.execute(
        select(func.avg(Signal.confidence))
    )
    avg_confidence = avg_conf_result.scalar() or 0
    
    # By strategy
    strategy_result = await db.execute(
        select(Signal.strategy, func.count(Signal.id))
        .group_by(Signal.strategy)
    )
    by_strategy = {row[0] or "unknown": row[1] for row in strategy_result.all()}
    
    # By symbol
    symbol_result = await db.execute(
        select(Signal.symbol, func.count(Signal.id))
        .group_by(Signal.symbol)
    )
    by_symbol = {row[0]: row[1] for row in symbol_result.all()}
    
    return {
        "total": total,
        "active": active,
        "hit_target": hit_target,
        "stopped_out": stopped_out,
        "expired": expired,
        "win_rate": win_rate,
        "avg_probability": avg_probability,
        "avg_confidence": avg_confidence,
        "by_strategy": by_strategy,
        "by_symbol": by_symbol,
    }


@router.post("/generate")
async def generate_signal(
    symbol: str,
    exchange: str = "NSE",
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate AI signal for a symbol
    
    This endpoint:
    1. Fetches market data for the symbol
    2. Runs probability engine analysis
    3. Executes strategy ensemble
    4. Returns signal with probability and targets
    """
    # Placeholder market data (in production, fetch from broker)
    market_data = {
        'ltp': 1850.0,
        'vwap': 1845.0,
        'volume': 1000000,
        'avg_volume': 800000,
        'rsi': 45,
        'momentum': 0.02,
        'price_change': 0.015,
    }
    
    # Strategy features
    features = probability_engine.StrategyFeatures(
        trend_score=0.7,
        volume_score=0.65,
        structure_score=0.6,
        smart_money_score=0.55,
        order_flow_score=0.5,
    )
    
    # Run probability engine
    prob_result = probability_engine.calculate(
        features=features,
        regime='CHOPPY',
        symbol=symbol
    )
    
    # Run strategy ensemble
    ensemble_result = strategy_ensemble.evaluate(
        market_data=market_data,
        regime=MarketRegime.CHOPPY
    )
    
    # Determine action
    action = SignalAction.BUY if ensemble_result.recommended_action == "BUY" else \
             SignalAction.SELL if ensemble_result.recommended_action == "SELL" else \
             SignalAction.HOLD
    
    # Calculate targets
    ltp = market_data['ltp']
    if action == SignalAction.BUY:
        entry = ltp
        stop_loss = ltp * 0.98  # 2% below
        target_1 = ltp * 1.02
        target_2 = ltp * 1.04
        target_3 = ltp * 1.06
    elif action == SignalAction.SELL:
        entry = ltp
        stop_loss = ltp * 1.02  # 2% above
        target_1 = ltp * 0.98
        target_2 = ltp * 0.96
        target_3 = ltp * 0.94
    else:
        entry = ltp
        stop_loss = ltp
        target_1 = ltp
        target_2 = ltp
        target_3 = None
    
    # Create signal record
    signal = Signal(
        user_id=1,  # Admin user
        trace_id=str(uuid.uuid4()),
        symbol=symbol,
        exchange=exchange,
        action=action,
        direction=ensemble_result.direction.value,
        probability=prob_result.final_probability,
        confidence=ensemble_result.probability,
        status=SignalStatus.ACTIVE,
        entry_price=entry,
        stop_loss=stop_loss,
        target_1=target_1,
        target_2=target_2,
        target_3=target_3,
        strategy=ensemble_result.consensus,
        market_regime='CHOPPY',
        evidence_count=prob_result.evidence_count,
        reasoning=prob_result.reason,
        signal_time=datetime.utcnow(),
    )
    
    db.add(signal)
    await db.commit()
    await db.refresh(signal)
    
    return {
        "id": signal.id,
        "user_id": signal.user_id,
        "trace_id": signal.trace_id,
        "symbol": signal.symbol,
        "exchange": signal.exchange,
        "action": signal.action.value,
        "direction": signal.direction,
        "status": signal.status.value,
        "probability": signal.probability,
        "confidence": signal.confidence,
        "confidence_level": signal.confidence_level,
        "risk_level": signal.risk_level,
        "risk_warning": signal.risk_warning,
        "entry_price": signal.entry_price,
        "stop_loss": signal.stop_loss,
        "target_1": signal.target_1,
        "target_2": signal.target_2,
        "target_3": signal.target_3,
        "market_regime": signal.market_regime,
        "strategy": signal.strategy,
        "evidence_count": signal.evidence_count,
        "reasoning": signal.reasoning,
        "quantity": signal.quantity,
        "allocated_capital": signal.allocated_capital,
        "signal_time": signal.signal_time.isoformat() if signal.signal_time else None,
        "expiry_time": signal.expiry_time.isoformat() if signal.expiry_time else None,
        "created_at": signal.created_at.isoformat() if signal.created_at else None,
        "updated_at": signal.updated_at.isoformat() if signal.updated_at else None,
    }


@router.get("/{signal_id}")
async def get_signal(
    signal_id: int,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific signal by ID"""
    result = await db.execute(
        select(Signal).where(Signal.id == signal_id)
    )
    signal = result.scalar_one_or_none()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    return {
        "id": signal.id,
        "user_id": signal.user_id,
        "trace_id": signal.trace_id,
        "symbol": signal.symbol,
        "exchange": signal.exchange,
        "action": signal.action.value if signal.action else "HOLD",
        "direction": signal.direction,
        "status": signal.status.value if signal.status else "PENDING",
        "probability": signal.probability,
        "confidence": signal.confidence,
        "confidence_level": signal.confidence_level,
        "risk_level": signal.risk_level,
        "risk_warning": signal.risk_warning,
        "entry_price": signal.entry_price,
        "stop_loss": signal.stop_loss,
        "target_1": signal.target_1,
        "target_2": signal.target_2,
        "target_3": signal.target_3,
        "market_regime": signal.market_regime,
        "strategy": signal.strategy,
        "evidence_count": signal.evidence_count,
        "reasoning": signal.reasoning,
        "quantity": signal.quantity,
        "allocated_capital": signal.allocated_capital,
        "signal_time": signal.signal_time.isoformat() if signal.signal_time else None,
        "expiry_time": signal.expiry_time.isoformat() if signal.expiry_time else None,
        "created_at": signal.created_at.isoformat() if signal.created_at else None,
        "updated_at": signal.updated_at.isoformat() if signal.updated_at else None,
    }


@router.get("/trace/{trace_id}")
async def get_signal_by_trace_id(
    trace_id: str,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a signal by trace ID"""
    result = await db.execute(
        select(Signal).where(Signal.trace_id == trace_id)
    )
    signal = result.scalar_one_or_none()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    return {
        "id": signal.id,
        "user_id": signal.user_id,
        "trace_id": signal.trace_id,
        "symbol": signal.symbol,
        "exchange": signal.exchange,
        "action": signal.action.value if signal.action else "HOLD",
        "direction": signal.direction,
        "status": signal.status.value if signal.status else "PENDING",
        "probability": signal.probability,
        "confidence": signal.confidence,
        "confidence_level": signal.confidence_level,
        "risk_level": signal.risk_level,
        "risk_warning": signal.risk_warning,
        "entry_price": signal.entry_price,
        "stop_loss": signal.stop_loss,
        "target_1": signal.target_1,
        "target_2": signal.target_2,
        "target_3": signal.target_3,
        "market_regime": signal.market_regime,
        "strategy": signal.strategy,
        "evidence_count": signal.evidence_count,
        "reasoning": signal.reasoning,
        "quantity": signal.quantity,
        "allocated_capital": signal.allocated_capital,
        "signal_time": signal.signal_time.isoformat() if signal.signal_time else None,
        "expiry_time": signal.expiry_time.isoformat() if signal.expiry_time else None,
        "created_at": signal.created_at.isoformat() if signal.created_at else None,
        "updated_at": signal.updated_at.isoformat() if signal.updated_at else None,
    }


@router.get("/symbol/{symbol}")
async def get_signals_by_symbol(
    symbol: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get signals for a specific symbol"""
    # Count total
    count_query = select(func.count(Signal.id)).where(Signal.symbol == symbol)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Paginate
    query = select(Signal).where(Signal.symbol == symbol)
    query = query.order_by(desc(Signal.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    signals = result.scalars().all()
    
    return {
        "signals": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "trace_id": s.trace_id,
                "symbol": s.symbol,
                "exchange": s.exchange,
                "action": s.action.value if s.action else "HOLD",
                "direction": s.direction,
                "status": s.status.value if s.status else "PENDING",
                "probability": s.probability,
                "confidence": s.confidence,
                "confidence_level": s.confidence_level,
                "risk_level": s.risk_level,
                "risk_warning": s.risk_warning,
                "entry_price": s.entry_price,
                "stop_loss": s.stop_loss,
                "target_1": s.target_1,
                "target_2": s.target_2,
                "target_3": s.target_3,
                "market_regime": s.market_regime,
                "strategy": s.strategy,
                "evidence_count": s.evidence_count,
                "reasoning": s.reasoning,
                "quantity": s.quantity,
                "allocated_capital": s.allocated_capital,
                "signal_time": s.signal_time.isoformat() if s.signal_time else None,
                "expiry_time": s.expiry_time.isoformat() if s.expiry_time else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in signals
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (page * page_size) < total,
    }


@router.patch("/{signal_id}")
async def update_signal(
    signal_id: int,
    status: Optional[str] = None,
    quantity: Optional[int] = None,
    allocated_capital: Optional[float] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a signal"""
    result = await db.execute(
        select(Signal).where(Signal.id == signal_id)
    )
    signal = result.scalar_one_or_none()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    if status:
        signal.status = SignalStatus(status)
    if quantity is not None:
        signal.quantity = quantity
    if allocated_capital is not None:
        signal.allocated_capital = allocated_capital
    
    await db.commit()
    
    return {
        "id": signal.id,
        "status": signal.status.value,
        "quantity": signal.quantity,
        "allocated_capital": signal.allocated_capital,
    }


@router.post("/{signal_id}/cancel")
async def cancel_signal(
    signal_id: int,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an active signal"""
    result = await db.execute(
        select(Signal).where(Signal.id == signal_id)
    )
    signal = result.scalar_one_or_none()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    if signal.status != SignalStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel non-active signal"
        )
    
    signal.status = SignalStatus.CANCELLED
    await db.commit()
    
    return {
        "id": signal.id,
        "status": signal.status.value,
        "message": "Signal cancelled",
    }
