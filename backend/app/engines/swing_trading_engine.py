"""
Swing Trading Strategy Engine
Multi-Timeframe Analysis for 2-3 Day Holding Trades
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date, timedelta
from enum import Enum
import numpy as np
from loguru import logger

from app.engines.pre_momentum import pre_momentum_engine, PreMomentumSignal
from app.services.historical_data_service import historical_data_service, OHLCV


class TradeSignal(str, Enum):
    """Trade signal types"""
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    WEAK_BUY = "WEAK_BUY"
    HOLD = "HOLD"
    WEAK_SELL = "WEAK_SELL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"


class TrendDirection(str, Enum):
    """Trend direction"""
    STRONG_UPTREND = "STRONG_UPTREND"
    UPTREND = "UPTREND"
    SIDEWAYS = "SIDEWAYS"
    DOWNTREND = "DOWNTREND"
    STRONG_DOWNTREND = "STRONG_DOWNTREND"


@dataclass
class TimeframeAnalysis:
    """Analysis result for a single timeframe"""
    timeframe: str
    trend: TrendDirection
    signal: TradeSignal
    score: float  # 0-100
    momentum: float  # -100 to 100
    volume_strength: float  # 0-100
    support_distance: float  # % distance to nearest support
    resistance_distance: float  # % distance to nearest resistance
    key_levels: Dict[str, float] = field(default_factory=dict)
    reasoning: str = ""


@dataclass
class MultiTimeframeResult:
    """Combined multi-timeframe analysis result"""
    symbol: str
    overall_signal: TradeSignal
    overall_score: float
    confluence_score: float  # How aligned are timeframes?
    recommended_action: str  # BUY, SELL, HOLD
    recommended_holding_days: int
    best_entry_timeframe: str
    timeframe_analyses: Dict[str, TimeframeAnalysis]
    
    # Entry parameters
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: Optional[float]
    target_3: Optional[float]
    risk_reward_ratio: float
    
    # Risk assessment
    risk_level: str
    confidence: float
    
    # Pre-momentum data
    pre_momentum_score: float
    
    reasoning: str


class SwingTradingEngine:
    """
    Swing Trading Strategy Engine
    
    Features:
    - Multi-timeframe analysis (Weekly, Daily, 4H, 1H)
    - Trend confluence detection
    - Dynamic target calculation
    - Risk-reward optimization
    - Pre-momentum detection
    """

    # Timeframe weights for signal generation
    TIMEFRAME_WEIGHTS = {
        "WEEKLY": 0.30,   # Macro trend direction
        "DAILY": 0.35,    # Primary signal generation
        "4H": 0.20,       # Entry timing
        "1H": 0.15,       # Precise entry
    }

    # Thresholds
    MIN_CONFIDENCE = 0.65
    MIN_RISK_REWARD = 1.5
    MAX_RISK_PERCENT = 2.0

    def __init__(self):
        """Initialize swing trading engine"""
        self.analysis_history: Dict[str, List[MultiTimeframeResult]] = {}
        
        logger.info("📊 Swing Trading Engine initialized")

    async def analyze(
        self,
        symbol: str,
        historical_data: Dict[str, List[OHLCV]],
        current_price: float,
        additional_data: Optional[Dict] = None
    ) -> MultiTimeframeResult:
        """
        Perform comprehensive multi-timeframe analysis
        
        Args:
            symbol: Trading symbol
            historical_data: Dict of timeframe -> OHLCV candles
            current_price: Current market price
            additional_data: Additional market data
            
        Returns:
            MultiTimeframeResult with complete analysis
        """
        logger.info(f"📈 Analyzing {symbol} for swing trade opportunity")
        
        # 1. Analyze each timeframe
        timeframe_analyses = {}
        
        for tf_name, candles in historical_data.items():
            if candles and len(candles) >= 20:
                tf_analysis = self._analyze_timeframe(tf_name, candles, current_price)
                timeframe_analyses[tf_name] = tf_analysis
        
        # 2. Calculate confluence
        confluence_score = self._calculate_confluence(timeframe_analyses)
        
        # 3. Determine overall signal
        overall_signal, overall_score = self._determine_overall_signal(timeframe_analyses)
        
        # 4. Calculate entry parameters
        entry_params = self._calculate_entry_parameters(
            timeframe_analyses, 
            current_price, 
            overall_signal
        )
        
        # 5. Determine recommended holding period
        holding_days = self._determine_holding_period(timeframe_analyses, confluence_score)
        
        # 6. Get best entry timeframe
        best_tf = self._get_best_entry_timeframe(timeframe_analyses)
        
        # 7. Assess risk
        risk_level = self._assess_risk(timeframe_analyses, confluence_score)
        
        # 8. Calculate pre-momentum score (simplified)
        pre_momentum_score = self._calculate_pre_momentum(timeframe_analyses)
        
        # 9. Determine action
        recommended_action = self._get_recommended_action(
            overall_signal, 
            confluence_score, 
            entry_params["risk_reward_ratio"]
        )
        
        # 10. Build reasoning
        reasoning = self._build_reasoning(timeframe_analyses, overall_signal, confluence_score)
        
        result = MultiTimeframeResult(
            symbol=symbol,
            overall_signal=overall_signal,
            overall_score=overall_score,
            confluence_score=confluence_score,
            recommended_action=recommended_action,
            recommended_holding_days=holding_days,
            best_entry_timeframe=best_tf,
            timeframe_analyses=timeframe_analyses,
            entry_price=entry_params["entry_price"],
            stop_loss=entry_params["stop_loss"],
            target_1=entry_params["target_1"],
            target_2=entry_params.get("target_2"),
            target_3=entry_params.get("target_3"),
            risk_reward_ratio=entry_params["risk_reward_ratio"],
            risk_level=risk_level,
            confidence=confluence_score / 100,
            pre_momentum_score=pre_momentum_score,
            reasoning=reasoning,
        )
        
        # Store in history
        if symbol not in self.analysis_history:
            self.analysis_history[symbol] = []
        self.analysis_history[symbol].append(result)
        
        return result

    def _analyze_timeframe(
        self,
        timeframe: str,
        candles: List[OHLCV],
        current_price: float
    ) -> TimeframeAnalysis:
        """Analyze a single timeframe"""
        
        closes = np.array([c.close for c in candles])
        highs = np.array([c.high for c in candles])
        lows = np.array([c.low for c in candles])
        volumes = np.array([c.volume for c in candles])
        
        # Calculate indicators
        features = historical_data_service.calculate_features_from_candles(candles)
        
        # Determine trend
        trend = self._determine_trend(closes, highs, lows, features)
        
        # Calculate momentum
        momentum = self._calculate_momentum(closes, features)
        
        # Calculate volume strength
        volume_strength = self._calculate_volume_strength(volumes, features)
        
        # Find key levels
        key_levels = self._find_key_levels(highs, lows, closes)
        
        # Calculate distances
        support_distance = features.get("support_distance", 5)
        resistance_distance = features.get("resistance_distance", 5)
        
        # Generate signal for this timeframe
        signal, score = self._generate_timeframe_signal(
            trend, momentum, volume_strength, features
        )
        
        # Build reasoning
        reasoning = self._build_timeframe_reasoning(
            timeframe, trend, signal, features
        )
        
        return TimeframeAnalysis(
            timeframe=timeframe,
            trend=trend,
            signal=signal,
            score=score,
            momentum=momentum,
            volume_strength=volume_strength,
            support_distance=support_distance,
            resistance_distance=resistance_distance,
            key_levels=key_levels,
            reasoning=reasoning,
        )

    def _determine_trend(
        self,
        closes: np.ndarray,
        highs: np.ndarray,
        lows: np.ndarray,
        features: Dict
    ) -> TrendDirection:
        """Determine trend direction"""
        
        # Higher Highs and Higher Lows check
        recent_highs = highs[-20:]
        recent_lows = lows[-20:]
        
        hh_count = 0  # Higher highs count
        ll_count = 0  # Lower lows count
        hl_count = 0  # Higher lows count
        lh_count = 0  # Lower highs count
        
        for i in range(1, len(recent_highs)):
            if recent_highs[i] > recent_highs[i-1]:
                hh_count += 1
            else:
                lh_count += 1
                
            if recent_lows[i] > recent_lows[i-1]:
                hl_count += 1
            else:
                ll_count += 1
        
        # EMA trend
        ema_bullish = features.get("ema_cross_bullish", False)
        above_ema50 = features.get("price_above_ema50", False)
        
        # Price change trend
        change_5d = features.get("price_change_5d", 0)
        change_20d = features.get("price_change_20d", 0)
        
        # RSI trend
        rsi = features.get("rsi", 50)
        
        # Scoring
        bullish_score = 0
        bearish_score = 0
        
        if hh_count > lh_count:
            bullish_score += 2
        else:
            bearish_score += 2
            
        if hl_count > ll_count:
            bullish_score += 2
        else:
            bearish_score += 2
            
        if ema_bullish:
            bullish_score += 2
            
        if above_ema50:
            bullish_score += 1
            
        if change_5d > 2:
            bullish_score += 2
        elif change_5d < -2:
            bearish_score += 2
            
        if change_20d > 5:
            bullish_score += 2
        elif change_20d < -5:
            bearish_score += 2
        
        # Determine trend
        if bullish_score >= 8:
            return TrendDirection.STRONG_UPTREND
        elif bullish_score >= 5:
            return TrendDirection.UPTREND
        elif bearish_score >= 8:
            return TrendDirection.STRONG_DOWNTREND
        elif bearish_score >= 5:
            return TrendDirection.DOWNTREND
        else:
            return TrendDirection.SIDEWAYS

    def _calculate_momentum(self, closes: np.ndarray, features: Dict) -> float:
        """Calculate momentum (-100 to 100)"""
        
        momentum = features.get("momentum", 0)
        rsi = features.get("rsi", 50)
        macd = features.get("macd", 0)
        
        # Normalize momentum
        momentum_score = momentum * 10  # Scale to -100 to 100
        
        # RSI contribution
        rsi_score = (rsi - 50) * 2  # Scale to -100 to 100
        
        # MACD contribution
        price = closes[-1]
        macd_score = (macd / price) * 1000 if price > 0 else 0
        
        # Combined
        combined = momentum_score * 0.4 + rsi_score * 0.3 + macd_score * 0.3
        
        return np.clip(combined, -100, 100)

    def _calculate_volume_strength(self, volumes: np.ndarray, features: Dict) -> float:
        """Calculate volume strength (0-100)"""
        
        volume_ratio = features.get("volume_ratio", 1)
        
        # Volume trend
        recent_vol = np.mean(volumes[-5:])
        older_vol = np.mean(volumes[-20:-5])
        vol_trend = recent_vol / older_vol if older_vol > 0 else 1
        
        # Score
        score = (volume_ratio * 50 + vol_trend * 50) / 2
        score = min(100, score * 50)  # Scale to 0-100
        
        return score

    def _find_key_levels(
        self,
        highs: np.ndarray,
        lows: np.ndarray,
        closes: np.ndarray
    ) -> Dict[str, float]:
        """Find key support and resistance levels"""
        
        # Recent swing highs and lows
        lookback = min(50, len(highs))
        
        resistance_levels = []
        support_levels = []
        
        for i in range(2, lookback - 2):
            # Swing high
            if (highs[-i-1] > highs[-i] and highs[-i-1] > highs[-i-2] and
                highs[-i-1] > highs[-i+1] and highs[-i-1] > highs[-i+2]):
                resistance_levels.append(highs[-i-1])
            
            # Swing low
            if (lows[-i-1] < lows[-i] and lows[-i-1] < lows[-i-2] and
                lows[-i-1] < lows[-i+1] and lows[-i-1] < lows[-i+2]):
                support_levels.append(lows[-i-1])
        
        return {
            "resistance_1": resistance_levels[0] if resistance_levels else max(highs[-20:]),
            "resistance_2": resistance_levels[1] if len(resistance_levels) > 1 else None,
            "support_1": support_levels[0] if support_levels else min(lows[-20:]),
            "support_2": support_levels[1] if len(support_levels) > 1 else None,
        }

    def _generate_timeframe_signal(
        self,
        trend: TrendDirection,
        momentum: float,
        volume_strength: float,
        features: Dict
    ) -> Tuple[TradeSignal, float]:
        """Generate signal for a timeframe"""
        
        score = 50  # Base score
        
        # Trend contribution
        trend_scores = {
            TrendDirection.STRONG_UPTREND: 25,
            TrendDirection.UPTREND: 15,
            TrendDirection.SIDEWAYS: 0,
            TrendDirection.DOWNTREND: -15,
            TrendDirection.STRONG_DOWNTREND: -25,
        }
        score += trend_scores.get(trend, 0)
        
        # Momentum contribution
        score += momentum * 0.2
        
        # Volume contribution
        if volume_strength > 60:
            score += 10
        elif volume_strength < 40:
            score -= 5
        
        # RSI contribution
        rsi = features.get("rsi", 50)
        if rsi < 30:
            score += 15  # Oversold - potential reversal
        elif rsi > 70:
            score -= 15  # Overbought - potential reversal
        elif 40 <= rsi <= 60:
            score += 5  # Neutral
        
        # EMA cross contribution
        if features.get("ema_cross_bullish"):
            score += 10
        
        # Price action
        change_5d = features.get("price_change_5d", 0)
        if -5 < change_5d < -2:  # Pullback in uptrend
            score += 5
        elif 2 < change_5d < 5:  # Moderate gain
            score += 5
        
        score = np.clip(score, 0, 100)
        
        # Determine signal
        if score >= 80:
            signal = TradeSignal.STRONG_BUY
        elif score >= 65:
            signal = TradeSignal.BUY
        elif score >= 55:
            signal = TradeSignal.WEAK_BUY
        elif score <= 20:
            signal = TradeSignal.STRONG_SELL
        elif score <= 35:
            signal = TradeSignal.SELL
        elif score <= 45:
            signal = TradeSignal.WEAK_SELL
        else:
            signal = TradeSignal.HOLD
        
        return signal, score

    def _calculate_confluence(self, analyses: Dict[str, TimeframeAnalysis]) -> float:
        """Calculate how aligned all timeframes are"""
        
        if not analyses:
            return 0
        
        # Get signals and weights
        signals = []
        weights = []
        
        for tf_name, analysis in analyses.items():
            weight = self.TIMEFRAME_WEIGHTS.get(tf_name.upper(), 0.25)
            
            # Convert signal to numeric
            signal_values = {
                TradeSignal.STRONG_BUY: 100,
                TradeSignal.BUY: 75,
                TradeSignal.WEAK_BUY: 55,
                TradeSignal.HOLD: 50,
                TradeSignal.WEAK_SELL: 45,
                TradeSignal.SELL: 25,
                TradeSignal.STRONG_SELL: 0,
            }
            
            signals.append(signal_values.get(analysis.signal, 50))
            weights.append(weight)
        
        # Normalize weights
        total_weight = sum(weights)
        weights = [w / total_weight for w in weights]
        
        # Weighted average
        weighted_signal = sum(s * w for s, w in zip(signals, weights))
        
        # Calculate alignment (how close all signals are)
        if len(signals) > 1:
            std_dev = np.std(signals)
            alignment = max(0, 100 - std_dev)
        else:
            alignment = 100
        
        # Confluence = weighted signal * alignment factor
        confluence = weighted_signal * (alignment / 100)
        
        return round(confluence, 2)

    def _determine_overall_signal(
        self,
        analyses: Dict[str, TimeframeAnalysis]
    ) -> Tuple[TradeSignal, float]:
        """Determine overall signal from all timeframes"""
        
        if not analyses:
            return TradeSignal.HOLD, 50
        
        # Get weighted scores
        total_score = 0
        total_weight = 0
        
        for tf_name, analysis in analyses.items():
            weight = self.TIMEFRAME_WEIGHTS.get(tf_name.upper(), 0.25)
            total_score += analysis.score * weight
            total_weight += weight
        
        overall_score = total_score / total_weight if total_weight > 0 else 50
        
        # Determine signal
        if overall_score >= 80:
            signal = TradeSignal.STRONG_BUY
        elif overall_score >= 65:
            signal = TradeSignal.BUY
        elif overall_score >= 55:
            signal = TradeSignal.WEAK_BUY
        elif overall_score <= 20:
            signal = TradeSignal.STRONG_SELL
        elif overall_score <= 35:
            signal = TradeSignal.SELL
        elif overall_score <= 45:
            signal = TradeSignal.WEAK_SELL
        else:
            signal = TradeSignal.HOLD
        
        return signal, round(overall_score, 2)

    def _calculate_entry_parameters(
        self,
        analyses: Dict[str, TimeframeAnalysis],
        current_price: float,
        signal: TradeSignal
    ) -> Dict:
        """Calculate entry, stop loss, and targets"""
        
        if signal in [TradeSignal.HOLD, TradeSignal.WEAK_SELL, TradeSignal.WEAK_BUY]:
            return {
                "entry_price": current_price,
                "stop_loss": current_price,
                "target_1": current_price,
                "target_2": None,
                "target_3": None,
                "risk_reward_ratio": 0,
            }
        
        # Get key levels from daily analysis
        daily_analysis = analyses.get("1D") or analyses.get("DAILY")
        
        if daily_analysis:
            key_levels = daily_analysis.key_levels
            support = key_levels.get("support_1", current_price * 0.97)
            resistance = key_levels.get("resistance_1", current_price * 1.03)
        else:
            support = current_price * 0.97
            resistance = current_price * 1.03
        
        is_long = signal in [TradeSignal.BUY, TradeSignal.STRONG_BUY]
        
        if is_long:
            entry_price = current_price
            stop_loss = max(support, current_price * 0.97)  # Max 3% stop loss
            
            # Targets based on risk
            risk = entry_price - stop_loss
            target_1 = entry_price + risk * 1.5
            target_2 = entry_price + risk * 2.0
            target_3 = entry_price + risk * 3.0
            
        else:  # Short
            entry_price = current_price
            stop_loss = min(resistance, current_price * 1.03)
            
            risk = stop_loss - entry_price
            target_1 = entry_price - risk * 1.5
            target_2 = entry_price - risk * 2.0
            target_3 = entry_price - risk * 3.0
        
        # Risk-reward ratio
        risk_rr = 1.5 if target_1 else 0
        
        return {
            "entry_price": round(entry_price, 2),
            "stop_loss": round(stop_loss, 2),
            "target_1": round(target_1, 2),
            "target_2": round(target_2, 2),
            "target_3": round(target_3, 2),
            "risk_reward_ratio": risk_rr,
        }

    def _determine_holding_period(
        self,
        analyses: Dict[str, TimeframeAnalysis],
        confluence: float
    ) -> int:
        """Determine recommended holding period"""
        
        # Higher confluence = longer holding potential
        if confluence >= 75:
            return 3  # 3 days
        elif confluence >= 60:
            return 2  # 2 days
        else:
            return 1  # 1 day (if target hits intraday)

    def _get_best_entry_timeframe(self, analyses: Dict[str, TimeframeAnalysis]) -> str:
        """Get best timeframe for entry timing"""
        
        # Prefer lower timeframes for entry timing
        for tf in ["1H", "4H", "1D", "WEEKLY"]:
            if tf.lower() in analyses or tf in analyses:
                return tf
        
        return "1D"

    def _assess_risk(
        self,
        analyses: Dict[str, TimeframeAnalysis],
        confluence: float
    ) -> str:
        """Assess trade risk level"""
        
        if confluence >= 80:
            return "LOW"
        elif confluence >= 65:
            return "MEDIUM"
        elif confluence >= 50:
            return "HIGH"
        else:
            return "EXTREME"

    def _calculate_pre_momentum(self, analyses: Dict[str, TimeframeAnalysis]) -> float:
        """Calculate simplified pre-momentum score"""
        
        # Combine momentum from all timeframes
        momentum_scores = [a.momentum for a in analyses.values()]
        
        if not momentum_scores:
            return 0
        
        avg_momentum = np.mean(momentum_scores)
        
        # Convert to 0-100 scale
        pre_momentum = (avg_momentum + 100) / 2
        
        return round(pre_momentum, 2)

    def _get_recommended_action(
        self,
        signal: TradeSignal,
        confluence: float,
        risk_reward: float
    ) -> str:
        """Get recommended action"""
        
        if signal in [TradeSignal.STRONG_BUY, TradeSignal.BUY]:
            if confluence >= 65 and risk_reward >= 1.5:
                return "BUY"
            elif confluence >= 55:
                return "CONDITIONAL_BUY"
        elif signal in [TradeSignal.STRONG_SELL, TradeSignal.SELL]:
            if confluence >= 35 and risk_reward >= 1.5:
                return "SELL"
            elif confluence <= 45:
                return "CONDITIONAL_SELL"
        
        return "HOLD"

    def _build_reasoning(
        self,
        analyses: Dict[str, TimeframeAnalysis],
        signal: TradeSignal,
        confluence: float
    ) -> str:
        """Build reasoning for the analysis"""
        
        reasons = []
        
        # Timeframe breakdown
        for tf_name, analysis in analyses.items():
            reasons.append(f"{tf_name}: {analysis.trend.value} ({analysis.signal.value})")
        
        # Confluence
        reasons.append(f"Confluence: {confluence:.0f}%")
        
        # Signal
        reasons.append(f"Signal: {signal.value}")
        
        return " | ".join(reasons)

    def _build_timeframe_reasoning(
        self,
        timeframe: str,
        trend: TrendDirection,
        signal: TradeSignal,
        features: Dict
    ) -> str:
        """Build reasoning for timeframe analysis"""
        
        rsi = features.get("rsi", 50)
        momentum = features.get("momentum", 0)
        
        parts = [
            f"Trend: {trend.value}",
            f"RSI: {rsi:.0f}",
            f"Momentum: {momentum:.1f}%",
        ]
        
        return ", ".join(parts)


# Singleton instance
swing_trading_engine = SwingTradingEngine()
