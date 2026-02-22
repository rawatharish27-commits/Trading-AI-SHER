"""
Order Endpoints
Order placement, management, and history
"""

from datetime import datetime, date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.models import Order, OrderStatus, OrderSide, OrderType, ProductType
from app.engines import risk_system, TradeRequest
from app.api.v1.endpoints.auth import get_admin_user

router = APIRouter()


# ==================== SCHEMAS ====================

class OrderCreate:
    def __init__(
        self,
        symbol: str,
        side: str,
        quantity: int,
        price: float = 0.0,
        order_type: str = "MARKET",
        product_type: str = "INTRADAY",
        exchange: str = "NSE",
        trigger_price: Optional[float] = None,
        stop_loss: Optional[float] = None,
        square_off: Optional[float] = None,
        trailing_sl: Optional[float] = None,
        signal_id: Optional[int] = None,
        strategy: Optional[str] = None,
    ):
        self.symbol = symbol
        self.side = side
        self.quantity = quantity
        self.price = price
        self.order_type = order_type
        self.product_type = product_type
        self.exchange = exchange
        self.trigger_price = trigger_price
        self.stop_loss = stop_loss
        self.square_off = square_off
        self.trailing_sl = trailing_sl
        self.signal_id = signal_id
        self.strategy = strategy


# ==================== ENDPOINTS ====================

@router.post("")
async def place_order(
    symbol: str,
    side: str,  # BUY or SELL
    quantity: int,
    price: float = 0.0,
    order_type: str = "MARKET",
    product_type: str = "INTRADAY",
    exchange: str = "NSE",
    trigger_price: Optional[float] = None,
    stop_loss: Optional[float] = None,
    square_off: Optional[float] = None,
    trailing_sl: Optional[float] = None,
    signal_id: Optional[int] = None,
    strategy: Optional[str] = None,
    admin: dict = Depends(get_admin_user),
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
    # Validate side
    if side.upper() not in ["BUY", "SELL"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Side must be BUY or SELL"
        )
    
    # Validate quantity
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )
    
    # Create trade request for risk audit
    trade_request = TradeRequest(
        symbol=symbol,
        exchange=exchange,
        side=side,
        quantity=quantity,
        price=price if price > 0 else 0,
        stop_loss=stop_loss,
        target=square_off,
    )
    
    # Run risk audit
    risk_audit = await risk_system.audit_trade(trade_request)
    
    if not risk_audit.allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Risk check failed: {risk_audit.reason}"
        )
    
    # Determine order type enum
    order_type_enum = OrderType.MARKET if order_type.upper() == "MARKET" else \
                      OrderType.LIMIT if order_type.upper() == "LIMIT" else \
                      OrderType.STOPLOSS_LIMIT if order_type.upper() == "STOPLOSS_LIMIT" else \
                      OrderType.STOPLOSS_MARKET
    
    # Determine product type enum
    product_type_enum = ProductType.INTRADAY if product_type.upper() == "INTRADAY" else \
                        ProductType.DELIVERY if product_type.upper() == "DELIVERY" else \
                        ProductType.MARGIN if product_type.upper() == "MARGIN" else \
                        ProductType.BO if product_type.upper() == "BO" else \
                        ProductType.CO
    
    # Create order record
    order = Order(
        user_id=1,  # Admin user
        symbol=symbol,
        exchange=exchange,
        side=OrderSide.BUY if side.upper() == "BUY" else OrderSide.SELL,
        order_type=order_type_enum,
        product_type=product_type_enum,
        quantity=quantity,
        filled_quantity=0,
        pending_quantity=quantity,
        price=price,
        trigger_price=trigger_price,
        average_price=0,
        stop_loss=stop_loss,
        square_off=square_off,
        trailing_sl=trailing_sl,
        status=OrderStatus.PENDING,
        broker="ANGEL_ONE",
        signal_id=signal_id,
        strategy=strategy,
        order_time=datetime.utcnow(),
    )
    
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    return {
        "id": order.id,
        "user_id": order.user_id,
        "order_id": order.order_id,
        "client_order_id": order.client_order_id,
        "symbol": order.symbol,
        "exchange": order.exchange,
        "side": order.side.value,
        "order_type": order.order_type.value,
        "product_type": order.product_type.value,
        "quantity": order.quantity,
        "filled_quantity": order.filled_quantity,
        "pending_quantity": order.pending_quantity,
        "price": order.price,
        "trigger_price": order.trigger_price,
        "average_price": order.average_price,
        "stop_loss": order.stop_loss,
        "square_off": order.square_off,
        "trailing_sl": order.trailing_sl,
        "status": order.status.value,
        "rejection_reason": order.rejection_reason,
        "broker": order.broker,
        "broker_order_id": order.broker_order_id,
        "broker_message": order.broker_message,
        "signal_id": order.signal_id,
        "strategy": order.strategy,
        "order_time": order.order_time.isoformat() if order.order_time else None,
        "execution_time": order.execution_time.isoformat() if order.execution_time else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "risk_audit": {
            "rating": risk_audit.risk_rating.value,
            "firewall_code": risk_audit.firewall_code,
            "suggested_quantity": risk_audit.suggested_quantity,
        },
        "message": "Order placed successfully",
    }


