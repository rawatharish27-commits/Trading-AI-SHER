"""
Exceptions Package
"""

from app.exceptions.errors import (
    AppException,
    AuthenticationError,
    InvalidTokenError,
    InsufficientPermissionsError,
    RiskLimitExceededError,
    KillSwitchActiveError,
    InsufficientFundsError,
    PositionNotFoundError,
    OrderRejectedError,
    BrokerConnectionError,
    BrokerAuthenticationError,
    MarketDataError,
    SignalGenerationError,
    LowProbabilityError,
    RateLimitExceededError,
    ValidationError,
    InvalidSymbolError,
    DatabaseError,
    RecordNotFoundError,
    register_exception_handlers,
)

__all__ = [
    "AppException",
    "AuthenticationError",
    "InvalidTokenError",
    "InsufficientPermissionsError",
    "RiskLimitExceededError",
    "KillSwitchActiveError",
    "InsufficientFundsError",
    "PositionNotFoundError",
    "OrderRejectedError",
    "BrokerConnectionError",
    "BrokerAuthenticationError",
    "MarketDataError",
    "SignalGenerationError",
    "LowProbabilityError",
    "RateLimitExceededError",
    "ValidationError",
    "InvalidSymbolError",
    "DatabaseError",
    "RecordNotFoundError",
    "register_exception_handlers",
]
