"""
Swing Trading API Endpoints
Complete API for swing trading operations
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
import asyncio

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from loguru import logger

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.swing_trade import (
    SwingTrade, SwingTradeStatus, SwingTradeSignal,
    ExitReason, Timeframe
)
from app.engines.swing_trading_engine import swing_trading_engine
from app.engines.enhanced_signal_generator import enhanced_signal_generator
from app.services.historical_data_service import historical_data_service
from app.services.trade_monitor_service import trade_monitor_service


router = APIRouter(prefix="/swing", tags=["Swing Trading"])


# ==================== REQUEST MODELS ====================

class GenerateSignalRequest(BaseModel):
    """Request for generating swing trade signal"""
    symbol: str
    exchange: str = "NSE"
    capital_percent: float = Field(default=5.0, ge=1.0, le=20.0)
    max_risk_percent: float = Field(default=2.0, ge=0.5, le=5.0)


class ExecuteTradeRequest(BaseModel):
    """Request for executing a swing trade"""
    symbol: str
    side: str  # LONG, SHORT
    quantity: int
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: Optional[float] = None
    target_3: Optional[float] = None
    max_holding_days: int = Field(default=3, ge=1, le=5)
    strategy: str = "SWING_MOMENTUM"


class MonitorTradeRequest(BaseModel):
    """Request for monitoring a trade"""
    trade_id: int


class UpdateHistoricalDataRequest(BaseModel):
    """Request for updating historical data"""
    symbols: Optional[List[str]] = None
    days: int = Field(default=90, ge=30, le=365)


class ExitTradeRequest(BaseModel):
    """Request for exiting a trade"""
    trade_id: int
    exit_reason: Optional[str] = "MANUAL_EXIT"


# ==================== RESPONSE MODELS ====================

class SignalResponse(BaseModel):
    """Signal response"""
    symbol: str
    signal: str
    action: str
    confidence: float
    confluence_score: float
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: Optional[float]
    target_3: Optional[float]
    risk_reward_ratio: float
    recommended_holding_days: int
    risk_level: str
    pre_momentum_score: float
    reasoning: str


class TradeResponse(BaseModel):
    """Trade response"""
    trade_id: int
    symbol: str
    status: str
    side: str
    quantity: int
    entry_price: float
    current_price: float
    stop_loss: float
    target_1: float
    target_2: Optional[float]
    target_3: Optional[float]
    unrealized_pnl: float
    pnl_percent: float
    days_held: int
    max_holding_days: int
    analysis_score: float
    analysis_trend: str


class MonitoringResponse(BaseModel):
    """Monitoring response"""
    trade_id: int
    symbol: str
    action: str
    current_price: float
    pnl: float
    pnl_percent: float
    exit_recommended: bool
    exit_reason: Optional[str]
    targets_achieved: List[str]
    days_remaining: int
    warnings: List[str]
    reasoning: str


# ==================== API ENDPOINTS ====================

@router.post("/generate-signal", response_model=SignalResponse)
async def generate_swing_signal(
    request: GenerateSignalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate swing trade signal with multi-timeframe analysis
    
    - Fetches 3 months historical data
    - Performs multi-timeframe analysis
    - Generates entry, exit, targets
    """
    logger.info(f"Generating swing signal for {request.symbol}")
    
    try:
        # 1. Fetch historical data for multiple timeframes
        historical_data = await historical_data_service.get_multi_timeframe_data(
            db=db,
            symbol=request.symbol,
            exchange=request.exchange
        )
        
        # If no data in DB, fetch and store
        if not historical_data or not historical_data.get("1D"):
            logger.info(f"No cached data, fetching fresh data for {request.symbol}")
            
            for tf in ["1D", "1h", "15m"]:
                candles = await historical_data_service.fetch_historical_data(
                    symbol=request.symbol,
                    exchange=request.exchange,
                    interval=tf,
                    days=90 if tf == "1D" else 30
                )
                
                if candles:
                    await historical_data_service.store_historical_data(
                        db=db,
                        symbol=request.symbol,
                        exchange=request.exchange,
                        interval=tf,
                        candles=candles
                    )
            
            # Fetch again
            historical_data = await historical_data_service.get_multi_timeframe_data(
                db=db,
                symbol=request.symbol,
                exchange=request.exchange
            )
        
        # 2. Get current price from latest candle
        current_price = 0
        if historical_data.get("1D"):
            current_price = historical_data["1D"][-1].close
        
        if current_price == 0:
            raise HTTPException(status_code=400, detail="Unable to get current price")
        
        # 3. Perform multi-timeframe analysis
        analysis = await swing_trading_engine.analyze(
            symbol=request.symbol,
            historical_data=historical_data,
            current_price=current_price
        )
        
        return SignalResponse(
            symbol=request.symbol,
            signal=analysis.overall_signal.value,
            action=analysis.recommended_action,
            confidence=analysis.confidence,
            confluence_score=analysis.confluence_score,
            entry_price=analysis.entry_price,
            stop_loss=analysis.stop_loss,
            target_1=analysis.target_1,
            target_2=analysis.target_2,
            target_3=analysis.target_3,
            risk_reward_ratio=analysis.risk_reward_ratio,
            recommended_holding_days=analysis.recommended_holding_days,
            risk_level=analysis.risk_level,
            pre_momentum_score=analysis.pre_momentum_score,
            reasoning=analysis.reasoning
        )
        
    except Exception as e:
        logger.error(f"Error generating signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-trade", response_model=TradeResponse)
