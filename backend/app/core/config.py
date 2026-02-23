"""
Application Configuration
Pydantic Settings for environment variables
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Trading AI SHER"
    app_version: str = "4.5.0"
    debug: bool = False
    environment: str = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4

    # Database
    database_url: str = "postgresql+asyncpg://trading_user:trading_password@localhost:5432/trading_engine"
    timescale_url: str = "postgresql+asyncpg://trading_user:trading_password@localhost:5433/trading_engine"

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    access_token_expire_minutes: int = 1440  # 24 hours
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # Angel One Broker
    angel_one_api_key: str = ""
    angel_one_client_id: str = ""
    angel_one_password: str = ""
    angel_one_totp_secret: str = ""

    # AI/ML Configuration
    ml_model_path: str = "./models"
    probability_threshold: float = 0.75
    confidence_threshold: float = 0.70

    # Risk Management
    max_capital_per_trade: float = 0.01  # 1%
    max_daily_loss: float = 0.02  # 2%
    max_weekly_loss: float = 0.05  # 5%
    max_drawdown: float = 0.10  # 10%
    kill_switch_threshold: float = 0.05  # 5%

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str = ""

    # External APIs
    gemini_api_key: str = ""

    # SMC Configuration
    # Timeframe Settings
    smc_ltf_timeframe: str = "15m"  # Lower timeframe for entry
    smc_htf_timeframe: str = "1h"   # Higher timeframe for bias

    # Quality Thresholds
    smc_min_quality_score: float = 0.6  # Minimum quality score for signals
    smc_min_confidence: float = 0.7     # Minimum confidence level

    # Risk Parameters
    smc_min_rr_ratio: float = 1.5       # Minimum risk-reward ratio
    smc_max_risk_per_trade: float = 0.01  # Maximum risk per trade (1%)
    smc_max_daily_signals: int = 3      # Maximum signals per day

    # SMC Component Weights (for quality scoring)
    smc_market_structure_weight: float = 0.3
    smc_liquidity_weight: float = 0.25
    smc_order_block_weight: float = 0.25
    smc_fvg_weight: float = 0.15
    smc_mtf_weight: float = 0.05

    # Symbol-specific SMC parameters (JSON string)
    smc_symbol_configs: str = '{"default": {"ltf_timeframe": "15m", "htf_timeframe": "1h", "min_quality": 0.6}}'

    # Environment-specific SMC settings
    smc_production_mode: bool = False
    smc_backtest_mode: bool = False
    smc_debug_logging: bool = False

    # CORS
    cors_origins: str = '["http://localhost:3000","http://localhost:5173"]'

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from string"""
        import json
        try:
            return json.loads(self.cors_origins)
        except:
            return ["http://localhost:3000"]

    @property
    def smc_symbol_configs_dict(self) -> dict:
        """Parse SMC symbol configurations from JSON string"""
        import json
        try:
            return json.loads(self.smc_symbol_configs)
        except:
            return {"default": {"ltf_timeframe": "15m", "htf_timeframe": "1h", "min_quality": 0.6}}

    def get_smc_config_for_symbol(self, symbol: str) -> dict:
        """Get SMC configuration for a specific symbol"""
        configs = self.smc_symbol_configs_dict
        return configs.get(symbol, configs.get("default", {}))

    def is_smc_enabled_for_symbol(self, symbol: str) -> bool:
        """Check if SMC is enabled for a symbol"""
        config = self.get_smc_config_for_symbol(symbol)
        return config.get("enabled", True)

    def get_smc_timeframes_for_symbol(self, symbol: str) -> tuple[str, str]:
        """Get LTF and HTF timeframes for a symbol"""
        config = self.get_smc_config_for_symbol(symbol)
        ltf = config.get("ltf_timeframe", self.smc_ltf_timeframe)
        htf = config.get("htf_timeframe", self.smc_htf_timeframe)
        return ltf, htf


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export settings instance
settings = get_settings()
