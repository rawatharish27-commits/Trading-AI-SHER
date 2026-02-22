"""
Audit Log Model
Compliance and activity tracking
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
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class AuditAction(str, enum.Enum):
    """Audit action types"""
    # Auth
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    MFA_ENABLED = "MFA_ENABLED"
    MFA_DISABLED = "MFA_DISABLED"

    # User
    USER_CREATE = "USER_CREATE"
    USER_UPDATE = "USER_UPDATE"
    USER_DELETE = "USER_DELETE"

    # Trading
    SIGNAL_GENERATED = "SIGNAL_GENERATED"
    ORDER_PLACED = "ORDER_PLACED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    ORDER_FILLED = "ORDER_FILLED"
    POSITION_OPENED = "POSITION_OPENED"
    POSITION_CLOSED = "POSITION_CLOSED"

    # System
    API_KEY_CREATED = "API_KEY_CREATED"
    API_KEY_REVOKED = "API_KEY_REVOKED"
    SETTINGS_CHANGED = "SETTINGS_CHANGED"
    DATA_EXPORT = "DATA_EXPORT"

    # Compliance
    COMPLIANCE_CHECK = "COMPLIANCE_CHECK"
    RISK_ALERT = "RISK_ALERT"
    CIRCUIT_BREAKER = "CIRCUIT_BREAKER"


class AuditSeverity(str, enum.Enum):
    """Audit severity levels"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class AuditLog(Base):
    """Audit log for compliance tracking"""

    __tablename__ = "audit_logs"

    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # User (nullable for system actions)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # Action Info
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction), nullable=False, index=True)
    severity: Mapped[AuditSeverity] = mapped_column(Enum(AuditSeverity), default=AuditSeverity.INFO)

    # Resource
    resource_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., 'signal', 'order'
    resource_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Details
    description: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Request Info
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    request_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    request_method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Performance
    response_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Tenant
    tenant_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", lazy="selectin")

    # Indexes for common queries
    __table_args__ = (
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
        Index('ix_audit_logs_tenant_created', 'tenant_id', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, severity={self.severity})>"
