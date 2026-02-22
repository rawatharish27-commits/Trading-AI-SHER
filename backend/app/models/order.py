"""
Order Model
Trading orders and execution history
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
import enum

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class OrderType(str, enum.Enum):
    """Order types"""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOPLOSS_LIMIT = "STOPLOSS_LIMIT"
    STOPLOSS_MARKET = "STOPLOSS_MARKET"


class OrderStatus(str, enum.Enum):
    """Order status"""
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ProductType(str, enum.Enum):
    """Product types"""
    DELIVERY = "DELIVERY"
    INTRADAY = "INTRADAY"
    MARGIN = "MARGIN"
    BO = "BO"  # Bracket Order
    CO = "CO"  # Cover Order


class OrderSide(str, enum.Enum):
    """Order sides"""
    BUY = "BUY"
    SELL = "SELL"


class Order(Base):
    """Trading order model"""

    __tablename__ = "orders"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    signal_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("signals.id"), nullable=True)

    # Order Identification
    order_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    client_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Symbol Information
    symbol: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), default="NSE")
    token: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Order Details
    side: Mapped[OrderSide] = mapped_column(Enum(OrderSide), nullable=False)
    order_type: Mapped[OrderType] = mapped_column(Enum(OrderType), default=OrderType.MARKET)
    product_type: Mapped[ProductType] = mapped_column(Enum(ProductType), default=ProductType.INTRADAY)

    # Quantity
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    filled_quantity: Mapped[int] = mapped_column(Integer, default=0)
    pending_quantity: Mapped[int] = mapped_column(Integer, default=0)
    disclosed_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Price
    price: Mapped[float] = mapped_column(Float, default=0.0)
    trigger_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_price: Mapped[float] = mapped_column(Float, default=0.0)

    # Stop Loss & Target (for bracket orders)
    stop_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    square_off: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trailing_sl: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Status
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Broker Information
    broker: Mapped[str] = mapped_column(String(50), default="ANGEL_ONE")
    broker_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    broker_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Strategy & Metadata
    strategy: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Timestamps
    order_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    execution_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, symbol='{self.symbol}', side={self.side}, status={self.status})>"

    @property
    def is_complete(self) -> bool:
        """Check if order is completely filled"""
        return self.status == OrderStatus.FILLED

    @property
    def is_active(self) -> bool:
        """Check if order is still active"""
        return self.status in [
            OrderStatus.PENDING,
            OrderStatus.SUBMITTED,
            OrderStatus.PARTIALLY_FILLED
        ]

    @property
    def fill_percentage(self) -> float:
        """Calculate fill percentage"""
        if self.quantity == 0:
            return 0.0
        return round((self.filled_quantity / self.quantity) * 100, 2)

    @property
    def order_value(self) -> float:
        """Calculate total order value"""
        return self.quantity * self.price if self.price > 0 else self.quantity * self.average_price
