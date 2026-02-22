"""
API Key Model
Programmatic access management
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
import enum
import secrets

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
    from app.models.user import User


class APIKeyStatus(str, enum.Enum):
    """API Key status"""
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class APIKeyScope(str, enum.Enum):
    """API Key scopes"""
    READ = "READ"
    WRITE = "WRITE"
    TRADE = "TRADE"
    ADMIN = "ADMIN"


class APIKey(Base):
    """API Key for programmatic access"""

    __tablename__ = "api_keys"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign Key
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Key Info
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # First 8 chars for identification

    # Scopes & Permissions
    scopes: Mapped[str] = mapped_column(String(255), default="READ")  # Comma-separated scopes
    permissions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON permissions

    # Status
    status: Mapped[APIKeyStatus] = mapped_column(Enum(APIKeyStatus), default=APIKeyStatus.ACTIVE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Rate Limiting
    rate_limit: Mapped[int] = mapped_column(Integer, default=100)  # Requests per minute
    daily_limit: Mapped[int] = mapped_column(Integer, default=10000)  # Requests per day

    # Expiry
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Usage Tracking
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_requests: Mapped[int] = mapped_column(Integer, default=0)
    requests_today: Mapped[int] = mapped_column(Integer, default=0)
    last_reset_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # IP Whitelist
    allowed_ips: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Comma-separated IPs

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
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<APIKey(id={self.id}, name='{self.name}', status={self.status})>"

    @staticmethod
    def generate_key() -> str:
        """Generate a new API key"""
        return f"sher_{secrets.token_urlsafe(32)}"

    @property
    def is_valid(self) -> bool:
        """Check if API key is valid"""
        if not self.is_active or self.status != APIKeyStatus.ACTIVE:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True

    def check_scope(self, scope: APIKeyScope) -> bool:
        """Check if key has specific scope"""
        return scope.value in self.scopes.split(",")