@router.get("")
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    side: Optional[str] = None,
    product_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get orders with pagination"""
    query = select(Order)
    count_query = select(func.count(Order.id))
    
    if symbol:
        query = query.where(Order.symbol == symbol)
        count_query = count_query.where(Order.symbol == symbol)
    if status:
        query = query.where(Order.status == OrderStatus(status.upper()))
        count_query = count_query.where(Order.status == OrderStatus(status.upper()))
    if side:
        query = query.where(Order.side == OrderSide(side.upper()))
        count_query = count_query.where(Order.side == OrderSide(side.upper()))
    if product_type:
        query = query.where(Order.product_type == ProductType(product_type.upper()))
        count_query = count_query.where(Order.product_type == ProductType(product_type.upper()))
    
    # Count total
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Paginate
    query = query.order_by(desc(Order.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return {
        "orders": [
            {
                "id": o.id,
                "user_id": o.user_id,
                "order_id": o.order_id,
                "client_order_id": o.client_order_id,
                "symbol": o.symbol,
                "exchange": o.exchange,
                "side": o.side.value,
                "order_type": o.order_type.value,
                "product_type": o.product_type.value,
                "quantity": o.quantity,
                "filled_quantity": o.filled_quantity,
                "pending_quantity": o.pending_quantity,
                "price": o.price,
                "trigger_price": o.trigger_price,
                "average_price": o.average_price,
                "stop_loss": o.stop_loss,
                "square_off": o.square_off,
                "trailing_sl": o.trailing_sl,
                "status": o.status.value,
                "rejection_reason": o.rejection_reason,
                "broker": o.broker,
                "broker_order_id": o.broker_order_id,
                "broker_message": o.broker_message,
                "signal_id": o.signal_id,
                "strategy": o.strategy,
                "order_time": o.order_time.isoformat() if o.order_time else None,
                "execution_time": o.execution_time.isoformat() if o.execution_time else None,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "updated_at": o.updated_at.isoformat() if o.updated_at else None,
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (page * page_size) < total,
    }


@router.get("/today")
async def get_today_orders(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get today's orders"""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    result = await db.execute(
        select(Order)
        .where(and_(
            Order.order_time >= today_start,
            Order.order_time <= today_end
        ))
        .order_by(desc(Order.order_time))
    )
    orders = result.scalars().all()
    
    return [
        {
            "id": o.id,
            "user_id": o.user_id,
            "order_id": o.order_id,
            "client_order_id": o.client_order_id,
            "symbol": o.symbol,
            "exchange": o.exchange,
            "side": o.side.value,
            "order_type": o.order_type.value,
            "product_type": o.product_type.value,
            "quantity": o.quantity,
            "filled_quantity": o.filled_quantity,
            "pending_quantity": o.pending_quantity,
            "price": o.price,
            "trigger_price": o.trigger_price,
            "average_price": o.average_price,
            "stop_loss": o.stop_loss,
            "square_off": o.square_off,
            "trailing_sl": o.trailing_sl,
            "status": o.status.value,
            "rejection_reason": o.rejection_reason,
            "broker": o.broker,
            "broker_order_id": o.broker_order_id,
            "broker_message": o.broker_message,
            "signal_id": o.signal_id,
            "strategy": o.strategy,
            "order_time": o.order_time.isoformat() if o.order_time else None,
            "execution_time": o.execution_time.isoformat() if o.execution_time else None,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "updated_at": o.updated_at.isoformat() if o.updated_at else None,
        }
        for o in orders
    ]


