"""
Tenant Model
Multi-tenancy support for SaaS
"""

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Integer,
    String,
    Text,
    Float,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class TenantStatus(str, enum.Enum):
    """Tenant status"""
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    CANCELLED = "CANCELLED"


class TenantPlan(str, enum.Enum):
    """Tenant subscription plans"""
    STARTER = "STARTER"
    PROFESSIONAL = "PROFESSIONAL"
    ENTERPRISE = "ENTERPRISE"
    WHITE_LABEL = "WHITE_LABEL"


class Tenant(Base):
    """Tenant model for multi-tenancy"""

    __tablename__ = "tenants"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Tenant Info
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)

    # Contact
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Plan & Status
    plan: Mapped[TenantPlan] = mapped_column(Enum(TenantPlan), default=TenantPlan.STARTER)
    status: Mapped[TenantStatus] = mapped_column(Enum(TenantStatus), default=TenantStatus.TRIAL)

    # Subscription
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    subscription_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Limits
    max_users: Mapped[int] = mapped_column(Integer, default=5)
    max_signals_per_day: Mapped[int] = mapped_column(Integer, default=50)
    max_api_calls_per_day: Mapped[int] = mapped_column(Integer, default=1000)
    max_capital_allocation: Mapped[float] = mapped_column(Float, default=100000.0)

    # Settings
    settings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON settings
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Features
    features_enabled: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON features

    # Billing
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

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
    users: Mapped[List["User"]] = relationship("User", back_populates="tenant", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name='{self.name}', plan={self.plan})>"

    @property
    def is_active(self) -> bool:
        """Check if tenant is active"""
        return self.status == TenantStatus.ACTIVE

    @property
    def is_trial(self) -> bool:
        """Check if tenant is in trial"""
        return self.status == TenantStatus.TRIAL

    @property
    def is_enterprise(self) -> bool:
        """Check if tenant has enterprise plan"""
        return self.plan in [TenantPlan.ENTERPRISE, TenantPlan.WHITE_LABEL]