async def execute_swing_trade(
    request: ExecuteTradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute a swing trade
    
    - Creates trade entry in database
    - Sets up monitoring
    - Calculates initial analysis scores
    """
    logger.info(f"Executing swing trade for {request.symbol}")
    
    try:
        # Get historical data for initial analysis
        historical_data = await historical_data_service.get_multi_timeframe_data(
            db=db,
            symbol=request.symbol
        )
        
        # Calculate initial analysis score
        analysis_score = 0
        if historical_data.get("1D"):
            features = historical_data_service.calculate_features_from_candles(
                historical_data["1D"]
            )
            # Simple scoring
            rsi = features.get("rsi", 50)
            momentum = features.get("momentum", 0)
            ema_cross = features.get("ema_cross_bullish", False)
            
            score = 50
            if request.side == "LONG":
                if rsi < 40:
                    score += 15
                if momentum > 0:
                    score += 10
                if ema_cross:
                    score += 15
            else:
                if rsi > 60:
                    score += 15
                if momentum < 0:
                    score += 10
                if not ema_cross:
                    score += 15
            
            analysis_score = score
        
        # Create trade
        trade = SwingTrade(
            user_id=current_user.id,
            symbol=request.symbol,
            exchange="NSE",
            side=request.side,
            status=SwingTradeStatus.ACTIVE,
            signal_strength=SwingTradeSignal.BUY if request.side == "LONG" else SwingTradeSignal.SELL,
            
            quantity=request.quantity,
            entry_price=request.entry_price,
            current_price=request.entry_price,
            
            target_1=request.target_1,
            target_2=request.target_2,
            target_3=request.target_3,
            stop_loss=request.stop_loss,
            
            max_holding_days=request.max_holding_days,
            entry_date=date.today(),
            entry_time=datetime.now(),
            
            entry_analysis_score=analysis_score,
            current_analysis_score=analysis_score,
            strategy_name=request.strategy,
            
            risk_reward_ratio=abs(request.target_1 - request.entry_price) / 
                            abs(request.entry_price - request.stop_loss) if request.stop_loss != request.entry_price else 0
        )
        
        db.add(trade)
        await db.commit()
        await db.refresh(trade)
        
        logger.info(f"✅ Trade #{trade.id} created for {request.symbol}")
        
        return TradeResponse(
            trade_id=trade.id,
            symbol=trade.symbol,
            status=trade.status.value,
            side=trade.side,
            quantity=trade.quantity,
            entry_price=trade.entry_price,
            current_price=trade.current_price,
            stop_loss=trade.stop_loss,
            target_1=trade.target_1,
            target_2=trade.target_2,
            target_3=trade.target_3,
            unrealized_pnl=trade.unrealized_pnl,
            pnl_percent=trade.pnl_percent,
            days_held=trade.days_held,
            max_holding_days=trade.max_holding_days,
            analysis_score=trade.current_analysis_score,
            analysis_trend=trade.analysis_trend
        )
        
    except Exception as e:
        logger.error(f"Error executing trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active-trades", response_model=List[TradeResponse])
async def get_active_trades(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active swing trades"""
    
    result = await db.execute(
        select(SwingTrade).where(
            and_(
                SwingTrade.user_id == current_user.id,
                SwingTrade.status == SwingTradeStatus.ACTIVE
            )
        ).order_by(SwingTrade.entry_time.desc())
    )
    
    trades = result.scalars().all()
    
    return [
        TradeResponse(
            trade_id=t.id,
            symbol=t.symbol,
            status=t.status.value,
            side=t.side,
            quantity=t.quantity,
            entry_price=t.entry_price,
            current_price=t.current_price,
            stop_loss=t.stop_loss,
            target_1=t.target_1,
            target_2=t.target_2,
            target_3=t.target_3,
            unrealized_pnl=t.unrealized_pnl,
            pnl_percent=t.pnl_percent,
            days_held=t.days_held,
            max_holding_days=t.max_holding_days,
            analysis_score=t.current_analysis_score,
            analysis_trend=t.analysis_trend
        )
        for t in trades
    ]


@router.post("/monitor/{trade_id}", response_model=MonitoringResponse)
async def monitor_single_trade(
    trade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Monitor a single swing trade
    
    - Checks target/stop loss
    - Performs analysis
    - Recommends exit if needed
    """
    
    # Get trade
    result = await db.execute(
        select(SwingTrade).where(
            and_(
                SwingTrade.id == trade_id,
                SwingTrade.user_id == current_user.id
            )
        )
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    if trade.status != SwingTradeStatus.ACTIVE:
        raise HTTPException(status_code=400, detail=f"Trade is {trade.status.value}")
    
    try:
        # Get current price (mock update)
        current_price = trade.current_price
        
        # Get historical data
        historical_data = await historical_data_service.get_multi_timeframe_data(
            db=db,
            symbol=trade.symbol
        )
        
        # Monitor trade
        monitoring_result = await trade_monitor_service.monitor_trade(
            trade=trade,
            db=db,
            current_price=current_price,
            historical_data=historical_data
        )
        
        return MonitoringResponse(
            trade_id=monitoring_result.trade_id,
            symbol=monitoring_result.symbol,
            action=monitoring_result.action.value,
            current_price=monitoring_result.current_price,
            pnl=monitoring_result.unrealized_pnl,
            pnl_percent=monitoring_result.pnl_percent,
            exit_recommended=monitoring_result.exit_recommended,
            exit_reason=monitoring_result.exit_reason.value if monitoring_result.exit_reason else None,
            targets_achieved=monitoring_result.targets_achieved,
            days_remaining=monitoring_result.days_remaining,
            warnings=monitoring_result.warnings,
            reasoning=monitoring_result.reasoning
        )
        
    except Exception as e:
        logger.error(f"Error monitoring trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/monitor-all", response_model=List[MonitoringResponse])
async def monitor_all_trades(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Monitor all active swing trades"""
    
    results = await trade_monitor_service.monitor_all_active_trades(
        db=db,
        user_id=current_user.id
    )
    
    return [
        MonitoringResponse(
            trade_id=r.trade_id,
            symbol=r.symbol,
            action=r.action.value,
            current_price=r.current_price,
            pnl=r.unrealized_pnl,
            pnl_percent=r.pnl_percent,
            exit_recommended=r.exit_recommended,
            exit_reason=r.exit_reason.value if r.exit_reason else None,
            targets_achieved=r.targets_achieved,
            days_remaining=r.days_remaining,
            warnings=r.warnings,
            reasoning=r.reasoning
        )
        for r in results
    ]


@router.post("/exit-trade")
async def exit_trade(
    request: ExitTradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exit a swing trade"""
    
    # Get trade
    result = await db.execute(
        select(SwingTrade).where(
            and_(
                SwingTrade.id == request.trade_id,
                SwingTrade.user_id == current_user.id
            )
        )
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    if trade.status != SwingTradeStatus.ACTIVE:
        raise HTTPException(status_code=400, detail=f"Trade is already {trade.status.value}")
    
    # Close trade
    trade.status = SwingTradeStatus.CLOSED
    trade.exit_time = datetime.now()
    trade.exit_date = date.today()
    trade.exit_price = trade.current_price
    trade.realized_pnl = trade.unrealized_pnl
    trade.exit_reason = ExitReason.MANUAL_EXIT
    trade.exit_reason_text = request.exit_reason or "Manual exit by user"
    
    await db.commit()
    
    return {
        "status": "success",
        "trade_id": trade.id,
        "symbol": trade.symbol,
        "exit_price": trade.exit_price,
        "realized_pnl": trade.realized_pnl,
        "pnl_percent": trade.pnl_percent,
        "exit_reason": trade.exit_reason.value
    }


@router.post("/update-historical-data")
async def update_historical_data(
    request: UpdateHistoricalDataRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update historical data for symbols
    
    - Fetches last N days of data
    - Stores in database
    - Runs in background
    """
    
    symbols = request.symbols or historical_data_service.DEFAULT_SYMBOLS
    
    async def update_task():
        try:
            for symbol in symbols:
                candles = await historical_data_service.fetch_historical_data(
                    symbol=symbol,
                    interval="1D",
                    days=request.days
                )
                
                if candles:
                    await historical_data_service.store_historical_data(
                        db=db,
                        symbol=symbol,
                        exchange="NSE",
                        interval="1D",
                        candles=candles
                    )
                    logger.info(f"Updated historical data for {symbol}")
                
                await asyncio.sleep(0.5)
                
        except Exception as e:
            logger.error(f"Error updating historical data: {e}")
    
    background_tasks.add_task(update_task)
    
    return {
        "status": "started",
        "symbols": symbols,
        "days": request.days,
        "message": f"Updating historical data for {len(symbols)} symbols"
    }


@router.get("/trade-history")
async def get_trade_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get trade history"""
    
    result = await db.execute(
        select(SwingTrade).where(
            SwingTrade.user_id == current_user.id
        ).order_by(SwingTrade.created_at.desc()).limit(limit)
    )
    
    trades = result.scalars().all()
    
    return {
        "trades": [
            {
                "trade_id": t.id,
                "symbol": t.symbol,
                "status": t.status.value,
                "side": t.side,
                "entry_price": t.entry_price,
                "exit_price": t.exit_price,
                "realized_pnl": t.realized_pnl,
                "pnl_percent": t.pnl_percent,
                "entry_date": t.entry_date.isoformat() if t.entry_date else None,
                "exit_date": t.exit_date.isoformat() if t.exit_date else None,
                "days_held": t.days_held,
                "exit_reason": t.exit_reason.value if t.exit_reason else None
            }
            for t in trades
        ]
    }


@router.get("/statistics")
async def get_trading_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get swing trading statistics"""
    
    # Get all trades
    result = await db.execute(
        select(SwingTrade).where(
            SwingTrade.user_id == current_user.id
        )
    )
    trades = result.scalars().all()
    
    if not trades:
        return {
            "total_trades": 0,
            "win_rate": 0,
            "total_pnl": 0,
            "avg_pnl": 0,
            "avg_holding_days": 0,
        }
    
    # Calculate statistics
    total_trades = len(trades)
    winning_trades = [t for t in trades if t.realized_pnl > 0]
    losing_trades = [t for t in trades if t.realized_pnl < 0]
    
    total_pnl = sum(t.realized_pnl for t in trades)
    win_rate = len(winning_trades) / total_trades * 100 if total_trades > 0 else 0
    
    avg_pnl = total_pnl / total_trades if total_trades > 0 else 0
    avg_holding = sum(t.days_held for t in trades) / total_trades if total_trades > 0 else 0
    
    # Exit reason breakdown
    exit_reasons = {}
    for t in trades:
        if t.exit_reason:
            reason = t.exit_reason.value
            exit_reasons[reason] = exit_reasons.get(reason, 0) + 1
    
    return {
        "total_trades": total_trades,
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "win_rate": round(win_rate, 2),
        "total_pnl": round(total_pnl, 2),
        "avg_pnl": round(avg_pnl, 2),
        "avg_holding_days": round(avg_holding, 1),
        "biggest_win": round(max((t.realized_pnl for t in winning_trades), default=0), 2),
        "biggest_loss": round(min((t.realized_pnl for t in losing_trades), default=0), 2),
        "exit_reasons": exit_reasons
    }
