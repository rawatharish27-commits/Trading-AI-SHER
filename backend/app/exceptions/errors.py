"""
Custom Exceptions
Application-specific exceptions
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppException(Exception):
    """Base application exception"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "UNKNOWN_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


# Authentication Exceptions
class AuthenticationError(AppException):
    """Authentication failed"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="AUTH_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class InvalidTokenError(AppException):
    """Invalid or expired token"""
    
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(
            message=message,
            error_code="INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class InsufficientPermissionsError(AppException):
    """User lacks required permissions"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_PERMISSIONS",
            status_code=status.HTTP_403_FORBIDDEN
        )


# Trading Exceptions
class RiskLimitExceededError(AppException):
    """Risk limit exceeded"""
    
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            error_code="RISK_LIMIT_EXCEEDED",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class KillSwitchActiveError(AppException):
    """Kill switch is active"""
    
    def __init__(self, reason: str = "Trading is disabled"):
        super().__init__(
            message=reason,
            error_code="KILL_SWITCH_ACTIVE",
            status_code=status.HTTP_403_FORBIDDEN
        )


class InsufficientFundsError(AppException):
    """Insufficient funds for trade"""
    
    def __init__(self, required: float, available: float):
        super().__init__(
            message=f"Insufficient funds. Required: {required}, Available: {available}",
            error_code="INSUFFICIENT_FUNDS",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"required": required, "available": available}
        )


class PositionNotFoundError(AppException):
    """Position not found"""
    
    def __init__(self, symbol: str):
        super().__init__(
            message=f"Position not found for symbol: {symbol}",
            error_code="POSITION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


class OrderRejectedError(AppException):
    """Order rejected by broker"""
    
    def __init__(self, reason: str, order_id: Optional[str] = None):
        super().__init__(
            message=f"Order rejected: {reason}",
            error_code="ORDER_REJECTED",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"order_id": order_id, "reason": reason}
        )


# Broker Exceptions
class BrokerConnectionError(AppException):
    """Broker connection failed"""
    
    def __init__(self, broker: str = "Angel One"):
        super().__init__(
            message=f"Failed to connect to {broker}",
            error_code="BROKER_CONNECTION_FAILED",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class BrokerAuthenticationError(AppException):
    """Broker authentication failed"""
    
    def __init__(self, broker: str = "Angel One"):
        super().__init__(
            message=f"{broker} authentication failed",
            error_code="BROKER_AUTH_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class MarketDataError(AppException):
    """Market data unavailable"""
    
    def __init__(self, symbol: str):
        super().__init__(
            message=f"Market data unavailable for {symbol}",
            error_code="MARKET_DATA_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# Signal Exceptions
class SignalGenerationError(AppException):
    """Signal generation failed"""
    
    def __init__(self, reason: str):
        super().__init__(
            message=f"Signal generation failed: {reason}",
            error_code="SIGNAL_GENERATION_FAILED",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class LowProbabilityError(AppException):
    """Signal probability too low"""
    
    def __init__(self, probability: float, threshold: float):
        super().__init__(
            message=f"Signal probability {probability:.2%} below threshold {threshold:.2%}",
            error_code="LOW_PROBABILITY",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"probability": probability, "threshold": threshold}
        )


# Rate Limiting
class RateLimitExceededError(AppException):
    """Rate limit exceeded"""
    
    def __init__(self, retry_after: int = 60):
        super().__init__(
            message="Rate limit exceeded",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retry_after": retry_after}
        )


# Validation Exceptions
class ValidationError(AppException):
    """Validation error"""
    
    def __init__(self, field: str, message: str):
        super().__init__(
            message=f"Validation error for {field}: {message}",
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field": field}
        )


class InvalidSymbolError(AppException):
    """Invalid trading symbol"""
    
    def __init__(self, symbol: str):
        super().__init__(
            message=f"Invalid symbol: {symbol}",
            error_code="INVALID_SYMBOL",
            status_code=status.HTTP_400_BAD_REQUEST
        )


# Database Exceptions
class DatabaseError(AppException):
    """Database operation failed"""
    
    def __init__(self, operation: str, details: Optional[Dict] = None):
        super().__init__(
            message=f"Database operation failed: {operation}",
            error_code="DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class RecordNotFoundError(AppException):
    """Record not found"""
    
    def __init__(self, model: str, record_id: Any):
        super().__init__(
            message=f"{model} with id {record_id} not found",
            error_code="RECORD_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


# Exception handlers
def register_exception_handlers(app):
    """Register exception handlers with FastAPI app"""
    from fastapi.responses import JSONResponse
    
    @app.exception_handler(AppException)
    async def app_exception_handler(request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        )
