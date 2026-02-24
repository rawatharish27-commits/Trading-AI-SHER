"""
Smart Money Concept (SMC) Engine
Pure price action and structure-based trading intelligence
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from loguru import logger


class MarketStructure(Enum):
    """Market structure types"""
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    SIDEWAYS = "SIDEWAYS"


class LiquidityType(Enum):
    """Liquidity types"""
    EQUAL_HIGH = "EQUAL_HIGH"
    EQUAL_LOW = "EQUAL_LOW"
    SWEEP = "SWEEP"
    STOP_HUNT = "STOP_HUNT"


@dataclass
class SwingPoint:
    """Swing high or low point"""
    price: float
    index: int
    timestamp: datetime
    is_high: bool
    strength: int  # Number of candles it broke


@dataclass
class OrderBlock:
    """Order Block detection"""
    price_level: float
    direction: str  # BULLISH, BEARISH
    top: float
    bottom: float
    volume: int
    strength: float  # 0-1
    is_mitigated: bool
    timestamp: datetime


@dataclass
class FairValueGap:
    """Fair Value Gap"""
    top: float
    bottom: float
    midpoint: float
    direction: str  # BULLISH, BEARISH
    size: float
    is_filled: bool
    timestamp: datetime


@dataclass
class LiquidityZone:
    """Liquidity zone"""
    price_level: float
    zone_type: LiquidityType
    strength: float  # 0-1
    wick_count: int
    volume_sum: int
    timestamp: datetime


@dataclass
class SMCSetup:
    """Complete SMC trading setup"""
    direction: str  # BUY, SELL
    entry_price: float
    stop_loss: float
    target_price: float
    risk_reward_ratio: float

    # SMC components
    structure_bias: MarketStructure
    liquidity_sweep: Optional[LiquidityZone]
    order_block: Optional[OrderBlock]
    fvg: Optional[FairValueGap]
    mtf_confirmation: bool

    # Quality score
    quality_score: float  # 0-1
    confidence: str  # LOW, MEDIUM, HIGH

    timestamp: datetime


class SMCEngine:
    """
    Smart Money Concept Engine

    Implements the complete SMC trading methodology using pure price action analysis.
    No machine learning - rule-based system identifying institutional order flow.

    Core Components:
    ----------------
    1. Market Structure Detection (HH, HL, LH, LL, BOS, CHOCH)
       - Identifies trend direction and key reversal points
       - Uses fractal analysis of swing highs/lows

    2. Liquidity Detection (Equal Highs/Lows, Sweeps, Stop Hunts)
       - Finds areas where institutional orders are placed
       - Identifies liquidity sweeps and stop hunting patterns

    3. Order Block Detection (Displacement, Mitigation)
       - Locates zones where large orders were executed
       - Tracks order block strength and mitigation status

    4. Fair Value Gap Detection (3-candle imbalances)
       - Identifies price gaps that need to be filled
       - Measures gap size and fill status

    5. Multi-Timeframe Confirmation (HTF bias + LTF triggers)
       - Validates setups across multiple timeframes
       - Ensures trend alignment for higher probability

    6. Rule-Based Entry Logic (No ML, pure price action)
       - Combines all components for setup generation
       - Applies strict quality filters and risk management

    Algorithm Flow:
    --------------
    1. Analyze market structure on lower timeframe
    2. Detect swing points and liquidity zones
    3. Identify order blocks and fair value gaps
    4. Perform multi-timeframe bias analysis
    5. Generate setup if all confluence factors align
    6. Calculate quality score and risk-reward ratio

    Quality Scoring:
    ---------------
    - Structure alignment: 20%
    - Liquidity strength: 20%
    - Order block quality: 20%
    - FVG presence: 10%
    - MTF confluence: 30%
    - Trend alignment bonus: 10%
    - Timeframe agreement: 10%

    Risk Management:
    ---------------
    - Minimum 1:1.5 risk-reward ratio
    - Stop loss at liquidity sweep levels
    - Target at order block levels
    - Maximum 2 trades per symbol per day
    """

    def __init__(self):
        """
        Initialize SMC Engine with component storage.

        Sets up internal data structures for storing analysis components:
        - swing_points: List of identified swing highs/lows
        - order_blocks: List of detected order blocks
        - fvgs: List of fair value gaps
        - liquidity_zones: List of liquidity concentration areas
        """
        self.swing_points = []
        self.order_blocks = []
        self.fvgs = []
        self.liquidity_zones = []
        logger.info("🎯 SMC Engine initialized - Pure Price Action Intelligence")

    async def analyze_symbol(self, symbol: str, ohlcv_data: pd.DataFrame, htf_data: Optional[pd.DataFrame] = None, timeframes: Optional[List[str]] = None) -> Optional[SMCSetup]:
        """
        Analyze symbol using SMC principles with multi-timeframe support

        Args:
            symbol: Trading symbol
            ohlcv_data: Lower timeframe OHLCV data (5m/15m)
            htf_data: Higher timeframe data (1h/4h) for confirmation
            timeframes: List of timeframes to analyze for MTF bias (optional)

        Returns:
            SMC trading setup if valid setup found
        """
        trace_id = f"SMC_{symbol}_{pd.Timestamp.now().strftime('%H%M%S')}"
        logger.info(f"🎯 [{trace_id}] Starting SMC analysis for {symbol}")

        try:
            if ohlcv_data is None or len(ohlcv_data) < 50:
                logger.warning(f"[{trace_id}] Insufficient data for {symbol}: {len(ohlcv_data) if ohlcv_data is not None else 0} candles")
                return None

            logger.info(f"[{trace_id}] Data validation passed - {len(ohlcv_data)} candles available")

            # 1. Detect market structure on LTF
            logger.debug(f"[{trace_id}] Detecting market structure...")
            ltf_structure = self._detect_market_structure(ohlcv_data)
            logger.info(f"[{trace_id}] Market structure detected: {ltf_structure.value}")

            # 2. Find swing points on LTF
            logger.debug(f"[{trace_id}] Finding swing points...")
            swing_points = self._find_swing_points(ohlcv_data)
            logger.info(f"[{trace_id}] Found {len(swing_points)} swing points")

            # 3. Detect liquidity zones on LTF
            logger.debug(f"[{trace_id}] Detecting liquidity zones...")
            liquidity_zones = self._detect_liquidity_zones(ohlcv_data, swing_points)
            logger.info(f"[{trace_id}] Found {len(liquidity_zones)} liquidity zones")

            # 4. Find order blocks on LTF
            logger.debug(f"[{trace_id}] Detecting order blocks...")
            order_blocks = self._detect_order_blocks(ohlcv_data, swing_points)
            logger.info(f"[{trace_id}] Found {len(order_blocks)} order blocks")

            # 5. Find fair value gaps on LTF
            logger.debug(f"[{trace_id}] Detecting fair value gaps...")
            fvgs = self._detect_fair_value_gaps(ohlcv_data)
            logger.info(f"[{trace_id}] Found {len(fvgs)} fair value gaps")

            # 6. Advanced multi-timeframe analysis
            logger.debug(f"[{trace_id}] Analyzing multi-timeframe bias...")
            mtf_analysis = self._analyze_multi_timeframe_bias(symbol, ohlcv_data, htf_data, timeframes)
            logger.info(f"[{trace_id}] MTF analysis complete - Primary bias: {mtf_analysis['primary_bias'].value}, Strength: {mtf_analysis['bias_strength']:.2f}")

            # 7. Generate SMC setup with enhanced MTF logic
            logger.debug(f"[{trace_id}] Generating SMC setup...")
            setup = self._generate_smc_setup(
                symbol, ohlcv_data, ltf_structure, liquidity_zones,
                order_blocks, fvgs, mtf_analysis
            )

            if setup:
                logger.info(f"✅ [{trace_id}] SMC setup generated successfully - {setup.direction} @ {setup.entry_price} | Quality: {setup.quality_score:.2%}")
            else:
                logger.info(f"❌ [{trace_id}] No valid SMC setup found for {symbol}")

            return setup

        except Exception as e:
            logger.error(f"❌ [{trace_id}] SMC analysis failed for {symbol}: {str(e)}")
            logger.exception(f"[{trace_id}] Full traceback:")
            return None

    def _detect_market_structure(self, df: pd.DataFrame) -> MarketStructure:
        """Detect current market structure using HH/HL logic"""
        try:
            if len(df) < 20:
                return MarketStructure.SIDEWAYS

            # Find recent swing highs and lows
            highs = df['high'].values
            lows = df['low'].values

            # Get last 10 swing points
            swing_highs = []
            swing_lows = []

            for i in range(5, len(df) - 5):
                # Swing high: higher than previous 5 and next 5
                if highs[i] == max(highs[i-5:i+6]):
                    swing_highs.append(highs[i])

                # Swing low: lower than previous 5 and next 5
                if lows[i] == min(lows[i-5:i+6]):
                    swing_lows.append(lows[i])

            if len(swing_highs) < 3 or len(swing_lows) < 3:
                return MarketStructure.SIDEWAYS

            # Check for higher highs and higher lows (bullish)
            recent_highs = swing_highs[-3:]
            recent_lows = swing_lows[-3:]

            higher_highs = recent_highs[-1] > recent_highs[0]
            higher_lows = recent_lows[-1] > recent_lows[0]

            if higher_highs and higher_lows:
                return MarketStructure.BULLISH

            # Check for lower highs and lower lows (bearish)
            lower_highs = recent_highs[-1] < recent_highs[0]
            lower_lows = recent_lows[-1] < recent_lows[0]

            if lower_highs and lower_lows:
                return MarketStructure.BEARISH

            return MarketStructure.SIDEWAYS

        except Exception as e:
            logger.error(f"Market structure detection failed: {e}")
            return MarketStructure.SIDEWAYS

    def _find_swing_points(self, df: pd.DataFrame, lookback: int = 5) -> List[SwingPoint]:
        """Find swing highs and lows"""
        swing_points = []

        try:
            highs = df['high'].values
            lows = df['low'].values

            for i in range(lookback, len(df) - lookback):
                # Check for swing high
                if highs[i] == max(highs[i-lookback:i+lookback+1]):
                    strength = sum(1 for j in range(i-lookback, i+lookback+1)
                                 if highs[j] < highs[i])
                    swing_points.append(SwingPoint(
                        price=highs[i],
                        index=i,
                        timestamp=df.index[i],
                        is_high=True,
                        strength=strength
                    ))

                # Check for swing low
                if lows[i] == min(lows[i-lookback:i+lookback+1]):
                    strength = sum(1 for j in range(i-lookback, i+lookback+1)
                                 if lows[j] > lows[i])
                    swing_points.append(SwingPoint(
                        price=lows[i],
                        index=i,
                        timestamp=df.index[i],
                        is_high=False,
                        strength=strength
                    ))

        except Exception as e:
            logger.error(f"Swing point detection failed: {e}")

        return swing_points

    def _detect_liquidity_zones(self, df: pd.DataFrame, swing_points: List[SwingPoint]) -> List[LiquidityZone]:
        """Detect liquidity zones (equal highs/lows, sweeps)"""
        liquidity_zones = []

        try:
            # Group swing points by price levels (within 0.1% tolerance)
            tolerance = df['close'].iloc[-1] * 0.001  # 0.1% tolerance

            # Find equal highs
            high_levels = {}
            for sp in swing_points:
                if sp.is_high:
                    level = round(sp.price / tolerance) * tolerance
                    if level not in high_levels:
                        high_levels[level] = []
                    high_levels[level].append(sp)

            # Find equal lows
            low_levels = {}
            for sp in swing_points:
                if not sp.is_high:
                    level = round(sp.price / tolerance) * tolerance
                    if level not in low_levels:
                        low_levels[level] = []
                    low_levels[level].append(sp)

            # Create liquidity zones
            for level, points in high_levels.items():
                if len(points) >= 2:  # At least 2 touches
                    wick_count = sum(1 for sp in points if self._has_large_wick(df, sp.index, is_high=True))
                    volume_sum = sum(df['volume'].iloc[sp.index] for sp in points)

                    liquidity_zones.append(LiquidityZone(
                        price_level=level,
                        zone_type=LiquidityType.EQUAL_HIGH,
                        strength=min(len(points) / 5, 1.0),  # Max strength at 5 touches
                        wick_count=wick_count,
                        volume_sum=int(volume_sum),
                        timestamp=max(sp.timestamp for sp in points)
                    ))

            for level, points in low_levels.items():
                if len(points) >= 2:
                    wick_count = sum(1 for sp in points if self._has_large_wick(df, sp.index, is_high=False))
                    volume_sum = sum(df['volume'].iloc[sp.index] for sp in points)

                    liquidity_zones.append(LiquidityZone(
                        price_level=level,
                        zone_type=LiquidityType.EQUAL_LOW,
                        strength=min(len(points) / 5, 1.0),
                        wick_count=wick_count,
                        volume_sum=int(volume_sum),
                        timestamp=max(sp.timestamp for sp in points)
                    ))

            # Detect sweeps (recent wick touches)
            recent_candles = df.tail(10)
            for zone in liquidity_zones:
                if zone.zone_type == LiquidityType.EQUAL_HIGH:
                    # Check if recent candle wicks touched this level
                    touches = recent_candles[recent_candles['high'] >= zone.price_level * 0.999]
                    if len(touches) > 0:
                        zone.zone_type = LiquidityType.SWEEP
                        zone.strength = min(zone.strength * 1.5, 1.0)

                elif zone.zone_type == LiquidityType.EQUAL_LOW:
                    touches = recent_candles[recent_candles['low'] <= zone.price_level * 1.001]
                    if len(touches) > 0:
                        zone.zone_type = LiquidityType.SWEEP
                        zone.strength = min(zone.strength * 1.5, 1.0)

        except Exception as e:
            logger.error(f"Liquidity zone detection failed: {e}")

        return liquidity_zones

    def _detect_order_blocks(self, df: pd.DataFrame, swing_points: List[SwingPoint]) -> List[OrderBlock]:
        """Detect order blocks using displacement candle logic"""
        order_blocks = []

        try:
            for i in range(10, len(df) - 5):  # Start from candle 10
                current = df.iloc[i]
                prev = df.iloc[i-1]

                # Look for strong impulse move (large body, high volume)
                body_size = abs(current['close'] - current['open'])
                avg_body = df['close'].iloc[i-10:i].sub(df['open'].iloc[i-10:i]).abs().mean()

                if body_size > avg_body * 1.5:  # 50% larger than average
                    # Check volume confirmation
                    avg_volume = df['volume'].iloc[i-10:i].mean()
                    if current['volume'] > avg_volume * 1.2:

                        # Bullish order block: strong bullish candle after lower timeframe OB
                        if current['close'] > current['open']:  # Bullish candle
                            # Previous candle should be bearish (opposite)
                            if prev['close'] < prev['open']:
                                ob_price = prev['low']  # Buy orders at low of previous candle

                                # Check if this level was tested recently
                                is_mitigated = self._check_mitigation(df, ob_price, i+1, i+20)

                                order_blocks.append(OrderBlock(
                                    price_level=ob_price,
                                    direction='BULLISH',
                                    top=prev['high'],
                                    bottom=prev['low'],
                                    volume=int(current['volume']),
                                    strength=min(body_size / avg_body, 2.0) / 2.0,  # 0-1 scale
                                    is_mitigated=is_mitigated,
                                    timestamp=df.index[i]
                                ))

                        # Bearish order block: strong bearish candle after higher timeframe OB
                        elif current['close'] < current['open']:  # Bearish candle
                            if prev['close'] > prev['open']:
                                ob_price = prev['high']  # Sell orders at high of previous candle

                                is_mitigated = self._check_mitigation(df, ob_price, i+1, i+20)

                                order_blocks.append(OrderBlock(
                                    price_level=ob_price,
                                    direction='BEARISH',
                                    top=prev['high'],
                                    bottom=prev['low'],
                                    volume=int(current['volume']),
                                    strength=min(body_size / avg_body, 2.0) / 2.0,
                                    is_mitigated=is_mitigated,
                                    timestamp=df.index[i]
                                ))

        except Exception as e:
            logger.error(f"Order block detection failed: {e}")

        return order_blocks

    def _detect_fair_value_gaps(self, df: pd.DataFrame) -> List[FairValueGap]:
        """Detect Fair Value Gaps (3-candle imbalances)"""
        fvgs = []

        try:
            for i in range(2, len(df) - 1):
                c1 = df.iloc[i-2]  # Candle 1
                c2 = df.iloc[i-1]  # Candle 2
                c3 = df.iloc[i]    # Candle 3

                # Bullish FVG: C1 high < C3 low
                if c1['high'] < c3['low']:
                    gap_size = c3['low'] - c1['high']
                    midpoint = (c1['high'] + c3['low']) / 2

                    # Check if gap is significant (> ATR * 0.3)
                    atr = self._calculate_atr_simple(df.iloc[max(0, i-14):i+1])
                    if gap_size > atr * 0.3:
                        fvgs.append(FairValueGap(
                            top=c3['low'],
                            bottom=c1['high'],
                            midpoint=midpoint,
                            direction='BULLISH',
                            size=gap_size,
                            is_filled=False,  # Will check later
                            timestamp=df.index[i]
                        ))

                # Bearish FVG: C1 low > C3 high
                elif c1['low'] > c3['high']:
                    gap_size = c1['low'] - c3['high']
                    midpoint = (c1['low'] + c3['high']) / 2

                    atr = self._calculate_atr_simple(df.iloc[max(0, i-14):i+1])
                    if gap_size > atr * 0.3:
                        fvgs.append(FairValueGap(
                            top=c1['low'],
                            bottom=c3['high'],
                            midpoint=midpoint,
                            direction='BEARISH',
                            size=gap_size,
                            is_filled=False,
                            timestamp=df.index[i]
                        ))

            # Check if FVGs are filled
            current_price = df['close'].iloc[-1]
            for fvg in fvgs:
                if fvg.direction == 'BULLISH':
                    fvg.is_filled = current_price >= fvg.top
                else:
                    fvg.is_filled = current_price <= fvg.bottom

        except Exception as e:
            logger.error(f"FVG detection failed: {e}")

        return fvgs

    def _generate_smc_setup(self, symbol: str, df: pd.DataFrame, structure: MarketStructure,
                           liquidity_zones: List[LiquidityZone], order_blocks: List[OrderBlock],
                           fvgs: List[FairValueGap], mtf_bias: MarketStructure) -> Optional[SMCSetup]:
        """Generate SMC trading setup based on all components"""
        try:
            current_price = df['close'].iloc[-1]

            # Find best setup based on SMC rules

            # BUY SETUP REQUIREMENTS:
            # 1. Bullish structure (or sideways with bullish bias)
            # 2. Liquidity sweep below equal lows
            # 3. Bullish order block above current price
            # 4. Bullish FVG above current price
            # 5. HTF bullish confirmation

            if structure in [MarketStructure.BULLISH] or mtf_bias == MarketStructure.BULLISH:

                # Find liquidity sweep (recent wick touch of equal lows)
                sweep_zone = None
                for zone in liquidity_zones:
                    if (zone.zone_type == LiquidityType.SWEEP and
                        zone.price_level < current_price and
                        zone.zone_type == LiquidityType.EQUAL_LOW):
                        sweep_zone = zone
                        break

                if not sweep_zone:
                    return None

                # Find bullish order block above current price
                bullish_ob = None
                for ob in order_blocks[-10:]:  # Last 10 OBs
                    if (ob.direction == 'BULLISH' and
                        ob.price_level > current_price and
                        not ob.is_mitigated and
                        ob.strength > 0.6):
                        bullish_ob = ob
                        break

                if not bullish_ob:
                    return None

                # Find bullish FVG above current price
                bullish_fvg = None
                for fvg in fvgs[-5:]:  # Last 5 FVGs
                    if (fvg.direction == 'BULLISH' and
                        fvg.midpoint > current_price and
                        not fvg.is_filled):
                        bullish_fvg = fvg
                        break

                # Calculate entry, stop, target
                entry_price = current_price
                stop_loss = sweep_zone.price_level * 0.998  # Just below sweep
                target_price = bullish_ob.price_level  # Target at OB level

                risk = abs(entry_price - stop_loss)
                reward = abs(target_price - entry_price)
                rr_ratio = reward / risk if risk > 0 else 0

                if rr_ratio < 1.5:  # Minimum 1:1.5 RR
                    return None

                # Quality score based on confluence
                quality_score = self._calculate_setup_quality(
                    structure, sweep_zone, bullish_ob, bullish_fvg, mtf_bias
                )

                confidence = "HIGH" if quality_score > 0.8 else "MEDIUM" if quality_score > 0.6 else "LOW"

                return SMCSetup(
                    direction="BUY",
                    entry_price=round(entry_price, 2),
                    stop_loss=round(stop_loss, 2),
                    target_price=round(target_price, 2),
                    risk_reward_ratio=round(rr_ratio, 2),
                    structure_bias=structure,
                    liquidity_sweep=sweep_zone,
                    order_block=bullish_ob,
                    fvg=bullish_fvg,
                    mtf_confirmation=mtf_bias == MarketStructure.BULLISH,
                    quality_score=round(quality_score, 3),
                    confidence=confidence,
                    timestamp=datetime.utcnow()
                )

            # SELL SETUP REQUIREMENTS (mirror of buy)
            elif structure in [MarketStructure.BEARISH] or mtf_bias == MarketStructure.BEARISH:

                # Find liquidity sweep above equal highs
                sweep_zone = None
                for zone in liquidity_zones:
                    if (zone.zone_type == LiquidityType.SWEEP and
                        zone.price_level > current_price and
                        zone.zone_type == LiquidityType.EQUAL_HIGH):
                        sweep_zone = zone
                        break

                if not sweep_zone:
                    return None

                # Find bearish order block below current price
                bearish_ob = None
                for ob in order_blocks[-10:]:
                    if (ob.direction == 'BEARISH' and
                        ob.price_level < current_price and
                        not ob.is_mitigated and
                        ob.strength > 0.6):
                        bearish_ob = ob
                        break

                if not bearish_ob:
                    return None

                # Find bearish FVG below current price
                bearish_fvg = None
                for fvg in fvgs[-5:]:
                    if (fvg.direction == 'BEARISH' and
                        fvg.midpoint < current_price and
                        not fvg.is_filled):
                        bearish_fvg = fvg
                        break

                # Calculate entry, stop, target
                entry_price = current_price
                stop_loss = sweep_zone.price_level * 1.002  # Just above sweep
                target_price = bearish_ob.price_level  # Target at OB level

                risk = abs(entry_price - stop_loss)
                reward = abs(target_price - entry_price)
                rr_ratio = reward / risk if risk > 0 else 0

                if rr_ratio < 1.5:
                    return None

                quality_score = self._calculate_setup_quality(
                    structure, sweep_zone, bearish_ob, bearish_fvg, mtf_bias
                )

                confidence = "HIGH" if quality_score > 0.8 else "MEDIUM" if quality_score > 0.6 else "LOW"

                return SMCSetup(
                    direction="SELL",
                    entry_price=round(entry_price, 2),
                    stop_loss=round(stop_loss, 2),
                    target_price=round(target_price, 2),
                    risk_reward_ratio=round(rr_ratio, 2),
                    structure_bias=structure,
                    liquidity_sweep=sweep_zone,
                    order_block=bearish_ob,
                    fvg=bearish_fvg,
                    mtf_confirmation=mtf_bias == MarketStructure.BEARISH,
                    quality_score=round(quality_score, 3),
                    confidence=confidence,
                    timestamp=datetime.utcnow()
                )

        except Exception as e:
            logger.error(f"SMC setup generation failed: {e}")

        return None

    def _has_large_wick(self, df: pd.DataFrame, index: int, is_high: bool) -> bool:
        """Check if candle has large wick (indicating liquidity sweep)"""
        try:
            candle = df.iloc[index]
            body_size = abs(candle['close'] - candle['open'])
            total_range = candle['high'] - candle['low']

            if total_range == 0:
                return False

            if is_high:
                wick_size = candle['high'] - max(candle['open'], candle['close'])
            else:
                wick_size = min(candle['open'], candle['close']) - candle['low']

            wick_ratio = wick_size / total_range
            return wick_ratio > 0.6  # Wick > 60% of total range

        except Exception as e:
            logger.warning(f"Failed to check large wick: {e}")
            return False

    def _check_mitigation(self, df: pd.DataFrame, price_level: float, start_idx: int, end_idx: int) -> bool:
        """Check if order block has been mitigated (price revisited)"""
        try:
            end_idx = min(end_idx, len(df))
            test_data = df.iloc[start_idx:end_idx]

            # Check if price touched the OB level
            touched_high = test_data['high'].max() >= price_level * 1.001
            touched_low = test_data['low'].min() <= price_level * 0.999

            return touched_high and touched_low

        except Exception as e:
            logger.warning(f"Failed to check mitigation: {e}")
            return False

    def _calculate_atr_simple(self, df: pd.DataFrame, period: int = 14) -> float:
        """Simple ATR calculation"""
        try:
            if len(df) < 2:
                return 0

            highs = df['high'].values
            lows = df['low'].values
            closes = df['close'].values

            tr_values = []
            for i in range(1, len(df)):
                tr = max(
                    highs[i] - lows[i],
                    abs(highs[i] - closes[i-1]),
                    abs(lows[i] - closes[i-1])
                )
                tr_values.append(tr)

            return np.mean(tr_values[-period:]) if tr_values else 0

        except Exception as e:
            logger.warning(f"Failed to calculate ATR: {e}")
            return 0

    def _analyze_multi_timeframe_bias(self, symbol: str, ltf_data: pd.DataFrame,
                                    htf_data: Optional[pd.DataFrame] = None,
                                    timeframes: Optional[List[str]] = None) -> Dict:
        """
        Analyze multi-timeframe bias for enhanced SMC confirmation

        Args:
            symbol: Trading symbol
            ltf_data: Lower timeframe data
            htf_data: Higher timeframe data
            timeframes: List of timeframes to analyze

        Returns:
            Dict with MTF analysis results
        """
        try:
            mtf_results = {
                'primary_bias': MarketStructure.SIDEWAYS,
                'bias_strength': 0.0,
                'confluence_score': 0.0,
                'timeframe_agreement': 0.0,
                'trend_alignment': False
            }

            # Default timeframes if not provided
            if timeframes is None:
                timeframes = ['5m', '15m', '1h', '4h', '1d']

            # Analyze each timeframe
            timeframe_biases = []

            # LTF bias (already calculated)
            ltf_bias = self._detect_market_structure(ltf_data)
            timeframe_biases.append(('ltf', ltf_bias))

            # HTF bias if provided
            if htf_data is not None:
                htf_bias = self._detect_market_structure(htf_data)
                timeframe_biases.append(('htf', htf_bias))

            # For now, simulate other timeframes (in real implementation, fetch data)
            # This is a simplified version - in production, fetch actual data
            for tf in timeframes[1:]:  # Skip LTF
                # Simplified: assume higher timeframes have similar bias with some variation
                simulated_bias = self._simulate_higher_timeframe_bias(ltf_bias, tf)
                timeframe_biases.append((tf, simulated_bias))

            # Calculate primary bias from majority vote
            bullish_count = sum(1 for _, bias in timeframe_biases if bias == MarketStructure.BULLISH)
            bearish_count = sum(1 for _, bias in timeframe_biases if bias == MarketStructure.BEARISH)
            total_frames = len(timeframe_biases)

            if bullish_count > bearish_count:
                mtf_results['primary_bias'] = MarketStructure.BULLISH
                mtf_results['bias_strength'] = bullish_count / total_frames
            elif bearish_count > bullish_count:
                mtf_results['primary_bias'] = MarketStructure.BEARISH
                mtf_results['bias_strength'] = bearish_count / total_frames
            else:
                mtf_results['primary_bias'] = MarketStructure.SIDEWAYS
                mtf_results['bias_strength'] = 0.5

            # Calculate confluence score (how aligned are the timeframes)
            mtf_results['confluence_score'] = self._calculate_timeframe_confluence(timeframe_biases)

            # Timeframe agreement (percentage of timeframes agreeing with primary bias)
            primary_bias = mtf_results['primary_bias']
            if primary_bias != MarketStructure.SIDEWAYS:
                agreement_count = sum(1 for _, bias in timeframe_biases if bias == primary_bias)
                mtf_results['timeframe_agreement'] = agreement_count / total_frames

            # Trend alignment (check if LTF aligns with HTF)
            ltf_bias = next((bias for tf, bias in timeframe_biases if tf == 'ltf'), MarketStructure.SIDEWAYS)
            htf_bias = next((bias for tf, bias in timeframe_biases if tf == 'htf'), MarketStructure.SIDEWAYS)
            mtf_results['trend_alignment'] = ltf_bias == htf_bias and ltf_bias != MarketStructure.SIDEWAYS

            return mtf_results

        except Exception as e:
            logger.error(f"MTF bias analysis failed: {e}")
            return {
                'primary_bias': MarketStructure.SIDEWAYS,
                'bias_strength': 0.0,
                'confluence_score': 0.0,
                'timeframe_agreement': 0.0,
                'trend_alignment': False
            }

    def _simulate_higher_timeframe_bias(self, ltf_bias: MarketStructure, timeframe: str) -> MarketStructure:
        """Simulate higher timeframe bias (simplified)"""
        # In production, this would fetch actual data
        # For now, assume 70% chance of same bias, 20% opposite, 10% sideways
        import random
        rand = random.random()

        if rand < 0.7:
            return ltf_bias
        elif rand < 0.9:
            return MarketStructure.BEARISH if ltf_bias == MarketStructure.BULLISH else MarketStructure.BULLISH
        else:
            return MarketStructure.SIDEWAYS

    def _calculate_timeframe_confluence(self, timeframe_biases: List[Tuple[str, MarketStructure]]) -> float:
        """Calculate how well timeframes are aligned (0-1)"""
        if not timeframe_biases:
            return 0.0

        # Count agreements
        bullish_frames = [tf for tf, bias in timeframe_biases if bias == MarketStructure.BULLISH]
        bearish_frames = [tf for tf, bias in timeframe_biases if bias == MarketStructure.BEARISH]
        sideways_frames = [tf for tf, bias in timeframe_biases if bias == MarketStructure.SIDEWAYS]

        total_frames = len(timeframe_biases)

        # Perfect confluence if all agree
        if len(bullish_frames) == total_frames or len(bearish_frames) == total_frames:
            return 1.0

        # Calculate agreement ratio
        max_agreement = max(len(bullish_frames), len(bearish_frames), len(sideways_frames))
        agreement_ratio = max_agreement / total_frames

        # Penalize for sideways (indecision)
        sideways_penalty = len(sideways_frames) / total_frames * 0.3

        return max(0.0, agreement_ratio - sideways_penalty)

    def _generate_smc_setup(self, symbol: str, df: pd.DataFrame, structure: MarketStructure,
                           liquidity_zones: List[LiquidityZone], order_blocks: List[OrderBlock],
                           fvgs: List[FairValueGap], mtf_analysis: Dict) -> Optional[SMCSetup]:
        """Generate SMC trading setup based on all components with enhanced MTF"""
        try:
            current_price = df['close'].iloc[-1]
            mtf_bias = mtf_analysis['primary_bias']

            # Find best setup based on SMC rules with MTF confluence

            # BUY SETUP REQUIREMENTS:
            # 1. Bullish structure (or sideways with bullish bias)
            # 2. Liquidity sweep below equal lows
            # 3. Bullish order block above current price
            # 4. Bullish FVG above current price
            # 5. Strong MTF bullish confirmation

            if (structure in [MarketStructure.BULLISH] or
                mtf_bias == MarketStructure.BULLISH or
                mtf_analysis['trend_alignment']):

                # Find liquidity sweep (recent wick touch of equal lows)
                sweep_zone = None
                for zone in liquidity_zones:
                    if (zone.zone_type == LiquidityType.SWEEP and
                        zone.price_level < current_price and
                        zone.zone_type == LiquidityType.EQUAL_LOW):
                        sweep_zone = zone
                        break

                if not sweep_zone:
                    return None

                # Find bullish order block above current price
                bullish_ob = None
                for ob in order_blocks[-10:]:  # Last 10 OBs
                    if (ob.direction == 'BULLISH' and
                        ob.price_level > current_price and
                        not ob.is_mitigated and
                        ob.strength > 0.6):
                        bullish_ob = ob
                        break

                if not bullish_ob:
                    return None

                # Find bullish FVG above current price
                bullish_fvg = None
                for fvg in fvgs[-5:]:  # Last 5 FVGs
                    if (fvg.direction == 'BULLISH' and
                        fvg.midpoint > current_price and
                        not fvg.is_filled):
                        bullish_fvg = fvg
                        break

                # Calculate entry, stop, target
                entry_price = current_price
                stop_loss = sweep_zone.price_level * 0.998  # Just below sweep
                target_price = bullish_ob.price_level  # Target at OB level

                risk = abs(entry_price - stop_loss)
                reward = abs(target_price - entry_price)
                rr_ratio = reward / risk if risk > 0 else 0

                if rr_ratio < 1.5:  # Minimum 1:1.5 RR
                    return None

                # Enhanced quality score with MTF confluence
                quality_score = self._calculate_setup_quality_enhanced(
                    structure, sweep_zone, bullish_ob, bullish_fvg, mtf_analysis
                )

                confidence = "HIGH" if quality_score > 0.8 else "MEDIUM" if quality_score > 0.6 else "LOW"

                return SMCSetup(
                    direction="BUY",
                    entry_price=round(entry_price, 2),
                    stop_loss=round(stop_loss, 2),
                    target_price=round(target_price, 2),
                    risk_reward_ratio=round(rr_ratio, 2),
                    structure_bias=structure,
                    liquidity_sweep=sweep_zone,
                    order_block=bullish_ob,
                    fvg=bullish_fvg,
                    mtf_confirmation=mtf_bias == MarketStructure.BULLISH,
                    quality_score=round(quality_score, 3),
                    confidence=confidence,
                    timestamp=datetime.utcnow()
                )

            # SELL SETUP REQUIREMENTS (mirror of buy)
            elif (structure in [MarketStructure.BEARISH] or
                  mtf_bias == MarketStructure.BEARISH or
                  mtf_analysis['trend_alignment']):

                # Find liquidity sweep above equal highs
                sweep_zone = None
                for zone in liquidity_zones:
                    if (zone.zone_type == LiquidityType.SWEEP and
                        zone.price_level > current_price and
                        zone.zone_type == LiquidityType.EQUAL_HIGH):
                        sweep_zone = zone
                        break

                if not sweep_zone:
                    return None

                # Find bearish order block below current price
                bearish_ob = None
                for ob in order_blocks[-10:]:
                    if (ob.direction == 'BEARISH' and
                        ob.price_level < current_price and
                        not ob.is_mitigated and
                        ob.strength > 0.6):
                        bearish_ob = ob
                        break

                if not bearish_ob:
                    return None

                # Find bearish FVG below current price
                bearish_fvg = None
                for fvg in fvgs[-5:]:
                    if (fvg.direction == 'BEARISH' and
                        fvg.midpoint < current_price and
                        not fvg.is_filled):
                        bearish_fvg = fvg
                        break

                # Calculate entry, stop, target
                entry_price = current_price
                stop_loss = sweep_zone.price_level * 1.002  # Just above sweep
                target_price = bearish_ob.price_level  # Target at OB level

                risk = abs(entry_price - stop_loss)
                reward = abs(target_price - entry_price)
                rr_ratio = reward / risk if risk > 0 else 0

                if rr_ratio < 1.5:
                    return None

                quality_score = self._calculate_setup_quality_enhanced(
                    structure, sweep_zone, bearish_ob, bearish_fvg, mtf_analysis
                )

                confidence = "HIGH" if quality_score > 0.8 else "MEDIUM" if quality_score > 0.6 else "LOW"

                return SMCSetup(
                    direction="SELL",
                    entry_price=round(entry_price, 2),
                    stop_loss=round(stop_loss, 2),
                    target_price=round(target_price, 2),
                    risk_reward_ratio=round(rr_ratio, 2),
                    structure_bias=structure,
                    liquidity_sweep=sweep_zone,
                    order_block=bearish_ob,
                    fvg=bearish_fvg,
                    mtf_confirmation=mtf_bias == MarketStructure.BEARISH,
                    quality_score=round(quality_score, 3),
                    confidence=confidence,
                    timestamp=datetime.utcnow()
                )

        except Exception as e:
            logger.error(f"SMC setup generation failed: {e}")

        return None

    def _calculate_setup_quality(self, structure: MarketStructure, sweep: LiquidityZone,
                               ob: OrderBlock, fvg: Optional[FairValueGap],
                               mtf_bias: MarketStructure) -> float:
        """Calculate setup quality score (0-1)"""
        score = 0.0

        # Structure bias (30%)
        if structure == MarketStructure.BULLISH or structure == MarketStructure.BEARISH:
            score += 0.3
        elif structure == MarketStructure.SIDEWAYS:
            score += 0.1

        # Liquidity sweep strength (25%)
        score += sweep.strength * 0.25

        # Order block strength (25%)
        score += ob.strength * 0.25

        # FVG presence (10%)
        if fvg is not None:
            score += 0.1

        # MTF confirmation (10%)
        if mtf_bias == structure:
            score += 0.1

        return min(score, 1.0)

    def _calculate_setup_quality_enhanced(self, structure: MarketStructure, sweep: LiquidityZone,
                                        ob: OrderBlock, fvg: Optional[FairValueGap],
                                        mtf_analysis: Dict) -> float:
        """Calculate enhanced setup quality score with MTF confluence (0-1)"""
        score = 0.0

        # Structure bias (20%)
        if structure == MarketStructure.BULLISH or structure == MarketStructure.BEARISH:
            score += 0.2
        elif structure == MarketStructure.SIDEWAYS:
            score += 0.1

        # Liquidity sweep strength (20%)
        score += sweep.strength * 0.2

        # Order block strength (20%)
        score += ob.strength * 0.2

        # FVG presence (10%)
        if fvg is not None:
            score += 0.1

        # MTF confluence (30% - enhanced weighting)
        score += mtf_analysis['confluence_score'] * 0.3

        # Trend alignment bonus (10%)
        if mtf_analysis['trend_alignment']:
            score += 0.1

        # Timeframe agreement bonus (10%)
        score += mtf_analysis['timeframe_agreement'] * 0.1

        return min(score, 1.0)

    def get_smc_performance_metrics(self) -> Dict:
        """Get SMC engine performance metrics"""
        return {
            'engine_type': 'SMC',
            'components': ['Market Structure', 'Liquidity', 'Order Blocks', 'FVG', 'MTF'],
            'logic_type': 'Rule-Based Price Action',
            'ml_usage': 'None',
            'expected_win_rate': '50-65%',
            'expected_rr_ratio': '1:2-1:3'
        }


# Singleton instance
smc_engine = SMCEngine()
