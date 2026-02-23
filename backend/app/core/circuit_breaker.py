"""
Circuit Breaker Pattern Implementation
Provides resilience against external service failures
"""

import asyncio
import time
from enum import Enum
from typing import Callable, Any, Optional
from dataclasses import dataclass
from contextlib import asynccontextmanager

from loguru import logger


class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "CLOSED"       # Normal operation
    OPEN = "OPEN"          # Failing, requests blocked
    HALF_OPEN = "HALF_OPEN" # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5      # Failures before opening
    recovery_timeout: float = 60.0  # Seconds to wait before trying again
    expected_exception: tuple = (Exception,)  # Exceptions to count as failures
    success_threshold: int = 3      # Successes needed to close circuit
    timeout: float = 10.0          # Request timeout


class CircuitBreakerOpenException(Exception):
    """Exception raised when circuit breaker is open"""
    pass


class CircuitBreaker:
    """
    Circuit Breaker implementation for external service calls

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Service is failing, requests are blocked
    - HALF_OPEN: Testing if service has recovered
    """

    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None

        logger.info(f"🛡️ Circuit breaker '{name}' initialized")

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"🔄 Circuit breaker '{self.name}' entering HALF_OPEN state")
            else:
                raise CircuitBreakerOpenException(f"Circuit breaker '{self.name}' is OPEN")

        try:
            # Execute with timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.config.timeout
            )

            self._on_success()
            return result

        except self.config.expected_exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True

        return (time.time() - self.last_failure_time) >= self.config.recovery_timeout

    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0

        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._close_circuit()
        else:
            self.success_count = 0

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        self.success_count = 0

        if self.failure_count >= self.config.failure_threshold:
            self._open_circuit()

    def _open_circuit(self):
        """Open the circuit breaker"""
        self.state = CircuitBreakerState.OPEN
        logger.warning(f"🔴 Circuit breaker '{self.name}' OPENED after {self.failure_count} failures")

    def _close_circuit(self):
        """Close the circuit breaker"""
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        logger.info(f"🟢 Circuit breaker '{self.name}' CLOSED - service recovered")

    @property
    def is_open(self) -> bool:
        """Check if circuit breaker is open"""
        return self.state == CircuitBreakerState.OPEN

    @property
    def is_closed(self) -> bool:
        """Check if circuit breaker is closed"""
        return self.state == CircuitBreakerState.CLOSED

    def get_status(self) -> dict:
        """Get circuit breaker status"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "success_threshold": self.config.success_threshold,
                "timeout": self.config.timeout
            }
        }


# Global circuit breakers for different services
market_data_circuit_breaker = CircuitBreaker(
    "market_data_api",
    CircuitBreakerConfig(
        failure_threshold=3,
        recovery_timeout=30.0,
        timeout=5.0
    )
)

broker_api_circuit_breaker = CircuitBreaker(
    "broker_api",
    CircuitBreakerConfig(
        failure_threshold=5,
        recovery_timeout=60.0,
        timeout=10.0
    )
)

external_api_circuit_breaker = CircuitBreaker(
    "external_api",
    CircuitBreakerConfig(
        failure_threshold=3,
        recovery_timeout=45.0,
        timeout=8.0
    )
)


@asynccontextmanager
async def circuit_breaker_context(name: str):
    """Context manager for circuit breaker protection"""
    breaker = CircuitBreaker(name)
    try:
        yield breaker
    except Exception as e:
        breaker._on_failure()
        raise e
    else:
        breaker._on_success()


async def call_with_circuit_breaker(
    breaker: CircuitBreaker,
    func: Callable,
    *args,
    fallback: Optional[Callable] = None,
    **kwargs
) -> Any:
    """
    Call function with circuit breaker and optional fallback

    Args:
        breaker: Circuit breaker instance
        func: Function to call
        fallback: Fallback function if circuit is open
        *args, **kwargs: Arguments for the function

    Returns:
        Function result or fallback result
    """
    try:
        return await breaker.call(func, *args, **kwargs)
    except CircuitBreakerOpenException:
        if fallback:
            logger.warning(f"Using fallback for {breaker.name}")
            return await fallback(*args, **kwargs)
        else:
            raise


# Retry mechanism
async def retry_with_backoff(
    func: Callable,
    *args,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    **kwargs
) -> Any:
    """
    Retry function with exponential backoff

    Args:
        func: Function to retry
        max_retries: Maximum number of retries
        base_delay: Initial delay between retries
        max_delay: Maximum delay between retries
        backoff_factor: Backoff multiplier
        *args, **kwargs: Function arguments

    Returns:
        Function result
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_exception = e

            if attempt == max_retries:
                logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}")
                raise e

            delay = min(base_delay * (backoff_factor ** attempt), max_delay)
            logger.warning(f"Attempt {attempt + 1} failed, retrying in {delay:.1f}s: {e}")
            await asyncio.sleep(delay)

    # This should never be reached, but just in case
    raise last_exception


# Graceful degradation utilities
class GracefulDegradationManager:
    """
    Manages graceful degradation of features when dependencies fail
    """

    def __init__(self):
        self.degraded_features = set()
        self.fallback_responses = {}

    def mark_degraded(self, feature: str, fallback_response: Any = None):
        """Mark a feature as degraded"""
        self.degraded_features.add(feature)
        if fallback_response is not None:
            self.fallback_responses[feature] = fallback_response
        logger.warning(f"Feature '{feature}' marked as degraded")

    def is_degraded(self, feature: str) -> bool:
        """Check if feature is degraded"""
        return feature in self.degraded_features

    def get_fallback_response(self, feature: str) -> Any:
        """Get fallback response for degraded feature"""
        return self.fallback_responses.get(feature)

    def recover_feature(self, feature: str):
        """Mark feature as recovered"""
        self.degraded_features.discard(feature)
        self.fallback_responses.pop(feature, None)
        logger.info(f"Feature '{feature}' recovered")

    def get_status(self) -> dict:
        """Get degradation status"""
        return {
            "degraded_features": list(self.degraded_features),
            "fallback_responses": self.fallback_responses
        }


# Global graceful degradation manager
graceful_degradation = GracefulDegradationManager()
