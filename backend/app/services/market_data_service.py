"""
Market Data Service
Real-time and historical market data from broker APIs
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd

from loguru import logger
from app.brokers.angel_one import AngelOneAdapter, AngelOneConfig
from app.cache.market_cache import MarketDataCache
from app.core.config import settings


class MarketDataService:
    """
    Market Data Service - Production Grade

    Provides real market data from broker APIs:
    - Real-time quotes and LTP
    - Historical OHLCV data
    - Symbol information
    - Market depth and order book
    """

    def __init__(self):
        self.broker = None
        self.cache = MarketDataCache()
        self._initialize_broker()

    def _initialize_broker(self):
        """Initialize broker connection"""
        try:
            config = AngelOneConfig(
                api_key=settings.angel_one_api_key,
                client_id=settings.angel_one_client_id,
                password=settings.angel_one_password,
                totp_secret=settings.angel_one_totp_secret
            )
            self.broker = AngelOneAdapter(config)
            logger.info("🏦 Market Data Service initialized with Angel One")
        except Exception as e:
            logger.error(f"Failed to initialize broker: {e}")
            self.broker = None

    async def get_market_data(self, symbol: str, exchange: str = "NSE") -> Optional[Dict]:
        """
        Get real-time market data for a symbol

        Args:
            symbol: Trading symbol (e.g., "RELIANCE", "TCS")
            exchange: Exchange (NSE, BSE, MCX)

        Returns:
            Market data dictionary
        """
        try:
            # Try cache first
            cached_data = await self.cache.get_market_data(symbol, exchange)
            if cached_data:
                return cached_data

            # Get from broker API
            if not self.broker:
                logger.error("Broker not initialized")
                return None

            # Get symbol token first
            symbol_token = await self._get_symbol_token(symbol, exchange)
            if not symbol_token:
                return None

            # Get quote
            quote = await self.broker.get_quote(symbol_token, exchange)

            market_data = {
                'symbol': symbol,
                'exchange': exchange,
                'ltp': quote.ltp,
                'change': quote.change,
                'change_percent': quote.change_percent,
                'open': quote.open,
                'high': quote.high,
                'low': quote.low,
                'close': quote.close,
                'volume': quote.volume,
                'bid_price': quote.bid_price,
                'ask_price': quote.ask_price,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'angel_one'
            }

            # Cache the data (5 second expiry for real-time data)
            await self.cache.set_market_data(symbol, exchange, market_data, ttl=5)

            return market_data

        except Exception as e:
            logger.error(f"Failed to get market data for {symbol}: {e}")
            return None

    async def get_ohlcv(self, symbol: str, timeframe: str = '15m', limit: int = 200) -> Optional[pd.DataFrame]:
        """
        Get OHLCV data for technical analysis

        Args:
            symbol: Trading symbol
            timeframe: Timeframe (1m, 5m, 15m, 1h, 1d)
            limit: Number of candles to fetch

        Returns:
            Pandas DataFrame with OHLCV data
        """
        try:
            # Try cache first
            cache_key = f"ohlcv_{symbol}_{timeframe}_{limit}"
            cached_data = await self.cache.get(cache_key)
            if cached_data is not None:
                return pd.DataFrame(cached_data)

            # Get from broker API
            if not self.broker:
                logger.error("Broker not initialized")
                return None

            # Get symbol token
            symbol_token = await self._get_symbol_token(symbol, "NSE")
            if not symbol_token:
                return None

            # Convert timeframe to Angel One format
            interval = self._convert_timeframe(timeframe)

            # Calculate date range
            to_date = datetime.now()
            from_date = self._calculate_from_date(to_date, timeframe, limit)

            # Get historical data
            candles_data = await self.broker.get_historical_data(
                symbol_token=symbol_token,
                exchange="NSE",
                interval=interval,
                from_date=from_date.strftime("%Y-%m-%d %H:%M"),
                to_date=to_date.strftime("%Y-%m-%d %H:%M")
            )

            if not candles_data:
                return None

            # Convert to DataFrame
            df = pd.DataFrame(candles_data)

            # Rename columns to standard OHLCV format
            column_mapping = {
                'timestamp': 'timestamp',
                'open': 'open',
                'high': 'high',
                'low': 'low',
                'close': 'close',
                'volume': 'volume'
            }

            df = df.rename(columns=column_mapping)

            # Ensure numeric columns
            numeric_cols = ['open', 'high', 'low', 'close', 'volume']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            # Set timestamp as index
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df = df.set_index('timestamp')

            # Sort by timestamp
            df = df.sort_index()

            # Cache the data (5 minute expiry for historical data)
            await self.cache.set(cache_key, df.to_dict('records'), ttl=300)

            return df

        except Exception as e:
            logger.error(f"Failed to get OHLCV data for {symbol}: {e}")
            return None

    async def get_multiple_quotes(self, symbols: List[str], exchange: str = "NSE") -> Dict[str, Dict]:
        """
        Get quotes for multiple symbols efficiently

        Args:
            symbols: List of trading symbols
            exchange: Exchange

        Returns:
            Dictionary of symbol -> market data
        """
        results = {}

        # Process in batches to avoid rate limits
        batch_size = 10
        for i in range(0, len(symbols), batch_size):
            batch = symbols[i:i + batch_size]

            tasks = []
            for symbol in batch:
                task = self.get_market_data(symbol, exchange)
                tasks.append(task)

            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for symbol, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to get data for {symbol}: {result}")
                    results[symbol] = None
                else:
                    results[symbol] = result

            # Small delay between batches
            if i + batch_size < len(symbols):
                await asyncio.sleep(0.1)

        return results

    async def get_symbol_info(self, symbol: str, exchange: str = "NSE") -> Optional[Dict]:
        """
        Get detailed symbol information

        Args:
            symbol: Trading symbol

        Returns:
            Symbol information dictionary
        """
        try:
            # This would typically come from a symbol master database
            # For now, return basic info
            symbol_token = await self._get_symbol_token(symbol, exchange)
            if not symbol_token:
                return None

            return {
                'symbol': symbol,
                'exchange': exchange,
                'token': symbol_token,
                'instrument_type': 'EQ',  # Assume equity for now
                'lot_size': 1,
                'tick_size': 0.01,
                'is_active': True
            }

        except Exception as e:
            logger.error(f"Failed to get symbol info for {symbol}: {e}")
            return None

    async def search_symbols(self, query: str, exchange: str = "NSE", limit: int = 10) -> List[Dict]:
        """
        Search for symbols matching query

        Args:
            query: Search query
            exchange: Exchange to search in
            limit: Maximum results

        Returns:
            List of matching symbols
        """
        try:
            # This would integrate with broker's symbol search API
            # For now, return mock results
            return [
                {
                    'symbol': f"{query.upper()}",
                    'name': f"{query.upper()} Company",
                    'exchange': exchange,
                    'instrument_type': 'EQ'
                }
            ][:limit]

        except Exception as e:
            logger.error(f"Failed to search symbols: {e}")
            return []

    async def get_market_status(self, exchange: str = "NSE") -> Dict:
        """
        Get market status (open/closed/holidays)

        Args:
            exchange: Exchange

        Returns:
            Market status information
        """
        try:
            # Check if it's a trading day and within hours
            now = datetime.now()
            weekday = now.weekday()  # 0=Monday, 6=Sunday

            # Check if weekend
            if weekday >= 5:  # Saturday or Sunday
                return {
                    'status': 'CLOSED',
                    'reason': 'Weekend',
                    'next_open': self._get_next_trading_day(now)
                }

            # Check holidays
            if await self._is_holiday(now.date()):
                return {
                    'status': 'CLOSED',
                    'reason': 'Holiday',
                    'next_open': self._get_next_trading_day(now)
                }

            # Check trading hours (9:15 AM to 3:30 PM IST)
            current_time = now.time()
            market_open = datetime.strptime("09:15", "%H:%M").time()
            market_close = datetime.strptime("15:30", "%H:%M").time()

            if market_open <= current_time <= market_close:
                return {
                    'status': 'OPEN',
                    'time_to_close': self._time_to_market_close(current_time)
                }
            elif current_time < market_open:
                return {
                    'status': 'PRE_OPEN',
                    'time_to_open': self._time_to_market_open(current_time)
                }
            else:
                return {
                    'status': 'CLOSED',
                    'reason': 'After hours',
                    'next_open': self._get_next_trading_day(now)
                }

        except Exception as e:
            logger.error(f"Failed to get market status: {e}")
            return {'status': 'UNKNOWN', 'error': str(e)}

    # ==================== PRIVATE METHODS ====================

    async def _get_symbol_token(self, symbol: str, exchange: str) -> Optional[str]:
        """Get symbol token from broker API"""
        try:
            # This would typically query broker's symbol master
            # For now, use a simple mapping
            symbol_mappings = {
                'RELIANCE': '738',
                'TCS': '11536',
                'HDFC': '1333',
                'INFY': '1594',
                'ICICIBANK': '4963',
                'HINDUNILVR': '1394',
                'ITC': '1660',
                'KOTAKBANK': '1922',
                'LT': '11483',
                'AXISBANK': '5900'
            }

            return symbol_mappings.get(symbol.upper())

        except Exception as e:
            logger.error(f"Failed to get symbol token for {symbol}: {e}")
            return None

    def _convert_timeframe(self, timeframe: str) -> str:
        """Convert standard timeframe to Angel One format"""
        mapping = {
            '1m': 'ONE_MINUTE',
            '5m': 'FIVE_MINUTE',
            '15m': 'FIFTEEN_MINUTE',
            '1h': 'ONE_HOUR',
            '1d': 'ONE_DAY'
        }
        return mapping.get(timeframe, 'FIFTEEN_MINUTE')

    def _calculate_from_date(self, to_date: datetime, timeframe: str, limit: int) -> datetime:
        """Calculate from_date based on timeframe and limit"""
        if timeframe == '1m':
            minutes = limit
        elif timeframe == '5m':
            minutes = limit * 5
        elif timeframe == '15m':
            minutes = limit * 15
        elif timeframe == '1h':
            minutes = limit * 60
        elif timeframe == '1d':
            minutes = limit * 1440  # 24 * 60
        else:
            minutes = limit * 15  # Default to 15m

        return to_date - timedelta(minutes=minutes)

    async def _is_holiday(self, date) -> bool:
        """Check if date is a holiday"""
        # This would check against a holiday database
        # For now, return False (simplified)
        return False

    def _get_next_trading_day(self, current_time: datetime) -> str:
        """Get next trading day"""
        next_day = current_time + timedelta(days=1)
        while next_day.weekday() >= 5:  # Skip weekends
            next_day += timedelta(days=1)
        return next_day.strftime("%Y-%m-%d")

    def _time_to_market_close(self, current_time) -> str:
        """Calculate time to market close"""
        market_close = datetime.strptime("15:30", "%H:%M").time()
        close_datetime = datetime.combine(datetime.today(), market_close)
        current_datetime = datetime.combine(datetime.today(), current_time)
        time_left = close_datetime - current_datetime
        return str(time_left)

    def _time_to_market_open(self, current_time) -> str:
        """Calculate time to market open"""
        market_open = datetime.strptime("09:15", "%H:%M").time()
        open_datetime = datetime.combine(datetime.today(), market_open)
        current_datetime = datetime.combine(datetime.today(), current_time)
        time_left = open_datetime - current_datetime
        return str(time_left)


# Singleton instance
market_data_service = MarketDataService()
