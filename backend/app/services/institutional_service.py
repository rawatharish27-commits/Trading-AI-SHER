"""
Institutional Service
FII/DII flow analysis and institutional data collection
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd

from loguru import logger
from app.cache.market_cache import MarketDataCache


class InstitutionalService:
    """
    Institutional Flow Analysis Service

    Analyzes institutional activity for trading signals:
    - FII/DII buying/selling patterns
    - Options chain analysis (PCR, OI changes)
    - Delivery percentage analysis
    - Bulk deal monitoring
    """

    def __init__(self):
        self.cache = MarketDataCache()
        self.fii_dii_data = []
        self.options_data = {}
        self.delivery_data = {}

    async def get_flow_analysis(self, symbol: str) -> Dict:
        """
        Get comprehensive institutional flow analysis for a symbol

        Args:
            symbol: Trading symbol

        Returns:
            Institutional analysis dictionary
        """
        try:
            # Get FII/DII data
            fii_dii = await self._get_fii_dii_data()

            # Get options chain data
            options = await self._get_options_chain(symbol)

            # Get delivery data
            delivery = await self._get_delivery_data(symbol)

            # Get bulk deals
            bulk_deals = await self._get_bulk_deals(symbol)

            # Analyze overall institutional sentiment
            sentiment = self._analyze_institutional_sentiment(fii_dii, options, delivery, bulk_deals)

            return {
                'symbol': symbol,
                'fii_dii': fii_dii,
                'options': options,
                'delivery': delivery,
                'bulk_deals': bulk_deals,
                'sentiment': sentiment,
                'score': sentiment.get('score', 0.5),
                'direction': sentiment.get('direction', 'NEUTRAL'),
                'signals': sentiment.get('signals', []),
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get institutional analysis for {symbol}: {e}")
            return self._get_default_analysis(symbol)

    async def _get_fii_dii_data(self) -> Dict:
        """Get latest FII/DII data"""
        try:
            # Try cache first
            cache_key = "fii_dii_latest"
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return cached_data

            # In production, this would fetch from NSE API or data provider
            # For now, return mock data based on typical patterns
            today = datetime.now().date()

            # Mock FII/DII data (in crores)
            mock_data = {
                'date': today.isoformat(),
                'fii_buy': 2500.50,
                'fii_sell': 2200.75,
                'fii_net': 299.75,
                'dii_buy': 1800.25,
                'dii_sell': 1950.80,
                'dii_net': -150.55,
                'total_net': 149.20,
                'net_percentage': 0.85  # Percentage of market cap
            }

            # Cache for 1 hour
            await self.cache.set(cache_key, mock_data, ttl=3600)

            return mock_data

        except Exception as e:
            logger.error(f"Failed to get FII/DII data: {e}")
            return {}

    async def _get_options_chain(self, symbol: str) -> Dict:
        """Get options chain analysis for symbol"""
        try:
            cache_key = f"options_chain_{symbol}"
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return cached_data

            # In production, this would fetch from NSE API
            # For now, return mock analysis
            mock_options = {
                'symbol': symbol,
                'pcr': 1.25,  # Put-Call Ratio
                'total_oi_ce': 1250000,  # Call OI
                'total_oi_pe': 1562500,  # Put OI
                'oi_change_ce': 2.5,  # % change
                'oi_change_pe': -1.8,  # % change
                'max_pain': 2450.00,  # Max pain strike
                'significant_strikes': [
                    {'strike': 2400, 'oi_ce': 150000, 'oi_pe': 200000},
                    {'strike': 2450, 'oi_ce': 180000, 'oi_pe': 160000},
                    {'strike': 2500, 'oi_ce': 120000, 'oi_pe': 140000}
                ],
                'iv_range': {'min': 15.5, 'max': 28.7, 'avg': 22.1}
            }

            # Cache for 5 minutes
            await self.cache.set(cache_key, mock_options, ttl=300)

            return mock_options

        except Exception as e:
            logger.error(f"Failed to get options chain for {symbol}: {e}")
            return {}

    async def _get_delivery_data(self, symbol: str) -> Dict:
        """Get delivery percentage data"""
        try:
            cache_key = f"delivery_{symbol}"
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return cached_data

            # In production, this would fetch from NSE
            # Mock delivery data
            mock_delivery = {
                'symbol': symbol,
                'delivery_percent': 42.5,
                'delivery_quantity': 2850000,
                'total_volume': 6700000,
                'avg_delivery_20d': 38.7,
                'delivery_spike': True,  # Above average
                'trend': 'INCREASING'  # INCREASING, DECREASING, STABLE
            }

            # Cache for 1 hour
            await self.cache.set(cache_key, mock_delivery, ttl=3600)

            return mock_delivery

        except Exception as e:
            logger.error(f"Failed to get delivery data for {symbol}: {e}")
            return {}

    async def _get_bulk_deals(self, symbol: str) -> List[Dict]:
        """Get bulk deals for symbol"""
        try:
            cache_key = f"bulk_deals_{symbol}"
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                return cached_data

            # In production, this would fetch from NSE
            # Mock bulk deals
            mock_deals = [
                {
                    'date': datetime.now().date().isoformat(),
                    'buyer': 'Institutional Investor',
                    'seller': 'Promoter',
                    'quantity': 500000,
                    'price': 2450.50,
                    'value_crore': 122.525,
                    'type': 'BULK'
                }
            ]

            # Cache for 1 hour
            await self.cache.set(cache_key, mock_deals, ttl=3600)

            return mock_deals

        except Exception as e:
            logger.error(f"Failed to get bulk deals for {symbol}: {e}")
            return []

    def _analyze_institutional_sentiment(self, fii_dii: Dict, options: Dict, delivery: Dict, bulk_deals: List) -> Dict:
        """Analyze overall institutional sentiment"""
        score = 0.5
        direction = 'NEUTRAL'
        signals = []

        # FII/DII Analysis
        if fii_dii:
            fii_net = fii_dii.get('fii_net', 0)
            dii_net = fii_dii.get('dii_net', 0)

            if fii_net > 500:  # Strong FII buying
                score += 0.2
                signals.append(f"Strong FII buying: ₹{fii_net} Cr")
            elif fii_net < -500:  # Strong FII selling
                score -= 0.2
                signals.append(f"Strong FII selling: ₹{fii_net} Cr")

            if dii_net > 200:  # DII buying
                score += 0.1
                signals.append(f"DII accumulation: ₹{dii_net} Cr")

        # Options Analysis
        if options:
            pcr = options.get('pcr', 1.0)
            oi_change_ce = options.get('oi_change_ce', 0)
            oi_change_pe = options.get('oi_change_pe', 0)

            if pcr < 0.8:  # Bearish PCR
                score -= 0.15
                signals.append(f"Bearish PCR: {pcr}")
            elif pcr > 1.5:  # Bullish PCR
                score += 0.15
                signals.append(f"Bullish PCR: {pcr}")

            # OI Changes
            if oi_change_ce > 5 and oi_change_pe < -5:  # Calls building, puts reducing
                score += 0.1
                signals.append("Call OI building, Put OI reducing")

        # Delivery Analysis
        if delivery:
            delivery_pct = delivery.get('delivery_percent', 0)
            avg_delivery = delivery.get('avg_delivery_20d', 0)
            spike = delivery.get('delivery_spike', False)

            if delivery_pct > 50:  # High delivery %
                score += 0.1
                signals.append(f"High delivery: {delivery_pct}%")
            elif delivery_pct < 20:  # Low delivery %
                score -= 0.1
                signals.append(f"Low delivery: {delivery_pct}%")

            if spike:
                score += 0.1
                signals.append("Delivery spike detected")

        # Bulk Deals Analysis
        if bulk_deals:
            total_value = sum(deal.get('value_crore', 0) for deal in bulk_deals)
            if total_value > 50:  # Significant bulk deals
                score += 0.15
                signals.append(f"Bulk deals worth ₹{total_value} Cr")

        # Determine direction
        if score >= 0.7:
            direction = 'BUY'
        elif score <= 0.3:
            direction = 'SELL'
        else:
            direction = 'NEUTRAL'

        # Ensure score is within bounds
        score = max(0.1, min(0.9, score))

        return {
            'score': score,
            'direction': direction,
            'signals': signals[:5],  # Limit to 5 signals
            'confidence': min(abs(score - 0.5) * 2, 1.0)  # Confidence based on deviation from neutral
        }

    def _get_default_analysis(self, symbol: str) -> Dict:
        """Get default analysis when data is unavailable"""
        return {
            'symbol': symbol,
            'fii_dii': {},
            'options': {},
            'delivery': {},
            'bulk_deals': [],
            'sentiment': {
                'score': 0.5,
                'direction': 'NEUTRAL',
                'signals': ['Data unavailable'],
                'confidence': 0.0
            },
            'score': 0.5,
            'direction': 'NEUTRAL',
            'signals': ['Data unavailable'],
            'timestamp': datetime.utcnow().isoformat()
        }

    async def get_market_institutional_summary(self) -> Dict:
        """Get overall market institutional summary"""
        try:
            # Aggregate data across major indices
            indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY']

            summary = {
                'indices': {},
                'total_fii_flow': 0,
                'total_dii_flow': 0,
                'market_sentiment': 'NEUTRAL',
                'timestamp': datetime.utcnow().isoformat()
            }

            for index in indices:
                analysis = await self.get_flow_analysis(index)
                summary['indices'][index] = analysis
                summary['total_fii_flow'] += analysis.get('fii_dii', {}).get('fii_net', 0)
                summary['total_dii_flow'] += analysis.get('fii_dii', {}).get('dii_net', 0)

            # Determine market sentiment
            net_flow = summary['total_fii_flow'] + summary['total_dii_flow']
            if net_flow > 1000:
                summary['market_sentiment'] = 'BULLISH'
            elif net_flow < -1000:
                summary['market_sentiment'] = 'BEARISH'
            else:
                summary['market_sentiment'] = 'NEUTRAL'

            return summary

        except Exception as e:
            logger.error(f"Failed to get market institutional summary: {e}")
            return {}


# Singleton instance
institutional_service = InstitutionalService()
