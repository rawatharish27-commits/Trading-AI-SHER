"""
Market Data Endpoints
Quotes, historical data, market status
"""

from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, Query

from app.api.v1.endpoints.auth import get_admin_user

router = APIRouter()


# ==================== SCHEMAS ====================

class Quote:
    def __init__(self, symbol: str, ltp: float, **kwargs):
        self.symbol = symbol
        self.ltp = ltp
        self.open = kwargs.get('open', ltp * 0.99)
        self.high = kwargs.get('high', ltp * 1.01)
        self.low = kwargs.get('low', ltp * 0.98)
        self.close = kwargs.get('close', ltp * 0.99)
        self.prev_close = kwargs.get('prev_close', ltp * 0.985)
        self.change = ltp - self.prev_close
        self.change_percent = (self.change / self.prev_close * 100) if self.prev_close > 0 else 0
        self.volume = kwargs.get('volume', 1000000)
        self.value = kwargs.get('value', ltp * self.volume)
        self.high_52week = kwargs.get('high_52week', ltp * 1.3)
        self.low_52week = kwargs.get('low_52week', ltp * 0.7)
        self.upper_circuit = kwargs.get('upper_circuit', ltp * 1.1)
        self.lower_circuit = kwargs.get('lower_circuit', ltp * 0.9)
        self.trade_time = datetime.utcnow().isoformat()


class MarketIndex:
    def __init__(self, name: str, value: float, change: float, change_percent: float):
        self.name = name
        self.value = value
        self.change = change
        self.change_percent = change_percent


class MarketMover:
    def __init__(self, symbol: str, name: str, ltp: float, change: float, change_percent: float, volume: int):
        self.symbol = symbol
        self.name = name
        self.ltp = ltp
        self.change = change
        self.change_percent = change_percent
        self.volume = volume


# ==================== ENDPOINTS ====================

@router.get("/quote/{symbol}")
async def get_quote(
    symbol: str,
    admin: dict = Depends(get_admin_user)
):
    """Get market quote for a symbol"""
    # In production, fetch from broker API
    # For now, return a placeholder that indicates no real data
    return {
        "symbol": symbol,
        "exchange": "NSE",
        "ltp": 0,
        "open": 0,
        "high": 0,
        "low": 0,
        "close": 0,
        "prev_close": 0,
        "change": 0,
        "change_percent": 0,
        "volume": 0,
        "value": 0,
        "high_52week": 0,
        "low_52week": 0,
        "upper_circuit": 0,
        "lower_circuit": 0,
        "trade_time": None,
        "message": "Connect broker API for real market data",
    }


