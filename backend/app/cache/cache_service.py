"""
Cache Service
Caching decorators and utilities
"""

import functools
import json
from typing import Any, Callable, Dict, Optional, TypeVar, Union
from datetime import timedelta

from app.cache.redis_client import RedisClient, CacheKeys

T = TypeVar("T")


class CacheService:
    """High-level caching service"""

    def __init__(self, ttl: int = 300):
        """
        Initialize cache service.

        Args:
            ttl: Default time-to-live in seconds (5 minutes)
        """
        self.default_ttl = ttl

    async def get_or_set(
        self,
        key: str,
        factory: Callable[[], T],
        ttl: Union[int, timedelta] = None
    ) -> T:
        """
        Get value from cache or compute and cache it.

        Args:
            key: Cache key
            factory: Async function to compute value if not cached
            ttl: Time-to-live (uses default if not specified)

        Returns:
            Cached or computed value
        """
        cached = await RedisClient.get(key)
        if cached is not None:
            return cached

        value = await factory()
        if value is not None:
            ttl = ttl or self.default_ttl
            await RedisClient.set(key, value, ttl)

        return value

    async def invalidate(self, key: str) -> bool:
        """Invalidate cache key"""
        return await RedisClient.delete(key) > 0

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        keys = await RedisClient.keys(pattern)
        if keys:
            client = RedisClient.get_client()
            return await client.delete(*keys)
        return 0


def cached(
    key_template: str,
    ttl: Union[int, timedelta] = 300,
    key_params: list = None
):
    """
    Decorator for caching function results.

    Args:
        key_template: Redis key template with placeholders
        ttl: Time-to-live in seconds
        key_params: Parameters to use in key template

    Usage:
        @cached("user:{user_id}", ttl=600, key_params=["user_id"])
        async def get_user(user_id: int):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Build cache key
            key_params_list = key_params or []
            key_kwargs = {
                p: kwargs.get(p, args[i] if i < len(args) else None)
                for i, p in enumerate(key_params_list)
            }
            cache_key = key_template.format(**key_kwargs)

            # Try to get from cache
            cached_value = await RedisClient.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Compute value
            result = await func(*args, **kwargs)

            # Cache result
            if result is not None:
                await RedisClient.set(cache_key, result, ttl)

            return result

        return wrapper
    return decorator


class MarketDataCache:
    """Cache for market data"""

    # TTLs
    QUOTE_TTL = 5  # 5 seconds for real-time quotes
    MARKET_DATA_TTL = 60  # 1 minute for market data
    HISTORICAL_TTL = 3600  # 1 hour for historical data

    @staticmethod
    async def get_quote(symbol: str) -> Optional[Dict[str, Any]]:
        """Get cached quote"""
        key = CacheKeys.QUOTE.format(symbol=symbol)
        return await RedisClient.get(key)

    @staticmethod
    async def set_quote(symbol: str, data: Dict[str, Any]) -> bool:
        """Cache quote data"""
        key = CacheKeys.QUOTE.format(symbol=symbol)
        return await RedisClient.set(key, data, ttl=MarketDataCache.QUOTE_TTL)

    @staticmethod
    async def get_multiple_quotes(symbols: list) -> Dict[str, Any]:
        """Get multiple quotes from cache"""
        results = {}
        for symbol in symbols:
            data = await MarketDataCache.get_quote(symbol)
            if data:
                results[symbol] = data
        return results

    @staticmethod
    async def set_multiple_quotes(quotes: Dict[str, Any]) -> bool:
        """Cache multiple quotes"""
        for symbol, data in quotes.items():
            await MarketDataCache.set_quote(symbol, data)
        return True

    @staticmethod
    async def invalidate_quote(symbol: str) -> bool:
        """Invalidate cached quote"""
        key = CacheKeys.QUOTE.format(symbol=symbol)
        return await RedisClient.delete(key) > 0


class UserCache:
    """Cache for user data"""

    USER_TTL = 3600  # 1 hour
    SESSION_TTL = 86400  # 24 hours

    @staticmethod
    async def get_user(user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached user data"""
        key = CacheKeys.USER.format(user_id=user_id)
        return await RedisClient.get(key)

    @staticmethod
    async def set_user(user_id: int, data: Dict[str, Any]) -> bool:
        """Cache user data"""
        key = CacheKeys.USER.format(user_id=user_id)
        return await RedisClient.set(key, data, ttl=UserCache.USER_TTL)

    @staticmethod
    async def invalidate_user(user_id: int) -> bool:
        """Invalidate cached user data"""
        key = CacheKeys.USER.format(user_id=user_id)
        return await RedisClient.delete(key) > 0

    @staticmethod
    async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        key = CacheKeys.USER_SESSION.format(session_id=session_id)
        return await RedisClient.get(key)

    @staticmethod
    async def set_session(
        session_id: str,
        data: Dict[str, Any],
        ttl: int = None
    ) -> bool:
        """Set session data"""
        key = CacheKeys.USER_SESSION.format(session_id=session_id)
        return await RedisClient.set(key, data, ttl=ttl or UserCache.SESSION_TTL)

    @staticmethod
    async def delete_session(session_id: str) -> bool:
        """Delete session"""
        key = CacheKeys.USER_SESSION.format(session_id=session_id)
        return await RedisClient.delete(key) > 0


class RateLimiter:
    """Rate limiting using Redis"""

    @staticmethod
    async def is_allowed(
        identifier: str,
        endpoint: str,
        limit: int,
        window: int = 60
    ) -> tuple[bool, int, int]:
        """
        Check if request is allowed under rate limit.

        Args:
            identifier: Unique identifier (user_id, IP, API key)
            endpoint: API endpoint
            limit: Maximum requests allowed
            window: Time window in seconds

        Returns:
            (is_allowed, current_count, remaining)
        """
        key = CacheKeys.RATE_LIMIT.format(
            identifier=identifier,
            endpoint=endpoint
        )

        # Get current count
        current = await RedisClient.get(key)
        current = int(current) if current else 0

        if current >= limit:
            ttl = await RedisClient.ttl(key)
            return False, current, 0

        # Increment counter
        new_count = await RedisClient.incr(key)

        # Set TTL on first request
        if new_count == 1:
            await RedisClient.expire(key, window)

        remaining = max(0, limit - new_count)
        return True, new_count, remaining

    @staticmethod
    async def reset(identifier: str, endpoint: str) -> bool:
        """Reset rate limit counter"""
        key = CacheKeys.RATE_LIMIT.format(
            identifier=identifier,
            endpoint=endpoint
        )
        return await RedisClient.delete(key) > 0
