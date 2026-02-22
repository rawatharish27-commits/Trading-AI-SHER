"""
Market Cache
Specialized caching for market data
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from app.cache.redis_client import RedisClient, CacheKeys


class MarketCache:
    """Specialized cache for market data with real-time updates"""

    # Cache TTLs
    QUOTE_TTL = 5  # Real-time quotes: 5 seconds
    DEPTH_TTL = 2  # Market depth: 2 seconds
    INDEX_TTL = 10  # Index data: 10 seconds
    GAINER_LOSER_TTL = 30  # Gainers/Losers: 30 seconds
    SECTOR_TTL = 60  # Sector data: 1 minute
    HISTORICAL_TTL = 3600  # Historical data: 1 hour

    @staticmethod
    async def cache_quote(symbol: str, quote_data: Dict[str, Any]) -> bool:
        """Cache real-time quote data"""
        key = CacheKeys.QUOTE.format(symbol=symbol)
        return await RedisClient.set(key, quote_data, ttl=MarketCache.QUOTE_TTL)

    @staticmethod
    async def get_quote(symbol: str) -> Optional[Dict[str, Any]]:
        """Get cached quote data"""
        key = CacheKeys.QUOTE.format(symbol=symbol)
        return await RedisClient.get(key)

    @staticmethod
    async def cache_quotes(quotes: Dict[str, Dict[str, Any]]) -> bool:
        """Cache multiple quotes at once"""
        for symbol, quote_data in quotes.items():
            await MarketCache.cache_quote(symbol, quote_data)
        return True

    @staticmethod
    async def get_quotes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get multiple cached quotes"""
        quotes = {}
        for symbol in symbols:
            quote = await MarketCache.get_quote(symbol)
            if quote:
                quotes[symbol] = quote
        return quotes

    @staticmethod
    async def cache_market_depth(
        symbol: str,
        depth_data: Dict[str, Any]
    ) -> bool:
        """Cache market depth (bids/asks)"""
        key = CacheKeys.MARKET_DEPTH.format(symbol=symbol)
        return await RedisClient.set(key, depth_data, ttl=MarketCache.DEPTH_TTL)

    @staticmethod
    async def get_market_depth(symbol: str) -> Optional[Dict[str, Any]]:
        """Get cached market depth"""
        key = CacheKeys.MARKET_DEPTH.format(symbol=symbol)
        return await RedisClient.get(key)

    @staticmethod
    async def cache_index_data(
        index_name: str,
        index_data: Dict[str, Any]
    ) -> bool:
        """Cache index data (NIFTY, BANKNIFTY, etc.)"""
        key = CacheKeys.INDEX_DATA.format(index_name=index_name)
        return await RedisClient.set(key, index_data, ttl=MarketCache.INDEX_TTL)

    @staticmethod
    async def get_index_data(index_name: str) -> Optional[Dict[str, Any]]:
        """Get cached index data"""
        key = CacheKeys.INDEX_DATA.format(index_name=index_name)
        return await RedisClient.get(key)

    @staticmethod
    async def cache_all_indices(indices: Dict[str, Dict[str, Any]]) -> bool:
        """Cache all major indices"""
        for index_name, index_data in indices.items():
            await MarketCache.cache_index_data(index_name, index_data)
        return True

    @staticmethod
    async def get_all_indices(
        index_names: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Get all cached indices"""
        indices = {}
        for index_name in index_names:
            data = await MarketCache.get_index_data(index_name)
            if data:
                indices[index_name] = data
        return indices

    @staticmethod
    async def cache_gainers_losers(
        exchange: str,
        gainers: List[Dict[str, Any]],
        losers: List[Dict[str, Any]]
    ) -> bool:
        """Cache top gainers and losers"""
        key_gainers = f"gainers:{exchange}"
        key_losers = f"losers:{exchange}"

        await RedisClient.set(key_gainers, gainers, ttl=MarketCache.GAINER_LOSER_TTL)
        await RedisClient.set(key_losers, losers, ttl=MarketCache.GAINER_LOSER_TTL)
        return True

    @staticmethod
    async def get_gainers(exchange: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached top gainers"""
        key = f"gainers:{exchange}"
        return await RedisClient.get(key)

    @staticmethod
    async def get_losers(exchange: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached top losers"""
        key = f"losers:{exchange}"
        return await RedisClient.get(key)

    @staticmethod
    async def cache_sector_performance(
        sector_data: Dict[str, Dict[str, Any]]
    ) -> bool:
        """Cache sector-wise performance"""
        key = "sectors:performance"
        return await RedisClient.set(key, sector_data, ttl=MarketCache.SECTOR_TTL)

    @staticmethod
    async def get_sector_performance() -> Optional[Dict[str, Dict[str, Any]]]:
        """Get cached sector performance"""
        key = "sectors:performance"
        return await RedisClient.get(key)

    @staticmethod
    async def cache_ohlcv(
        symbol: str,
        interval: str,
        data: List[Dict[str, Any]]
    ) -> bool:
        """Cache OHLCV data for a symbol and interval"""
        key = f"ohlcv:{symbol}:{interval}"
        return await RedisClient.set(key, data, ttl=MarketCache.HISTORICAL_TTL)

    @staticmethod
    async def get_ohlcv(
        symbol: str,
        interval: str
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached OHLCV data"""
        key = f"ohlcv:{symbol}:{interval}"
        return await RedisClient.get(key)

    @staticmethod
    async def cache_technical_indicators(
        symbol: str,
        indicators: Dict[str, Any]
    ) -> bool:
        """Cache technical indicators for a symbol"""
        key = f"indicators:{symbol}"
        return await RedisClient.set(key, indicators, ttl=MarketCache.HISTORICAL_TTL)

    @staticmethod
    async def get_technical_indicators(
        symbol: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached technical indicators"""
        key = f"indicators:{symbol}"
        return await RedisClient.get(key)

    @staticmethod
    async def invalidate_symbol(symbol: str) -> bool:
        """Invalidate all cached data for a symbol"""
        patterns = [
            CacheKeys.QUOTE.format(symbol=symbol),
            CacheKeys.MARKET_DEPTH.format(symbol=symbol),
            f"ohlcv:{symbol}:*",
            f"indicators:{symbol}",
        ]

        for pattern in patterns:
            if "*" in pattern:
                keys = await RedisClient.keys(pattern)
                if keys:
                    client = RedisClient.get_client()
                    await client.delete(*keys)
            else:
                await RedisClient.delete(pattern)

        return True


class WatchlistCache:
    """Cache for user watchlists"""

    WATCHLIST_TTL = 300  # 5 minutes

    @staticmethod
    async def cache_watchlist(
        user_id: int,
        watchlist: List[Dict[str, Any]]
    ) -> bool:
        """Cache user's watchlist"""
        key = f"watchlist:user:{user_id}"
        return await RedisClient.set(
            key,
            watchlist,
            ttl=WatchlistCache.WATCHLIST_TTL
        )

    @staticmethod
    async def get_watchlist(user_id: int) -> Optional[List[Dict[str, Any]]]:
        """Get cached watchlist"""
        key = f"watchlist:user:{user_id}"
        return await RedisClient.get(key)

    @staticmethod
    async def invalidate_watchlist(user_id: int) -> bool:
        """Invalidate cached watchlist"""
        key = f"watchlist:user:{user_id}"
        return await RedisClient.delete(key) > 0


class SignalCache:
    """Cache for trading signals"""

    SIGNAL_TTL = 60  # 1 minute

    @staticmethod
    async def cache_active_signals(
        signals: List[Dict[str, Any]]
    ) -> bool:
        """Cache active signals"""
        key = CacheKeys.SIGNALS_ACTIVE
        return await RedisClient.set(key, signals, ttl=SignalCache.SIGNAL_TTL)

    @staticmethod
    async def get_active_signals() -> Optional[List[Dict[str, Any]]]:
        """Get cached active signals"""
        key = CacheKeys.SIGNALS_ACTIVE
        return await RedisClient.get(key)

    @staticmethod
    async def cache_user_signals(
        user_id: int,
        signals: List[Dict[str, Any]]
    ) -> bool:
        """Cache user's signals"""
        key = CacheKeys.SIGNALS_USER.format(user_id=user_id)
        return await RedisClient.set(key, signals, ttl=SignalCache.SIGNAL_TTL)

    @staticmethod
    async def get_user_signals(user_id: int) -> Optional[List[Dict[str, Any]]]:
        """Get cached user signals"""
        key = CacheKeys.SIGNALS_USER.format(user_id=user_id)
        return await RedisClient.get(key)

    @staticmethod
    async def invalidate_user_signals(user_id: int) -> bool:
        """Invalidate cached user signals"""
        key = CacheKeys.SIGNALS_USER.format(user_id=user_id)
        return await RedisClient.delete(key) > 0
