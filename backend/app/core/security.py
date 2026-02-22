"""
Security Utilities
JWT Token, Password Hashing, Authentication
"""

from datetime import datetime, timedelta
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None,
    extra_data: Optional[dict] = None
) -> str:
    """Create JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "access"
    }

    if extra_data:
        to_encode.update(extra_data)

    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT refresh token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.refresh_token_expire_days
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh"
    }

    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """Verify token and return subject (user ID)"""
    payload = decode_token(token)
    if payload is None:
        return None

    if payload.get("type") != token_type:
        return None

    return payload.get("sub")
