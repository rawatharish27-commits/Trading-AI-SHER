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

from app.core.database import get_db_session
from app.models.user import User


@dataclass
class APIKey:
    """API key with metadata"""
    key_id: str
    key_hash: str
    user_id: int
    name: str
    permissions: List[str]
    created_at: datetime
    expires_at: Optional[datetime]
    last_used: Optional[datetime]
    is_active: bool = True


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
        permissions: List[str],
        expires_in_days: Optional[int] = 365
    ) -> tuple[str, str]:
        """
        Create a new API key for user

        Returns:
            Tuple of (key_id, api_key)
        """
        key_id = secrets.token_urlsafe(16)
        api_key = secrets.token_urlsafe(32)

        # Hash the API key for storage
        key_hash = self._hash_api_key(api_key)

        # Encrypt sensitive data
        encrypted_permissions = self.cipher.encrypt(json.dumps(permissions).encode())

        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        # Store in database (simplified - would need proper model)
        async with get_db_session() as session:
            # This would be replaced with actual database operations
            logger.info(f"Created API key {key_id} for user {user_id}")

        return key_id, api_key

    async def validate_api_key(self, api_key: str) -> Optional[APIKey]:
        """
        Validate API key and return key info

        Returns:
            APIKey object if valid, None otherwise
        """
        key_hash = self._hash_api_key(api_key)

        # Query database for key (simplified)
        async with get_db_session() as session:
            # This would query the actual API key table
            # For now, return None (implement proper validation)
            return None

    async def rotate_api_key(self, user_id: int, old_key_id: str) -> tuple[str, str]:
        """
        Rotate an existing API key

        Returns:
            Tuple of (new_key_id, new_api_key)
        """
        # Invalidate old key
        await self.revoke_api_key(old_key_id)

        # Create new key with same permissions
        # This would need to fetch old key permissions first
        return await self.create_api_key(user_id, f"Rotated from {old_key_id}", ["read", "write"])

    async def revoke_api_key(self, key_id: str) -> bool:
        """Revoke an API key"""
        async with get_db_session() as session:
            # Mark key as inactive in database
            logger.info(f"Revoked API key {key_id}")
            return True

    async def list_user_keys(self, user_id: int) -> List[APIKey]:
        """List all API keys for a user"""
        async with get_db_session() as session:
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

        # Store in audit database (simplified)
        async with get_db_session() as session:
            # This would insert into audit_log table
            pass

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

        # This would implement sliding window rate limiting
        # For now, return allowed
        return True, {
            "limit": limits["requests_per_hour"],
            "remaining": limits["requests_per_hour"] - 1,
            "reset_time": datetime.utcnow() + timedelta(hours=1)
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
    "rate_limit_manager"
]
