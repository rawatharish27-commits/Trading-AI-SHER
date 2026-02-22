"""
Subscription Model
Subscription and payment tracking
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
import enum

from sqlalchemy import (
    Boolean,
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


class SubscriptionStatus(str, enum.Enum):
    """Subscription status"""
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    TRIAL = "TRIAL"


class PaymentStatus(str, enum.Enum):
    """Payment status"""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Subscription(Base):
    """User subscription"""

    __tablename__ = "subscriptions"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Plan
    plan_name: Mapped[str] = mapped_column(String(50), nullable=False)  # FREE, PRO, ELITE, INSTITUTIONAL

    # Status
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL)

    # Pricing
    price: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    billing_cycle: Mapped[str] = mapped_column(String(20), default="MONTHLY")  # MONTHLY, YEARLY

    # Duration
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Trial
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Payment Gateway
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    razorpay_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    razorpay_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Features
    features: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Auto Renew
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
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
    user: Mapped["User"] = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Subscription(user_id={self.user_id}, plan={self.plan_name}, status={self.status})>"

    @property
    def is_active(self) -> bool:
        """Check if subscription is active"""
        return self.status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]

    @property
    def days_remaining(self) -> int:
        """Calculate days remaining in current period"""
        if self.current_period_end:
            delta = self.current_period_end - datetime.utcnow()
            return max(0, delta.days)
        return 0


class Payment(Base):
    """Payment transaction"""

    __tablename__ = "payments"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("subscriptions.id"), nullable=True)

    # Payment Info
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING)

    # Payment Method
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # CARD, UPI, NETBANKING
    payment_method_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Gateway
    gateway: Mapped[str] = mapped_column(String(50), default="RAZORPAY")  # STRIPE, RAZORPAY
    gateway_payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gateway_order_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gateway_signature: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Invoice
    invoice_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    invoice_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Refund
    refund_amount: Mapped[float] = mapped_column(Float, default=0.0)
    refund_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refunded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Metadata
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Timestamps
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, amount={self.amount}, status={self.status})>"

    @property
    def is_successful(self) -> bool:
        """Check if payment was successful"""
        return self.status == PaymentStatus.COMPLETED
