"""
Pre-Momentum Detection Engine
Detects price movements BEFORE they happen

This module implements leading (not lagging) signal detection using:
1. Order Flow Imbalance (OFI)
2. Volume Acceleration
3. Spread Dynamics
4. Large Lot Detection
5. Price Action Patterns
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime
import numpy as np
from collections import deque

from loguru import logger


class PreMomentumSignal(str, Enum):
    """Pre-momentum signal types"""
    STRONG_BULLISH = "STRONG_BULLISH"
    BULLISH = "BULLISH"
    NEUTRAL = "NEUTRAL"
    BEARISH = "BEARISH"
    STRONG_BEARISH = "STRONG_BEARISH"


@dataclass
class OrderBookSnapshot:
    """Order book snapshot"""
    timestamp: datetime
    bids: List[Tuple[float, int]]  # (price, quantity)
    asks: List[Tuple[float, int]]
    total_bid_qty: int = 0
    total_ask_qty: int = 0
    
    def __post_init__(self):
        self.total_bid_qty = sum(q for _, q in self.bids[:5])
        self.total_ask_qty = sum(q for _, q in self.asks[:5])


@dataclass
class Trade:
    """Single trade data"""
    timestamp: datetime
    price: float
    quantity: int
    side: str  # 'BUY' or 'SELL'
    

@dataclass
class PreMomentumResult:
    """Result from pre-momentum analysis"""
    signal: PreMomentumSignal
    score: float  # 0-100
    confidence: float  # 0-1
    components: Dict[str, float]
    direction: str  # 'LONG', 'SHORT', 'NEUTRAL'
    expected_move: float  # Expected price move in %
    time_to_move: int  # Expected seconds until move
    reasoning: str
    timestamp: datetime = field(default_factory=datetime.now)


class OrderFlowImbalance:
    """
    Order Flow Imbalance (OFI) Calculator
    
    OFI measures the imbalance between buy and sell pressure
    in the order book. High OFI predicts short-term price moves.
    
    Research shows OFI can predict returns 30-60 seconds ahead.
    """
    
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.ofi_history: deque = deque(maxlen=window_size)
        self.prev_bid_qty = 0
        self.prev_ask_qty = 0
        
    def calculate(self, order_book: OrderBookSnapshot) -> float:
        """
        Calculate OFI value
        
        Returns:
            OFI value from -1 (strong sell) to +1 (strong buy)
        """
        bid_qty = order_book.total_bid_qty
        ask_qty = order_book.total_ask_qty
        
        # OFI = change in bid qty - change in ask qty
        bid_change = bid_qty - self.prev_bid_qty
        ask_change = ask_qty - self.prev_ask_qty
        
        # Normalize by total quantity
        total_qty = bid_qty + ask_qty
        if total_qty > 0:
            ofi = (bid_change - ask_change) / total_qty
        else:
            ofi = 0
        
        self.prev_bid_qty = bid_qty
        self.prev_ask_qty = ask_qty
        self.ofi_history.append(ofi)
        
        return np.clip(ofi, -1, 1)
    
    def get_ofi_trend(self) -> float:
        """Get OFI trend (moving average)"""
        if len(self.ofi_history) < 10:
            return 0
        return np.mean(list(self.ofi_history)[-10:])
    
    def get_ofi_acceleration(self) -> float:
        """Get OFI acceleration (rate of change)"""
        if len(self.ofi_history) < 20:
            return 0
        recent = np.mean(list(self.ofi_history)[-5:])
        older = np.mean(list(self.ofi_history)[-20:-15:])
        return recent - older


class VolumeAccelerator:
    """
    Volume Acceleration Detector
    
    Detects unusual volume activity before price moves.
    Volume often surges before significant price movements.
    """
    
    def __init__(self, window_size: int = 60):
        self.window_size = window_size
        self.volume_history: deque = deque(maxlen=window_size)
        self.baseline_volume: Optional[float] = None
        
    def add_volume(self, volume: int) -> None:
        """Add volume data point"""
        self.volume_history.append(volume)
        
        # Update baseline every 30 data points
        if len(self.volume_history) >= 30 and len(self.volume_history) % 30 == 0:
            self.baseline_volume = np.mean(list(self.volume_history))
    
    def calculate_acceleration(self) -> float:
        """
        Calculate volume acceleration
        
        Returns:
            Acceleration factor (1 = normal, 2 = 2x normal, etc.)
        """
        if len(self.volume_history) < 10 or self.baseline_volume is None:
            return 1.0
        
        recent_volume = np.mean(list(self.volume_history)[-5:])
        return recent_volume / self.baseline_volume if self.baseline_volume > 0 else 1.0
    
    def detect_volume_spike(self, current_volume: int) -> Tuple[bool, float]:
        """
        Detect if current volume is a spike
        
        Returns:
            (is_spike, spike_magnitude)
        """
        if len(self.volume_history) < 20:
            return False, 1.0
        
        mean_vol = np.mean(list(self.volume_history)[-20:])
        std_vol = np.std(list(self.volume_history)[-20:])
        
        if std_vol == 0:
            return False, 1.0
        
        z_score = (current_volume - mean_vol) / std_vol
        
        is_spike = z_score > 2.0
        magnitude = max(1.0, current_volume / mean_vol) if mean_vol > 0 else 1.0
        
        return is_spike, magnitude


class SpreadAnalyzer:
    """
    Bid-Ask Spread Analyzer
    
    Spread compression often precedes price moves.
    Market makers tighten spreads when they expect directional moves.
    """
    
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.spread_history: deque = deque(maxlen=window_size)
        
    def add_spread(self, bid: float, ask: float, ltp: float) -> float:
        """
        Add spread data point
        
        Returns:
            Spread ratio (spread / price)
        """
        spread = ask - bid
        spread_ratio = spread / ltp if ltp > 0 else 0
        self.spread_history.append(spread_ratio)
        return spread_ratio
    
    def get_spread_percentile(self) -> float:
        """
        Get current spread percentile (0-100)
        
        Lower percentile = tighter spread = potential move incoming
        """
        if len(self.spread_history) < 20:
            return 50
        
        current = self.spread_history[-1]
        sorted_spreads = sorted(self.spread_history)
        
        # Find percentile
        below = sum(1 for s in sorted_spreads if s < current)
        percentile = (below / len(sorted_spreads)) * 100
        
        return percentile
    
    def is_spread_compressed(self) -> bool:
        """Check if spread is significantly compressed"""
        percentile = self.get_spread_percentile()
        return percentile < 20  # Bottom 20%


class LargeLotDetector:
    """
    Large Lot Activity Detector
    
    Detects institutional/smart money activity through large trades.
    Smart money often positions before retail notices.
    """
    
    def __init__(self, large_lot_threshold: float = 2.0):
        self.large_lot_threshold = large_lot_threshold
        self.trades: deque = deque(maxlen=1000)
        self.avg_trade_size: float = 0
        
    def add_trade(self, trade: Trade) -> None:
        """Add trade to tracking"""
        self.trades.append(trade)
        
        # Update average trade size
        if len(self.trades) >= 100:
            self.avg_trade_size = np.mean([t.quantity for t in self.trades])
    
    def analyze_large_lots(self, window: int = 100) -> Dict:
        """
        Analyze large lot activity
        
        Returns:
            Dictionary with buy_pressure, sell_pressure, net_pressure
        """
        if len(self.trades) < 20 or self.avg_trade_size == 0:
            return {'buy_pressure': 0.5, 'sell_pressure': 0.5, 'net_pressure': 0}
        
        large_trades = [
            t for t in list(self.trades)[-window:]
            if t.quantity > self.avg_trade_size * self.large_lot_threshold
        ]
        
        if not large_trades:
            return {'buy_pressure': 0.5, 'sell_pressure': 0.5, 'net_pressure': 0}
        
        buy_value = sum(t.price * t.quantity for t in large_trades if t.side == 'BUY')
        sell_value = sum(t.price * t.quantity for t in large_trades if t.side == 'SELL')
        total_value = buy_value + sell_value
        
        if total_value == 0:
            return {'buy_pressure': 0.5, 'sell_pressure': 0.5, 'net_pressure': 0}
        
        buy_pressure = buy_value / total_value
        sell_pressure = sell_value / total_value
        net_pressure = (buy_value - sell_value) / total_value
        
        return {
            'buy_pressure': buy_pressure,
            'sell_pressure': sell_pressure,
            'net_pressure': net_pressure,
        }


class PricePatternDetector:
    """
    Pre-Momentum Price Pattern Detection
    
    Detects patterns that precede price moves:
    - Consolidation breakout setup
    - Compression patterns
    - Absorption signals
    """
    
    def __init__(self, window_size: int = 50):
        self.window_size = window_size
        self.price_history: deque = deque(maxlen=window_size)
        self.high_history: deque = deque(maxlen=window_size)
        self.low_history: deque(maxlen=window_size)
        
    def add_price(self, high: float, low: float, close: float) -> None:
        """Add price data"""
        self.price_history.append(close)
        self.high_history.append(high)
        self.low_history.append(low)
    
    def detect_compression(self) -> Tuple[bool, float]:
        """
        Detect price compression (volatility squeeze)
        
        Compression often precedes explosive moves.
        
        Returns:
            (is_compressed, compression_score)
        """
        if len(self.price_history) < 20:
            return False, 0
        
        # Calculate recent range vs older range
        recent_high = max(list(self.high_history)[-10:])
        recent_low = min(list(self.low_history)[-10:])
        recent_range = recent_high - recent_low
        
        older_high = max(list(self.high_history)[-30:-10])
        older_low = min(list(self.low_history)[-30:-10])
        older_range = older_high - older_low
        
        if older_range == 0:
            return False, 0
        
        compression_ratio = recent_range / older_range
        
        # Compression if recent range is less than 50% of older range
        is_compressed = compression_ratio < 0.5
        compression_score = 1 - compression_ratio
        
        return is_compressed, compression_score
    
    def detect_absorption(self) -> Dict:
        """
        Detect absorption (buying/selling pressure absorbed)
        
        Absorption at highs/lows signals reversal or continuation.
        """
        if len(self.price_history) < 20:
            return {'detected': False, 'type': None, 'strength': 0}
        
        closes = list(self.price_history)
        highs = list(self.high_history)
        lows = list(self.low_history)
        
        # Check for absorption at highs (selling absorbed)
        recent_high = max(highs[-10:])
        touches = sum(1 for h in highs[-10:] if h >= recent_high * 0.999)
        
        if touches >= 3 and closes[-1] < recent_high * 0.998:
            return {
                'detected': True,
                'type': 'ABSORPTION_AT_HIGH',
                'strength': touches / 10,
                'direction': 'BEARISH'
            }
        
        # Check for absorption at lows (buying absorbed)
        recent_low = min(lows[-10:])
        touches = sum(1 for l in lows[-10:] if l <= recent_low * 1.001)
        
        if touches >= 3 and closes[-1] > recent_low * 1.002:
            return {
                'detected': True,
                'type': 'ABSORPTION_AT_LOW',
                'strength': touches / 10,
                'direction': 'BULLISH'
            }
        
        return {'detected': False, 'type': None, 'strength': 0}


class PreMomentumEngine:
    """
    Main Pre-Momentum Detection Engine
    
    Combines all pre-momentum indicators into a unified signal.
    Designed to detect moves BEFORE they happen.
    """
    
    # Component weights (calibrated for Indian markets)
    WEIGHTS = {
        'ofi': 0.25,
        'volume_acceleration': 0.15,
        'spread_compression': 0.15,
        'large_lot': 0.25,
        'price_pattern': 0.20,
    }
    
    def __init__(self):
        """Initialize pre-momentum engine"""
        self.ofi = OrderFlowImbalance()
        self.volume_accel = VolumeAccelerator()
        self.spread_analyzer = SpreadAnalyzer()
        self.large_lot_detector = LargeLotDetector()
        self.pattern_detector = PricePatternDetector()
        
        self.last_result: Optional[PreMomentumResult] = None
        
        logger.info("🚀 Pre-Momentum Detection Engine initialized")
    
    async def analyze(
        self,
        order_book: Optional[OrderBookSnapshot] = None,
        volume: Optional[int] = None,
        trades: Optional[List[Trade]] = None,
        price_data: Optional[Dict] = None,
    ) -> PreMomentumResult:
        """
        Perform comprehensive pre-momentum analysis
        
        Args:
            order_book: Current order book snapshot
            volume: Current volume
            trades: Recent trades
            price_data: Dict with 'high', 'low', 'close', 'ltp'
            
        Returns:
            PreMomentumResult with signal and confidence
        """
        scores = {}
        
        # 1. Order Flow Imbalance
        if order_book:
            ofi_value = self.ofi.calculate(order_book)
            ofi_trend = self.ofi.get_ofi_trend()
            ofi_accel = self.ofi.get_ofi_acceleration()
            
            # OFI score (0-100)
            ofi_score = (abs(ofi_value) * 50 + abs(ofi_accel) * 50)
            ofi_direction = 'LONG' if ofi_value > 0.2 else ('SHORT' if ofi_value < -0.2 else 'NEUTRAL')
            scores['ofi'] = {'score': ofi_score, 'direction': ofi_direction, 'value': ofi_value}
        else:
            scores['ofi'] = {'score': 50, 'direction': 'NEUTRAL', 'value': 0}
        
        # 2. Volume Acceleration
        if volume:
            self.volume_accel.add_volume(volume)
            accel_factor = self.volume_accel.calculate_acceleration()
            is_spike, spike_magnitude = self.volume_accel.detect_volume_spike(volume)
            
            vol_score = min(100, accel_factor * 50)
            scores['volume_acceleration'] = {
                'score': vol_score,
                'direction': 'NEUTRAL',  # Volume alone doesn't indicate direction
                'acceleration': accel_factor,
                'is_spike': is_spike
            }
        else:
            scores['volume_acceleration'] = {'score': 50, 'direction': 'NEUTRAL', 'acceleration': 1.0}
        
        # 3. Spread Compression
        if order_book and price_data:
            spread_ratio = self.spread_analyzer.add_spread(
                order_book.bids[0][0] if order_book.bids else price_data['ltp'],
                order_book.asks[0][0] if order_book.asks else price_data['ltp'],
                price_data['ltp']
            )
            is_compressed = self.spread_analyzer.is_spread_compressed()
            spread_percentile = self.spread_analyzer.get_spread_percentile()
            
            # Lower percentile = higher score (tight spread = potential move)
            spread_score = 100 - spread_percentile
            scores['spread_compression'] = {
                'score': spread_score,
                'direction': 'NEUTRAL',
                'is_compressed': is_compressed
            }
        else:
            scores['spread_compression'] = {'score': 50, 'direction': 'NEUTRAL'}
        
        # 4. Large Lot Activity
        if trades:
            for trade in trades[-100:]:  # Last 100 trades
                self.large_lot_detector.add_trade(trade)
            
            lot_analysis = self.large_lot_detector.analyze_large_lots()
            
            # Score based on net pressure
            lot_score = abs(lot_analysis['net_pressure']) * 100
            lot_direction = 'LONG' if lot_analysis['buy_pressure'] > 0.6 else (
                'SHORT' if lot_analysis['sell_pressure'] > 0.6 else 'NEUTRAL'
            )
            scores['large_lot'] = {
                'score': lot_score,
                'direction': lot_direction,
                'buy_pressure': lot_analysis['buy_pressure']
            }
        else:
            scores['large_lot'] = {'score': 50, 'direction': 'NEUTRAL', 'buy_pressure': 0.5}
        
        # 5. Price Pattern Detection
        if price_data:
            self.pattern_detector.add_price(
                price_data.get('high', price_data['ltp']),
                price_data.get('low', price_data['ltp']),
                price_data.get('close', price_data['ltp'])
            )
            
            is_compressed, compression_score = self.pattern_detector.detect_compression()
            absorption = self.pattern_detector.detect_absorption()
            
            pattern_score = compression_score * 100 if is_compressed else 50
            pattern_direction = absorption.get('direction', 'NEUTRAL') if absorption['detected'] else 'NEUTRAL'
            
            scores['price_pattern'] = {
                'score': pattern_score,
                'direction': pattern_direction,
                'is_compressed': is_compressed,
                'absorption': absorption
            }
        else:
            scores['price_pattern'] = {'score': 50, 'direction': 'NEUTRAL'}
        
        # Calculate combined score
        total_score = 0
        for component, data in scores.items():
            total_score += data['score'] * self.WEIGHTS.get(component, 0.2)
        
        # Determine direction (weighted vote)
        direction_votes = {'LONG': 0, 'SHORT': 0, 'NEUTRAL': 0}
        for component, data in scores.items():
            weight = self.WEIGHTS.get(component, 0.2)
            direction_votes[data['direction']] += weight
        
        final_direction = max(direction_votes, key=direction_votes.get)
        
        # Determine signal strength
        if total_score >= 80 and direction_votes['LONG'] > 0.6:
            signal = PreMomentumSignal.STRONG_BULLISH
        elif total_score >= 70 and direction_votes['LONG'] > 0.5:
            signal = PreMomentumSignal.BULLISH
        elif total_score >= 80 and direction_votes['SHORT'] > 0.6:
            signal = PreMomentumSignal.STRONG_BEARISH
        elif total_score >= 70 and direction_votes['SHORT'] > 0.5:
            signal = PreMomentumSignal.BEARISH
        else:
            signal = PreMomentumSignal.NEUTRAL
            final_direction = 'NEUTRAL'
        
        # Calculate confidence
        confidence = min(1.0, total_score / 100)
        
        # Estimate expected move
        expected_move = self._estimate_expected_move(total_score, scores)
        
        # Estimate time to move
        time_to_move = self._estimate_time_to_move(scores)
        
        # Build reasoning
        reasoning = self._build_reasoning(scores, signal)
        
        result = PreMomentumResult(
            signal=signal,
            score=total_score,
            confidence=confidence,
            components=scores,
            direction=final_direction,
            expected_move=expected_move,
            time_to_move=time_to_move,
            reasoning=reasoning,
        )
        
        self.last_result = result
        return result
    
    def _estimate_expected_move(self, total_score: float, scores: Dict) -> float:
        """Estimate expected price move percentage"""
        base_move = total_score / 100 * 2  # Base 2% for max score
        
        # Adjust based on volume acceleration
        vol_accel = scores.get('volume_acceleration', {}).get('acceleration', 1)
        base_move *= min(2, vol_accel)
        
        return round(base_move, 2)
    
    def _estimate_time_to_move(self, scores: Dict) -> int:
        """Estimate seconds until expected move"""
        # OFI leads 30-60 seconds
        # Volume acceleration leads 10-30 seconds
        # Spread compression leads 5-15 seconds
        
        time_estimates = []
        
        if scores['ofi']['score'] > 70:
            time_estimates.append(45)
        
        if scores['volume_acceleration'].get('is_spike'):
            time_estimates.append(20)
        
        if scores['spread_compression'].get('is_compressed'):
            time_estimates.append(10)
        
        if time_estimates:
            return int(np.mean(time_estimates))
        return 60  # Default 1 minute
    
    def _build_reasoning(self, scores: Dict, signal: PreMomentumSignal) -> str:
        """Build human-readable reasoning"""
        reasons = []
        
        if scores['ofi']['score'] > 70:
            ofi_val = scores['ofi']['value']
            reasons.append(f"OFI shows strong {'buying' if ofi_val > 0 else 'selling'} pressure ({ofi_val:.2f})")
        
        if scores['volume_acceleration'].get('is_spike'):
            reasons.append(f"Volume spike detected ({scores['volume_acceleration']['acceleration']:.1f}x normal)")
        
        if scores['spread_compression'].get('is_compressed'):
            reasons.append("Spread compression signals incoming move")
        
        if scores['large_lot']['score'] > 70:
            bp = scores['large_lot'].get('buy_pressure', 0.5)
            reasons.append(f"Large lot activity favors {'buyers' if bp > 0.5 else 'sellers'}")
        
        if scores['price_pattern'].get('is_compressed'):
            reasons.append("Price compression pattern detected")
        
        if scores['price_pattern'].get('absorption', {}).get('detected'):
            abs_type = scores['price_pattern']['absorption']['type']
            reasons.append(f"{abs_type.replace('_', ' ').title()} detected")
        
        if not reasons:
            reasons.append("No strong pre-momentum signals detected")
        
        return " | ".join(reasons)
    
    def get_signal_summary(self) -> Dict:
        """Get summary of current pre-momentum state"""
        if self.last_result is None:
            return {'status': 'no_data'}
        
        return {
            'signal': self.last_result.signal.value,
            'score': self.last_result.score,
            'confidence': self.last_result.confidence,
            'direction': self.last_result.direction,
            'expected_move': f"{self.last_result.expected_move}%",
            'time_to_move': f"{self.last_result.time_to_move}s",
            'reasoning': self.last_result.reasoning,
        }


# Singleton instance
pre_momentum_engine = PreMomentumEngine()
