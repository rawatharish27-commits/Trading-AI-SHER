"""
Signal Service
Business logic for signal generation
"""

from datetime import datetime
from typing import Dict, List, Optional
import uuid

from loguru import logger

from app.engines import (
    probability_engine,
    strategy_ensemble,
    risk_system,
    MarketRegime,
    StrategyFeatures,
)
from app.ml import ml_predictor, feature_engineer


class SignalService:
    """
    Signal Generation Service
    
    Orchestrates:
    - Market data processing
    - Feature engineering
    - ML prediction
    - Probability calculation
    - Risk assessment
    """

    async def generate_signal(
        self,
        symbol: str,
        exchange: str = "NSE",
        market_data: Optional[Dict] = None,
        candles: Optional[List] = None
    ) -> Dict:
        """
        Generate AI trading signal
        
        Args:
            symbol: Trading symbol
            exchange: Exchange (NSE, BSE, MCX)
            market_data: Current market data
            candles: Historical candles for feature engineering
            
        Returns:
            Signal dictionary
        """
        trace_id = str(uuid.uuid4())[:12]
        logger.info(f"[{trace_id}] Generating signal for {symbol}")
        
        # 1. Get or create market data
        if market_data is None:
            market_data = self._get_mock_market_data(symbol)
        
        # 2. Feature engineering
        features = {}
        if candles and len(candles) >= 50:
            features = feature_engineer.calculate_all_features(candles)
        
        # 3. Determine market regime
        regime = self._determine_regime(market_data, features)
        
        # 4. Strategy ensemble evaluation
        ensemble_result = strategy_ensemble.evaluate(market_data, regime)
        
        # 5. Probability calculation
        strategy_features = StrategyFeatures(
            trend_score=features.get('ema_cross_9_21', 0.5) * 0.5 + 0.5,
            volume_score=min(market_data.get('volume_ratio', 1), 2) / 2,
            structure_score=0.7,
            smart_money_score=0.6,
            order_flow_score=0.5,
        )
        
        prob_result = probability_engine.calculate(
            features=strategy_features,
            regime=regime.value if hasattr(regime, 'value') else regime,
            symbol=symbol
        )
        
        # 6. ML prediction
        ml_result = ml_predictor.predict(features if features else market_data)
        
        # 7. Combine predictions
        final_probability = (
            prob_result.final_probability * 0.6 +
            ml_result.probability * 0.4
        )
        
        # 8. Determine action
        if ensemble_result.recommended_action == "BUY" and final_probability >= 0.65:
            action = "BUY"
        elif ensemble_result.recommended_action == "SELL" and final_probability >= 0.65:
            action = "SELL"
        else:
            action = "HOLD"
        
        # 9. Calculate targets
        ltp = market_data.get('ltp', 0)
        targets = self._calculate_targets(action, ltp, market_data)
        
        # 10. Risk assessment
        risk_label = self._assess_risk(final_probability, regime, features)
        
        signal = {
            "trace_id": trace_id,
            "symbol": symbol,
            "exchange": exchange,
            "action": action,
            "direction": ensemble_result.direction.value if hasattr(ensemble_result.direction, 'value') else ensemble_result.direction,
            "probability": round(final_probability, 4),
            "confidence": round(ensemble_result.probability, 4),
            "confidence_level": prob_result.confidence_level,
            "risk_level": risk_label,
            "market_regime": regime.value if hasattr(regime, 'value') else regime,
            "strategy": ensemble_result.consensus,
            "entry_price": targets['entry'],
            "stop_loss": targets['stop_loss'],
            "target_1": targets['target_1'],
            "target_2": targets['target_2'],
            "target_3": targets.get('target_3'),
            "risk_reward_ratio": targets.get('risk_reward', 0),
            "evidence_count": prob_result.evidence_count,
            "reasoning": prob_result.reason,
            "signal_time": datetime.utcnow().isoformat(),
        }
        
        logger.info(f"[{trace_id}] Signal generated: {action} {symbol} @ {final_probability:.2%}")
        return signal

    def _get_mock_market_data(self, symbol: str) -> Dict:
        """Get mock market data for development"""
        base_price = {
            "RELIANCE": 2450,
            "TCS": 3850,
            "HDFC": 1650,
            "INFY": 1550,
        }.get(symbol, 1000)
        
        import random
        ltp = base_price + random.uniform(-20, 20)
        
        return {
            'ltp': ltp,
            'vwap': base_price,
            'volume': random.randint(500000, 2000000),
            'avg_volume': 1000000,
            'rsi': random.uniform(30, 70),
            'momentum': random.uniform(-0.02, 0.02),
            'price_change': random.uniform(-0.01, 0.01),
            'volume_ratio': random.uniform(0.8, 1.5),
        }

    def _determine_regime(self, market_data: Dict, features: Dict) -> MarketRegime:
        """Determine current market regime"""
        rsi = market_data.get('rsi', 50)
        momentum = market_data.get('momentum', 0)
        
        if abs(momentum) > 0.02:
            return MarketRegime.TRENDING
        elif rsi > 70 or rsi < 30:
            return MarketRegime.PANIC
        elif abs(momentum) < 0.005:
            return MarketRegime.CHOPPY
        else:
            return MarketRegime.MEAN_REVERTING

    def _calculate_targets(self, action: str, ltp: float, market_data: Dict) -> Dict:
        """Calculate price targets"""
        if action == "BUY":
            entry = ltp
            stop_loss = ltp * 0.98  # 2% stop loss
            target_1 = ltp * 1.02
            target_2 = ltp * 1.04
            target_3 = ltp * 1.06
        elif action == "SELL":
            entry = ltp
            stop_loss = ltp * 1.02
            target_1 = ltp * 0.98
            target_2 = ltp * 0.96
            target_3 = ltp * 0.94
        else:
            entry = ltp
            stop_loss = ltp
            target_1 = ltp
            target_2 = ltp
            target_3 = None
        
        risk = abs(entry - stop_loss)
        reward = abs(target_1 - entry)
        risk_reward = round(reward / risk, 2) if risk > 0 else 0
        
        return {
            'entry': round(entry, 2),
            'stop_loss': round(stop_loss, 2),
            'target_1': round(target_1, 2),
            'target_2': round(target_2, 2),
            'target_3': round(target_3, 2) if target_3 else None,
            'risk_reward': risk_reward
        }

    def _assess_risk(self, probability: float, regime: MarketRegime, features: Dict) -> str:
        """Assess signal risk level"""
        if regime == MarketRegime.PANIC:
            return "EXTREME"
        
        if probability >= 0.85:
            return "LOW"
        elif probability >= 0.75:
            return "MEDIUM"
        elif probability >= 0.65:
            return "HIGH"
        return "EXTREME"


# Singleton instance
signal_service = SignalService()
