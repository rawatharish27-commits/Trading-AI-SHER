"""
Admin Configuration - Single User System
All trading settings in one place
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache
from datetime import time


class AdminConfig(BaseSettings):
    """
    Single Admin Configuration
    
    All settings for the trading system - No multi-user complexity
    """
    
    # ==================== ADMIN INFO ====================
    ADMIN_NAME: str = "Admin"
    ADMIN_EMAIL: str = "admin@sher.trading"
    ADMIN_MOBILE: str = "+91-9999999999"
    
    # ==================== CAPITAL ====================
    TOTAL_CAPITAL: float = 1000000.0  # 10 Lakh
    CAPITAL_PER_TRADE: float = 0.10  # 10% per trade
    MAX_CAPITAL_USAGE: float = 0.50  # Max 50% total usage
    
    # ==================== AUTO TRADING ====================
    AUTO_TRADE_ENABLED: bool = False
    AUTO_TRADE_CONFIDENCE_THRESHOLD: float = 0.75  # 75% min confidence
    AUTO_TRADE_MAX_POSITIONS: int = 5
    AUTO_TRADE_CAPITAL_PER_TRADE: float = 0.10  # 10% of capital
    AUTO_TRADE_Holding_DAYS: int = 3
    
    # ==================== RISK MANAGEMENT ====================
    MAX_RISK_PER_TRADE: float = 0.02  # 2% max risk per trade
    MAX_DAILY_LOSS: float = 0.05  # 5% max daily loss
    MAX_WEEKLY_LOSS: float = 0.10  # 10% max weekly loss
    MAX_DRAWDOWN: float = 0.20  # 20% max drawdown
    
    # ==================== TRACKED SYMBOLS ====================
    TRACKED_SYMBOLS: str = "RELIANCE,TCS,INFY,HDFC,ICICIBANK,SBIN,BHARTIARTL,ITC,KOTAKBANK,LT"
    
    @property
    def tracked_symbols_list(self) -> List[str]:
        return [s.strip().upper() for s in self.TRACKED_SYMBOLS.split(",")]
    
    # ==================== MARKET TIMINGS (IST) ====================
    MARKET_OPEN_TIME: str = "09:15"
    MARKET_CLOSE_TIME: str = "15:30"
    PRE_MARKET_START: str = "09:00"
    POST_MARKET_END: str = "16:00"
    
    @property
    def market_open(self) -> time:
        return time.fromisoformat(self.MARKET_OPEN_TIME)
    
    @property
    def market_close(self) -> time:
        return time.fromisoformat(self.MARKET_CLOSE_TIME)
    
    # ==================== BROKER SETTINGS ====================
    BROKER_API_KEY: str = ""
    BROKER_API_SECRET: str = ""
    BROKER_ACCESS_TOKEN: str = ""
    BROKER_NAME: str = "angel_one"  # angel_one, zerodha, upstox
    
    # ==================== NOTIFICATIONS ====================
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    EMAIL_ENABLED: bool = False
    EMAIL_SMTP_HOST: str = ""
    EMAIL_SMTP_PORT: int = 587
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    WEBHOOK_URL: str = ""
    
    # ==================== DATA SETTINGS ====================
    HISTORICAL_DATA_DAYS: int = 730  # 2 years for weekly analysis
    HOURLY_DATA_DAYS: int = 180  # 6 months hourly
    DATA_UPDATE_INTERVAL: int = 300  # 5 minutes
    
    # ==================== SIGNAL SETTINGS ====================
    MIN_SIGNAL_CONFIDENCE: float = 0.65
    MIN_RISK_REWARD: float = 2.0
    SIGNAL_CACHE_TTL: int = 300  # 5 minutes
    
    # ==================== DATABASE ====================
    DATABASE_URL: str = "sqlite+aiosqlite:///./sher.db"
    
    # ==================== LOGGING ====================
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/trading.log"
    
    class Config:
        env_prefix = ""
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_admin_config() -> AdminConfig:
    """Get cached admin configuration"""
    return AdminConfig()


# Global instance
admin_config = get_admin_config()


# ==================== HELPER FUNCTIONS ====================

def get_broker_credentials() -> dict:
    """Get broker API credentials"""
    return {
        "broker": admin_config.BROKER_NAME,
        "api_key": admin_config.BROKER_API_KEY,
        "api_secret": admin_config.BROKER_API_SECRET,
        "access_token": admin_config.BROKER_ACCESS_TOKEN,
    }


def get_notification_settings() -> dict:
    """Get notification settings"""
    return {
        "telegram": {
            "enabled": bool(admin_config.TELEGRAM_BOT_TOKEN),
            "bot_token": admin_config.TELEGRAM_BOT_TOKEN,
            "chat_id": admin_config.TELEGRAM_CHAT_ID,
        },
        "email": {
            "enabled": admin_config.EMAIL_ENABLED,
            "smtp_host": admin_config.EMAIL_SMTP_HOST,
            "smtp_port": admin_config.EMAIL_SMTP_PORT,
            "username": admin_config.EMAIL_USERNAME,
            "password": admin_config.EMAIL_PASSWORD,
        },
        "webhook": {
            "enabled": bool(admin_config.WEBHOOK_URL),
            "url": admin_config.WEBHOOK_URL,
        }
    }


def get_trading_settings() -> dict:
    """Get trading settings"""
    return {
        "capital": {
            "total": admin_config.TOTAL_CAPITAL,
            "per_trade_percent": admin_config.CAPITAL_PER_TRADE * 100,
            "max_usage_percent": admin_config.MAX_CAPITAL_USAGE * 100,
        },
        "auto_trade": {
            "enabled": admin_config.AUTO_TRADE_ENABLED,
            "confidence_threshold": admin_config.AUTO_TRADE_CONFIDENCE_THRESHOLD,
            "max_positions": admin_config.AUTO_TRADE_MAX_POSITIONS,
        },
        "risk": {
            "max_per_trade_percent": admin_config.MAX_RISK_PER_TRADE * 100,
            "max_daily_loss_percent": admin_config.MAX_DAILY_LOSS * 100,
            "max_weekly_loss_percent": admin_config.MAX_WEEKLY_LOSS * 100,
            "max_drawdown_percent": admin_config.MAX_DRAWDOWN * 100,
        },
        "signals": {
            "min_confidence": admin_config.MIN_SIGNAL_CONFIDENCE,
            "min_risk_reward": admin_config.MIN_RISK_REWARD,
        }
    }
