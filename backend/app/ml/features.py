"""
Feature Engineering for ML Models
Technical indicators and market features
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from dataclasses import dataclass

from loguru import logger


@dataclass
class OHLCV:
    """OHLCV candle data"""
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: int


class FeatureEngineer:
    """
    Feature Engineering for Trading ML Models
    
    Calculates:
    - Technical indicators (RSI, MACD, Bollinger Bands, etc.)
    - Price patterns
    - Volume metrics
    - Volatility measures
    """

    def __init__(self):
        self.feature_names = [
            'rsi', 'rsi_signal',
            'macd', 'macd_signal', 'macd_hist',
            'bb_upper', 'bb_middle', 'bb_lower', 'bb_width', 'bb_position',
            'atr', 'atr_percent',
            'adx', 'adx_direction',
            'cci',
            'momentum', 'momentum_signal',
            'volume_ratio', 'volume_trend',
            'vwap', 'vwap_distance',
            'obv', 'obv_trend',
            'ema_9', 'ema_21', 'ema_50', 'ema_200',
            'ema_cross_9_21', 'ema_cross_21_50',
            'price_change_1d', 'price_change_5d', 'price_change_10d', 'price_change_20d',
            'volatility_10d', 'volatility_20d', 'volatility_ratio',
            'high_low_ratio', 'open_close_ratio', 'gap_percent',
            'true_range', 'avg_true_range',
            'support_distance', 'resistance_distance',
        ]
        
        logger.info(f"📊 Feature Engineer initialized with {len(self.feature_names)} features")

    def calculate_all_features(self, candles: List[OHLCV]) -> Dict[str, float]:
        """
        Calculate all features from OHLCV candles
        
        Args:
            candles: List of OHLCV data (oldest first)
            
        Returns:
            Dictionary of feature values
        """
        if len(candles) < 50:
            logger.warning(f"Insufficient candles: {len(candles)} < 50")
            return self._default_features()
        
        # Convert to arrays
        closes = np.array([c.close for c in candles])
        highs = np.array([c.high for c in candles])
        lows = np.array([c.low for c in candles])
        opens = np.array([c.open for c in candles])
        volumes = np.array([c.volume for c in candles])
        
        features = {}
        
        # RSI
        features.update(self._calculate_rsi(closes, period=14))
        
        # MACD
        features.update(self._calculate_macd(closes))
        
        # Bollinger Bands
        features.update(self._calculate_bollinger(closes, period=20))
        
        # ATR
        features.update(self._calculate_atr(highs, lows, closes, period=14))
        
        # ADX
        features.update(self._calculate_adx(highs, lows, closes, period=14))
        
        # CCI
        features['cci'] = self._calculate_cci(highs, lows, closes, period=20)
        
        # Momentum
        features.update(self._calculate_momentum(closes))
        
        # Volume metrics
        features.update(self._calculate_volume_metrics(volumes, closes))
        
        # VWAP
        features.update(self._calculate_vwap(candles))
        
        # OBV
        features.update(self._calculate_obv(closes, volumes))
        
        # EMAs
        features.update(self._calculate_emas(closes))
        
        # Price changes
        features.update(self._calculate_price_changes(closes))
        
        # Volatility
        features.update(self._calculate_volatility(closes))
        
        # Candle patterns
        features.update(self._calculate_candle_patterns(highs, lows, opens, closes))
        
        # Support/Resistance (simplified)
        features.update(self._calculate_support_resistance(candles))
        
        return features

    def _default_features(self) -> Dict[str, float]:
        """Return default feature values"""
        return {name: 0.0 for name in self.feature_names}

    def _calculate_rsi(self, closes: np.ndarray, period: int = 14) -> Dict[str, float]:
        """Calculate RSI"""
        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        return {
            'rsi': rsi,
            'rsi_signal': 1 if rsi < 30 else (-1 if rsi > 70 else 0)
        }

    def _calculate_macd(self, closes: np.ndarray) -> Dict[str, float]:
        """Calculate MACD"""
        ema_12 = self._ema(closes, 12)
        ema_26 = self._ema(closes, 26)
        
        macd = ema_12 - ema_26
        signal = self._ema(np.array([macd]), 9)[0] if len(closes) > 26 else macd
        hist = macd - signal
        
        return {
            'macd': macd,
            'macd_signal': signal,
            'macd_hist': hist
        }

    def _calculate_bollinger(self, closes: np.ndarray, period: int = 20) -> Dict[str, float]:
        """Calculate Bollinger Bands"""
        middle = np.mean(closes[-period:])
        std = np.std(closes[-period:])
        
        upper = middle + (2 * std)
        lower = middle - (2 * std)
        width = (upper - lower) / middle if middle > 0 else 0
        
        current = closes[-1]
        position = (current - lower) / (upper - lower) if upper != lower else 0.5
        
        return {
            'bb_upper': upper,
            'bb_middle': middle,
            'bb_lower': lower,
            'bb_width': width,
            'bb_position': position
        }

    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> Dict[str, float]:
        """Calculate Average True Range"""
        tr1 = highs[-period:] - lows[-period:]
        tr2 = np.abs(highs[-period:] - np.roll(closes, 1)[-period:])
        tr3 = np.abs(lows[-period:] - np.roll(closes, 1)[-period:])
        
        true_ranges = np.maximum(tr1, np.maximum(tr2, tr3))
        atr = np.mean(true_ranges)
        atr_percent = atr / closes[-1] * 100 if closes[-1] > 0 else 0
        
        return {
            'atr': atr,
            'atr_percent': atr_percent,
            'true_range': true_ranges[-1],
            'avg_true_range': atr
        }

    def _calculate_adx(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> Dict[str, float]:
        """Calculate ADX"""
        plus_dm = highs[1:] - highs[:-1]
        minus_dm = lows[:-1] - lows[1:]
        
        plus_dm = np.where(plus_dm > minus_dm, plus_dm, 0)
        minus_dm = np.where(minus_dm > plus_dm, minus_dm, 0)
        
        # Simplified ADX calculation
        tr = highs - lows
        plus_di = 100 * np.mean(plus_dm[-period:]) / np.mean(tr[-period:]) if np.mean(tr[-period:]) > 0 else 0
        minus_di = 100 * np.mean(minus_dm[-period:]) / np.mean(tr[-period:]) if np.mean(tr[-period:]) > 0 else 0
        
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di) if (plus_di + minus_di) > 0 else 0
        
        return {
            'adx': dx,
            'adx_direction': 1 if plus_di > minus_di else -1
        }

    def _calculate_cci(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 20) -> float:
        """Calculate Commodity Channel Index"""
        tp = (highs[-period:] + lows[-period:] + closes[-period:]) / 3
        mean_tp = np.mean(tp)
        mad = np.mean(np.abs(tp - mean_tp))
        
        if mad == 0:
            return 0
        
        return (tp[-1] - mean_tp) / (0.015 * mad)

    def _calculate_momentum(self, closes: np.ndarray) -> Dict[str, float]:
        """Calculate momentum"""
        if len(closes) < 10:
            return {'momentum': 0, 'momentum_signal': 0}
        
        momentum = (closes[-1] - closes[-10]) / closes[-10] * 100 if closes[-10] > 0 else 0
        
        return {
            'momentum': momentum,
            'momentum_signal': 1 if momentum > 0 else (-1 if momentum < 0 else 0)
        }

    def _calculate_volume_metrics(self, volumes: np.ndarray, closes: np.ndarray) -> Dict[str, float]:
        """Calculate volume metrics"""
        avg_volume = np.mean(volumes[-20:])
        volume_ratio = volumes[-1] / avg_volume if avg_volume > 0 else 1
        
        # Volume trend (increasing/decreasing)
        recent_vol = np.mean(volumes[-5:])
        older_vol = np.mean(volumes[-20:-5])
        volume_trend = (recent_vol - older_vol) / older_vol if older_vol > 0 else 0
        
        return {
            'volume_ratio': volume_ratio,
            'volume_trend': volume_trend
        }

    def _calculate_vwap(self, candles: List[OHLCV]) -> Dict[str, float]:
        """Calculate VWAP"""
        typical_prices = [(c.high + c.low + c.close) / 3 for c in candles[-20:]]
        volumes = [c.volume for c in candles[-20:]]
        
        vwap = sum(tp * v for tp, v in zip(typical_prices, volumes)) / sum(volumes) if sum(volumes) > 0 else typical_prices[-1]
        current_price = candles[-1].close
        vwap_distance = (current_price - vwap) / vwap * 100 if vwap > 0 else 0
        
        return {
            'vwap': vwap,
            'vwap_distance': vwap_distance
        }

    def _calculate_obv(self, closes: np.ndarray, volumes: np.ndarray) -> Dict[str, float]:
        """Calculate On-Balance Volume"""
        obv = 0
        for i in range(1, len(closes)):
            if closes[i] > closes[i-1]:
                obv += volumes[i]
            elif closes[i] < closes[i-1]:
                obv -= volumes[i]
        
        # OBV trend
        recent_obv = sum(volumes[-5:]) if len(volumes) >= 5 else sum(volumes)
        
        return {
            'obv': obv,
            'obv_trend': 1 if obv > 0 else (-1 if obv < 0 else 0)
        }

    def _calculate_emas(self, closes: np.ndarray) -> Dict[str, float]:
        """Calculate multiple EMAs"""
        ema_9 = self._ema(closes, 9)
        ema_21 = self._ema(closes, 21)
        ema_50 = self._ema(closes, 50)
        ema_200 = self._ema(closes, 200) if len(closes) >= 200 else closes[-1]
        
        return {
            'ema_9': ema_9,
            'ema_21': ema_21,
            'ema_50': ema_50,
            'ema_200': ema_200,
            'ema_cross_9_21': 1 if ema_9 > ema_21 else -1,
            'ema_cross_21_50': 1 if ema_21 > ema_50 else -1
        }

    def _calculate_price_changes(self, closes: np.ndarray) -> Dict[str, float]:
        """Calculate price changes"""
        def pct_change(idx):
            if len(closes) <= idx or closes[-idx-1] == 0:
                return 0
            return (closes[-1] - closes[-idx-1]) / closes[-idx-1] * 100
        
        return {
            'price_change_1d': pct_change(1),
            'price_change_5d': pct_change(5),
            'price_change_10d': pct_change(10),
            'price_change_20d': pct_change(20)
        }

    def _calculate_volatility(self, closes: np.ndarray) -> Dict[str, float]:
        """Calculate volatility measures"""
        returns = np.diff(closes[-21:]) / closes[-22:-1]
        
        volatility_10d = np.std(returns[-10:]) * 100 if len(returns) >= 10 else 0
        volatility_20d = np.std(returns) * 100 if len(returns) > 0 else 0
        volatility_ratio = volatility_10d / volatility_20d if volatility_20d > 0 else 1
        
        return {
            'volatility_10d': volatility_10d,
            'volatility_20d': volatility_20d,
            'volatility_ratio': volatility_ratio
        }

    def _calculate_candle_patterns(self, highs: np.ndarray, lows: np.ndarray, opens: np.ndarray, closes: np.ndarray) -> Dict[str, float]:
        """Calculate candle pattern features"""
        high = highs[-1]
        low = lows[-1]
        open_ = opens[-1]
        close = closes[-1]
        
        high_low_ratio = high / low if low > 0 else 1
        open_close_ratio = open_ / close if close > 0 else 1
        gap_percent = (open_ - closes[-2]) / closes[-2] * 100 if closes[-2] > 0 else 0
        
        return {
            'high_low_ratio': high_low_ratio,
            'open_close_ratio': open_close_ratio,
            'gap_percent': gap_percent
        }

    def _calculate_support_resistance(self, candles: List[OHLCV]) -> Dict[str, float]:
        """Calculate support/resistance distances"""
        closes = [c.close for c in candles[-50:]]
        highs = [c.high for c in candles[-50:]]
        lows = [c.low for c in candles[-50:]]
        
        current = candles[-1].close
        
        # Simple support/resistance
        resistance = max(highs)
        support = min(lows)
        
        resistance_distance = (resistance - current) / current * 100 if current > 0 else 0
        support_distance = (current - support) / current * 100 if current > 0 else 0
        
        return {
            'support_distance': support_distance,
            'resistance_distance': resistance_distance
        }

    def _ema(self, data: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(data) < period:
            return data[-1] if len(data) > 0 else 0
        
        multiplier = 2 / (period + 1)
        ema = np.mean(data[:period])
        
        for price in data[period:]:
            ema = (price - ema) * multiplier + ema
        
        return ema


# Singleton instance
feature_engineer = FeatureEngineer()
