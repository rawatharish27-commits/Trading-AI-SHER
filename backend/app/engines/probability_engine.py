"""
Probability Engine V3
Calibrated probability calculation for trading signals
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np

from loguru import logger


@dataclass
class StrategyFeatures:
    """Features extracted from market data for strategy evaluation"""
    momentum_score: float = 0.0
    trend_score: float = 0.0
    structure_score: float = 0.0
    smart_money_score: float = 0.0
    volume_score: float = 0.0
    volatility_score: float = 0.0
    order_flow_score: float = 0.0


@dataclass
class ProbabilityComponents:
    """Individual probability components"""
    technical: float = 0.0
    volume: float = 0.0
    order_book: float = 0.0
    market_regime: float = 0.0
    ml_confidence: float = 0.0
    correlation_penalty: float = 0.0


@dataclass
class ProbabilityResult:
    """Final probability result with components"""
    final_probability: float
    confidence_interval: tuple[float, float]
    confidence_level: str
    components: ProbabilityComponents
    evidence_count: int
    risk_label: str
    approved: bool
    reason: str


class ProbabilityEngineV3:
    """
    SHER Probability Engine V3 (Calibrated)
    
    Calculates ensemble probability for trading signals using:
    - Technical analysis scores
    - Volume participation
    - Smart money flow (order book imbalance)
    - Market structure integrity
    - Regime-adjusted penalties
    """

    # Strategy weights (calibrated via neural feedback loop)
    WEIGHTS = {
        'TREND': 0.25,
        'VOLUME': 0.20,
        'ORDERFLOW': 0.25,
        'STRUCTURE': 0.20,
        'ML': 0.10,
    }

    # Probability thresholds
    PROBABILITY_FLOOR = 0.65  # Minimum probability for signal approval
    HIGH_CONFIDENCE_THRESHOLD = 0.80
    MEDIUM_CONFIDENCE_THRESHOLD = 0.65

    # Regime penalties
    REGIME_PENALTIES = {
        'TRENDING': 1.0,
        'MEAN_REVERTING': 0.95,
        'CHOPPY': 0.80,
        'PANIC': 0.60,
    }

    def __init__(self, ml_model=None):
        """
        Initialize Probability Engine
        
        Args:
            ml_model: Optional ML model for probability enhancement
        """
        self.ml_model = ml_model
        self.calibration_history: List[Dict] = []
        logger.info("🧠 Probability Engine V3 initialized")

    def calculate(
        self,
        features: StrategyFeatures,
        regime: str = 'CHOPPY',
        symbol: str = '',
        additional_factors: Optional[Dict] = None
    ) -> ProbabilityResult:
        """
        Calculate ensemble probability for a signal
        
        Args:
            features: Extracted strategy features
            regime: Current market regime
            symbol: Trading symbol
            additional_factors: Additional factors to consider
            
        Returns:
            ProbabilityResult with final probability and components
        """
        # 1. Calculate weighted scores
        trend_score = features.trend_score * self.WEIGHTS['TREND']
        volume_score = features.volume_score * self.WEIGHTS['VOLUME']
        orderflow_score = features.order_flow_score * self.WEIGHTS['ORDERFLOW']
        structure_score = features.structure_score * self.WEIGHTS['STRUCTURE']

        # 2. Base probability calculation
        base_prob = trend_score + volume_score + orderflow_score + structure_score

        # 3. Apply regime penalty
        regime_penalty = self.REGIME_PENALTIES.get(regime, 0.8)
        adjusted_prob = base_prob * regime_penalty

        # 4. ML enhancement if available
        ml_confidence = 0.5
        if self.ml_model and additional_factors:
            try:
                ml_prob = self._get_ml_probability(features, additional_factors)
                adjusted_prob = adjusted_prob * 0.9 + ml_prob * self.WEIGHTS['ML']
                ml_confidence = ml_prob
            except Exception as e:
                logger.warning(f"ML probability failed: {e}")

        # 5. Final probability (0-1 scale)
        final_prob = min(max(adjusted_prob, 0.0), 1.0)

        # 6. Calculate confidence interval
        confidence_interval = self._calculate_confidence_interval(final_prob, features)

        # 7. Determine confidence level
        confidence_level = self._get_confidence_level(final_prob)

        # 8. Determine risk label
        risk_label = self._get_risk_label(final_prob, regime)

        # 9. Evidence count
        evidence_count = self._count_evidence(features)

        # 10. Check approval
        approved = final_prob >= self.PROBABILITY_FLOOR

        # Build components
        components = ProbabilityComponents(
            technical=trend_score,
            volume=volume_score,
            order_book=orderflow_score,
            market_regime=regime_penalty,
            ml_confidence=ml_confidence,
            correlation_penalty=0.0,  # Set by risk engine
        )

        # Build reason
        reason = self._build_reason(final_prob, approved, regime, evidence_count)

        result = ProbabilityResult(
            final_probability=round(final_prob, 4),
            confidence_interval=confidence_interval,
            confidence_level=confidence_level,
            components=components,
            evidence_count=evidence_count,
            risk_label=risk_label,
            approved=approved,
            reason=reason,
        )

        # Log for calibration
        self._log_calculation(symbol, features, regime, result)

        return result

    def _calculate_confidence_interval(
        self,
        probability: float,
        features: StrategyFeatures
    ) -> tuple[float, float]:
        """Calculate confidence interval for probability estimate"""
        # Use feature consistency to determine interval width
        scores = [
            features.trend_score,
            features.volume_score,
            features.order_flow_score,
            features.structure_score,
        ]
        
        std_dev = np.std(scores) if scores else 0.1
        interval_width = min(std_dev * 0.5, 0.15)  # Cap at 15%

        lower = max(0.0, probability - interval_width)
        upper = min(1.0, probability + interval_width)

        return (round(lower, 4), round(upper, 4))

    def _get_confidence_level(self, probability: float) -> str:
        """Determine confidence level from probability"""
        if probability >= self.HIGH_CONFIDENCE_THRESHOLD:
            return 'HIGH'
        elif probability >= self.MEDIUM_CONFIDENCE_THRESHOLD:
            return 'MEDIUM'
        return 'LOW'

    def _get_risk_label(self, probability: float, regime: str) -> str:
        """Determine risk label based on probability and regime"""
        if regime == 'PANIC':
            return 'EXTREME'
        
        if probability >= 0.85:
            return 'LOW'
        elif probability >= 0.75:
            return 'MEDIUM'
        elif probability >= 0.65:
            return 'HIGH'
        return 'EXTREME'

    def _count_evidence(self, features: StrategyFeatures) -> int:
        """Count number of supporting evidence factors"""
        count = 0
        
        if features.trend_score >= 0.6:
            count += 1
        if features.volume_score >= 0.6:
            count += 1
        if features.order_flow_score >= 0.6:
            count += 1
        if features.structure_score >= 0.6:
            count += 1
        if features.momentum_score >= 0.6:
            count += 1
            
        return count

    def _get_ml_probability(
        self,
        features: StrategyFeatures,
        additional_factors: Dict
    ) -> float:
        """Get probability from ML model"""
        # Placeholder for ML model inference
        # In production, this would use trained XGBoost/LSTM model
        return 0.5

    def _build_reason(
        self,
        probability: float,
        approved: bool,
        regime: str,
        evidence_count: int
    ) -> str:
        """Build reason message for the probability result"""
        if approved:
            return f"Probability {probability*100:.1f}% exceeds floor. {evidence_count} evidence factors support. Regime: {regime}"
        return f"Probability {probability*100:.1f}% below floor of {self.PROBABILITY_FLOOR*100:.0f}%. Needs more confirmation."

    def _log_calculation(
        self,
        symbol: str,
        features: StrategyFeatures,
        regime: str,
        result: ProbabilityResult
    ) -> None:
        """Log calculation for calibration tracking"""
        self.calibration_history.append({
            'symbol': symbol,
            'features': features.__dict__,
            'regime': regime,
            'result': {
                'probability': result.final_probability,
                'approved': result.approved,
                'confidence_level': result.confidence_level,
            }
        })

        # Keep only last 1000 calculations
        if len(self.calibration_history) > 1000:
            self.calibration_history = self.calibration_history[-1000:]

    def get_calibration_stats(self) -> Dict:
        """Get calibration statistics"""
        if not self.calibration_history:
            return {}

        approved = [c for c in self.calibration_history if c['result']['approved']]
        
        return {
            'total_calculations': len(self.calibration_history),
            'approved_count': len(approved),
            'approval_rate': len(approved) / len(self.calibration_history),
            'avg_probability': np.mean([c['result']['probability'] for c in self.calibration_history]),
        }


# Singleton instance
probability_engine = ProbabilityEngineV3()
