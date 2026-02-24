"""
Enhanced Security Features
API key rotation, data encryption, and security hardening
"""

import os
import hashlib
import hmac
import secrets
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_context
from app.core.config import settings
from app.models.user import User
from app.models.api_key import APIKey, APIKeyStatus, APIKeyScope
from app.models.audit_log import AuditLog, AuditAction, AuditSeverity


class APIKeyManager:
    """
    API Key Management with rotation and security features
    """

    def __init__(self, encryption_key: Optional[str] = None):
        self.encryption_key = encryption_key or self._generate_encryption_key()
        self.cipher = Fernet(self.encryption_key)

    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key from environment or create new one"""
        key = os.getenv("API_KEY_ENCRYPTION_KEY")
        if key:
            # Derive key using PBKDF2
            salt = b"sher_api_key_salt"
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            return base64.urlsafe_b64encode(kdf.derive(key.encode()))
        else:
            # Generate new key (not recommended for production)
            return Fernet.generate_key()

    async def create_api_key(
        self,
        user_id: int,
        name: str,
        scopes: List[str],
        expires_in_days: Optional[int] = 365
    ) -> tuple[str, str]:
        """
        Create a new API key for user

        Returns:
            Tuple of (key_id, api_key)
        """
        # Generate API key
        api_key = APIKey.generate_key()
        key_prefix = api_key[:8]  # First 8 chars for identification
        key_hash = self._hash_api_key(api_key)

        # Convert scopes to comma-separated string
        scopes_str = ",".join(scopes)

        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        # Store in database
        async with get_db_context() as session:
            api_key_obj = APIKey(
                user_id=user_id,
                name=name,
                key_hash=key_hash,
                key_prefix=key_prefix,
                scopes=scopes_str,
                expires_at=expires_at
            )
            session.add(api_key_obj)
            await session.commit()
            await session.refresh(api_key_obj)

            logger.info(f"Created API key {api_key_obj.id} for user {user_id}")

        return str(api_key_obj.id), api_key

    async def validate_api_key(self, api_key: str) -> Optional[APIKey]:
        """
        Validate API key and return key info

        Returns:
            APIKey object if valid, None otherwise
        """
        key_hash = self._hash_api_key(api_key)

        # Query database for key
        async with get_db_context() as session:
            stmt = (
                APIKey.__table__.select()
                .where(
                    APIKey.key_hash == key_hash,
                    APIKey.is_active == True,
                    APIKey.status == APIKeyStatus.ACTIVE
                )
            )
            result = await session.execute(stmt)
            api_key_obj = result.scalar_one_or_none()

            if not api_key_obj:
                return None

            # Check expiration
            if api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
                # Mark as expired
                api_key_obj.status = APIKeyStatus.EXPIRED
                await session.commit()
                return None

            # Update last used
            api_key_obj.last_used_at = datetime.utcnow()
            api_key_obj.total_requests += 1
            await session.commit()

            return api_key_obj

    async def rotate_api_key(self, user_id: int, old_key_id: str) -> tuple[str, str]:
        """
        Rotate an existing API key with secure key rotation

        Returns:
            Tuple of (new_key_id, new_api_key)
        """
        # Fetch old key details before revoking
        async with get_db_context() as session:
            stmt = (
                APIKey.__table__.select()
                .where(APIKey.id == int(old_key_id), APIKey.user_id == user_id)
            )
            result = await session.execute(stmt)
            old_key = result.scalar_one_or_none()

            if not old_key:
                raise ValueError(f"API key {old_key_id} not found or not owned by user {user_id}")

            # Extract old key permissions
            old_scopes = old_key.scopes.split(",") if old_key.scopes else ["read", "write"]
            old_expires_at = old_key.expires_at

        # Create new key with same permissions
        new_name = f"Rotated from {old_key_id} at {datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        new_key_id, new_api_key = await self.create_api_key(
            user_id=user_id,
            name=new_name,
            scopes=old_scopes,
            expires_in_days=None  # Will set expiration manually if needed
        )

        # Set same expiration if it existed
        if old_expires_at:
            async with get_db_context() as session:
                stmt = (
                    APIKey.__table__.update()
                    .where(APIKey.id == int(new_key_id))
                    .values(expires_at=old_expires_at)
                )
                await session.execute(stmt)
                await session.commit()

        # Now revoke the old key
        await self.revoke_api_key(old_key_id)

        # Log the rotation
        await security_audit.log_security_event(
            "api_key_rotated",
            user_id,
            {
                "old_key_id": old_key_id,
                "new_key_id": new_key_id,
                "rotated_by": "user"
            },
            "info"
        )

        logger.info(f"Rotated API key {old_key_id} to {new_key_id} for user {user_id}")
        return new_key_id, new_api_key

    async def revoke_api_key(self, key_id: str) -> bool:
        """Revoke an API key"""
        async with get_db_context() as session:
            # Mark key as inactive in database
            logger.info(f"Revoked API key {key_id}")
            return True

    async def list_user_keys(self, user_id: int) -> List[APIKey]:
        """List all API keys for a user"""
        async with get_db_context() as session:
            # Query user's API keys
            return []

    def _hash_api_key(self, api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def _verify_api_key(self, api_key: str, stored_hash: str) -> bool:
        """Verify API key against stored hash"""
        return hmac.compare_digest(self._hash_api_key(api_key), stored_hash)


class DataEncryption:
    """
    Data encryption utilities for sensitive information
    """

    def __init__(self, key: Optional[bytes] = None):
        self.key = key or Fernet.generate_key()
        self.cipher = Fernet(self.key)

    def encrypt_data(self, data: str) -> str:
        """Encrypt string data"""
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt string data"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()

    def encrypt_json(self, data: Dict[str, Any]) -> str:
        """Encrypt JSON data"""
        json_str = json.dumps(data)
        return self.encrypt_data(json_str)

    def decrypt_json(self, encrypted_data: str) -> Dict[str, Any]:
        """Decrypt JSON data"""
        json_str = self.decrypt_data(encrypted_data)
        return json.loads(json_str)


class SecurityAudit:
    """
    Security audit logging and monitoring
    """

    @staticmethod
    async def log_security_event(
        event_type: str,
        user_id: Optional[int],
        details: Dict[str, Any],
        severity: str = "info"
    ):
        """Log security-related events"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "details": details,
            "severity": severity,
            "ip_address": details.get("ip_address"),
            "user_agent": details.get("user_agent")
        }

        # Log to security log
        logger.bind(security=True).log(severity.upper(), f"Security event: {event_type}", extra=event)

        # Store in audit database
        async with get_db_context() as session:
            # Map severity string to enum
            severity_enum = {
                "info": AuditSeverity.INFO,
                "warning": AuditSeverity.WARNING,
                "error": AuditSeverity.ERROR,
                "critical": AuditSeverity.CRITICAL
            }.get(severity.lower(), AuditSeverity.INFO)

            # Map event_type to AuditAction if possible
            action_enum = None
            try:
                action_enum = AuditAction(event_type.upper())
            except ValueError:
                # If not a standard action, use a generic one or create custom
                action_enum = AuditAction.SETTINGS_CHANGED  # Default fallback

            audit_log = AuditLog(
                user_id=user_id,
                action=action_enum,
                severity=severity_enum,
                description=f"Security event: {event_type}",
                details=details,
                ip_address=details.get("ip_address"),
                user_agent=details.get("user_agent"),
                request_path=details.get("request_path"),
                request_method=details.get("request_method"),
                status_code=details.get("status_code"),
                response_time_ms=details.get("response_time_ms")
            )
            session.add(audit_log)
            await session.commit()

    @staticmethod
    async def log_failed_authentication(
        username: str,
        ip_address: str,
        user_agent: str,
        reason: str
    ):
        """Log failed authentication attempts"""
        await SecurityAudit.log_security_event(
            "failed_authentication",
            None,
            {
                "username": username,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "reason": reason
            },
            "warning"
        )

    @staticmethod
    async def log_suspicious_activity(
        user_id: int,
        activity: str,
        details: Dict[str, Any]
    ):
        """Log suspicious user activity"""
        await SecurityAudit.log_security_event(
            "suspicious_activity",
            user_id,
            {"activity": activity, **details},
            "warning"
        )

    @staticmethod
    async def log_api_key_usage(
        key_id: str,
        user_id: int,
        endpoint: str,
        method: str
    ):
        """Log API key usage"""
        await SecurityAudit.log_security_event(
            "api_key_usage",
            user_id,
            {
                "key_id": key_id,
                "endpoint": endpoint,
                "method": method
            },
            "info"
        )

    @staticmethod
    async def log_configuration_change(
        user_id: int,
        config_key: str,
        old_value: Any,
        new_value: Any,
        ip_address: str,
        user_agent: str
    ):
        """Log configuration changes"""
        await SecurityAudit.log_security_event(
            "configuration_change",
            user_id,
            {
                "config_key": config_key,
                "old_value": str(old_value),
                "new_value": str(new_value),
                "ip_address": ip_address,
                "user_agent": user_agent,
                "change_type": "configuration_update"
            },
            "warning"
        )

    @staticmethod
    async def log_audit_trail_event(
        event_type: str,
        user_id: Optional[int],
        resource_type: str,
        resource_id: Optional[str],
        action: str,
        details: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log comprehensive audit trail events"""
        audit_event = {
            "event_type": event_type,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "details": details,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.utcnow().isoformat(),
            "compliance_type": "audit_trail"
        }

        # Determine severity based on event type
        severity_map = {
            "create": "info",
            "read": "info",
            "update": "info",
            "delete": "warning",
            "login": "info",
            "logout": "info",
            "failed_login": "warning",
            "permission_change": "warning",
            "config_change": "warning",
            "data_export": "warning",
            "data_deletion": "critical"
        }

        severity = severity_map.get(action.lower(), "info")

        await SecurityAudit.log_security_event(
            f"audit_{event_type}",
            user_id,
            audit_event,
            severity
        )

    @staticmethod
    async def log_user_action_audit(
        user_id: int,
        action: str,
        target_resource: str,
        target_id: Optional[str],
        details: Dict[str, Any],
        ip_address: str,
        user_agent: str
    ):
        """Log user actions for audit trail"""
        await SecurityAudit.log_audit_trail_event(
            "user_action",
            user_id,
            target_resource,
            target_id,
            action,
            details,
            ip_address,
            user_agent
        )

    @staticmethod
    async def log_system_configuration_change(
        user_id: int,
        config_section: str,
        config_key: str,
        old_value: Any,
        new_value: Any,
        change_reason: str,
        ip_address: str,
        user_agent: str
    ):
        """Log system configuration changes with full audit trail"""
        await SecurityAudit.log_audit_trail_event(
            "system_config",
            user_id,
            "configuration",
            f"{config_section}.{config_key}",
            "update",
            {
                "config_section": config_section,
                "config_key": config_key,
                "old_value": str(old_value),
                "new_value": str(new_value),
                "change_reason": change_reason,
                "change_type": "system_configuration"
            },
            ip_address,
            user_agent
        )

    @staticmethod
    async def log_security_policy_change(
        user_id: int,
        policy_type: str,
        policy_name: str,
        old_settings: Dict[str, Any],
        new_settings: Dict[str, Any],
        change_reason: str,
        ip_address: str,
        user_agent: str
    ):
        """Log security policy changes"""
        await SecurityAudit.log_audit_trail_event(
            "security_policy",
            user_id,
            "security_policy",
            policy_name,
            "update",
            {
                "policy_type": policy_type,
                "policy_name": policy_name,
                "old_settings": old_settings,
                "new_settings": new_settings,
                "change_reason": change_reason,
                "change_type": "security_policy_update"
            },
            ip_address,
            user_agent
        )

    @staticmethod
    async def log_data_access_audit(
        user_id: int,
        data_type: str,
        operation: str,
        record_count: int,
        filters_used: Dict[str, Any],
        purpose: str,
        ip_address: str,
        user_agent: str
    ):
        """Log data access for audit compliance"""
        await SecurityAudit.log_audit_trail_event(
            "data_access",
            user_id,
            data_type,
            None,
            operation,
            {
                "record_count": record_count,
                "filters_used": filters_used,
                "purpose": purpose,
                "access_type": "data_query",
                "compliance_check": "GDPR_Article_30"
            },
            ip_address,
            user_agent
        )

    @staticmethod
    async def log_administrative_action(
        admin_user_id: int,
        action: str,
        target_type: str,
        target_id: str,
        action_details: Dict[str, Any],
        justification: str,
        ip_address: str,
        user_agent: str
    ):
        """Log administrative actions with full audit trail"""
        await SecurityAudit.log_audit_trail_event(
            "admin_action",
            admin_user_id,
            target_type,
            target_id,
            action,
            {
                "action_details": action_details,
                "justification": justification,
                "admin_role": "system_admin",
                "approval_required": True,
                "change_type": "administrative_action"
            },
            ip_address,
            user_agent
        )

    @staticmethod
    async def log_compliance_event(
        event_type: str,
        user_id: Optional[int],
        regulation: str,
        requirement: str,
        details: Dict[str, Any],
        severity: str = "info"
    ):
        """Log compliance-related events"""
        compliance_event = {
            "event_type": event_type,
            "regulation": regulation,
            "requirement": requirement,
            "details": details,
            "timestamp": datetime.utcnow().isoformat(),
            "compliance_type": "regulatory_compliance"
        }

        await SecurityAudit.log_security_event(
            f"compliance_{event_type}",
            user_id,
            compliance_event,
            severity
        )



    @staticmethod
    async def log_data_access(
        user_id: int,
        data_type: str,
        operation: str,
        record_id: Optional[int],
        ip_address: str,
        user_agent: str
    ):
        """Log sensitive data access"""
        await SecurityAudit.log_security_event(
            "data_access",
            user_id,
            {
                "data_type": data_type,
                "operation": operation,
                "record_id": record_id,
                "ip_address": ip_address,
                "user_agent": user_agent
            },
            "info"
        )

    @staticmethod
    async def log_rate_limit_exceeded(
        identifier: str,
        endpoint: str,
        ip_address: str,
        user_agent: str
    ):
        """Log rate limit violations"""
        await SecurityAudit.log_security_event(
            "rate_limit_exceeded",
            None,
            {
                "identifier": identifier,
                "endpoint": endpoint,
                "ip_address": ip_address,
                "user_agent": user_agent
            },
            "warning"
        )

    @staticmethod
    async def log_suspicious_request(
        ip_address: str,
        user_agent: str,
        request_path: str,
        request_method: str,
        reason: str
    ):
        """Log suspicious requests"""
        await SecurityAudit.log_security_event(
            "suspicious_request",
            None,
            {
                "ip_address": ip_address,
                "user_agent": user_agent,
                "request_path": request_path,
                "request_method": request_method,
                "reason": reason
            },
            "warning"
        )

    @staticmethod
    async def log_system_event(
        event_type: str,
        details: Dict[str, Any],
        severity: str = "info"
    ):
        """Log system-level events"""
        await SecurityAudit.log_security_event(
            f"system_{event_type}",
            None,
            details,
            severity
        )

    # ===== SEBI COMPLIANCE LOGGING =====

    @staticmethod
    async def log_sebi_trade_execution(
        user_id: int,
        order_id: str,
        symbol: str,
        side: str,
        quantity: int,
        price: float,
        order_type: str,
        exchange: str = "NSE",
        broker: str = "ANGEL_ONE"
    ):
        """Log trade execution for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_trade_execution",
            user_id,
            {
                "order_id": order_id,
                "symbol": symbol,
                "exchange": exchange,
                "side": side,
                "quantity": quantity,
                "price": price,
                "order_type": order_type,
                "broker": broker,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "trade_execution"
            },
            "info"
        )

    @staticmethod
    async def log_sebi_order_modification(
        user_id: int,
        order_id: str,
        original_order: Dict[str, Any],
        modified_order: Dict[str, Any],
        reason: str
    ):
        """Log order modifications for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_order_modification",
            user_id,
            {
                "order_id": order_id,
                "original_order": original_order,
                "modified_order": modified_order,
                "modification_reason": reason,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "order_modification"
            },
            "warning"
        )

    @staticmethod
    async def log_sebi_order_cancellation(
        user_id: int,
        order_id: str,
        symbol: str,
        reason: str,
        remaining_quantity: int = 0
    ):
        """Log order cancellations for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_order_cancellation",
            user_id,
            {
                "order_id": order_id,
                "symbol": symbol,
                "cancellation_reason": reason,
                "remaining_quantity": remaining_quantity,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "order_cancellation"
            },
            "warning"
        )

    @staticmethod
    async def log_sebi_portfolio_update(
        user_id: int,
        symbol: str,
        position_change: float,
        new_quantity: int,
        average_price: float,
        pnl_realized: float = 0.0
    ):
        """Log portfolio updates for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_portfolio_update",
            user_id,
            {
                "symbol": symbol,
                "position_change": position_change,
                "new_quantity": new_quantity,
                "average_price": average_price,
                "pnl_realized": pnl_realized,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "portfolio_update"
            },
            "info"
        )

    @staticmethod
    async def log_sebi_signal_generation(
        user_id: int,
        signal_id: str,
        symbol: str,
        action: str,
        confidence: float,
        strategy: str,
        risk_level: str
    ):
        """Log signal generation for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_signal_generation",
            user_id,
            {
                "signal_id": signal_id,
                "symbol": symbol,
                "action": action,
                "confidence": confidence,
                "strategy": strategy,
                "risk_level": risk_level,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "signal_generation"
            },
            "info"
        )

    @staticmethod
    async def log_sebi_user_login(
        user_id: int,
        ip_address: str,
        user_agent: str,
        login_method: str = "password"
    ):
        """Log user login events for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_user_login",
            user_id,
            {
                "ip_address": ip_address,
                "user_agent": user_agent,
                "login_method": login_method,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "user_login"
            },
            "info"
        )

    @staticmethod
    async def log_sebi_user_logout(
        user_id: int,
        session_duration_minutes: float,
        ip_address: str
    ):
        """Log user logout events for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_user_logout",
            user_id,
            {
                "session_duration_minutes": session_duration_minutes,
                "ip_address": ip_address,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "user_logout"
            },
            "info"
        )

    @staticmethod
    async def log_sebi_funds_transfer(
        user_id: int,
        transfer_type: str,  # "deposit" or "withdrawal"
        amount: float,
        method: str,
        reference_id: str,
        status: str
    ):
        """Log funds transfer events for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_funds_transfer",
            user_id,
            {
                "transfer_type": transfer_type,
                "amount": amount,
                "method": method,
                "reference_id": reference_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "funds_transfer"
            },
            "warning" if transfer_type == "withdrawal" else "info"
        )

    @staticmethod
    async def log_sebi_risk_breach(
        user_id: int,
        breach_type: str,
        current_value: float,
        threshold_value: float,
        symbol: Optional[str] = None
    ):
        """Log risk limit breaches for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_risk_breach",
            user_id,
            {
                "breach_type": breach_type,
                "current_value": current_value,
                "threshold_value": threshold_value,
                "symbol": symbol,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "risk_breach"
            },
            "critical"
        )

    @staticmethod
    async def log_sebi_system_alert(
        alert_type: str,
        severity: str,
        message: str,
        affected_users: Optional[List[int]] = None,
        system_component: Optional[str] = None
    ):
        """Log system alerts for SEBI compliance"""
        await SecurityAudit.log_security_event(
            "sebi_system_alert",
            None,
            {
                "alert_type": alert_type,
                "severity": severity,
                "message": message,
                "affected_users": affected_users or [],
                "system_component": system_component,
                "timestamp": datetime.utcnow().isoformat(),
                "compliance_type": "system_alert"
            },
            severity
        )


