"""
NSE Trading Holidays 2025
"""

NSE_HOLIDAYS_2025 = [
    "2025-01-26",  # Republic Day
    "2025-02-26",  # Maha Shivaratri
    "2025-03-14",  # Holi
    "2025-03-31",  # Id-ul-Fitr
    "2025-04-10",  # Shri Ram Navami
    "2025-04-14",  # Dr. Baba Saheb Ambedkar Jayanti
    "2025-04-18",  # Good Friday
    "2025-05-01",  # Maharashtra Day
    "2025-08-15",  # Independence Day
    "2025-08-27",  # Ganesh Chaturthi
    "2025-10-02",  # Gandhi Jayanti
    "2025-10-20",  # Diwali-Laxmi Pujan
    "2025-10-21",  # Diwali-Balipratipada
    "2025-11-01",  # Deepavali
    "2025-11-05",  # Prakash Gurpurab
    "2025-12-25",  # Christmas
]

BSE_HOLIDAYS_2025 = NSE_HOLIDAYS_2025

MCX_HOLIDAYS_2025 = NSE_HOLIDAYS_2025 + [
    # Additional MCX specific holidays
]


def is_trading_holiday(date_str: str, exchange: str = "NSE") -> bool:
    """Check if a date is a trading holiday"""
    if exchange == "NSE":
        return date_str in NSE_HOLIDAYS_2025
    elif exchange == "BSE":
        return date_str in BSE_HOLIDAYS_2025
    elif exchange == "MCX":
        return date_str in MCX_HOLIDAYS_2025
    return False


def get_next_trading_day(date_str: str, exchange: str = "NSE") -> str:
    """Get next trading day from a given date"""
    from datetime import datetime, timedelta
    
    date = datetime.strptime(date_str, "%Y-%m-%d")
    
    while True:
        date += timedelta(days=1)
        
        # Skip weekends
        if date.weekday() >= 5:
            continue
        
        # Skip holidays
        date_str = date.strftime("%Y-%m-%d")
        if is_trading_holiday(date_str, exchange):
            continue
        
        return date_str
