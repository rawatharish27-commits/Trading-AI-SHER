"""
Enhanced Historical Data Service
Fetches 2 YEARS of historical data for proper trend analysis
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


class EnhancedHistoricalDataService:
    """
    Enhanced Historical Data Management
    
    Fetches:
    - 2 YEARS of daily data (500+ candles) for weekly trend
    - 6 MONTHS of hourly data for swing analysis
    - 3 MONTHS of 15-min data for entry timing
    
    This ensures:
    - 100+ weekly candles for macro trend
    - 120+ daily candles for swing analysis
    - Proper moving averages, support/resistance
    """

    # Data requirements for different analysis
    DATA_REQUIREMENTS = {
        "WEEKLY_TREND": {
            "interval": "1D",
            "days": 730,  # 2 years = ~500 daily candles = ~100 weekly candles
            "purpose": "Macro trend direction, major support/resistance"
        },
        "DAILY_ANALYSIS": {
            "interval": "1D",
            "days": 365,  # 1 year = ~250 candles
            "purpose": "Swing trade signals, trend confirmation"
        },
        "HOURLY_ENTRY": {
            "interval": "1H",
            "days": 180,  # 6 months = ~1200 hourly candles
            "purpose": "Entry timing, intraday levels"
        },
        "INTRADAY_TIMING": {
            "interval": "15M",
            "days": 90,  # 3 months
            "purpose": "Precise entry timing"
        }
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
        self.base_url = "https://apiconnect.angelone.in"
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Cache for quick access
        self._cache: Dict[str, Dict[str, List]] = {}
        
        logger.info("📊 Enhanced Historical Data Service initialized")

    async def initialize(self) -> None:
        """Initialize async resources"""
        self.session = aiohttp.ClientSession()

    async def close(self) -> None:
        """Close async resources"""
        if self.session:
            await self.session.close()

    async def fetch_full_historical_data(
        self,
        symbol: str,
        exchange: str = "NSE",
        include_hourly: bool = True,
        include_intraday: bool = False
    ) -> Dict[str, List[Dict]]:
        """
        Fetch comprehensive historical data
        
        Args:
            symbol: Trading symbol
            exchange: Exchange (NSE, BSE)
            include_hourly: Include hourly data (takes longer)
            include_intraday: Include 15-min data (takes longest)
            
        Returns:
            Dictionary with data for different timeframes
        """
        if not self.session:
            await self.initialize()

        result = {}
        
        # 1. Always fetch 2 years of daily data (for weekly trend)
        logger.info(f"📈 Fetching 2 years daily data for {symbol}...")
        daily_data = await self._fetch_data(
            symbol=symbol,
            exchange=exchange,
            interval="1D",
            days=730  # 2 years
        )
        result["1D"] = daily_data
        logger.info(f"✅ Fetched {len(daily_data)} daily candles for {symbol}")
        
        # 2. Optionally fetch hourly data
        if include_hourly:
            logger.info(f"📈 Fetching 6 months hourly data for {symbol}...")
            hourly_data = await self._fetch_data(
                symbol=symbol,
                exchange=exchange,
                interval="1H",
                days=180
            )
            result["1H"] = hourly_data
            logger.info(f"✅ Fetched {len(hourly_data)} hourly candles for {symbol}")
        
        # 3. Optionally fetch 15-min data
        if include_intraday:
            logger.info(f"📈 Fetching 3 months 15-min data for {symbol}...")
            intraday_data = await self._fetch_data(
                symbol=symbol,
                exchange=exchange,
                interval="15M",
                days=90
            )
            result["15M"] = intraday_data
            logger.info(f"✅ Fetched {len(intraday_data)} 15-min candles for {symbol}")
        
        # Cache the data
        self._cache[symbol] = result
        
        return result

    async def _fetch_data(
        self,
        symbol: str,
        exchange: str,
        interval: str,
        days: int
    ) -> List[Dict]:
        """Fetch data from API or generate realistic data"""
        
        # For production, this would call actual API
        # For development, generate realistic data
        return await self._generate_realistic_data(symbol, interval, days)

    async def _generate_realistic_data(
        self,
        symbol: str,
        interval: str,
        days: int
    ) -> List[Dict]:
        """Generate realistic historical data"""
        
        import random
        import math

        candles = []
        
        # Base prices for different symbols
        base_prices = {
            "RELIANCE": 2450, "TCS": 3850, "HDFC": 1650, "INFY": 1550,
            "ICICI": 1100, "SBIN": 650, "BHARTIARTL": 1200, "ITC": 450,
            "KOTAKBANK": 1800, "LT": 3500, "HINDUNILVR": 2500,
            "AXISBANK": 1100, "BAJFINANCE": 7000, "MARUTI": 10000,
            "ASIANPAINT": 3200, "HCLTECH": 1400, "SUNPHARMA": 1500,
            "TITAN": 3500, "WIPRO": 450, "ULTRACEMCO": 11000,
        }
        
        base_price = base_prices.get(symbol, 1000)
        
        # Calculate number of candles based on interval
        if interval == "1D":
            # Skip weekends
            total_candles = days * 5 // 7
        elif interval == "1H":
            # ~6 hours per day
            total_candles = days * 6
        else:  # 15M
            # ~24 candles per day
            total_candles = days * 24
        
        # Limit for development
        total_candles = min(total_candles, 1000)
        
        # Generate with realistic market cycles
        price = base_price * 0.8  # Start 20% lower for growth simulation
        
        # Market cycle simulation (bull/bear markets)
        cycle_length = 100  # candles per cycle
        cycle_phase = 0
        cycle_direction = 1  # 1 = bull, -1 = bear
        
        for i in range(total_candles):
            # Market cycle
            if i % cycle_length == 0:
                cycle_direction *= -1
            
            # Trend component
            trend = cycle_direction * 0.0003
            
            # Random component
            noise = random.gauss(0, 0.01)
            
            # Combine
            change = trend + noise
            price = price * (1 + change)
            
            # OHLC generation
            open_price = price
            close_price = price * (1 + random.gauss(0, 0.005))
            high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.01))
            low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.01))
            
            # Volume with some correlation to price movement
            base_volume = random.randint(500000, 2000000)
            volume = int(base_volume * (1 + abs(change) * 20))
            
            candles.append({
                "timestamp": i,
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": volume,
            })
            
            price = close_price

        logger.debug(f"Generated {len(candles)} {interval} candles for {symbol}")
        return candles

    def create_weekly_from_daily(self, daily_candles: List[Dict]) -> List[Dict]:
        """
        Convert daily candles to weekly candles
        
        This gives us weekly data even if API only provides daily
        """
        if not daily_candles:
            return []
        
        weekly = []
        current_week = None
        week_data = []
        
        for candle in daily_candles:
            # Group by week (simplified - every 5 candles = 1 week)
            ts = candle["timestamp"]
            week_num = ts // 5
            
            if current_week is None:
                current_week = week_num
            
            if week_num != current_week:
                # Create weekly candle from week_data
                if week_data:
                    weekly.append({
                        "timestamp": current_week,
                        "open": week_data[0]["open"],
                        "high": max(c["high"] for c in week_data),
                        "low": min(c["low"] for c in week_data),
                        "close": week_data[-1]["close"],
                        "volume": sum(c["volume"] for c in week_data),
                    })
                
                week_data = []
                current_week = week_num
            
            week_data.append(candle)
        
        # Last week
        if week_data:
            weekly.append({
                "timestamp": current_week,
                "open": week_data[0]["open"],
                "high": max(c["high"] for c in week_data),
                "low": min(c["low"] for c in week_data),
                "close": week_data[-1]["close"],
                "volume": sum(c["volume"] for c in week_data),
            })
        
        return weekly

    def analyze_trend_quality(
        self,
        candles: List[Dict],
        timeframe: str = "DAILY"
    ) -> Dict:
        """
        Analyze trend quality with proper statistics
        
        Args:
            candles: OHLCV candles
            timeframe: DAILY, WEEKLY, etc.
            
        Returns:
            Trend analysis with confidence metrics
        """
        import numpy as np
        
        if len(candles) < 50:
            return {
                "trend": "INSUFFICIENT_DATA",
                "confidence": 0,
                "candles_available": len(candles),
                "candles_needed": 50,
                "message": f"Need at least 50 candles for reliable analysis, got {len(candles)}"
            }
        
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        
        # Calculate multiple EMAs
        ema_20 = self._calculate_ema(closes, 20)
        ema_50 = self._calculate_ema(closes, 50)
        ema_100 = self._calculate_ema(closes, 100) if len(closes) >= 100 else ema_50
        ema_200 = self._calculate_ema(closes, 200) if len(closes) >= 200 else ema_100
        
        current_price = closes[-1]
        
        # Trend scoring
        bullish_signals = 0
        bearish_signals = 0
        
        # Price above/below EMAs
        if current_price > ema_20:
            bullish_signals += 1
        else:
            bearish_signals += 1
            
        if current_price > ema_50:
            bullish_signals += 2
        else:
            bearish_signals += 2
            
        if current_price > ema_100:
            bullish_signals += 2
        else:
            bearish_signals += 2
            
        if current_price > ema_200:
            bullish_signals += 3
        else:
            bearish_signals += 3
        
        # EMA crossovers
        if ema_20 > ema_50:
            bullish_signals += 2
        else:
            bearish_signals += 2
            
        if ema_50 > ema_100:
            bullish_signals += 1
        else:
            bearish_signals += 1
        
        # Higher highs / Higher lows
        recent_highs = highs[-20:]
        recent_lows = lows[-20:]
        
        hh_count = sum(1 for i in range(1, len(recent_highs)) if recent_highs[i] > recent_highs[i-1])
        ll_count = sum(1 for i in range(1, len(recent_lows)) if recent_lows[i] < recent_lows[i-1])
        
        if hh_count > ll_count:
            bullish_signals += 2
        else:
            bearish_signals += 2
        
        # Price momentum
        if len(closes) >= 20:
            change_20 = (closes[-1] - closes[-20]) / closes[-20] * 100
            if change_20 > 5:
                bullish_signals += 2
            elif change_20 < -5:
                bearish_signals += 2
        
        # Determine trend
        total_signals = bullish_signals + bearish_signals
        if total_signals == 0:
            trend = "SIDEWAYS"
            confidence = 0.5
        else:
            bullish_pct = bullish_signals / total_signals
            
            if bullish_pct >= 0.75:
                trend = "STRONG_UPTREND"
                confidence = bullish_pct
            elif bullish_pct >= 0.60:
                trend = "UPTREND"
                confidence = bullish_pct
            elif bullish_pct <= 0.25:
                trend = "STRONG_DOWNTREND"
                confidence = 1 - bullish_pct
            elif bullish_pct <= 0.40:
                trend = "DOWNTREND"
                confidence = 1 - bullish_pct
            else:
                trend = "SIDEWAYS"
                confidence = 0.5
        
        # Calculate trend strength (ADX-like)
        atr = self._calculate_atr(highs, lows, closes, 14)
        atr_pct = atr / current_price * 100 if current_price > 0 else 0
        
        # Trend quality score
        quality_score = confidence * (100 - atr_pct * 10) / 100
        quality_score = max(0, min(1, quality_score))
        
        return {
            "trend": trend,
            "confidence": round(confidence, 2),
            "quality_score": round(quality_score, 2),
            "bullish_signals": bullish_signals,
            "bearish_signals": bearish_signals,
            "candles_available": len(candles),
            "current_price": round(current_price, 2),
            "ema_20": round(ema_20, 2),
            "ema_50": round(ema_50, 2),
            "ema_100": round(ema_100, 2),
            "ema_200": round(ema_200, 2),
            "atr_percent": round(atr_pct, 2),
            "timeframe": timeframe,
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

    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int) -> float:
        """Calculate ATR"""
        if len(highs) < period + 1:
            return 0
        
        tr = []
        for i in range(1, len(highs)):
            tr_val = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            )
            tr.append(tr_val)
        
        return np.mean(tr[-period:]) if tr else 0

    def get_multi_timeframe_trend(
        self,
        daily_candles: List[Dict],
        hourly_candles: List[Dict] = None
    ) -> Dict:
        """
        Get comprehensive multi-timeframe trend analysis
        
        Args:
            daily_candles: 2 years of daily data
            hourly_candles: 6 months of hourly data
            
        Returns:
            Complete trend analysis across timeframes
        """
        result = {}
        
        # Create weekly from daily
        weekly_candles = self.create_weekly_from_daily(daily_candles)
        
        # Analyze weekly trend (MACRO)
        if len(weekly_candles) >= 50:
            result["WEEKLY"] = self.analyze_trend_quality(weekly_candles, "WEEKLY")
            result["WEEKLY"]["candles_count"] = len(weekly_candles)
            result["WEEKLY"]["purpose"] = "MACRO TREND - Primary direction for 2-3 day trades"
        else:
            result["WEEKLY"] = {
                "trend": "INSUFFICIENT_DATA",
                "message": f"Need 50+ weekly candles, got {len(weekly_candles)}. Fetch at least 1 year of daily data."
            }
        
        # Analyze daily trend (SWING)
        if len(daily_candles) >= 50:
            result["DAILY"] = self.analyze_trend_quality(daily_candles[-100:], "DAILY")  # Last 100 days
            result["DAILY"]["candles_count"] = len(daily_candles)
            result["DAILY"]["purpose"] = "SWING TREND - Trade signal generation"
        
        # Analyze hourly trend (ENTRY)
        if hourly_candles and len(hourly_candles) >= 50:
            result["HOURLY"] = self.analyze_trend_quality(hourly_candles[-200:], "HOURLY")  # Last 200 hours
            result["HOURLY"]["candles_count"] = len(hourly_candles)
            result["HOURLY"]["purpose"] = "ENTRY TIMING - Precise entry points"
        
        # Overall confluence
        trends = [r.get("trend") for r in result.values() if isinstance(r, dict) and "trend" in r]
        
        if trends:
            bullish_count = sum(1 for t in trends if "UP" in str(t))
            bearish_count = sum(1 for t in trends if "DOWN" in str(t))
            
            if bullish_count >= 2:
                result["CONFLUENCE"] = "BULLISH"
            elif bearish_count >= 2:
                result["CONFLUENCE"] = "BEARISH"
            else:
                result["CONFLUENCE"] = "MIXED"
        else:
            result["CONFLUENCE"] = "INSUFFICIENT_DATA"
        
        return result


# Singleton instance
enhanced_historical_service = EnhancedHistoricalDataService()
