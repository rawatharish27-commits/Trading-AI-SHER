"""
Enhanced Signal Generator with Pre-Momentum Detection
Integrates leading indicators with existing strategy ensemble
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

from loguru import logger

from app.engines import (
    probability_engine,
    strategy_ensemble,
    risk_system,
    MarketRegime,
    StrategyFeatures,
)
from app.engines.pre_momentum import (
    pre_momentum_engine,
    PreMomentumSignal,
    OrderBookSnapshot,
    Trade,
)
from app.ml import ml_predictor, feature_engineer


@dataclass
class EnhancedSignal:
    """Enhanced trading signal with pre-momentum data"""
    signal_id: str
    symbol: str
    exchange: str
    action: str  # BUY, SELL, HOLD
    direction: str  # LONG, SHORT, NEUTRAL
    
    # Probability & Confidence
    probability: float
    confidence: float
    confidence_level: str
    
    # Pre-Momentum Data
    pre_momentum_score: float
    pre_momentum_signal: str
    expected_lead_time: int  # seconds before move
    
    # Targets
    entry_price: float
    stop_loss: float
    target_1: float
    target_2: float
    target_3: Optional[float]
    risk_reward_ratio: float
    
    # Risk
    risk_level: str
    
    # Market Context
    market_regime: str
    strategy_consensus: str
    
    # Evidence
    evidence_count: int
    reasoning: str
    
    # Metadata
    signal_type: str  # PRE_MOMENTUM, CONFIRMATION, STANDARD
    signal_time: datetime = field(default_factory=datetime.now)
    
    # Component Scores
    components: Dict = field(default_factory=dict)


class EnhancedSignalGenerator:
    """
    Advanced Signal Generator with Pre-Momentum Detection
    
    Signal Hierarchy:
    1. PRE_MOMENTUM - Detected before move starts (highest value)
    2. CONFIRMATION - Confirmed after move begins (good value)
    3. STANDARD - Standard signal (decent value)
    """
    
    # Thresholds
    PRE_MOMENTUM_THRESHOLD = 70  # Min score for pre-momentum signal
    PROBABILITY_THRESHOLD = 0.65  # Min probability for action
    CONFIDENCE_THRESHOLD = 0.70  # Min confidence for execution
    
    # Weights for combined scoring
    COMPONENT_WEIGHTS = {
        'pre_momentum': 0.35,
        'probability': 0.30,
        'ml': 0.20,
        'risk_adjustment': 0.15,
    }
    
    def __init__(self):
        """Initialize enhanced signal generator"""
        self.signal_history: List[EnhancedSignal] = []
        self.performance_stats = {
            'pre_momentum_signals': 0,
            'confirmation_signals': 0,
            'standard_signals': 0,
            'total_signals': 0,
        }
        
        logger.info("🎯 Enhanced Signal Generator initialized")
    
    async def generate_signal(
        self,
        symbol: str,
        exchange: str = "NSE",
        market_data: Optional[Dict] = None,
        candles: Optional[List] = None,
        order_book: Optional[Dict] = None,
        recent_trades: Optional[List[Dict]] = None,
    ) -> EnhancedSignal:
        """
        Generate enhanced trading signal with pre-momentum detection
        
        Args:
            symbol: Trading symbol
            exchange: Exchange (NSE, BSE, MCX)
            market_data: Current market data (ltp, volume, etc.)
            candles: Historical candles for feature engineering
            order_book: Order book data for OFI calculation
            recent_trades: Recent trades for large lot detection
            
        Returns:
            EnhancedSignal with comprehensive analysis
        """
        signal_id = str(uuid.uuid4())[:12]
        logger.info(f"[{signal_id}] Generating enhanced signal for {symbol}")
        
        # 1. Get or create market data
        if market_data is None:
            market_data = self._get_mock_market_data(symbol)
        
        # 2. Feature Engineering
        features = {}
        if candles and len(candles) >= 50:
            features = feature_engineer.calculate_all_features(candles)
        
        # 3. Determine Market Regime
        regime = self._determine_regime(market_data, features)
        
        # 4. Pre-Momentum Analysis
        pre_momentum_result = await self._analyze_pre_momentum(
            order_book, market_data, recent_trades
        )
        
        # 5. Strategy Ensemble Evaluation
        ensemble_result = strategy_ensemble.evaluate(market_data, regime)
        
        # 6. Probability Calculation
        strategy_features = StrategyFeatures(
            trend_score=features.get('ema_cross_9_21', 0.5) * 0.5 + 0.5,
            volume_score=min(market_data.get('volume_ratio', 1), 2) / 2,
            structure_score=0.7,
            smart_money_score=pre_momentum_result.components.get('large_lot', {}).get('buy_pressure', 0.5),
            order_flow_score=abs(pre_momentum_result.components.get('ofi', {}).get('value', 0)),
        )
        
        prob_result = probability_engine.calculate(
            features=strategy_features,
            regime=regime.value if hasattr(regime, 'value') else regime,
            symbol=symbol
        )
        
        # 7. ML Prediction
        ml_result = ml_predictor.predict(features if features else market_data)
        
        # 8. Combine all signals
        combined_score = self._calculate_combined_score(
            pre_momentum_result.score / 100,
            prob_result.final_probability,
            ml_result.probability,
            self._get_risk_adjustment(market_data, regime)
        )
        
        # 9. Determine signal type and action
        signal_type = self._determine_signal_type(
            pre_momentum_result.score,
            ensemble_result.recommended_action,
            combined_score
        )
        
        action = self._determine_action(
            pre_momentum_result,
            ensemble_result,
            prob_result.final_probability,
            combined_score
        )
        
        # 10. Calculate targets with dynamic stops
        ltp = market_data.get('ltp', 0)
        atr = features.get('atr', ltp * 0.02)
        targets = self._calculate_dynamic_targets(
            action, ltp, atr, pre_momentum_result.expected_move
        )
        
        # 11. Build enhanced signal
        signal = EnhancedSignal(
            signal_id=signal_id,
            symbol=symbol,
            exchange=exchange,
            action=action,
            direction=pre_momentum_result.direction if action != 'HOLD' else 'NEUTRAL',
            
            probability=round(combined_score, 4),
            confidence=round(pre_momentum_result.confidence, 4),
            confidence_level=prob_result.confidence_level,
            
            pre_momentum_score=round(pre_momentum_result.score, 2),
            pre_momentum_signal=pre_momentum_result.signal.value,
            expected_lead_time=pre_momentum_result.time_to_move,
            
            entry_price=targets['entry'],
            stop_loss=targets['stop_loss'],
            target_1=targets['target_1'],
            target_2=targets['target_2'],
            target_3=targets.get('target_3'),
            risk_reward_ratio=targets.get('risk_reward', 0),
            
            risk_level=self._assess_risk(combined_score, regime, pre_momentum_result),
            market_regime=regime.value if hasattr(regime, 'value') else regime,
            strategy_consensus=ensemble_result.consensus,
            
            evidence_count=prob_result.evidence_count,
            reasoning=self._build_enhanced_reasoning(
                pre_momentum_result, ensemble_result, prob_result
            ),
            
            signal_type=signal_type,
            signal_time=datetime.now(),
            
            components={
                'pre_momentum': pre_momentum_result.components,
                'ensemble': {
                    'direction': ensemble_result.direction.value,
                    'consensus': ensemble_result.consensus,
                    'weighted_votes': ensemble_result.weighted_votes,
                },
                'probability': {
                    'final': prob_result.final_probability,
                    'components': {
                        'technical': prob_result.components.technical,
                        'volume': prob_result.components.volume,
                        'order_book': prob_result.components.order_book,
                    }
                },
                'ml': {
                    'probability': ml_result.probability,
                    'direction': ml_result.direction,
                }
            }
        )
        
        # Track statistics
        self._update_stats(signal_type)
        self.signal_history.append(signal)
        
        logger.info(
            f"[{signal_id}] Signal: {action} {symbol} | "
            f"Type: {signal_type} | Score: {combined_score:.2%} | "
            f"Pre-Mom: {pre_momentum_result.score:.0f}"
        )
        
        return signal
    
    async def _analyze_pre_momentum(
        self,
        order_book: Optional[Dict],
        market_data: Dict,
        trades: Optional[List[Dict]]
    ) -> Any:
        """Analyze pre-momentum indicators"""
        # Convert order book data to OrderBookSnapshot
        ob_snapshot = None
        if order_book:
            ob_snapshot = OrderBookSnapshot(
                timestamp=datetime.now(),
                bids=order_book.get('bids', []),
                asks=order_book.get('asks', []),
            )
        
        # Convert trades to Trade objects
        trade_objects = None
        if trades:
            trade_objects = [
                Trade(
                    timestamp=datetime.now(),
                    price=t['price'],
                    quantity=t['quantity'],
                    side=t['side']
                )
                for t in trades[-100:]
            ]
        
        return await pre_momentum_engine.analyze(
            order_book=ob_snapshot,
            volume=market_data.get('volume'),
            trades=trade_objects,
            price_data={
                'high': market_data.get('high', market_data.get('ltp')),
                'low': market_data.get('low', market_data.get('ltp')),
                'close': market_data.get('ltp'),
                'ltp': market_data.get('ltp'),
            }
        )
    
    def _calculate_combined_score(
        self,
        pre_momentum_score: float,
        probability_score: float,
        ml_score: float,
        risk_adjustment: float
    ) -> float:
        """Calculate combined signal score"""
        return (
            pre_momentum_score * self.COMPONENT_WEIGHTS['pre_momentum'] +
            probability_score * self.COMPONENT_WEIGHTS['probability'] +
            ml_score * self.COMPONENT_WEIGHTS['ml'] +
            risk_adjustment * self.COMPONENT_WEIGHTS['risk_adjustment']
        )
    
    def _determine_signal_type(
        self,
        pre_momentum_score: float,
        ensemble_action: str,
        combined_score: float
    ) -> str:
        """Determine signal type based on conditions"""
        if pre_momentum_score >= self.PRE_MOMENTUM_THRESHOLD and ensemble_action != 'HOLD':
            return 'PRE_MOMENTUM'
        elif combined_score >= 0.70 and ensemble_action != 'HOLD':
            return 'CONFIRMATION'
        else:
            return 'STANDARD'
    
    def _determine_action(
        self,
        pre_momentum_result,
        ensemble_result,
        probability: float,
        combined_score: float
    ) -> str:
        """Determine final action"""
        # Pre-momentum signal (highest priority)
        if pre_momentum_result.score >= self.PRE_MOMENTUM_THRESHOLD:
            if pre_momentum_result.signal in [PreMomentumSignal.STRONG_BULLISH, PreMomentumSignal.BULLISH]:
                if combined_score >= self.PROBABILITY_THRESHOLD:
                    return 'BUY'
            elif pre_momentum_result.signal in [PreMomentumSignal.STRONG_BEARISH, PreMomentumSignal.BEARISH]:
                if combined_score >= self.PROBABILITY_THRESHOLD:
                    return 'SELL'
        
        # Confirmation signal
        if ensemble_result.recommended_action == 'BUY' and probability >= self.PROBABILITY_THRESHOLD:
            if combined_score >= 0.65:
                return 'BUY'
        elif ensemble_result.recommended_action == 'SELL' and probability >= self.PROBABILITY_THRESHOLD:
            if combined_score >= 0.65:
                return 'SELL'
        
        return 'HOLD'
    
    def _calculate_dynamic_targets(
        self,
        action: str,
        ltp: float,
        atr: float,
        expected_move: float
    ) -> Dict:
        """Calculate targets with ATR-based stops"""
        if action == 'BUY':
            # Stop loss: 1.5x ATR below entry
            stop_loss = ltp - (atr * 1.5)
            
            # Targets based on expected move
            target_1 = ltp + max(expected_move * ltp / 100, atr * 1)
            target_2 = ltp + max(expected_move * ltp / 100 * 1.5, atr * 2)
            target_3 = ltp + max(expected_move * ltp / 100 * 2, atr * 3)
            
        elif action == 'SELL':
            stop_loss = ltp + (atr * 1.5)
            target_1 = ltp - max(expected_move * ltp / 100, atr * 1)
            target_2 = ltp - max(expected_move * ltp / 100 * 1.5, atr * 2)
            target_3 = ltp - max(expected_move * ltp / 100 * 2, atr * 3)
            
        else:
            stop_loss = ltp
            target_1 = ltp
            target_2 = ltp
            target_3 = None
        
        # Risk/Reward calculation
        risk = abs(ltp - stop_loss)
        reward = abs(target_1 - ltp)
        risk_reward = round(reward / risk, 2) if risk > 0 else 0
        
        return {
            'entry': round(ltp, 2),
            'stop_loss': round(stop_loss, 2),
            'target_1': round(target_1, 2),
            'target_2': round(target_2, 2),
            'target_3': round(target_3, 2) if target_3 else None,
            'risk_reward': risk_reward
        }
    
    def _get_risk_adjustment(self, market_data: Dict, regime: MarketRegime) -> float:
        """Get risk adjustment factor"""
        base = 0.7
        
        # Regime adjustment
        if regime == MarketRegime.TRENDING:
            base += 0.1
        elif regime == MarketRegime.CHOPPY:
            base -= 0.15
        elif regime == MarketRegime.PANIC:
            base -= 0.25
        
        # Volume adjustment
        volume_ratio = market_data.get('volume_ratio', 1)
        if volume_ratio > 1.5:
            base += 0.05
        
        return min(1.0, max(0.3, base))
    
    def _determine_regime(self, market_data: Dict, features: Dict) -> MarketRegime:
        """Determine current market regime"""
        rsi = market_data.get('rsi', features.get('rsi', 50))
        momentum = market_data.get('momentum', features.get('momentum', 0))
        adx = features.get('adx', 20)
        
        # Enhanced regime detection
        if adx > 25 and abs(momentum) > 0.015:
            return MarketRegime.TRENDING
        elif rsi > 75 or rsi < 25:
            return MarketRegime.PANIC
        elif adx < 20 and abs(momentum) < 0.005:
            return MarketRegime.CHOPPY
        else:
            return MarketRegime.MEAN_REVERTING
    
    def _assess_risk(self, probability: float, regime: MarketRegime, pre_momentum) -> str:
        """Assess signal risk level"""
        if regime == MarketRegime.PANIC:
            return "EXTREME"
        
        if pre_momentum.score >= 80:
            return "LOW"  # High confidence pre-momentum
        elif probability >= 0.80:
            return "LOW"
        elif probability >= 0.75:
            return "MEDIUM"
        elif probability >= 0.65:
            return "HIGH"
        return "EXTREME"
    
    def _build_enhanced_reasoning(self, pre_momentum, ensemble, prob_result) -> str:
        """Build comprehensive reasoning"""
        reasons = []
        
        # Pre-momentum reasoning
        if pre_momentum.score >= 70:
            reasons.append(f"PRE-MOMENTUM: {pre_momentum.reasoning}")
        
        # Ensemble reasoning
        if ensemble.consensus == 'STRONG':
            reasons.append(f"Strong strategy consensus ({ensemble.consensus})")
        elif ensemble.consensus == 'CONFLICT':
            reasons.append("Strategy conflict detected - caution advised")
        
        # Probability reasoning
        reasons.append(prob_result.reason)
        
        return " | ".join(reasons)
    
    def _get_mock_market_data(self, symbol: str) -> Dict:
        """Get mock market data for development"""
        import random
        
        base_price = {
            "RELIANCE": 2450,
            "TCS": 3850,
            "HDFC": 1650,
            "INFY": 1550,
        }.get(symbol, 1000)
        
        ltp = base_price + random.uniform(-20, 20)
        
        return {
            'ltp': ltp,
            'high': ltp + random.uniform(0, 10),
            'low': ltp - random.uniform(0, 10),
            'vwap': base_price,
            'volume': random.randint(500000, 2000000),
            'avg_volume': 1000000,
            'rsi': random.uniform(30, 70),
            'momentum': random.uniform(-0.02, 0.02),
            'price_change': random.uniform(-0.01, 0.01),
            'volume_ratio': random.uniform(0.8, 1.5),
        }
    
    def _update_stats(self, signal_type: str) -> None:
        """Update signal statistics"""
        self.performance_stats['total_signals'] += 1
        if signal_type == 'PRE_MOMENTUM':
            self.performance_stats['pre_momentum_signals'] += 1
        elif signal_type == 'CONFIRMATION':
            self.performance_stats['confirmation_signals'] += 1
        else:
            self.performance_stats['standard_signals'] += 1
    
    def get_performance_stats(self) -> Dict:
        """Get signal performance statistics"""
        total = self.performance_stats['total_signals']
        if total == 0:
            return self.performance_stats
        
        return {
            **self.performance_stats,
            'pre_momentum_rate': self.performance_stats['pre_momentum_signals'] / total,
            'confirmation_rate': self.performance_stats['confirmation_signals'] / total,
        }
    
    def get_recent_signals(self, limit: int = 10) -> List[Dict]:
        """Get recent signals"""
        recent = self.signal_history[-limit:]
        return [
            {
                'signal_id': s.signal_id,
                'symbol': s.symbol,
                'action': s.action,
                'signal_type': s.signal_type,
                'probability': s.probability,
                'pre_momentum_score': s.pre_momentum_score,
                'signal_time': s.signal_time.isoformat(),
            }
            for s in recent
        ]


# Singleton instance
enhanced_signal_generator = EnhancedSignalGenerator()
