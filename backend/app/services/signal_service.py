"""
Signal Service
Business logic for signal generation using real market data
"""

from datetime import datetime
from typing import Dict, List, Optional
import uuid

from loguru import logger

from app.engines.smc_engine import smc_engine
from app.engines.risk_engine import risk_engine
from app.brokers.angel_one import AngelOneAPI
from app.cache.market_cache import MarketDataCache


class SignalService:
    """
    Signal Generation Service - Production Grade

    Uses real market data from broker APIs:
    - Angel One API for live market data
    - Institutional flow analysis
    - Market structure analysis
    - No ML components - pure technical analysis
    """

    def __init__(self):
        self.broker_api = AngelOneAPI()
        self.market_cache = MarketDataCache()
        self.risk_engine = risk_engine

    async def generate_signal(
        self,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "15m"
    ) -> Dict:
        """
        Generate trading signal using real market data

        Args:
            symbol: Trading symbol (e.g., "RELIANCE", "TCS")
            exchange: Exchange (NSE, BSE, MCX)
            timeframe: Timeframe for analysis (1m, 5m, 15m, 1h, 1d)

        Returns:
            Signal dictionary with real market data
        """
        trace_id = str(uuid.uuid4())[:12]
        logger.info(f"[{trace_id}] Generating signal for {symbol} on {exchange}")

        try:
            # 1. Get real market data from broker API
            market_data = await self._get_real_market_data(symbol, exchange)
            if not market_data:
                return self._create_error_signal(trace_id, symbol, "No market data available")

            # 2. Get historical candles for analysis
            candles = await self._get_historical_candles(symbol, exchange, timeframe)
            if not candles or len(candles) < 50:
                return self._create_error_signal(trace_id, symbol, "Insufficient historical data")

            # 3. Analyze market structure
            structure_analysis = await self._analyze_market_structure(candles)

            # 4. Get institutional flow data
            institutional_data = await self._get_institutional_data()

            # 5. Determine market regime
            regime = self._determine_regime(market_data, candles)

            # 6. Strategy ensemble evaluation
            ensemble_result = strategy_ensemble.evaluate(market_data, regime)

            # 7. Calculate technical scores
            technical_scores = self._calculate_technical_scores(candles, market_data)

            # 8. Institutional flow analysis
            institutional_score = self._analyze_institutional_flow(institutional_data)

            # 9. Liquidity analysis
            liquidity_score = self._analyze_liquidity(candles)

            # 10. Multi-timeframe confluence
            mtf_score = await self._check_multi_timeframe_confluence(symbol, exchange)

            # 11. Probability calculation (no ML)
            strategy_features = StrategyFeatures(
                trend_score=technical_scores.get('trend', 0.5),
                volume_score=technical_scores.get('volume', 0.5),
                structure_score=structure_analysis.get('score', 0.5),
                smart_money_score=institutional_score,
                order_flow_score=liquidity_score,
            )

            prob_result = probability_engine.calculate(
                features=strategy_features,
                regime=regime.value if hasattr(regime, 'value') else regime,
                symbol=symbol
            )

            # 12. Final decision making
            final_probability = prob_result.final_probability
            confidence = self._calculate_overall_confidence(
                prob_result, ensemble_result, structure_analysis, institutional_score
            )

            # 13. Determine action
            action = self._determine_action(final_probability, ensemble_result, confidence)

            # 14. Calculate risk-adjusted targets
            targets = self._calculate_risk_targets(action, market_data, candles, regime)

            # 15. Risk assessment
            risk_label = self._assess_risk(final_probability, regime, technical_scores)

            signal = {
                "trace_id": trace_id,
                "symbol": symbol,
                "exchange": exchange,
                "timeframe": timeframe,
                "action": action,
                "direction": ensemble_result.direction.value if hasattr(ensemble_result.direction, 'value') else ensemble_result.direction,
                "probability": round(final_probability, 4),
                "confidence": round(confidence, 4),
                "confidence_level": prob_result.confidence_level,
                "risk_level": risk_label,
                "market_regime": regime.value if hasattr(regime, 'value') else regime,

                # Analysis scores
                "market_structure_score": structure_analysis.get('score', 0),
                "institutional_score": institutional_score,
                "liquidity_score": liquidity_score,
                "momentum_score": technical_scores.get('momentum', 0),
                "mtf_score": mtf_score,

                # Price levels
                "entry_price": targets['entry'],
                "stop_loss": targets['stop_loss'],
                "target_1": targets['target_1'],
                "target_2": targets['target_2'],
                "target_3": targets.get('target_3'),

                # Risk metrics
                "risk_reward_ratio": targets.get('risk_reward', 0),
                "position_size_percent": targets.get('position_size', 0),
                "max_loss_amount": targets.get('max_loss', 0),

                # Metadata
                "evidence_count": prob_result.evidence_count,
                "reasoning": prob_result.reason,
                "signal_time": datetime.utcnow().isoformat(),
                "market_data_timestamp": market_data.get('timestamp'),
            }

            logger.info(f"[{trace_id}] Signal generated: {action} {symbol} @ {final_probability:.2%} confidence")
            return signal

        except Exception as e:
            logger.error(f"[{trace_id}] Error generating signal for {symbol}: {e}")
            return self._create_error_signal(trace_id, symbol, str(e))

    async def _get_real_market_data(self, symbol: str, exchange: str) -> Optional[Dict]:
        """Get real-time market data from broker API"""
        try:
            # Try cache first
            cached_data = await self.market_cache.get_market_data(symbol, exchange)
            if cached_data:
                return cached_data

            # Get from broker API
            market_data = await self.broker_api.get_market_data(symbol, exchange)

            # Cache the data
            if market_data:
                await self.market_cache.set_market_data(symbol, exchange, market_data)

            return market_data

        except Exception as e:
            logger.error(f"Failed to get market data for {symbol}: {e}")
            return None

    async def _get_historical_candles(self, symbol: str, exchange: str, timeframe: str, limit: int = 200) -> Optional[List]:
        """Get historical candles from broker API"""
        try:
            candles = await self.broker_api.get_historical_data(symbol, exchange, timeframe, limit)
            return candles
        except Exception as e:
            logger.error(f"Failed to get historical data for {symbol}: {e}")
            return None

    async def _analyze_market_structure(self, candles: List) -> Dict:
        """Analyze market structure for order blocks, FVG, etc."""
        # This will be implemented in the market structure engine
        # For now, return basic analysis
        return {
            'score': 0.7,
            'order_blocks': [],
            'fvgs': [],
            'support_resistance': []
        }

    async def _get_institutional_data(self) -> Dict:
        """Get FII/DII data and options chain"""
        # This will be implemented with institutional data collectors
        return {
            'fii_net': 0,
            'dii_net': 0,
            'pcr': 1.2,
            'max_pain': 0
        }

    def _determine_regime(self, market_data: Dict, candles: List) -> MarketRegime:
        """Determine current market regime from real data"""
        if not candles or len(candles) < 20:
            return MarketRegime.CHOPPY

        # Calculate trend strength
        recent_prices = [c.get('close', c.get('ltp', 0)) for c in candles[-20:]]
        if len(recent_prices) < 20:
            return MarketRegime.CHOPPY

        # Simple trend analysis
        start_price = recent_prices[0]
        end_price = recent_prices[-1]
        price_change = (end_price - start_price) / start_price

        # Volatility check
        volatility = np.std([(p2 - p1) / p1 for p1, p2 in zip(recent_prices[:-1], recent_prices[1:])])

        if abs(price_change) > 0.02 and volatility < 0.015:  # Strong trend, low volatility
            return MarketRegime.TRENDING
        elif abs(price_change) < 0.005 and volatility > 0.02:  # Low trend, high volatility
            return MarketRegime.PANIC
        elif abs(price_change) < 0.01:  # Sideways
            return MarketRegime.CHOPPY
        else:
            return MarketRegime.MEAN_REVERTING

    def _calculate_technical_scores(self, candles: List, market_data: Dict) -> Dict:
        """Calculate technical analysis scores"""
        scores = {
            'trend': 0.5,
            'volume': 0.5,
            'momentum': 0.5,
            'volatility': 0.5
        }

        if not candles or len(candles) < 20:
            return scores

        # Trend score based on moving averages
        closes = [c.get('close', c.get('ltp', 0)) for c in candles[-50:]]
        if len(closes) >= 20:
            ema20 = sum(closes[-20:]) / 20
            ema50 = sum(closes[-50:]) / 50 if len(closes) >= 50 else ema20
            scores['trend'] = 0.7 if ema20 > ema50 else 0.3

        # Volume score
        volumes = [c.get('volume', 0) for c in candles[-20:]]
        if volumes:
            avg_volume = sum(volumes) / len(volumes)
            current_volume = market_data.get('volume', avg_volume)
            scores['volume'] = min(current_volume / avg_volume, 2.0) / 2.0

        # Momentum score (RSI-like)
        if len(closes) >= 14:
            gains = [max(0, closes[i] - closes[i-1]) for i in range(1, len(closes))]
            losses = [max(0, closes[i-1] - closes[i]) for i in range(1, len(closes))]
            avg_gain = sum(gains[-14:]) / 14
            avg_loss = sum(losses[-14:]) / 14
            rs = avg_gain / avg_loss if avg_loss > 0 else 1
            rsi = 100 - (100 / (1 + rs))
            scores['momentum'] = rsi / 100

        return scores

    def _analyze_institutional_flow(self, institutional_data: Dict) -> float:
        """Analyze institutional flow score"""
        fii_net = institutional_data.get('fii_net', 0)
        dii_net = institutional_data.get('dii_net', 0)
        pcr = institutional_data.get('pcr', 1.0)

        # Simple scoring based on institutional activity
        score = 0.5

        # FII flow (positive if buying)
        if fii_net > 100:  # 100 crores
            score += 0.2
        elif fii_net < -100:
            score -= 0.2

        # PCR (Put-Call Ratio) - lower PCR means more bullish
        if pcr < 0.8:
            score += 0.15
        elif pcr > 1.5:
            score -= 0.15

        return max(0.1, min(0.9, score))

    def _analyze_liquidity(self, candles: List) -> float:
        """Analyze liquidity and order flow"""
        if not candles or len(candles) < 10:
            return 0.5

        # Check for volume spikes and price action
        volumes = [c.get('volume', 0) for c in candles[-10:]]
        prices = [c.get('close', c.get('ltp', 0)) for c in candles[-10:]]

        if not volumes or not prices:
            return 0.5

        avg_volume = sum(volumes) / len(volumes)
        current_volume = volumes[-1]

        # Volume analysis
        volume_score = min(current_volume / avg_volume, 2.0) / 2.0

        # Price action analysis (simplified)
        price_range = max(prices) - min(prices)
        current_price = prices[-1]
        price_position = (current_price - min(prices)) / price_range if price_range > 0 else 0.5

        return (volume_score + price_position) / 2

    async def _check_multi_timeframe_confluence(self, symbol: str, exchange: str) -> float:
        """Check multi-timeframe alignment"""
        timeframes = ['5m', '15m', '1h']
        alignment_score = 0.5

        try:
            trends = []
            for tf in timeframes:
                candles = await self._get_historical_candles(symbol, exchange, tf, 50)
                if candles and len(candles) >= 20:
                    closes = [c.get('close', c.get('ltp', 0)) for c in candles[-20:]]
                    if len(closes) >= 20:
                        trend = 1 if closes[-1] > closes[0] else -1
                        trends.append(trend)

            if len(trends) >= 2:
                # Check if majority agree
                bullish = sum(1 for t in trends if t > 0)
                bearish = sum(1 for t in trends if t < 0)

                if bullish > bearish:
                    alignment_score = 0.7
                elif bearish > bullish:
                    alignment_score = 0.3
                else:
                    alignment_score = 0.5

        except Exception as e:
            logger.error(f"Error in multi-timeframe analysis: {e}")

        return alignment_score

    def _calculate_overall_confidence(self, prob_result, ensemble_result, structure_analysis, institutional_score) -> float:
        """Calculate overall confidence from all components"""
        weights = {
            'probability': 0.4,
            'ensemble': 0.3,
            'structure': 0.2,
            'institutional': 0.1
        }

        confidence = (
            prob_result.final_probability * weights['probability'] +
            ensemble_result.probability * weights['ensemble'] +
            structure_analysis.get('score', 0.5) * weights['structure'] +
            institutional_score * weights['institutional']
        )

        return min(confidence, 1.0)

    def _determine_action(self, probability: float, ensemble_result, confidence: float) -> str:
        """Determine final action based on probability and confidence"""
        if probability >= 0.75 and confidence >= 0.7:
            if ensemble_result.recommended_action == "BUY":
                return "BUY"
            elif ensemble_result.recommended_action == "SELL":
                return "SELL"

        return "HOLD"

    def _calculate_risk_targets(self, action: str, market_data: Dict, candles: List, regime: MarketRegime) -> Dict:
        """Calculate risk-adjusted price targets"""
        ltp = market_data.get('ltp', 0)
        if ltp == 0:
            return self._get_default_targets(ltp)

        # Calculate ATR for dynamic stop loss
        atr = self._calculate_atr(candles)

        if action == "BUY":
            entry = ltp
            stop_distance = max(atr * 1.5, ltp * 0.015)  # ATR or 1.5% minimum
            stop_loss = ltp - stop_distance
            target_distance = stop_distance * 2  # 2:1 reward ratio
            target_1 = ltp + target_distance
            target_2 = ltp + target_distance * 1.5
            target_3 = ltp + target_distance * 2

        elif action == "SELL":
            entry = ltp
            stop_distance = max(atr * 1.5, ltp * 0.015)
            stop_loss = ltp + stop_distance
            target_distance = stop_distance * 2
            target_1 = ltp - target_distance
            target_2 = ltp - target_distance * 1.5
            target_3 = ltp - target_distance * 2
        else:
            return self._get_default_targets(ltp)

        risk = abs(entry - stop_loss)
        reward = abs(target_1 - entry)
        risk_reward = round(reward / risk, 2) if risk > 0 else 0

        # Position sizing (risk 1% of capital)
        position_size_percent = 0.01  # 1% risk per trade
        max_loss_amount = risk * position_size_percent

        return {
            'entry': round(entry, 2),
            'stop_loss': round(stop_loss, 2),
            'target_1': round(target_1, 2),
            'target_2': round(target_2, 2),
            'target_3': round(target_3, 2),
            'risk_reward': risk_reward,
            'position_size': position_size_percent,
            'max_loss': round(max_loss_amount, 2)
        }

    def _calculate_atr(self, candles: List, period: int = 14) -> float:
        """Calculate Average True Range"""
        if not candles or len(candles) < period:
            return 0

        tr_values = []
        for i in range(1, min(len(candles), period + 1)):
            high = candles[i].get('high', candles[i].get('ltp', 0))
            low = candles[i].get('low', candles[i].get('ltp', 0))
            close_prev = candles[i-1].get('close', candles[i-1].get('ltp', 0))

            tr = max(
                high - low,
                abs(high - close_prev),
                abs(low - close_prev)
            )
            tr_values.append(tr)

        return sum(tr_values) / len(tr_values) if tr_values else 0

    def _get_default_targets(self, ltp: float) -> Dict:
        """Get default targets when calculation fails"""
        return {
            'entry': ltp,
            'stop_loss': ltp,
            'target_1': ltp,
            'target_2': ltp,
            'target_3': ltp,
            'risk_reward': 0,
            'position_size': 0,
            'max_loss': 0
        }

    def _assess_risk(self, probability: float, regime: MarketRegime, technical_scores: Dict) -> str:
        """Assess signal risk level"""
        if regime == MarketRegime.PANIC:
            return "EXTREME"

        # Risk based on probability and technical scores
        risk_score = 0

        if probability < 0.7:
            risk_score += 2
        elif probability < 0.8:
            risk_score += 1

        if technical_scores.get('volatility', 0) > 0.7:
            risk_score += 1

        if technical_scores.get('momentum', 0.5) < 0.3 or technical_scores.get('momentum', 0.5) > 0.7:
            risk_score += 1

        if risk_score >= 3:
            return "EXTREME"
        elif risk_score >= 2:
            return "HIGH"
        elif risk_score >= 1:
            return "MEDIUM"
        return "LOW"

    def _create_error_signal(self, trace_id: str, symbol: str, error: str) -> Dict:
        """Create error signal when generation fails"""
        return {
            "trace_id": trace_id,
            "symbol": symbol,
            "action": "HOLD",
            "direction": "NEUTRAL",
            "probability": 0.0,
            "confidence": 0.0,
            "error": error,
            "signal_time": datetime.utcnow().isoformat(),
        }


# Singleton instance
signal_service = SignalService()