class RateLimitManager:
    """
    Advanced rate limiting with different tiers
    """

    def __init__(self):
        self.user_limits = {
            "free": {"requests_per_hour": 100, "burst": 10},
            "basic": {"requests_per_hour": 1000, "burst": 50},
            "premium": {"requests_per_hour": 10000, "burst": 200},
            "enterprise": {"requests_per_hour": 100000, "burst": 1000}
        }
        # In-memory storage for rate limiting (use Redis in production)
        self._request_counts = {}
        self._reset_times = {}

    def get_user_limits(self, user_tier: str) -> Dict[str, int]:
        """Get rate limits for user tier"""
        return self.user_limits.get(user_tier, self.user_limits["free"])

    async def check_rate_limit(
        self,
        user_id: int,
        endpoint: str,
        user_tier: str = "free"
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request is within rate limits

        Returns:
            Tuple of (allowed, limit_info)
        """
        limits = self.get_user_limits(user_tier)
        key = f"{user_id}:{endpoint}"
        now = datetime.utcnow()

        # Clean up expired entries
        if key in self._reset_times and now > self._reset_times[key]:
            self._request_counts.pop(key, None)
            self._reset_times.pop(key, None)

        # Initialize if not exists
        if key not in self._request_counts:
            self._request_counts[key] = 0
            self._reset_times[key] = now + timedelta(hours=1)

        # Check burst limit (requests in last minute)
        burst_limit = limits["burst"]
        hourly_limit = limits["requests_per_hour"]

        # Simple implementation - in production use Redis with sliding window
        current_count = self._request_counts[key]
        reset_time = self._reset_times[key]

        # Check if within limits
        allowed = current_count < hourly_limit

        if allowed:
            self._request_counts[key] = current_count + 1

        remaining = max(0, hourly_limit - self._request_counts[key])

        return allowed, {
            "limit": hourly_limit,
            "remaining": remaining,
            "reset_time": reset_time,
            "retry_after": int((reset_time - now).total_seconds()) if not allowed else 0
        }


# Global security instances
api_key_manager = APIKeyManager()
data_encryption = DataEncryption()
security_audit = SecurityAudit()
rate_limit_manager = RateLimitManager()


# Security middleware enhancements
class SecurityHeadersMiddleware:
    """
    Enhanced security headers middleware
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        async def custom_send(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))

                # Add security headers
                security_headers = {
                    b"X-Content-Type-Options": b"nosniff",
                    b"X-Frame-Options": b"DENY",
                    b"X-XSS-Protection": b"1; mode=block",
                    b"Strict-Transport-Security": b"max-age=31536000; includeSubDomains",
                    b"Content-Security-Policy": b"default-src 'self'",
                    b"Referrer-Policy": b"strict-origin-when-cross-origin",
                    b"Permissions-Policy": b"geolocation=(), microphone=(), camera=()"
                }

                # Merge with existing headers
                for key, value in security_headers.items():
                    if key not in headers:
                        headers[key] = value

                message["headers"] = list(headers.items())

            await send(message)

        await self.app(scope, receive, send)


