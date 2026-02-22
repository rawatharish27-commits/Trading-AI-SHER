"""
Notification Model
User notifications and alerts
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    func,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, enum.Enum):
    """Notification types"""
    # Trading
    SIGNAL_GENERATED = "SIGNAL_GENERATED"
    ORDER_PLACED = "ORDER_PLACED"
    ORDER_FILLED = "ORDER_FILLED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    POSITION_OPENED = "POSITION_OPENED"
    POSITION_CLOSED = "POSITION_CLOSED"
    TARGET_HIT = "TARGET_HIT"
    STOP_LOSS_HIT = "STOP_LOSS_HIT"

    # Alerts
    PRICE_ALERT = "PRICE_ALERT"
    VOLUME_ALERT = "VOLUME_ALERT"
    MARKET_ALERT = "MARKET_ALERT"

    # System
    SYSTEM_UPDATE = "SYSTEM_UPDATE"
    MAINTENANCE = "MAINTENANCE"
    FEATURE_UPDATE = "FEATURE_UPDATE"

    # Account
    LOGIN_ALERT = "LOGIN_ALERT"
    SECURITY_ALERT = "SECURITY_ALERT"
    SUBSCRIPTION_REMINDER = "SUBSCRIPTION_REMINDER"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    PAYMENT_FAILED = "PAYMENT_FAILED"


class NotificationPriority(str, enum.Enum):
    """Notification priority"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class NotificationChannel(str, enum.Enum):
    """Notification channels"""
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"
    WHATSAPP = "WHATSAPP"


class Notification(Base):
    """User notification"""

    __tablename__ = "notifications"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Type & Priority
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), nullable=False)
    priority: Mapped[NotificationPriority] = mapped_column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)

    # Content
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Link
    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    action_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Related Resource
    resource_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resource_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Extra Data
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Status
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Delivery
    channels: Mapped[str] = mapped_column(String(255), default="IN_APP")  # Comma-separated channels
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Expiry
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")

    # Indexes
    __table_args__ = (
        Index('ix_notifications_user_read', 'user_id', 'read'),
        Index('ix_notifications_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.type}, user_id={self.user_id})>"

    @property
    def is_read(self) -> bool:
        """Check if notification is read"""
        return self.read

    def mark_as_read(self) -> None:
        """Mark notification as read"""
        self.read = True
        self.read_at = datetime.utcnow()


class NotificationPreference(Base):
    """User notification preferences"""

    __tablename__ = "notification_preferences"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Channel Preferences
    in_app_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Type Preferences
    signal_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    order_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    position_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    price_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    system_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    security_alerts: Mapped[bool] = mapped_column(Boolean, default=True)

    # Quiet Hours
    quiet_hours_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    quiet_hours_start: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)  # HH:MM
    quiet_hours_end: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)  # HH:MM

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

    def __repr__(self) -> str:
        return f"<NotificationPreference(user_id={self.user_id})>"
