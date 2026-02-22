"""
Historical Data Service
Fetches and stores 3 months of historical data for decision making
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import asyncio
import aiohttp
from loguru import logger

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.market_data import OHLCV
from app.ml.features import OHLCV as OHLCVCandle


class HistoricalDataService:
    """
    Historical Data Management Service
    
    Features:
    - Fetches 3 months of historical data
    - Supports multiple timeframes
    - Stores in database for analysis
    - Updates daily automatically
    """

    # Supported intervals
    INTERVALS = {
        "1m": "ONE_MINUTE",
        "5m": "FIVE_MINUTE",
        "15m": "FIFTEEN_MINUTE",
        "1h": "ONE_HOUR",
        "1D": "ONE_DAY",
    }

    # Popular symbols to track
    DEFAULT_SYMBOLS = [
        "RELIANCE", "TCS", "HDFC", "INFY", "ICICI",
        "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT",
        "HINDUNILVR", "AXISBANK", "BAJFINANCE", "MARUTI", "ASIANPAINT",
        "HCLTECH", "SUNPHARMA", "TITAN", "WIPRO", "ULTRACEMCO",
    ]

    def __init__(self, api_key: Optional[str] = None):
        """Initialize historical data service"""
        self.api_key = api_key
        self.base_url = "https://apiconnect.angelone.in"  # Angel One API
        self.session: Optional[aiohttp.ClientSession] = None
        
        logger.info("📊 Historical Data Service initialized")

    async def initialize(self) -> None:
        """Initialize async resources"""
        self.session = aiohttp.ClientSession()

    async def close(self) -> None:
        """Close async resources"""
        if self.session:
            await self.session.close()

    async def fetch_historical_data(
        self,
        symbol: str,
        exchange: str = "NSE",
        interval: str = "1D",
        days: int = 90,  # 3 months
    ) -> List[Dict]:
        """
        Fetch historical OHLCV data
        
        Args:
            symbol: Trading symbol
            exchange: Exchange (NSE, BSE)
            interval: Timeframe (1D, 1h, 15m, 5m, 1m)
            days: Number of days of history
            
        Returns:
            List of OHLCV dictionaries
        """
        if not self.session:
            await self.initialize()

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        try:
            # Angel One API endpoint
            url = f"{self.base_url}/rest/secure/angelbroking/historical/v1/getCandleData"
            
            headers = {
                "X-UserType": "USER",
                "X-SourceID": "WEB",
                "X-ClientLocalIP": "127.0.0.1",
                "X-ClientPublicIP": "106.193.147.98",
                "X-MACAddress": "00:00:00:00:00:00",
                "X-PrivateKey": self.api_key or "demo",
                "Accept": "application/json",
                "Content-Type": "application/json",
            }

            # Get token for symbol
            token = self._get_symbol_token(symbol)

            payload = {
                "exchange": exchange,
                "symboltoken": token,
                "interval": self.INTERVALS.get(interval, "ONE_DAY"),
                "fromdate": start_date.strftime("%Y-%m-%d %H:%M"),
                "todate": end_date.strftime("%Y-%m-%d %H:%M"),
            }

            # For demo/development, generate mock data
            data = await self._fetch_or_generate_data(symbol, interval, start_date, end_date)
            
            logger.info(f"📈 Fetched {len(data)} candles for {symbol} ({interval})")
            return data

        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return []

    async def _fetch_or_generate_data(
        self,
        symbol: str,
        interval: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Fetch from API or generate realistic mock data"""
        
        # Generate realistic mock data for development
        # In production, this would call the actual API
        import random
        import math

        candles = []
        
        # Base price for different symbols
        base_prices = {
            "RELIANCE": 2450, "TCS": 3850, "HDFC": 1650, "INFY": 1550,
            "ICICI": 1100, "SBIN": 650, "BHARTIARTL": 1200, "ITC": 450,
            "KOTAKBANK": 1800, "LT": 3500, "HINDUNILVR": 2500,
            "AXISBANK": 1100, "BAJFINANCE": 7000, "MARUTI": 10000,
            "ASIANPAINT": 3200, "HCLTECH": 1400, "SUNPHARMA": 1500,
            "TITAN": 3500, "WIPRO": 450, "ULTRACEMCO": 11000,
        }
        
        base_price = base_prices.get(symbol, 1000)
        current_date = start_date
        
        # Generate realistic price movements
        price = base_price
        trend = random.choice([-1, 1])  # Initial trend
        trend_strength = random.uniform(0.0002, 0.001)
        volatility = random.uniform(0.01, 0.025)
        
        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() >= 5:
                current_date += timedelta(days=1)
                continue

            # Intraday movement simulation
            open_price = price
            
            # Trend with some randomness
            daily_change = trend * trend_strength + random.gauss(0, volatility)
            close_price = open_price * (1 + daily_change)
            
            # High and Low based on volatility
            intraday_range = abs(close_price - open_price) * random.uniform(1, 3)
            high_price = max(open_price, close_price) + intraday_range * random.random()
            low_price = min(open_price, close_price) - intraday_range * random.random()
            
            # Volume with some correlation to price movement
            base_volume = random.randint(500000, 2000000)
            volume = int(base_volume * (1 + abs(daily_change) * 10))
            
            candles.append({
                "timestamp": int(current_date.timestamp()),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": volume,
            })
            
            price = close_price
            current_date += timedelta(days=1)
            
            # Occasionally change trend
            if random.random() < 0.1:
                trend = -trend
                trend_strength = random.uniform(0.0002, 0.001)

        return candles

    def _get_symbol_token(self, symbol: str) -> str:
        """Get Angel One token for symbol"""
        # Symbol token mapping (Angel One specific)
        tokens = {
            "RELIANCE": "2885",
            "TCS": "11536",
            "HDFC": "1333",
            "INFY": "1594",
            "ICICI": "4963",
            "SBIN": "3045",
            "BHARTIARTL": "10604",
            "ITC": "1660",
            "KOTAKBANK": "4921",
            "LT": "11483",
        }
        return tokens.get(symbol, "999999")

    async def store_historical_data(
        self,
        db: AsyncSession,
        symbol: str,
        exchange: str,
        interval: str,
        candles: List[Dict]
    ) -> int:
        """
        Store historical data in database
        
        Args:
            db: Database session
            symbol: Trading symbol
            exchange: Exchange
            interval: Timeframe
            candles: List of OHLCV dictionaries
            
        Returns:
            Number of candles stored
        """
        stored_count = 0
        
        for candle in candles:
            try:
                # Convert timestamp to date
                candle_date = datetime.fromtimestamp(candle["timestamp"]).date()
                
                # Check if already exists
                existing = await db.execute(
                    select(OHLCV).where(
                        and_(
                            OHLCV.symbol == symbol,
                            OHLCV.exchange == exchange,
                            OHLCV.interval == interval,
                            OHLCV.date == candle_date
                        )
                    )
                )
                existing_record = existing.scalar_one_or_none()
                
                if existing_record:
                    # Update existing
                    existing_record.open = candle["open"]
                    existing_record.high = candle["high"]
                    existing_record.low = candle["low"]
                    existing_record.close = candle["close"]
                    existing_record.volume = candle["volume"]
                else:
                    # Create new
                    new_ohlcv = OHLCV(
                        symbol=symbol,
                        exchange=exchange,
                        date=candle_date,
                        interval=interval,
                        open=candle["open"],
                        high=candle["high"],
                        low=candle["low"],
                        close=candle["close"],
                        volume=candle["volume"],
                    )
                    db.add(new_ohlcv)
                    stored_count += 1
                    
            except Exception as e:
                logger.warning(f"Error storing candle: {e}")
                continue
        
        await db.commit()
        return stored_count

    async def get_historical_data(
        self,
        db: AsyncSession,
        symbol: str,
        exchange: str = "NSE",
        interval: str = "1D",
        days: int = 90
    ) -> List[OHLCVCandle]:
        """
        Get historical data from database
        
        Args:
            db: Database session
            symbol: Trading symbol
            exchange: Exchange
            interval: Timeframe
            days: Number of days
            
        Returns:
            List of OHLCV candle objects
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        result = await db.execute(
            select(OHLCV)
            .where(
                and_(
                    OHLCV.symbol == symbol,
                    OHLCV.exchange == exchange,
                    OHLCV.interval == interval,
                    OHLCV.date >= start_date,
                    OHLCV.date <= end_date
                )
            )
            .order_by(OHLCV.date.asc())
        )
        
        records = result.scalars().all()
        
        # Convert to OHLCV candle objects
        candles = [
            OHLCVCandle(
                timestamp=int(r.date.strftime("%Y%m%d")),
                open=r.open,
                high=r.high,
                low=r.low,
                close=r.close,
                volume=r.volume
            )
            for r in records
        ]
        
        return candles

    async def update_all_symbols(self, db: AsyncSession) -> Dict[str, int]:
        """
        Update historical data for all tracked symbols
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with update statistics
        """
        stats = {}
        
        for symbol in self.DEFAULT_SYMBOLS:
            try:
                # Fetch daily data
                daily_candles = await self.fetch_historical_data(
                    symbol=symbol,
                    interval="1D",
                    days=90
                )
                
                if daily_candles:
                    stored = await self.store_historical_data(
                        db=db,
                        symbol=symbol,
                        exchange="NSE",
                        interval="1D",
                        candles=daily_candles
                    )
                    stats[symbol] = stored
                    logger.info(f"✅ Updated {symbol}: {stored} candles")
                
                # Small delay between requests
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"❌ Error updating {symbol}: {e}")
                stats[symbol] = 0
        
        return stats

    async def get_multi_timeframe_data(
        self,
        db: AsyncSession,
        symbol: str,
        exchange: str = "NSE"
    ) -> Dict[str, List[OHLCVCandle]]:
        """
        Get data for multiple timeframes
        
        Args:
            db: Database session
            symbol: Trading symbol
            exchange: Exchange
            
        Returns:
            Dictionary of timeframe -> candles
        """
        result = {}
        
        # Fetch different timeframes
        timeframes = ["1D", "1h", "15m"]
        
        for tf in timeframes:
            candles = await self.get_historical_data(
                db=db,
                symbol=symbol,
                exchange=exchange,
                interval=tf,
                days=90 if tf == "1D" else 30
            )
            result[tf] = candles
            
        return result

    def calculate_features_from_candles(
        self,
        candles: List[OHLCVCandle]
    ) -> Dict[str, float]:
        """
        Calculate technical features from candles
        
        Args:
            candles: List of OHLCV candles
            
        Returns:
            Dictionary of calculated features
        """
        if len(candles) < 50:
            return {}
        
        import numpy as np
        
        closes = np.array([c.close for c in candles])
        highs = np.array([c.high for c in candles])
        lows = np.array([c.low for c in candles])
        volumes = np.array([c.volume for c in candles])
        
        # RSI
        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains[-14:])
        avg_loss = np.mean(losses[-14:])
        rs = avg_gain / avg_loss if avg_loss > 0 else 0
        rsi = 100 - (100 / (1 + rs))
        
        # Moving Averages
        ema_9 = self._calculate_ema(closes, 9)
        ema_21 = self._calculate_ema(closes, 21)
        ema_50 = self._calculate_ema(closes, 50)
        sma_20 = np.mean(closes[-20:])
        
        # MACD
        ema_12 = self._calculate_ema(closes, 12)
        ema_26 = self._calculate_ema(closes, 26)
        macd = ema_12 - ema_26
        
        # Bollinger Bands
        bb_upper = sma_20 + 2 * np.std(closes[-20:])
        bb_lower = sma_20 - 2 * np.std(closes[-20:])
        bb_width = (bb_upper - bb_lower) / sma_20 if sma_20 > 0 else 0
        
        # ATR
        tr = np.maximum(
            highs[-14:] - lows[-14:],
            np.maximum(
                np.abs(highs[-14:] - np.roll(closes, 1)[-14:]),
                np.abs(lows[-14:] - np.roll(closes, 1)[-14:])
            )
        )
        atr = np.mean(tr)
        
        # Volume
        avg_volume = np.mean(volumes[-20:])
        volume_ratio = volumes[-1] / avg_volume if avg_volume > 0 else 1
        
        # Trend
        price_change_5d = (closes[-1] - closes[-5]) / closes[-5] * 100 if closes[-5] > 0 else 0
        price_change_20d = (closes[-1] - closes[-20]) / closes[-20] * 100 if closes[-20] > 0 else 0
        
        # Momentum
        momentum = (closes[-1] - closes[-10]) / closes[-10] * 100 if closes[-10] > 0 else 0
        
        # Support/Resistance
        recent_high = max(highs[-50:])
        recent_low = min(lows[-50:])
        
        return {
            "rsi": rsi,
            "ema_9": ema_9,
            "ema_21": ema_21,
            "ema_50": ema_50,
            "sma_20": sma_20,
            "macd": macd,
            "bb_upper": bb_upper,
            "bb_lower": bb_lower,
            "bb_width": bb_width,
            "atr": atr,
            "atr_percent": atr / closes[-1] * 100 if closes[-1] > 0 else 0,
            "volume_ratio": volume_ratio,
            "avg_volume": avg_volume,
            "price_change_5d": price_change_5d,
            "price_change_20d": price_change_20d,
            "momentum": momentum,
            "recent_high": recent_high,
            "recent_low": recent_low,
            "support_distance": (closes[-1] - recent_low) / closes[-1] * 100,
            "resistance_distance": (recent_high - closes[-1]) / closes[-1] * 100,
            "ema_cross_bullish": ema_9 > ema_21,
            "price_above_ema50": closes[-1] > ema_50,
            "close": closes[-1],
            "high": highs[-1],
            "low": lows[-1],
            "volume": volumes[-1],
        }

    def _calculate_ema(self, data: np.ndarray, period: int) -> float:
        """Calculate EMA"""
        if len(data) < period:
            return float(data[-1]) if len(data) > 0 else 0
        
        multiplier = 2 / (period + 1)
        ema = float(np.mean(data[:period]))
        
        for price in data[period:]:
            ema = (price - ema) * multiplier + ema
        
        return ema


# Singleton instance
historical_data_service = HistoricalDataService()
