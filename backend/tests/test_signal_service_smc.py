"""
Unit Tests for Signal Service SMC
Tests for SMC-based signal generation service
"""

import pytest
import pandas as pd
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from app.services.signal_service_smc import SignalServiceSMC
from app.engines.smc_engine import SMCSetup, MarketStructure, LiquidityType
from app.engines.risk_engine import risk_engine


class TestSignalServiceSMC:
    """Test cases for Signal Service SMC"""

    @pytest.fixture
    def signal_service_smc(self):
        """Create SignalServiceSMC instance"""
        return SignalServiceSMC()

    @pytest.fixture
    def mock_smc_setup(self):
        """Create mock SMC setup for testing"""
        return SMCSetup(
            direction="BUY",
            entry_price=100.0,
            stop_loss=98.0,
            target_price=105.0,
            risk_reward_ratio=2.5,
            structure_bias=MarketStructure.BULLISH,
            liquidity_sweep=MagicMock(),
            order_block=MagicMock(),
            fvg=MagicMock(),
            mtf_confirmation=True,
            quality_score=0.85,
            confidence="HIGH",
            timestamp=datetime.utcnow()
        )

    def test_init(self, signal_service_smc):
        """Test SignalServiceSMC initialization"""
        assert signal_service_smc.market_data is not None
        assert signal_service_smc.risk_engine is not None

    @pytest.mark.asyncio
    async def test_generate_signal_success(self, signal_service_smc, mock_smc_setup):
        """Test successful signal generation"""
        # Mock market data service
        with patch.object(signal_service_smc.market_data, 'get_ohlcv') as mock_get_ohlcv, \
             patch('app.services.signal_service_smc.smc_engine') as mock_smc_engine, \
             patch.object(signal_service_smc, '_validate_smc_risk') as mock_validate_risk, \
             patch.object(signal_service_smc, '_create_smc_signal') as mock_create_signal:

            # Setup mocks
            mock_get_ohlcv.side_effect = [
                pd.DataFrame({
                    'open': [100, 101, 102],
                    'high': [105, 106, 107],
                    'low': [95, 96, 97],
                    'close': [103, 104, 105],
                    'volume': [1000, 1100, 1200]
                }),  # LTF data
                pd.DataFrame({
                    'open': [100, 101],
                    'high': [105, 106],
                    'low': [95, 96],
                    'close': [103, 104],
                    'volume': [1000, 1100]
                })   # HTF data
            ]

            mock_smc_engine.analyze_symbol.return_value = mock_smc_setup
            mock_validate_risk.return_value = {
                'approved': True,
                'risk_level': 'LOW',
                'risk_score': 0,
                'reasons': []
            }
            mock_create_signal.return_value = {"signal": "test"}

            # Test
            result = await signal_service_smc.generate_signal(
                symbol="RELIANCE",
                exchange="NSE",
                ltf_timeframe="15m",
                htf_timeframe="1h"
            )

            # Assertions
            assert result == {"signal": "test"}
            mock_get_ohlcv.assert_called()
            mock_smc_engine.analyze_symbol.assert_called_once()
            mock_validate_risk.assert_called_once()
            mock_create_signal.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_signal_insufficient_ltf_data(self, signal_service_smc):
        """Test signal generation with insufficient LTF data"""
        with patch.object(signal_service_smc.market_data, 'get_ohlcv') as mock_get_ohlcv:
            mock_get_ohlcv.return_value = None  # No data

            result = await signal_service_smc.generate_signal("RELIANCE", "NSE")

            assert result["action"] == "HOLD"
            assert "Insufficient LTF data" in result["reason"]

    @pytest.mark.asyncio
    async def test_generate_signal_insufficient_htf_data(self, signal_service_smc):
        """Test signal generation with insufficient HTF data but valid LTF"""
        with patch.object(signal_service_smc.market_data, 'get_ohlcv') as mock_get_ohlcv, \
             patch('app.services.signal_service_smc.smc_engine') as mock_smc_engine:

            # Valid LTF data, no HTF data
            mock_get_ohlcv.side_effect = [
                pd.DataFrame({
                    'open': list(range(100, 200)),
                    'high': list(range(105, 205)),
                    'low': list(range(95, 195)),
                    'close': list(range(103, 203)),
                    'volume': [1000] * 100
                }),  # Valid LTF data
                None  # No HTF data
            ]

            mock_smc_engine.analyze_symbol.return_value = None  # No setup found

            result = await signal_service_smc.generate_signal("RELIANCE", "NSE")

            assert result["action"] == "HOLD"
            assert "No valid SMC setup found" in result["reason"]

    @pytest.mark.asyncio
    async def test_generate_signal_no_setup_found(self, signal_service_smc):
        """Test signal generation when no SMC setup is found"""
        with patch.object(signal_service_smc.market_data, 'get_ohlcv') as mock_get_ohlcv, \
             patch('app.services.signal_service_smc.smc_engine') as mock_smc_engine:

            # Setup valid data
            mock_get_ohlcv.side_effect = [
                pd.DataFrame({
                    'open': list(range(100, 200)),
                    'high': list(range(105, 205)),
                    'low': list(range(95, 195)),
                    'close': list(range(103, 203)),
                    'volume': [1000] * 100
                }),
                pd.DataFrame({
                    'open': [100, 101],
                    'high': [105, 106],
                    'low': [95, 96],
                    'close': [103, 104],
                    'volume': [1000, 1100]
                })
            ]

            mock_smc_engine.analyze_symbol.return_value = None  # No setup

            result = await signal_service_smc.generate_signal("RELIANCE", "NSE")

            assert result["action"] == "HOLD"
            assert "No valid SMC setup found" in result["reason"]

    def test_validate_smc_risk_low_risk(self, signal_service_smc, mock_smc_setup):
        """Test risk validation for low risk setup"""
        mock_smc_setup.quality_score = 0.9
        mock_smc_setup.risk_reward_ratio = 2.0
        mock_smc_setup.mtf_confirmation = True

        result = signal_service_smc._validate_smc_risk(mock_smc_setup)

        assert result['approved'] is True
        assert result['risk_level'] == 'LOW'
        assert result['risk_score'] == 0
        assert len(result['reasons']) == 0

    def test_validate_smc_risk_medium_risk(self, signal_service_smc, mock_smc_setup):
        """Test risk validation for medium risk setup"""
        mock_smc_setup.quality_score = 0.7
        mock_smc_setup.risk_reward_ratio = 1.8
        mock_smc_setup.mtf_confirmation = False

        result = signal_service_smc._validate_smc_risk(mock_smc_setup)

        assert result['approved'] is True
        assert result['risk_level'] == 'MEDIUM'
        assert result['risk_score'] == 1
        assert len(result['reasons']) == 1

    def test_validate_smc_risk_high_risk(self, signal_service_smc, mock_smc_setup):
        """Test risk validation for high risk setup"""
        mock_smc_setup.quality_score = 0.5
        mock_smc_setup.risk_reward_ratio = 1.3
        mock_smc_setup.mtf_confirmation = False

        result = signal_service_smc._validate_smc_risk(mock_smc_setup)

        assert result['approved'] is True
        assert result['risk_level'] == 'HIGH'
        assert result['risk_score'] == 2
        assert len(result['reasons']) == 2

    def test_validate_smc_risk_extreme_risk(self, signal_service_smc, mock_smc_setup):
        """Test risk validation for extreme risk setup"""
        mock_smc_setup.quality_score = 0.4
        mock_smc_setup.risk_reward_ratio = 1.2
        mock_smc_setup.mtf_confirmation = False

        result = signal_service_smc._validate_smc_risk(mock_smc_setup)

        assert result['approved'] is False
        assert result['risk_level'] == 'EXTREME'
        assert result['risk_score'] == 3
        assert len(result['reasons']) == 2

    def test_create_smc_signal_buy(self, signal_service_smc, mock_smc_setup):
        """Test creating BUY SMC signal"""
        mock_smc_setup.direction = "BUY"
        mock_smc_setup.liquidity_sweep.zone_type = LiquidityType.SWEEP
        mock_smc_setup.liquidity_sweep.price_level = 98.0
        mock_smc_setup.liquidity_sweep.strength = 0.8
        mock_smc_setup.order_block.price_level = 102.0
        mock_smc_setup.order_block.direction = "BULLISH"
        mock_smc_setup.order_block.strength = 0.7
        mock_smc_setup.fvg.top = 104.0
        mock_smc_setup.fvg.bottom = 100.0
        mock_smc_setup.fvg.midpoint = 102.0
        mock_smc_setup.fvg.direction = "BULLISH"

        risk_validation = {
            'approved': True,
            'risk_level': 'LOW',
            'risk_score': 0,
            'reasons': []
        }

        result = signal_service_smc._create_smc_signal(
            "test_trace", "RELIANCE", "NSE", mock_smc_setup, risk_validation
        )

        assert result['trace_id'] == "test_trace"
        assert result['symbol'] == "RELIANCE"
        assert result['exchange'] == "NSE"
        assert result['strategy'] == "SMC"
        assert result['action'] == "BUY"
        assert result['direction'] == "BUY"
        assert result['entry_price'] == 100.0
        assert result['stop_loss'] == 98.0
        assert result['target_price'] == 105.0
        assert result['quality_score'] == 0.85
        assert result['confidence'] == "HIGH"
        assert result['approved'] is True

    def test_create_smc_signal_sell(self, signal_service_smc, mock_smc_setup):
        """Test creating SELL SMC signal"""
        mock_smc_setup.direction = "SELL"
        mock_smc_setup.liquidity_sweep.zone_type = LiquidityType.SWEEP
        mock_smc_setup.liquidity_sweep.price_level = 102.0
        mock_smc_setup.liquidity_sweep.strength = 0.8
        mock_smc_setup.order_block.price_level = 98.0
        mock_smc_setup.order_block.direction = "BEARISH"
        mock_smc_setup.order_block.strength = 0.7
        mock_smc_setup.fvg.top = 100.0
        mock_smc_setup.fvg.bottom = 96.0
        mock_smc_setup.fvg.midpoint = 98.0
        mock_smc_setup.fvg.direction = "BEARISH"

        risk_validation = {
            'approved': True,
            'risk_level': 'MEDIUM',
            'risk_score': 1,
            'reasons': ['Poor risk-reward ratio']
        }

        result = signal_service_smc._create_smc_signal(
            "test_trace", "TCS", "NSE", mock_smc_setup, risk_validation
        )

        assert result['action'] == "SELL"
        assert result['direction'] == "SELL"
        assert result['risk_level'] == "MEDIUM"
        assert len(result['risk_reasons']) == 1

    def test_create_hold_signal(self, signal_service_smc):
        """Test creating hold signal"""
        result = signal_service_smc._create_hold_signal("test_trace", "RELIANCE", "No setup found")

        assert result['trace_id'] == "test_trace"
        assert result['symbol'] == "RELIANCE"
        assert result['action'] == "HOLD"
        assert result['direction'] == "NEUTRAL"
        assert result['reason'] == "No setup found"
        assert result['quality_score'] == 0.0
        assert result['confidence'] == "LOW"
        assert result['approved'] is False

    def test_create_error_signal(self, signal_service_smc):
        """Test creating error signal"""
        error_msg = "Market data unavailable"
        result = signal_service_smc._create_error_signal("test_trace", "RELIANCE", error_msg)

        assert result['trace_id'] == "test_trace"
        assert result['symbol'] == "RELIANCE"
        assert result['action'] == "HOLD"
        assert result['direction'] == "ERROR"
        assert result['error'] == error_msg
        assert result['quality_score'] == 0.0
        assert result['confidence'] == "LOW"
        assert result['approved'] is False

    @pytest.mark.asyncio
    async def test_get_smc_metrics(self, signal_service_smc):
        """Test getting SMC metrics"""
        with patch('app.services.signal_service_smc.smc_engine') as mock_smc_engine:
            mock_smc_engine.get_smc_performance_metrics.return_value = {
                'engine_type': 'SMC',
                'components': ['Market Structure', 'Liquidity', 'Order Blocks'],
                'logic_type': 'Rule-Based Price Action',
                'ml_usage': 'None'
            }

            result = await signal_service_smc.get_smc_metrics()

            assert isinstance(result, dict)
            assert result['engine_type'] == 'SMC'
            assert 'Market Structure' in result['components']
            mock_smc_engine.get_smc_performance_metrics.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_signal_exception_handling(self, signal_service_smc):
        """Test exception handling in signal generation"""
        with patch.object(signal_service_smc.market_data, 'get_ohlcv') as mock_get_ohlcv:
            mock_get_ohlcv.side_effect = Exception("API Error")

            result = await signal_service_smc.generate_signal("RELIANCE", "NSE")

            assert result['action'] == "HOLD"
            assert result['direction'] == "ERROR"
            assert "API Error" in result['error']
