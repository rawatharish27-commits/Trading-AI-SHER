"""
Strategy Ensemble Engine
Multiple strategy combination with weighted voting
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum

import numpy as np
from loguru import logger


class SignalDirection(str, Enum):
    """Signal directions"""
    LONG = "LONG"
    SHORT = "SHORT"
    NEUTRAL = "NEUTRAL"


class MarketRegime(str, Enum):
    """Market regimes"""
    TRENDING = "TRENDING"
    MEAN_REVERTING = "MEAN_REVERTING"
    CHOPPY = "CHOPPY"
    PANIC = "PANIC"


@dataclass
class StrategyOpinion:
    """Opinion from a single strategy"""
    strategy_id: str
    strategy_name: str
    direction: SignalDirection
    confidence: float
    regime_fit: float
    supported_regime: bool
    weight: float
    metadata: Dict


@dataclass
class EnsembleResult:
    """Final ensemble result"""
    direction: SignalDirection
    probability: float
    consensus: str  # STRONG, MODERATE, WEAK, CONFLICT
    signals: List[StrategyOpinion]
    weighted_votes: float
    conflict_detected: bool
    recommended_action: str


class StrategyBase(ABC):
    """Base class for all trading strategies"""

    def __init__(
        self,
        strategy_id: str,
        name: str,
        supported_regimes: List[MarketRegime],
        weight: float = 1.0,
        min_confidence: float = 0.6
    ):
        self.strategy_id = strategy_id
        self.name = name
        self.supported_regimes = supported_regimes
        self.weight = weight
        self.min_confidence = min_confidence

    @abstractmethod
    def evaluate(self, market_data: Dict, regime: MarketRegime) -> StrategyOpinion:
        """Evaluate market data and produce opinion"""
        pass

    def is_regime_supported(self, regime: MarketRegime) -> bool:
        """Check if strategy supports current regime"""
        return regime in self.supported_regimes

    def calculate_regime_fit(self, regime: MarketRegime) -> float:
        """Calculate how well strategy fits current regime"""
        if regime in self.supported_regimes:
            return 1.0
        return 0.5


class VwapTrendStrategy(StrategyBase):
    """VWAP Trend Following Strategy"""

    def __init__(self):
        super().__init__(
            strategy_id="vwap_trend",
            name="VWAP Trend Rider",
            supported_regimes=[MarketRegime.TRENDING],
            weight=1.2
        )

    def evaluate(self, market_data: Dict, regime: MarketRegime) -> StrategyOpinion:
        """Evaluate VWAP-based trend signal"""
        ltp = market_data.get('ltp', 0)
        vwap = market_data.get('vwap', ltp)
        volume = market_data.get('volume', 0)
        avg_volume = market_data.get('avg_volume', volume)

        if ltp == 0 or vwap == 0:
            return StrategyOpinion(
                strategy_id=self.strategy_id,
                strategy_name=self.name,
                direction=SignalDirection.NEUTRAL,
                confidence=0,
                regime_fit=0,
                supported_regime=False,
                weight=self.weight,
                metadata={}
            )

        # Calculate distance from VWAP
        distance = (ltp - vwap) / vwap

        direction = SignalDirection.NEUTRAL
        confidence = 0

        if distance > 0.002:  # 0.2% above VWAP
            direction = SignalDirection.LONG
            confidence = min(distance * 50, 1.0)
        elif distance < -0.002:
            direction = SignalDirection.SHORT
            confidence = min(abs(distance) * 50, 1.0)

        # Volume confirmation
        volume_ratio = volume / avg_volume if avg_volume > 0 else 1
        if volume_ratio > 1.5:
            confidence *= 1.1

        regime_fit = self.calculate_regime_fit(regime)

        return StrategyOpinion(
            strategy_id=self.strategy_id,
            strategy_name=self.name,
            direction=direction,
            confidence=confidence,
            regime_fit=regime_fit,
            supported_regime=self.is_regime_supported(regime),
            weight=self.weight,
            metadata={'vwap_distance': distance, 'volume_ratio': volume_ratio}
        )


class RsiExtremeStrategy(StrategyBase):
    """RSI Extreme Reversal Strategy"""

    def __init__(self):
        super().__init__(
            strategy_id="rsi_extreme",
            name="RSI Extreme Reversal",
            supported_regimes=[MarketRegime.MEAN_REVERTING, MarketRegime.CHOPPY],
            weight=1.0
        )
        self.oversold = 30
        self.overbought = 70

    def evaluate(self, market_data: Dict, regime: MarketRegime) -> StrategyOpinion:
        """Evaluate RSI-based reversal signal"""
        rsi = market_data.get('rsi', 50)

        direction = SignalDirection.NEUTRAL
        confidence = 0

        if rsi < self.oversold:
            direction = SignalDirection.LONG
            confidence = (self.oversold - rsi) / self.oversold
        elif rsi > self.overbought:
            direction = SignalDirection.SHORT
            confidence = (rsi - self.overbought) / (100 - self.overbought)

        # Extreme readings boost confidence
        if rsi < 20 or rsi > 80:
            confidence *= 1.3

        # Reduce in trending markets
        if regime == MarketRegime.TRENDING:
            confidence *= 0.7

        regime_fit = self.calculate_regime_fit(regime)

        return StrategyOpinion(
            strategy_id=self.strategy_id,
            strategy_name=self.name,
            direction=direction,
            confidence=confidence,
            regime_fit=regime_fit,
            supported_regime=self.is_regime_supported(regime),
            weight=self.weight,
            metadata={'rsi': rsi}
        )


class MomentumStrategy(StrategyBase):
    """Momentum Strategy"""

    def __init__(self):
        super().__init__(
            strategy_id="momentum",
            name="Momentum Rider",
            supported_regimes=[MarketRegime.TRENDING],
            weight=1.1
        )

    def evaluate(self, market_data: Dict, regime: MarketRegime) -> StrategyOpinion:
        """Evaluate momentum signal"""
        momentum = market_data.get('momentum', 0)
        price_change = market_data.get('price_change', 0)

        direction = SignalDirection.NEUTRAL
        confidence = 0

        if momentum > 0.02 and price_change > 0:
            direction = SignalDirection.LONG
            confidence = min(momentum * 20, 1.0)
        elif momentum < -0.02 and price_change < 0:
            direction = SignalDirection.SHORT
            confidence = min(abs(momentum) * 20, 1.0)

        regime_fit = self.calculate_regime_fit(regime)

        return StrategyOpinion(
            strategy_id=self.strategy_id,
            strategy_name=self.name,
            direction=direction,
            confidence=confidence,
            regime_fit=regime_fit,
            supported_regime=self.is_regime_supported(regime),
            weight=self.weight,
            metadata={'momentum': momentum}
        )


class StrategyEnsemble:
    """
    Ensemble of multiple strategies with weighted voting
    
    Combines signals from multiple strategies to produce
    a final probability and direction.
    """

    def __init__(self):
        """Initialize ensemble with default strategies"""
        self.strategies: List[StrategyBase] = [
            VwapTrendStrategy(),
            RsiExtremeStrategy(),
            MomentumStrategy(),
        ]

        # Strategy performance tracking
        self.performance: Dict[str, Dict] = {
            s.strategy_id: {'wins': 0, 'losses': 0, 'total': 0}
            for s in self.strategies
        }

        logger.info(f"🎯 Strategy Ensemble initialized with {len(self.strategies)} strategies")

    def evaluate(
        self,
        market_data: Dict,
        regime: MarketRegime = MarketRegime.CHOPPY
    ) -> EnsembleResult:
        """
        Evaluate all strategies and combine opinions
        
        Args:
            market_data: Market data for evaluation
            regime: Current market regime
            
        Returns:
            EnsembleResult with combined signal
        """
        # Get opinions from all strategies
        opinions = [
            strategy.evaluate(market_data, regime)
            for strategy in self.strategies
        ]

        # Calculate weighted votes
        long_votes = 0
        short_votes = 0
        total_weight = 0

        for opinion in opinions:
            weight = opinion.weight * opinion.regime_fit * opinion.confidence
            total_weight += opinion.weight

            if opinion.direction == SignalDirection.LONG:
                long_votes += weight
            elif opinion.direction == SignalDirection.SHORT:
                short_votes += weight

        # Determine final direction
        if long_votes > short_votes:
            direction = SignalDirection.LONG
            weighted_votes = long_votes
        elif short_votes > long_votes:
            direction = SignalDirection.SHORT
            weighted_votes = short_votes
        else:
            direction = SignalDirection.NEUTRAL
            weighted_votes = 0

        # Calculate probability
        total_votes = long_votes + short_votes
        if total_votes > 0:
            probability = weighted_votes / total_votes
        else:
            probability = 0.5

        # Determine consensus strength
        consensus = self._determine_consensus(opinions, probability)

        # Check for conflict
        conflict_detected = self._detect_conflict(opinions)

        # Recommended action
        recommended_action = self._get_recommended_action(direction, probability, consensus)

        return EnsembleResult(
            direction=direction,
            probability=probability,
            consensus=consensus,
            signals=opinions,
            weighted_votes=weighted_votes,
            conflict_detected=conflict_detected,
            recommended_action=recommended_action,
        )

    def _determine_consensus(
        self,
        opinions: List[StrategyOpinion],
        probability: float
    ) -> str:
        """Determine consensus strength"""
        agreeing = sum(1 for o in opinions if o.confidence > 0.5)
        total = len(opinions)
        agreement_rate = agreeing / total if total > 0 else 0

        if agreement_rate >= 0.8 and probability >= 0.75:
            return "STRONG"
        elif agreement_rate >= 0.6 and probability >= 0.65:
            return "MODERATE"
        elif agreement_rate >= 0.4:
            return "WEAK"
        return "CONFLICT"

    def _detect_conflict(self, opinions: List[StrategyOpinion]) -> bool:
        """Detect if strategies are in conflict"""
        long_count = sum(1 for o in opinions if o.direction == SignalDirection.LONG and o.confidence > 0.3)
        short_count = sum(1 for o in opinions if o.direction == SignalDirection.SHORT and o.confidence > 0.3)

        return long_count > 0 and short_count > 0

    def _get_recommended_action(
        self,
        direction: SignalDirection,
        probability: float,
        consensus: str
    ) -> str:
        """Get recommended action string"""
        if direction == SignalDirection.NEUTRAL:
            return "HOLD"
        if consensus == "CONFLICT":
            return "HOLD"
        if probability < 0.65:
            return "HOLD"
        if direction == SignalDirection.LONG:
            return "BUY"
        return "SELL"

    def add_strategy(self, strategy: StrategyBase) -> None:
        """Add a new strategy to ensemble"""
        self.strategies.append(strategy)
        self.performance[strategy.strategy_id] = {'wins': 0, 'losses': 0, 'total': 0}

    def update_performance(
        self,
        strategy_id: str,
        win: bool
    ) -> None:
        """Update strategy performance tracking"""
        if strategy_id in self.performance:
            self.performance[strategy_id]['total'] += 1
            if win:
                self.performance[strategy_id]['wins'] += 1
            else:
                self.performance[strategy_id]['losses'] += 1

    def get_strategy_stats(self) -> Dict:
        """Get performance statistics for all strategies"""
        stats = {}
        for sid, perf in self.performance.items():
            if perf['total'] > 0:
                stats[sid] = {
                    'win_rate': perf['wins'] / perf['total'],
                    'total_trades': perf['total'],
                }
        return stats


# Singleton instance
strategy_ensemble = StrategyEnsemble()
