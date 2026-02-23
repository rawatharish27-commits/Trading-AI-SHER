"""
Signal Endpoints
AI signal generation and management
"""

from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db, settings
from app.models import User, Signal, SignalAction, SignalStatus
from app.schemas import SignalCreate, SignalResponse, SignalListResponse
from app.services.signal_service_smc import signal_service_smc
from app.websocket.manager import signal_manager
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
    ltf_timeframe: Optional[str] = None,
    htf_timeframe: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate SMC-based AI signal for a symbol

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
        # Use config defaults if not provided
        if ltf_timeframe is None or htf_timeframe is None:
            config_ltf, config_htf = settings.get_smc_timeframes_for_symbol(symbol)
            ltf_timeframe = ltf_timeframe or config_ltf
            htf_timeframe = htf_timeframe or config_htf

        # Generate SMC signal
        smc_result = await signal_service_smc.generate_signal(
            symbol=symbol,
            exchange=exchange,
            ltf_timeframe=ltf_timeframe,
            htf_timeframe=htf_timeframe
        )

        # Handle HOLD signals
        if smc_result.get("action") == "HOLD":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=smc_result.get("reason", "No valid SMC setup found")
            )

        # Map SMC direction to action
        direction = smc_result["direction"]
        if direction == "LONG":
            action = SignalAction.BUY
        elif direction == "SHORT":
            action = SignalAction.SELL
        else:
            action = SignalAction.HOLD

        # Map risk level to confidence level
        risk_level = smc_result.get("risk_level", "MEDIUM")
        if risk_level == "LOW":
            confidence_level = "HIGH"
        elif risk_level == "MEDIUM":
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"

        # Create reasoning string
        reasoning_parts = []
        if smc_result.get("market_structure"):
            reasoning_parts.append(f"Structure: {smc_result['market_structure']}")
        if smc_result.get("liquidity_sweep"):
            reasoning_parts.append("Liquidity Sweep detected")
        if smc_result.get("order_block"):
            reasoning_parts.append("Order Block formed")
        if smc_result.get("fvg"):
            reasoning_parts.append("Fair Value Gap present")
        if smc_result.get("mtf_confirmation"):
            reasoning_parts.append("MTF confirmation")
        reasoning = "; ".join(reasoning_parts) if reasoning_parts else "SMC setup detected"

        # Create signal record
        signal = Signal(
            user_id=current_user.id,
            trace_id=smc_result["trace_id"],
            symbol=symbol,
            exchange=exchange,
            action=action,
            direction=direction,
            status=SignalStatus.ACTIVE if smc_result.get("approved", True) else SignalStatus.PENDING,
            probability=smc_result["quality_score"],  # Map quality score to probability
            confidence=smc_result["quality_score"],
            confidence_level=confidence_level,
            risk_level=risk_level,
            entry_price=smc_result["entry_price"],
            stop_loss=smc_result["stop_loss"],
            target_1=smc_result["target_price"],
            target_2=smc_result["target_price"] * 1.5,  # Conservative target
            target_3=smc_result["target_price"] * 2.0,  # Aggressive target
            strategy="SMC",
            market_regime="TRENDING",  # SMC works best in trending markets
            # Signal Versioning
            setup_version=smc_result.get("setup_version", "1.0"),
            # SMC-specific fields
            market_structure=smc_result.get("market_structure"),
            liquidity_sweep=smc_result.get("liquidity_sweep"),
            order_block=smc_result.get("order_block"),
            fair_value_gap=smc_result.get("fvg"),
            mtf_confirmation=smc_result.get("mtf_confirmation", False),
            evidence_count=1,  # SMC is rule-based, not evidence-based
            reasoning=reasoning,
            signal_time=datetime.fromisoformat(smc_result["signal_time"]),
        )

        db.add(signal)
        await db.commit()
        await db.refresh(signal)

        # Broadcast signal to WebSocket clients
        signal_data = {
            "id": signal.id,
            "symbol": signal.symbol,
            "exchange": signal.exchange,
            "action": signal.action.value,
            "direction": signal.direction,
            "quality_score": signal.probability,
            "strategy": signal.strategy,
            "entry_price": signal.entry_price,
            "stop_loss": signal.stop_loss,
            "target_price": signal.target_1,
            "risk_reward_ratio": signal.target_1 / abs(signal.entry_price - signal.stop_loss) if signal.stop_loss else 0,
            "trace_id": signal.trace_id,
            "market_structure": signal.market_structure,
            "liquidity_sweep": signal.liquidity_sweep,
            "order_block": signal.order_block,
            "fvg": signal.fair_value_gap,
            "mtf_confirmation": signal.mtf_confirmation,
            "reasoning": signal.reasoning,
            "signal_time": signal.signal_time.isoformat(),
        }

        # Broadcast asynchronously (don't wait for it)
        import asyncio
        asyncio.create_task(signal_manager.broadcast_signal(signal_data))

        return signal

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMC signal generation failed: {str(e)}"
        )


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
