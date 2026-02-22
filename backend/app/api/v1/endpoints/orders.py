"""
Order Endpoints
Order placement, management, and history
"""

from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import User, Order, OrderStatus, OrderSide, OrderType, ProductType
from app.engines import risk_system, TradeRequest

router = APIRouter()


@router.post("/place")
async def place_order(
    symbol: str,
    side: str,  # BUY or SELL
    quantity: int,
    price: float = 0.0,
    order_type: str = "MARKET",
    product_type: str = "INTRADAY",
    exchange: str = "NSE",
    stop_loss: Optional[float] = None,
    target: Optional[float] = None,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Place a new order
    
    This endpoint:
    1. Runs risk audit
    2. Checks position limits
    3. Places order with broker
    4. Records order in database
    """
    # Create trade request for risk audit
    trade_request = TradeRequest(
        symbol=symbol,
        exchange=exchange,
        side=side,
        quantity=quantity,
        price=price if price > 0 else 0,  # Market order
        stop_loss=stop_loss,
        target=target,
    )
    
    # Run risk audit
    risk_audit = await risk_system.audit_trade(trade_request)
    
    if not risk_audit.allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Risk check failed: {risk_audit.reason}"
        )
    
    # Create order record
    order = Order(
        user_id=current_user.id,
        symbol=symbol,
        exchange=exchange,
        side=OrderSide.BUY if side == "BUY" else OrderSide.SELL,
        order_type=OrderType.MARKET if order_type == "MARKET" else OrderType.LIMIT,
        product_type=ProductType.INTRADAY if product_type == "INTRADAY" else ProductType.DELIVERY,
        quantity=quantity,
        price=price,
        stop_loss=stop_loss,
        status=OrderStatus.PENDING,
        broker="ANGEL_ONE",
        order_time=datetime.utcnow(),
    )
    
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # In production, place order with broker here
    # broker_order = await angel_one.place_order(...)
    
    return {
        "order_id": order.id,
        "status": "PENDING",
        "risk_audit": {
            "rating": risk_audit.risk_rating.value,
            "firewall_code": risk_audit.firewall_code,
            "suggested_quantity": risk_audit.suggested_quantity,
        },
        "message": "Order placed successfully",
    }


@router.get("/")
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Get user's orders with pagination"""
    query = select(Order).where(Order.user_id == current_user.id)
    
    if symbol:
        query = query.where(Order.symbol == symbol)
    if status:
        query = query.where(Order.status == status)
    
    # Count
    count_query = select(Order.id).where(Order.user_id == current_user.id)
    total_result = await db.execute(count_query)
    total = len(total_result.all())
    
    # Paginate
    query = query.order_by(desc(Order.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific order by ID"""
    result = await db.execute(
        select(Order).where(and_(
            Order.id == order_id,
            Order.user_id == current_user.id
        ))
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending order"""
    result = await db.execute(
        select(Order).where(and_(
            Order.id == order_id,
            Order.user_id == current_user.id
        ))
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status not in [OrderStatus.PENDING, OrderStatus.SUBMITTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order in current status"
        )
    
    # In production, cancel with broker here
    # await angel_one.cancel_order(order.broker_order_id)
    
    order.status = OrderStatus.CANCELLED
    await db.commit()
    
    return {"message": "Order cancelled", "order_id": order_id}


@router.post("/square-off")
async def square_off_position(
    symbol: str,
    exchange: str = "NSE",
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Square off position for a symbol"""
    # Get active position
    from app.models import Position, PositionStatus
    
    result = await db.execute(
        select(Position).where(and_(
            Position.user_id == current_user.id,
            Position.symbol == symbol,
            Position.exchange == exchange,
            Position.status == PositionStatus.OPEN
        ))
    )
    position = result.scalar_one_or_none()
    
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No open position found for this symbol"
        )
    
    # Create square-off order
    side = "SELL" if position.side.value == "LONG" else "BUY"
    
    order = Order(
        user_id=current_user.id,
        symbol=symbol,
        exchange=exchange,
        side=OrderSide.SELL if side == "SELL" else OrderSide.BUY,
        order_type=OrderType.MARKET,
        product_type=ProductType.INTRADAY,
        quantity=position.open_quantity,
        price=0,
        status=OrderStatus.PENDING,
        broker="ANGEL_ONE",
        order_time=datetime.utcnow(),
    )
    
    db.add(order)
    
    # Update position
    position.status = PositionStatus.CLOSED
    position.exit_time = datetime.utcnow()
    
    await db.commit()
    
    return {
        "message": "Square-off order placed",
        "order_id": order.id,
        "position_id": position.id,
    }