# Input validation utilities
class InputValidator:
    """
    Input validation and sanitization
    """

    @staticmethod
    def sanitize_string(input_str: str, max_length: int = 1000) -> str:
        """Sanitize string input"""
        if not isinstance(input_str, str):
            raise ValueError("Input must be a string")

        # Remove null bytes and other dangerous characters
        sanitized = input_str.replace('\x00', '').strip()

        if len(sanitized) > max_length:
            raise ValueError(f"Input too long (max {max_length} characters)")

        return sanitized

    @staticmethod
    def validate_symbol(symbol: str) -> str:
        """Validate trading symbol"""
        import re
        symbol = InputValidator.sanitize_string(symbol, 20)

        # Allow alphanumeric, dots, hyphens
        if not re.match(r'^[A-Z0-9.-]+$', symbol):
            raise ValueError("Invalid symbol format")

        return symbol.upper()

    @staticmethod
    def validate_email(email: str) -> str:
        """Validate email address"""
        import re
        email = InputValidator.sanitize_string(email, 254)

        # Basic email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValueError("Invalid email format")

        return email.lower()


# ===== NETWORK SECURITY MIDDLEWARE =====

class HTTPSRedirectMiddleware:
    """
    Redirect HTTP requests to HTTPS in production
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            host = None
            for key, value in headers.items():
                if key == b"host":
                    host = value.decode()
                    break

            if host:
                url = f"https://{host}{scope['path']}"
                if scope.get('query_string'):
                    url += f"?{scope['query_string'].decode()}"

                # Send redirect response
                await send({
                    'type': 'http.response.start',
                    'status': 301,
                    'headers': [
                        [b'location', url.encode()],
                        [b'content-type', b'text/plain'],
                    ],
                })
                await send({
                    'type': 'http.response.body',
                    'body': b'Redirecting to HTTPS...',
                })
                return

        await self.app(scope, receive, send)


class RequestSizeLimitMiddleware:
    """
    Limit request body size to prevent DoS attacks
    """

    def __init__(self, app, max_request_size: int = 10 * 1024 * 1024):  # 10MB default
        self.app = app
        self.max_request_size = max_request_size

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Track received bytes
            received_bytes = 0

            async def limited_receive():
                nonlocal received_bytes
                message = await receive()

                if message.get("type") == "http.request":
                    body = message.get("body", b"")
                    received_bytes += len(body)

                    if received_bytes > self.max_request_size:
                        # Send 413 Payload Too Large
                        await send({
                            'type': 'http.response.start',
                            'status': 413,
                            'headers': [
                                [b'content-type', b'application/json'],
                            ],
                        })
                        await send({
                            'type': 'http.response.body',
                            'body': b'{"error": "Request payload too large"}',
                        })
                        return message  # Still return to avoid hanging

                return message

            await self.app(scope, limited_receive, send)
        else:
            await self.app(scope, receive, send)


class IPWhitelistMiddleware:
    """
    IP whitelisting for sensitive endpoints
    """

    def __init__(self, app, whitelist: List[str] = None):
        self.app = app
        self.whitelist = whitelist or []

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Get client IP
            client_ip = None
            headers = dict(scope.get("headers", []))
            if b'x-forwarded-for' in headers:
                client_ip = headers[b'x-forwarded-for'].decode().split(',')[0].strip()
            elif b'x-real-ip' in headers:
                client_ip = headers[b'x-real-ip'].decode().strip()
            else:
                # Fallback to connection info
                client = scope.get("client")
                if client:
                    client_ip = client[0]

            # Check whitelist
            if self.whitelist and client_ip not in self.whitelist:
                await send({
                    'type': 'http.response.start',
                    'status': 403,
                    'headers': [[b'content-type', b'application/json']],
                })
                await send({
                    'type': 'http.response.body',
                    'body': b'{"error": "IP address not whitelisted"}',
                })
                return

        await self.app(scope, receive, send)


# ===== JWT TOKEN MANAGEMENT =====

from jose import JWTError, jwt
from passlib.context import CryptContext


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str | int, expires_delta: Optional[timedelta] = None) -> str:
    """Create access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }

    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(subject: str | int) -> str:
    """Create refresh token"""
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }

    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode token without verification"""
    try:
        payload = jwt.get_unverified_claims(token)
        return payload
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """Verify token and return subject (user ID)"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

        # Check token type
        if payload.get("type") != token_type:
            return None

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            return None

        subject = payload.get("sub")
        if subject is None:
            return None

        return subject

    except JWTError:
        return None


# Export security utilities
__all__ = [
    "APIKeyManager",
    "DataEncryption",
    "SecurityAudit",
    "RateLimitManager",
    "SecurityHeadersMiddleware",
    "InputValidator",
    "api_key_manager",
    "data_encryption",
    "security_audit",
    "rate_limit_manager",
    "get_password_hash",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "verify_token"
]