@router.get("/pending")
async def get_pending_orders(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending orders"""
    result = await db.execute(
        select(Order)
        .where(Order.status.in_([OrderStatus.PENDING, OrderStatus.SUBMITTED]))
        .order_by(desc(Order.order_time))
    )
    orders = result.scalars().all()
    
    return [
        {
            "id": o.id,
            "user_id": o.user_id,
            "order_id": o.order_id,
            "symbol": o.symbol,
            "exchange": o.exchange,
            "side": o.side.value,
            "order_type": o.order_type.value,
            "product_type": o.product_type.value,
            "quantity": o.quantity,
            "filled_quantity": o.filled_quantity,
            "pending_quantity": o.pending_quantity,
            "price": o.price,
            "status": o.status.value,
            "order_time": o.order_time.isoformat() if o.order_time else None,
        }
        for o in orders
    ]


@router.get("/stats")
async def get_order_stats(
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order statistics"""
    # Total orders
    total_result = await db.execute(select(func.count(Order.id)))
    total = total_result.scalar() or 0
    
    # Filled orders
    filled_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.FILLED)
    )
    filled = filled_result.scalar() or 0
    
    # Cancelled orders
    cancelled_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.CANCELLED)
    )
    cancelled = cancelled_result.scalar() or 0
    
    # Rejected orders
    rejected_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.REJECTED)
    )
    rejected = rejected_result.scalar() or 0
    
    # Fill rate
    fill_rate = (filled / total * 100) if total > 0 else 0
    
    return {
        "total": total,
        "filled": filled,
        "cancelled": cancelled,
        "rejected": rejected,
        "fill_rate": fill_rate,
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific order by ID"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return {
        "id": order.id,
        "user_id": order.user_id,
        "order_id": order.order_id,
        "client_order_id": order.client_order_id,
        "symbol": order.symbol,
        "exchange": order.exchange,
        "side": order.side.value,
        "order_type": order.order_type.value,
        "product_type": order.product_type.value,
        "quantity": order.quantity,
        "filled_quantity": order.filled_quantity,
        "pending_quantity": order.pending_quantity,
        "price": order.price,
        "trigger_price": order.trigger_price,
        "average_price": order.average_price,
        "stop_loss": order.stop_loss,
        "square_off": order.square_off,
        "trailing_sl": order.trailing_sl,
        "status": order.status.value,
        "rejection_reason": order.rejection_reason,
        "broker": order.broker,
        "broker_order_id": order.broker_order_id,
        "broker_message": order.broker_message,
        "signal_id": order.signal_id,
        "strategy": order.strategy,
        "order_time": order.order_time.isoformat() if order.order_time else None,
        "execution_time": order.execution_time.isoformat() if order.execution_time else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }


@router.get("/order/{order_id_str}")
async def get_order_by_order_id(
    order_id_str: str,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get an order by order_id string"""
    result = await db.execute(
        select(Order).where(Order.order_id == order_id_str)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return {
        "id": order.id,
        "user_id": order.user_id,
        "order_id": order.order_id,
        "symbol": order.symbol,
        "exchange": order.exchange,
        "side": order.side.value,
        "order_type": order.order_type.value,
        "product_type": order.product_type.value,
        "quantity": order.quantity,
        "filled_quantity": order.filled_quantity,
        "price": order.price,
        "status": order.status.value,
        "order_time": order.order_time.isoformat() if order.order_time else None,
    }


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending order"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
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
    
    return {
        "id": order.id,
        "status": order.status.value,
        "message": "Order cancelled",
    }


@router.patch("/{order_id}")
async def modify_order(
    order_id: int,
    quantity: Optional[int] = None,
    price: Optional[float] = None,
    trigger_price: Optional[float] = None,
    stop_loss: Optional[float] = None,
    square_off: Optional[float] = None,
    trailing_sl: Optional[float] = None,
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Modify a pending order"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
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
            detail="Cannot modify order in current status"
        )
    
    if quantity is not None:
        order.quantity = quantity
        order.pending_quantity = quantity - order.filled_quantity
    if price is not None:
        order.price = price
    if trigger_price is not None:
        order.trigger_price = trigger_price
    if stop_loss is not None:
        order.stop_loss = stop_loss
    if square_off is not None:
        order.square_off = square_off
    if trailing_sl is not None:
        order.trailing_sl = trailing_sl
    
    await db.commit()
    
    return {
        "id": order.id,
        "quantity": order.quantity,
        "price": order.price,
        "trigger_price": order.trigger_price,
        "stop_loss": order.stop_loss,
        "square_off": order.square_off,
        "trailing_sl": order.trailing_sl,
        "status": order.status.value,
        "message": "Order modified",
    }


@router.post("/square-off")
async def square_off_position(
    symbol: str,
    exchange: str = "NSE",
    admin: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Square off position for a symbol"""
    from app.models import Position, PositionStatus
    
    # Get active position
    result = await db.execute(
        select(Position).where(and_(
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
        user_id=1,  # Admin user
        symbol=symbol,
        exchange=exchange,
        side=OrderSide.SELL if side == "SELL" else OrderSide.BUY,
        order_type=OrderType.MARKET,
        product_type=ProductType.INTRADAY,
        quantity=position.open_quantity,
        filled_quantity=0,
        pending_quantity=position.open_quantity,
        price=0,
        average_price=0,
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
        "symbol": symbol,
        "quantity": position.open_quantity,
        "side": side,
    }
