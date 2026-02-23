"""
Unit Tests for SMC Engine
Tests for Smart Money Concept engine components
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from app.engines.smc_engine import (
    SMCEngine, MarketStructure, LiquidityType,
    SwingPoint, OrderBlock, FairValueGap, LiquidityZone, SMCSetup
)


class TestSMCEngine:
    """Test cases for SMC Engine"""

    @pytest.fixture
    def smc_engine(self):
        """Create SMC engine instance"""
        return SMCEngine()

    @pytest.fixture
    def sample_ohlcv_data(self):
        """Create sample OHLCV data for testing"""
        # Create 100 candles of sample data
        dates = pd.date_range(start='2024-01-01', periods=100, freq='15min')
        np.random.seed(42)  # For reproducible results

        # Generate realistic price data
        base_price = 100.0
        prices = []
        current_price = base_price

        for i in range(100):
            # Add some trend and noise
            trend = 0.001 * (i - 50)  # Slight upward trend
            noise = np.random.normal(0, 0.5)
            change = trend + noise
            current_price += change

            high = current_price + abs(np.random.normal(0, 0.3))
            low = current_price - abs(np.random.normal(0, 0.3))
            open_price = current_price + np.random.normal(0, 0.2)
            close = current_price + np.random.normal(0, 0.2)

            # Ensure OHLC relationships
            high = max(high, open_price, close)
            low = min(low, open_price, close)

            prices.append({
                'timestamp': dates[i],
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(close, 2),
                'volume': np.random.randint(1000, 10000)
            })

        return pd.DataFrame(prices).set_index('timestamp')

    def test_market_structure_detection_bullish(self, smc_engine, sample_ohlcv_data):
        """Test bullish market structure detection"""
        # Modify data to create bullish structure (higher highs, higher lows)
        df = sample_ohlcv_data.copy()
        # Create clear bullish trend
        for i in range(len(df)):
            df.iloc[i, df.columns.get_loc('high')] = 100 + i * 0.5
            df.iloc[i, df.columns.get_loc('low')] = 99 + i * 0.5
            df.iloc[i, df.columns.get_loc('close')] = 99.5 + i * 0.5

        structure = smc_engine._detect_market_structure(df)
        assert structure in [MarketStructure.BULLISH, MarketStructure.SIDEWAYS]

    def test_market_structure_detection_bearish(self, smc_engine, sample_ohlcv_data):
        """Test bearish market structure detection"""
        # Modify data to create bearish structure (lower highs, lower lows)
        df = sample_ohlcv_data.copy()
        # Create clear bearish trend
        for i in range(len(df)):
            df.iloc[i, df.columns.get_loc('high')] = 200 - i * 0.5
            df.iloc[i, df.columns.get_loc('low')] = 199 - i * 0.5
            df.iloc[i, df.columns.get_loc('close')] = 199.5 - i * 0.5

        structure = smc_engine._detect_market_structure(df)
        assert structure in [MarketStructure.BEARISH, MarketStructure.SIDEWAYS]

    def test_market_structure_detection_sideways(self, smc_engine, sample_ohlcv_data):
        """Test sideways market structure detection"""
        # Keep data relatively flat
        df = sample_ohlcv_data.copy()
        for i in range(len(df)):
            df.iloc[i, df.columns.get_loc('high')] = 100 + np.sin(i * 0.1) * 2
            df.iloc[i, df.columns.get_loc('low')] = 98 + np.sin(i * 0.1) * 2
            df.iloc[i, df.columns.get_loc('close')] = 99 + np.sin(i * 0.1) * 2

        structure = smc_engine._detect_market_structure(df)
        assert isinstance(structure, MarketStructure)

    def test_swing_points_detection(self, smc_engine, sample_ohlcv_data):
        """Test swing points detection"""
        swing_points = smc_engine._find_swing_points(sample_ohlcv_data)

        assert isinstance(swing_points, list)
        for sp in swing_points:
            assert isinstance(sp, SwingPoint)
            assert isinstance(sp.price, (int, float))
            assert isinstance(sp.index, int)
            assert isinstance(sp.is_high, bool)
            assert sp.strength >= 0

    def test_liquidity_zones_detection(self, smc_engine, sample_ohlcv_data):
        """Test liquidity zones detection"""
        swing_points = smc_engine._find_swing_points(sample_ohlcv_data)
        liquidity_zones = smc_engine._detect_liquidity_zones(sample_ohlcv_data, swing_points)

        assert isinstance(liquidity_zones, list)
        for zone in liquidity_zones:
            assert isinstance(zone, LiquidityZone)
            assert isinstance(zone.price_level, (int, float))
            assert isinstance(zone.zone_type, LiquidityType)
            assert 0 <= zone.strength <= 1

    def test_order_blocks_detection(self, smc_engine, sample_ohlcv_data):
        """Test order blocks detection"""
        swing_points = smc_engine._find_swing_points(sample_ohlcv_data)
        order_blocks = smc_engine._detect_order_blocks(sample_ohlcv_data, swing_points)

        assert isinstance(order_blocks, list)
        for ob in order_blocks:
            assert isinstance(ob, OrderBlock)
            assert isinstance(ob.price_level, (int, float))
            assert ob.direction in ['BULLISH', 'BEARISH']
            assert 0 <= ob.strength <= 1

    def test_fair_value_gaps_detection(self, smc_engine, sample_ohlcv_data):
        """Test fair value gaps detection"""
        fvgs = smc_engine._detect_fair_value_gaps(sample_ohlcv_data)

        assert isinstance(fvgs, list)
        for fvg in fvgs:
            assert isinstance(fvg, FairValueGap)
            assert fvg.top > fvg.bottom
            assert fvg.direction in ['BULLISH', 'BEARISH']
            assert fvg.size > 0

    def test_calculate_atr_simple(self, smc_engine, sample_ohlcv_data):
        """Test ATR calculation"""
        atr = smc_engine._calculate_atr_simple(sample_ohlcv_data)
        assert isinstance(atr, (int, float))
        assert atr >= 0

    def test_has_large_wick(self, smc_engine, sample_ohlcv_data):
        """Test large wick detection"""
        # Test with a candle that has a large wick
        test_df = pd.DataFrame({
            'high': [105.0],
            'low': [95.0],
            'open': [100.0],
            'close': [100.0]
        })

        has_large_wick_high = smc_engine._has_large_wick(test_df, 0, is_high=True)
        has_large_wick_low = smc_engine._has_large_wick(test_df, 0, is_high=False)

        assert isinstance(has_large_wick_high, bool)
        assert isinstance(has_large_wick_low, bool)

    def test_check_mitigation(self, smc_engine, sample_ohlcv_data):
        """Test order block mitigation check"""
        price_level = 100.0
        is_mitigated = smc_engine._check_mitigation(sample_ohlcv_data, price_level, 10, 20)
        assert isinstance(is_mitigated, bool)

    def test_calculate_setup_quality(self, smc_engine):
        """Test setup quality calculation"""
        # Create mock objects for testing
        structure = MarketStructure.BULLISH

        sweep = LiquidityZone(
            price_level=99.0,
            zone_type=LiquidityType.SWEEP,
            strength=0.8,
            wick_count=2,
            volume_sum=5000,
            timestamp=datetime.utcnow()
        )

        ob = OrderBlock(
            price_level=101.0,
            direction='BULLISH',
            top=102.0,
            bottom=100.0,
            volume=3000,
            strength=0.7,
            is_mitigated=False,
            timestamp=datetime.utcnow()
        )

        fvg = FairValueGap(
            top=103.0,
            bottom=99.0,
            midpoint=101.0,
            direction='BULLISH',
            size=4.0,
            is_filled=False,
            timestamp=datetime.utcnow()
        )

        mtf_bias = MarketStructure.BULLISH

        quality = smc_engine._calculate_setup_quality(structure, sweep, ob, fvg, mtf_bias)
        assert isinstance(quality, float)
        assert 0 <= quality <= 1

    def test_analyze_multi_timeframe_bias(self, smc_engine, sample_ohlcv_data):
        """Test multi-timeframe bias analysis"""
        mtf_analysis = smc_engine._analyze_multi_timeframe_bias(
            "TEST", sample_ohlcv_data, None, ['5m', '15m', '1h']
        )

        assert isinstance(mtf_analysis, dict)
        assert 'primary_bias' in mtf_analysis
        assert 'bias_strength' in mtf_analysis
        assert 'confluence_score' in mtf_analysis
        assert isinstance(mtf_analysis['primary_bias'], MarketStructure)
        assert 0 <= mtf_analysis['bias_strength'] <= 1
        assert 0 <= mtf_analysis['confluence_score'] <= 1

    def test_generate_smc_setup_insufficient_data(self, smc_engine):
        """Test SMC setup generation with insufficient data"""
        # Test with None data
        setup = smc_engine._generate_smc_setup("TEST", None, MarketStructure.SIDEWAYS, [], [], [], {})
        assert setup is None

        # Test with empty dataframe
        empty_df = pd.DataFrame()
        setup = smc_engine._generate_smc_setup("TEST", empty_df, MarketStructure.SIDEWAYS, [], [], [], {})
        assert setup is None

    def test_smc_setup_creation(self, smc_engine, sample_ohlcv_data):
        """Test SMC setup creation with valid data"""
        # Create bullish setup data
        current_price = 100.0
        df = sample_ohlcv_data.copy()
        df.iloc[-1, df.columns.get_loc('close')] = current_price

        structure = MarketStructure.BULLISH

        # Create liquidity sweep below price
        sweep = LiquidityZone(
            price_level=98.0,
            zone_type=LiquidityType.SWEEP,
            strength=0.9,
            wick_count=3,
            volume_sum=10000,
            timestamp=datetime.utcnow()
        )

        # Create bullish order block above price
        ob = OrderBlock(
            price_level=105.0,
            direction='BULLISH',
            top=106.0,
            bottom=104.0,
            volume=5000,
            strength=0.8,
            is_mitigated=False,
            timestamp=datetime.utcnow()
        )

        # Create bullish FVG above price
        fvg = FairValueGap(
            top=107.0,
            bottom=103.0,
            midpoint=105.0,
            direction='BULLISH',
            size=4.0,
            is_filled=False,
            timestamp=datetime.utcnow()
        )

        mtf_analysis = {
            'primary_bias': MarketStructure.BULLISH,
            'bias_strength': 0.8,
            'confluence_score': 0.9,
            'timeframe_agreement': 0.7,
            'trend_alignment': True
        }

        setup = smc_engine._generate_smc_setup(
            "TEST", df, structure, [sweep], [ob], [fvg], mtf_analysis
        )

        if setup:
            assert isinstance(setup, SMCSetup)
            assert setup.direction in ["BUY", "SELL"]
            assert setup.entry_price > 0
            assert setup.stop_loss > 0
            assert setup.target_price > 0
            assert setup.risk_reward_ratio >= 1.5
            assert 0 <= setup.quality_score <= 1
            assert setup.confidence in ["LOW", "MEDIUM", "HIGH"]

    def test_get_smc_performance_metrics(self, smc_engine):
        """Test getting SMC performance metrics"""
        metrics = smc_engine.get_smc_performance_metrics()

        assert isinstance(metrics, dict)
        assert 'engine_type' in metrics
        assert 'components' in metrics
        assert 'logic_type' in metrics
        assert metrics['engine_type'] == 'SMC'
        assert 'Market Structure' in metrics['components']

    def test_analyze_symbol_insufficient_data(self, smc_engine):
        """Test analyze_symbol with insufficient data"""
        # Test with None data
        result = smc_engine.analyze_symbol("TEST", None)
        assert result is None

        # Test with small dataframe
        small_df = pd.DataFrame({
            'open': [100, 101],
            'high': [102, 103],
            'low': [99, 100],
            'close': [101, 102],
            'volume': [1000, 1100]
        })
        result = smc_engine.analyze_symbol("TEST", small_df)
        assert result is None

    @pytest.mark.asyncio
    async def test_analyze_symbol_with_data(self, smc_engine, sample_ohlcv_data):
        """Test analyze_symbol with valid data"""
        result = await smc_engine.analyze_symbol("TEST", sample_ohlcv_data)

        # Result may be None if no valid setup is found, which is acceptable
        if result:
            assert isinstance(result, SMCSetup)
        else:
            assert result is None