@router.get("/quotes")
async def get_quotes(
    symbols: str = Query(..., description="Comma-separated list of symbols"),
    admin: dict = Depends(get_admin_user)
):
    """Get quotes for multiple symbols"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    
    # Return empty quotes - real data requires broker connection
    quotes = {}
    for symbol in symbol_list:
        quotes[symbol] = {
            "symbol": symbol,
            "exchange": "NSE",
            "ltp": 0,
            "change": 0,
            "change_percent": 0,
            "volume": 0,
            "trade_time": None,
        }
    
    return quotes


@router.get("/ohlcv/{symbol}")
async def get_ohlcv(
    symbol: str,
    interval: str = Query("1D", description="Interval: 1m, 5m, 15m, 1h, 1D"),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    admin: dict = Depends(get_admin_user)
):
    """Get historical OHLCV data"""
    # Return empty candles - real data requires broker connection
    return {
        "symbol": symbol,
        "exchange": "NSE",
        "interval": interval,
        "data": [],
        "message": "Connect broker API for historical data",
    }


@router.get("/indices")
async def get_indices(
    admin: dict = Depends(get_admin_user)
):
    """Get market indices"""
    # Return empty - real data requires broker connection
    return []


@router.get("/gainers")
async def get_gainers(
    limit: int = Query(10, ge=1, le=50),
    admin: dict = Depends(get_admin_user)
):
    """Get top gainers"""
    # Return empty - real data requires broker connection
    return []


@router.get("/losers")
async def get_losers(
    limit: int = Query(10, ge=1, le=50),
    admin: dict = Depends(get_admin_user)
):
    """Get top losers"""
    # Return empty - real data requires broker connection
    return []


@router.get("/status")
async def get_market_status():
    """Get current market status"""
    now = datetime.utcnow()
    
    # NSE trading hours: 9:15 AM to 3:30 PM IST
    # IST = UTC + 5:30
    
    is_weekday = now.weekday() < 5
    
    # Calculate IST time
    ist_hour = (now.hour + 5) % 24
    ist_minute = now.minute + 30
    if ist_minute >= 60:
        ist_hour = (ist_hour + 1) % 24
        ist_minute -= 60
    
    # Determine session
    is_open = False
    session = "CLOSED"
    next_open = None
    next_close = None
    
    if is_weekday:
        if ist_hour < 9 or (ist_hour == 9 and ist_minute < 15):
            session = "PRE_MARKET"
            next_open = "09:15:00"
        elif (ist_hour == 9 and ist_minute >= 15) or (ist_hour >= 10 and ist_hour < 15):
            session = "NORMAL"
            is_open = True
            next_close = "15:30:00"
        elif ist_hour == 15 and ist_minute <= 30:
            session = "NORMAL"
            is_open = True
            next_close = "15:30:00"
        elif ist_hour == 15 and ist_minute > 30 and ist_minute <= 40:
            session = "POST_MARKET"
        else:
            session = "CLOSED"
            # Next open is tomorrow 9:15 AM
            next_open = "09:15:00"
    
    return {
        "is_open": is_open,
        "session": session,
        "next_open": next_open,
        "next_close": next_close,
        "exchange": "NSE",
        "trading_days": ["MON", "TUE", "WED", "THU", "FRI"],
        "timestamp": now.isoformat(),
    }


@router.get("/search")
async def search_symbols(
    q: str = Query(..., min_length=1, description="Search query"),
    exchange: str = Query("NSE"),
    admin: dict = Depends(get_admin_user)
):
    """Search for symbols"""
    # NSE F&O stocks (commonly traded)
    all_symbols = [
        {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "exchange": "NSE"},
        {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "exchange": "NSE"},
        {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "exchange": "NSE"},
        {"symbol": "INFY", "name": "Infosys Ltd", "exchange": "NSE"},
        {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "exchange": "NSE"},
        {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "exchange": "NSE"},
        {"symbol": "SBIN", "name": "State Bank of India", "exchange": "NSE"},
        {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "exchange": "NSE"},
        {"symbol": "ITC", "name": "ITC Ltd", "exchange": "NSE"},
        {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd", "exchange": "NSE"},
        {"symbol": "LT", "name": "Larsen & Toubro Ltd", "exchange": "NSE"},
        {"symbol": "AXISBANK", "name": "Axis Bank Ltd", "exchange": "NSE"},
        {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd", "exchange": "NSE"},
        {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd", "exchange": "NSE"},
        {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd", "exchange": "NSE"},
        {"symbol": "TITAN", "name": "Titan Company Ltd", "exchange": "NSE"},
        {"symbol": "TATASTEEL", "name": "Tata Steel Ltd", "exchange": "NSE"},
        {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd", "exchange": "NSE"},
        {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd", "exchange": "NSE"},
        {"symbol": "ADANIENT", "name": "Adani Enterprises Ltd", "exchange": "NSE"},
        {"symbol": "WIPRO", "name": "Wipro Ltd", "exchange": "NSE"},
        {"symbol": "HCLTECH", "name": "HCL Technologies Ltd", "exchange": "NSE"},
        {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Ltd", "exchange": "NSE"},
        {"symbol": "NTPC", "name": "NTPC Ltd", "exchange": "NSE"},
        {"symbol": "POWERGRID", "name": "Power Grid Corporation of India Ltd", "exchange": "NSE"},
        {"symbol": "ONGC", "name": "Oil & Natural Gas Corporation Ltd", "exchange": "NSE"},
        {"symbol": "JSWSTEEL", "name": "JSW Steel Ltd", "exchange": "NSE"},
        {"symbol": "M&M", "name": "Mahindra & Mahindra Ltd", "exchange": "NSE"},
        {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv Ltd", "exchange": "NSE"},
        {"symbol": "INDUSINDBK", "name": "IndusInd Bank Ltd", "exchange": "NSE"},
    ]
    
    # Filter by query
    query_upper = q.upper()
    filtered = [
        s for s in all_symbols 
        if query_upper in s["symbol"] or query_upper in s["name"].upper()
    ]
    
    return filtered[:10]


@router.get("/depth/{symbol}")
async def get_market_depth(
    symbol: str,
    admin: dict = Depends(get_admin_user)
):
    """Get market depth (order book)"""
    # Return empty depth - real data requires broker connection
    return {
        "symbol": symbol,
        "exchange": "NSE",
        "bids": [],
        "asks": [],
        "message": "Connect broker API for market depth",
    }
