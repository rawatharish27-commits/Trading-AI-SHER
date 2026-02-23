"""
Signal Service - SMC Based
Pure Smart Money Concept trading signals
"""

from datetime import datetime
from typing import Dict, List, Optional
import uuid

from loguru import logger

from app.engines.smc_engine import smc_engine, SMCSetup
from app.engines.risk_engine import risk_engine
from app.services.market_data_service import market_data_service


class SignalServiceSMC:
    """
    Signal Generation Service - Smart Money Concept

    Pure SMC-based trading signals:
    - Market Structure Analysis (HH, HL, LH, LL, BOS, CHOCH)
    - Liquidity Detection (Equal Highs/Lows, Sweeps)
    - Order Block Detection
    - Fair Value Gap Detection
    - Multi-Timeframe Confirmation
    - Rule-Based Entry Logic (No ML)
    """

    def __init__(self):
        self.market_data = market_data_service
        self.risk_engine = risk_engine

    async def generate_signal(
        self,
        symbol: str,
        exchange: str = "NSE",
        ltf_timeframe: str = "15m",
        htf_timeframe: str = "1h"
    ) -> Dict:
        """
        Generate SMC-based trading signal

        Args:
            symbol: Trading symbol (e.g., "RELIANCE", "TCS")
            exchange: Exchange (NSE, BSE, MCX)
            ltf_timeframe: Lower timeframe for entry (5m, 15m)
            htf_timeframe: Higher timeframe for bias (1h, 4h)

        Returns:
            SMC signal dictionary
        """
        trace_id = str(uuid.uuid4())[:12]
        logger.info(f"🎯 [{trace_id}] Generating SMC signal for {symbol}")

        try:
            # 1. Get LTF data for detailed analysis
            ltf_data = await self.market_data.get_ohlcv(symbol, ltf_timeframe, limit=200)
            if ltf_data is None or len(ltf_data) < 100:
                return self._create_error_signal(trace_id, symbol, "Insufficient LTF data")

            # 2. Get HTF data for bias confirmation
            htf_data = await self.market_data.get_ohlcv(symbol, htf_timeframe, limit=100)
            if htf_data is None or len(htf_data) < 50:
                htf_data = None  # Continue without HTF if not available

            # 3. Run SMC analysis
            smc_setup = await smc_engine.analyze_symbol(symbol, ltf_data, htf_data)

            if not smc_setup:
                return self._create_hold_signal(trace_id, symbol, "No valid SMC setup found")

            # 4. Risk validation
            risk_validation = await self._validate_smc_risk(smc_setup)

            # 5. Create signal response
            signal = self._create_smc_signal(trace_id, symbol, exchange, smc_setup, risk_validation)

            logger.info(f"✅ [{trace_id}] SMC Signal: {smc_setup.direction} {symbol} | Quality: {smc_setup.quality_score:.1%} | Confidence: {smc_setup.confidence}")
            return signal

        except Exception as e:
            logger.error(f"❌ [{trace_id}] SMC signal generation failed for {symbol}: {e}")
            return self._create_error_signal(trace_id, symbol, str(e))

    async def _validate_smc_risk(self, setup: SMCSetup) -> Dict:
        """Validate SMC setup against risk parameters"""
        try:
            # Basic risk checks for SMC setups
            risk_score = 0
            reasons = []

            # Quality check
            if setup.quality_score < 0.6:
                risk_score += 2
                reasons.append("Low quality setup")

            # RR ratio check
            if setup.risk_reward_ratio < 1.5:
                risk_score += 1
                reasons.append("Poor risk-reward ratio")

            # MTF confirmation
            if not setup.mtf_confirmation:
                risk_score += 1
                reasons.append("No MTF confirmation")

            # Risk level assessment
            if risk_score >= 3:
                risk_level = "EXTREME"
            elif risk_score >= 2:
                risk_level = "HIGH"
            elif risk_score >= 1:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            return {
                'approved': risk_score < 3,  # Reject extreme risk
                'risk_level': risk_level,
                'risk_score': risk_score,
                'reasons': reasons
            }

        except Exception as e:
            logger.error(f"Risk validation failed: {e}")
            return {
                'approved': False,
                'risk_level': 'EXTREME',
                'risk_score': 3,
                'reasons': ['Risk validation error']
            }

    def _create_smc_signal(self, trace_id: str, symbol: str, exchange: str,
                          setup: SMCSetup, risk_validation: Dict) -> Dict:
        """Create SMC signal response"""
        return {
            "trace_id": trace_id,
            "symbol": symbol,
            "exchange": exchange,
            "strategy": "SMC",
            "action": setup.direction,
            "direction": setup.direction,

            # Signal Versioning
            "setup_version": "1.0",  # Current SMC setup version

            # SMC Components
            "market_structure": setup.structure_bias.value,
            "liquidity_sweep": {
                "price": setup.liquidity_sweep.price_level if setup.liquidity_sweep else None,
                "type": setup.liquidity_sweep.zone_type.value if setup.liquidity_sweep else None,
                "strength": setup.liquidity_sweep.strength if setup.liquidity_sweep else 0
            } if setup.liquidity_sweep else None,

            "order_block": {
                "price": setup.order_block.price_level if setup.order_block else None,
                "direction": setup.order_block.direction if setup.order_block else None,
                "strength": setup.order_block.strength if setup.order_block else 0,
                "mitigated": setup.order_block.is_mitigated if setup.order_block else False
            } if setup.order_block else None,

            "fvg": {
                "top": setup.fvg.top if setup.fvg else None,
                "bottom": setup.fvg.bottom if setup.fvg else None,
                "midpoint": setup.fvg.midpoint if setup.fvg else None,
                "direction": setup.fvg.direction if setup.fvg else None,
                "filled": setup.fvg.is_filled if setup.fvg else False
            } if setup.fvg else None,

            "mtf_confirmation": setup.mtf_confirmation,

            # Quality & Confidence
            "quality_score": setup.quality_score,
            "confidence": setup.confidence,
            "risk_level": risk_validation['risk_level'],
            "approved": risk_validation['approved'],

            # Price Levels
            "entry_price": setup.entry_price,
            "stop_loss": setup.stop_loss,
            "target_price": setup.target_price,

            # Risk Metrics
            "risk_reward_ratio": setup.risk_reward_ratio,
            "risk_amount": abs(setup.entry_price - setup.stop_loss),
            "reward_amount": abs(setup.target_price - setup.entry_price),

            # Metadata
            "signal_time": setup.timestamp.isoformat(),
            "setup_timestamp": setup.timestamp.isoformat(),

            # Risk validation details
            "risk_reasons": risk_validation['reasons']
        }

    def _create_hold_signal(self, trace_id: str, symbol: str, reason: str) -> Dict:
        """Create hold signal when no setup is found"""
        return {
            "trace_id": trace_id,
            "symbol": symbol,
            "strategy": "SMC",
            "action": "HOLD",
            "direction": "NEUTRAL",
            "reason": reason,
            "quality_score": 0.0,
            "confidence": "LOW",
            "approved": False,
            "signal_time": datetime.utcnow().isoformat(),
        }

    def _create_error_signal(self, trace_id: str, symbol: str, error: str) -> Dict:
        """Create error signal when generation fails"""
        return {
            "trace_id": trace_id,
            "symbol": symbol,
            "strategy": "SMC",
            "action": "HOLD",
            "direction": "ERROR",
            "error": error,
            "quality_score": 0.0,
            "confidence": "LOW",
            "approved": False,
            "signal_time": datetime.utcnow().isoformat(),
        }

    async def get_smc_metrics(self) -> Dict:
        """Get SMC engine performance metrics"""
        return smc_engine.get_smc_performance_metrics()


# Singleton instance
signal_service_smc = SignalServiceSMC()
