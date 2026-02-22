"""
Cache Package
Redis caching layer for the Trading AI system
"""

from app.cache.redis_client import (
    RedisClient,
    CacheKeys,
    init_redis,
    close_redis,
)
from app.cache.cache_service import (
    CacheService,
    cached,
    MarketDataCache,
    UserCache,
    RateLimiter,
)
from app.cache.market_cache import (
    MarketCache,
    WatchlistCache,
    SignalCache,
)

__all__ = [
    # Redis Client
    "RedisClient",
    "CacheKeys",
    "init_redis",
    "close_redis",
    # Cache Service
    "CacheService",
    "cached",
    "MarketDataCache",
    "UserCache",
    "RateLimiter",
    # Market Cache
    "MarketCache",
    "WatchlistCache",
    "SignalCache",
]
