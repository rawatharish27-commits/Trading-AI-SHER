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
    database_url: str = "sqlite+aiosqlite:///./sher.db"

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


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export settings instance
settings = get_settings()
