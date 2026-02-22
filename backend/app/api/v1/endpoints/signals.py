"""
Signal Endpoints
AI signal generation and management
"""

from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import User, Signal, SignalAction, SignalStatus
from app.schemas import SignalCreate, SignalResponse, SignalListResponse
from app.engines import probability_engine, strategy_ensemble, MarketRegime
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


# ==================== HELPER ====================

async def get_active_user_signals(
    db: AsyncSession,
    user_id: int,
    limit: int = 100
) -> List[Signal]:
    """Get active signals for a user"""
    result = await db.execute(
        select(Signal)
        .where(and_(
            Signal.user_id == user_id,
            Signal.status == SignalStatus.ACTIVE
        ))
        .order_by(desc(Signal.created_at))
        .limit(limit)
    )
    return result.scalars().all()


# ==================== ENDPOINTS ====================

@router.post("/generate", response_model=SignalResponse)
async def generate_signal(
    symbol: str,
    exchange: str = "NSE",
    current_user: User = Depends(get_current_user),
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
    import uuid
    signal = Signal(
        user_id=current_user.id,
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
    
    return signal


@router.get("/", response_model=SignalListResponse)
async def get_signals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's signals with pagination and filtering"""
    query = select(Signal).where(Signal.user_id == current_user.id)
    
    if symbol:
        query = query.where(Signal.symbol == symbol)
    if action:
        query = query.where(Signal.action == action)
    if status:
        query = query.where(Signal.status == status)
    
    # Count total
    count_query = select(Signal.id).where(Signal.user_id == current_user.id)
    total_result = await db.execute(count_query)
    total = len(total_result.all())
    
    # Paginate
    query = query.order_by(desc(Signal.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    signals = result.scalars().all()
    
    return SignalListResponse(
        signals=signals,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{signal_id}", response_model=SignalResponse)
async def get_signal(
    signal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific signal by ID"""
    result = await db.execute(
        select(Signal).where(and_(
            Signal.id == signal_id,
            Signal.user_id == current_user.id
        ))
    )
    signal = result.scalar_one_or_none()
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    return signal


@router.post("/{signal_id}/cancel")
async def cancel_signal(
    signal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an active signal"""
    result = await db.execute(
        select(Signal).where(and_(
            Signal.id == signal_id,
            Signal.user_id == current_user.id
        ))
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
    
    return {"message": "Signal cancelled", "signal_id": signal_id}
