"""
User Model
User authentication and profile
"""

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.signal import Signal
    from app.models.order import Order
    from app.models.position import Position
    from app.models.swing_trade import SwingTrade

import enum


class UserRole(str, enum.Enum):
    """User roles"""
    ADMIN = "ADMIN"
    TRADER = "TRADER"
    VIEWER = "VIEWER"
    TENANT_OWNER = "TENANT_OWNER"


class Plan(str, enum.Enum):
    """Subscription plans"""
    FREE = "FREE"
    PRO = "PRO"
    ELITE = "ELITE"
    INSTITUTIONAL = "INSTITUTIONAL"


class User(Base):
    """User model for authentication and profile"""

    __tablename__ = "users"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Authentication
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Role & Plan
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.TRADER)
    plan: Mapped[Plan] = mapped_column(Enum(Plan), default=Plan.FREE)

    # Tenant (for multi-tenancy)
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Security
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_password_change: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Subscription
    plan_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

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
    signals: Mapped[List["Signal"]] = relationship("Signal", back_populates="user", lazy="selectin")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user", lazy="selectin")
    positions: Mapped[List["Position"]] = relationship("Position", back_populates="user", lazy="selectin")
    swing_trades: Mapped[List["SwingTrade"]] = relationship("SwingTrade", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role={self.role})>"

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email.split("@")[0]

    @property
    def is_premium(self) -> bool:
        """Check if user has premium plan"""
        return self.plan in [Plan.PRO, Plan.ELITE, Plan.INSTITUTIONAL]

    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN
