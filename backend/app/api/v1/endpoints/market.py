"""
Market Data Endpoints
Quotes, historical data, market status
"""

from datetime import datetime, timedelta
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.core import settings

router = APIRouter()


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get market quote for a symbol"""
    # In production, fetch from broker
    return {
        "symbol": symbol,
        "ltp": 1850.50,
        "change": 15.50,
        "change_percent": 0.85,
        "open": 1840.00,
        "high": 1860.00,
        "low": 1835.00,
        "close": 1835.00,
        "volume": 1500000,
        "bid": 1850.00,
        "ask": 1851.00,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/quotes")
async def get_quotes(
    symbols: str = Query(..., description="Comma-separated list of symbols"),
):
    """Get quotes for multiple symbols"""
    symbol_list = symbols.split(",")
    
    # In production, fetch from broker
    quotes = []
    for symbol in symbol_list:
        quotes.append({
            "symbol": symbol.strip(),
            "ltp": 1850.50 + (hash(symbol) % 100),
            "change": 15.50,
            "change_percent": 0.85,
            "timestamp": datetime.utcnow().isoformat(),
        })
    
    return {"quotes": quotes}


@router.get("/historical/{symbol}")
async def get_historical_data(
    symbol: str,
    interval: str = Query("ONE_DAY", description="Interval: ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, ONE_DAY"),
    days: int = Query(30, ge=1, le=365),
):
    """Get historical OHLC data"""
    # In production, fetch from broker
    candles = []
    base_price = 1800
    
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i)
        open_price = base_price + (i % 10)
        high = open_price + 20
        low = open_price - 15
        close = open_price + (i % 7 - 3)
        volume = 1000000 + (i * 10000)
        
        candles.append({
            "timestamp": date.isoformat(),
            "open": open_price,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
        })
        
        base_price = close
    
    return {
        "symbol": symbol,
        "interval": interval,
        "candles": candles,
    }


@router.get("/status")
async def get_market_status():
    """Get current market status"""
    now = datetime.utcnow()
    
    # NSE trading hours: 9:15 AM to 3:30 PM IST
    # Convert to UTC (IST = UTC+5:30)
    
    is_weekday = now.weekday() < 5
    
    # Simplified market status
    status = "CLOSED"
    if is_weekday:
        # Check if within trading hours (simplified)
        hour = (now.hour + 5) % 24  # Rough IST conversion
        if 9 <= hour < 16:
            status = "OPEN"
    
    return {
        "exchange": "NSE",
        "status": status,
        "timestamp": now.isoformat(),
        "next_open": "09:15:00",
        "next_close": "15:30:00",
        "trading_days": ["MON", "TUE", "WED", "THU", "FRI"],
    }


@router.get("/search")
async def search_symbols(
    query: str = Query(..., min_length=1),
    exchange: str = Query("NSE"),
):
    """Search for symbols"""
    # In production, search from instrument master
    results = [
        {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "exchange": "NSE"},
        {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "exchange": "NSE"},
        {"symbol": "HDFC", "name": "HDFC Bank Ltd", "exchange": "NSE"},
        {"symbol": "INFY", "name": "Infosys Ltd", "exchange": "NSE"},
        {"symbol": "ICICI", "name": "ICICI Bank Ltd", "exchange": "NSE"},
    ]
    
    # Filter by query
    filtered = [r for r in results if query.upper() in r["symbol"] or query.upper() in r["name"]]
    
    return {
        "results": filtered[:10],
        "total": len(filtered),
    }
