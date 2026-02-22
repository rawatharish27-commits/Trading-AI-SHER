"""
Redis Client
Redis connection manager for caching
"""

import json
from typing import Any, Dict, Optional, Union
from datetime import timedelta

import redis.asyncio as redis
from redis.asyncio import Redis
from redis.asyncio.connection import ConnectionPool

from app.core.config import settings


class RedisClient:
    """Redis client for caching and pub/sub"""

    _pool: Optional[ConnectionPool] = None
    _client: Optional[Redis] = None

    @classmethod
    async def init(cls) -> None:
        """Initialize Redis connection pool"""
        if cls._pool is None:
            cls._pool = ConnectionPool(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                password=settings.redis_password,
                decode_responses=True,
                max_connections=50,
            )
            cls._client = redis.Redis(connection_pool=cls._pool)

    @classmethod
    async def close(cls) -> None:
        """Close Redis connection"""
        if cls._client:
            await cls._client.close()
        if cls._pool:
            await cls._pool.disconnect()
        cls._client = None
        cls._pool = None

    @classmethod
    def get_client(cls) -> Redis:
        """Get Redis client"""
        if cls._client is None:
            raise RuntimeError("Redis client not initialized. Call init() first.")
        return cls._client

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        """Get value from Redis"""
        client = cls.get_client()
        value = await client.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    @classmethod
    async def set(
        cls,
        key: str,
        value: Any,
        ttl: Union[int, timedelta] = None
    ) -> bool:
        """Set value in Redis with optional TTL"""
        client = cls.get_client()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await client.set(key, value, ex=ttl)

    @classmethod
    async def delete(cls, key: str) -> int:
        """Delete key from Redis"""
        client = cls.get_client()
        return await client.delete(key)

    @classmethod
    async def exists(cls, key: str) -> bool:
        """Check if key exists"""
        client = cls.get_client()
        return await client.exists(key) > 0

    @classmethod
    async def expire(cls, key: str, ttl: Union[int, timedelta]) -> bool:
        """Set TTL for key"""
        client = cls.get_client()
        return await client.expire(key, ttl)

    @classmethod
    async def ttl(cls, key: str) -> int:
        """Get remaining TTL for key"""
        client = cls.get_client()
        return await client.ttl(key)

    @classmethod
    async def incr(cls, key: str, amount: int = 1) -> int:
        """Increment counter"""
        client = cls.get_client()
        return await client.incrby(key, amount)

    @classmethod
    async def decr(cls, key: str, amount: int = 1) -> int:
        """Decrement counter"""
        client = cls.get_client()
        return await client.decrby(key, amount)

    @classmethod
    async def hset(cls, name: str, key: str, value: Any) -> int:
        """Set hash field"""
        client = cls.get_client()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await client.hset(name, key, value)

    @classmethod
    async def hget(cls, name: str, key: str) -> Optional[Any]:
        """Get hash field"""
        client = cls.get_client()
        value = await client.hget(name, key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    @classmethod
    async def hgetall(cls, name: str) -> Dict[str, Any]:
        """Get all hash fields"""
        client = cls.get_client()
        data = await client.hgetall(name)
        result = {}
        for k, v in data.items():
            try:
                result[k] = json.loads(v)
            except json.JSONDecodeError:
                result[k] = v
        return result

    @classmethod
    async def hdel(cls, name: str, key: str) -> int:
        """Delete hash field"""
        client = cls.get_client()
        return await client.hdel(name, key)

    @classmethod
    async def lpush(cls, key: str, *values: Any) -> int:
        """Push to list"""
        client = cls.get_client()
        serialized = [
            json.dumps(v) if isinstance(v, (dict, list)) else v
            for v in values
        ]
        return await client.lpush(key, *serialized)

    @classmethod
    async def rpop(cls, key: str) -> Optional[Any]:
        """Pop from list"""
        client = cls.get_client()
        value = await client.rpop(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    @classmethod
    async def lrange(cls, key: str, start: int = 0, end: int = -1) -> list:
        """Get list range"""
        client = cls.get_client()
        values = await client.lrange(key, start, end)
        result = []
        for v in values:
            try:
                result.append(json.loads(v))
            except json.JSONDecodeError:
                result.append(v)
        return result

    @classmethod
    async def publish(cls, channel: str, message: Any) -> int:
        """Publish message to channel"""
        client = cls.get_client()
        if isinstance(message, (dict, list)):
            message = json.dumps(message)
        return await client.publish(channel, message)

    @classmethod
    async def keys(cls, pattern: str) -> list:
        """Get keys matching pattern"""
        client = cls.get_client()
        return await client.keys(pattern)


# Cache key prefixes
class CacheKeys:
    """Cache key prefixes for different data types"""

    # User
    USER = "user:{user_id}"
    USER_SESSION = "session:{session_id}"
    USER_SETTINGS = "user:{user_id}:settings"

    # Market
    QUOTE = "quote:{symbol}"
    QUOTES = "quotes:{exchange}"
    MARKET_DATA = "market:{symbol}:{date}"
    MARKET_DEPTH = "depth:{symbol}"
    INDEX_DATA = "index:{index_name}"

    # Trading
    SIGNAL = "signal:{signal_id}"
    SIGNALS_USER = "signals:user:{user_id}"
    SIGNALS_ACTIVE = "signals:active"
    ORDER = "order:{order_id}"
    POSITION = "position:{position_id}"
    PORTFOLIO = "portfolio:{user_id}"

    # Rate Limiting
    RATE_LIMIT = "rate_limit:{identifier}:{endpoint}"

    # API
    API_KEY = "api_key:{key_prefix}"


# Initialize Redis on app startup
async def init_redis() -> None:
    """Initialize Redis connection"""
    await RedisClient.init()


async def close_redis() -> None:
    """Close Redis connection"""
    await RedisClient.close()
