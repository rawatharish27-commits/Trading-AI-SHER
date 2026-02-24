"""
Application Configuration
Pydantic Settings for environment variables
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import List
from loguru import logger

from pydantic_settings import BaseSettings, SettingsConfigDict
from app.core.security import security_audit


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

    # Database - Environment-specific defaults
    database_url: str = ""
    timescale_url: str = ""

    @property
    def effective_database_url(self) -> str:
        """Get the effective database URL based on environment"""
        if self.database_url:
            return self.database_url

        # Environment-specific defaults
        if self.environment == "production":
            return "postgresql+asyncpg://trading_user:trading_password@localhost:5432/trading_engine"
        else:
            # Development/Testing - use SQLite
            db_path = BACKEND_DIR / "sher.db"
            return f"sqlite+aiosqlite:///{db_path}"

    @property
    def effective_timescale_url(self) -> str:
        """Get the effective TimescaleDB URL based on environment"""
        if self.timescale_url:
            return self.timescale_url

        # Environment-specific defaults
        if self.environment == "production":
            return "postgresql+asyncpg://trading_user:trading_password@localhost:5433/trading_engine"
        else:
            # Development/Testing - use same SQLite database
            db_path = BACKEND_DIR / "sher.db"
            return f"sqlite+aiosqlite:///{db_path}"

    # Security
    secret_key: str
    access_token_expire_minutes: int = 1440  # 24 hours
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.secret_key:
            raise ValueError("SECRET_KEY environment variable is required")
        if len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")

    # Angel One Broker (Encrypted)
    angel_one_api_key_encrypted: str = ""
    angel_one_client_id_encrypted: str = ""
    angel_one_password_encrypted: str = ""
    angel_one_totp_secret_encrypted: str = ""

    @property
    def angel_one_api_key(self) -> str:
        """Decrypt Angel One API key"""
        if not self.angel_one_api_key_encrypted:
            return ""
        try:
            from app.core.security import data_encryption
            return data_encryption.decrypt_data(self.angel_one_api_key_encrypted)
        except Exception:
            return ""

    @property
    def angel_one_client_id(self) -> str:
        """Decrypt Angel One client ID"""
        if not self.angel_one_client_id_encrypted:
            return ""
        try:
            from app.core.security import data_encryption
            return data_encryption.decrypt_data(self.angel_one_client_id_encrypted)
        except Exception:
            return ""

    @property
    def angel_one_password(self) -> str:
        """Decrypt Angel One password"""
        if not self.angel_one_password_encrypted:
            return ""
        try:
            from app.core.security import data_encryption
            return data_encryption.decrypt_data(self.angel_one_password_encrypted)
        except Exception:
            return ""

    @property
    def angel_one_totp_secret(self) -> str:
        """Decrypt Angel One TOTP secret"""
        if not self.angel_one_totp_secret_encrypted:
            return ""
        try:
            from app.core.security import data_encryption
            return data_encryption.decrypt_data(self.angel_one_totp_secret_encrypted)
        except Exception:
            return ""

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

    # CORS - Environment specific
    cors_origins_dev: str = '["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"]'
    cors_origins_prod: str = '["https://yourdomain.com","https://app.yourdomain.com"]'

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins based on environment"""
        import json
        try:
            if self.environment == "production":
                origins_str = self.cors_origins_prod
            else:
                origins_str = self.cors_origins_dev
            return json.loads(origins_str)
        except Exception as e:
            logger.warning(f"Failed to parse CORS origins: {e}")
            # Secure default - no origins allowed in production
            return [] if self.environment == "production" else ["http://localhost:3000"]

    @property
    def smc_symbol_configs_dict(self) -> dict:
        """Parse SMC symbol configurations from JSON string"""
        import json
        try:
            return json.loads(self.smc_symbol_configs)
        except Exception as e:
            logger.warning(f"Failed to parse SMC symbol configs: {e}")
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

    def audit_configuration_change(
        self,
        user_id: int,
        config_key: str,
        old_value: str,
        new_value: str,
        change_reason: str,
        ip_address: str,
        user_agent: str
    ) -> None:
        """
        Audit configuration changes for compliance

        Args:
            user_id: User making the change
            config_key: Configuration key being changed
            old_value: Previous value
            new_value: New value
            change_reason: Reason for the change
            ip_address: IP address of the user
            user_agent: User agent string
        """
        try:
            # Log configuration change audit
            security_audit.log_system_configuration_change(
                user_id=user_id,
                config_section="application_config",
                config_key=config_key,
                old_value=old_value,
                new_value=new_value,
                change_reason=change_reason,
                ip_address=ip_address,
                user_agent=user_agent
            )

            logger.info(f"Configuration change audited: {config_key} by user {user_id}")

        except Exception as e:
            logger.error(f"Failed to audit configuration change: {e}")

    def validate_configuration_on_startup(self) -> List[str]:
        """
        Validate configuration on application startup

        Returns:
            List of validation errors
        """
        errors = []

        # Check required environment variables
        required_vars = [
            'SECRET_KEY',
            'DATABASE_URL' if self.environment == 'production' else None
        ]

        for var in required_vars:
            if var and not os.getenv(var):
                errors.append(f"Required environment variable {var} is not set")

        # Validate SECRET_KEY length
        if len(self.secret_key) < 32:
            errors.append("SECRET_KEY must be at least 32 characters long")

        # Validate database URLs
        if self.environment == 'production':
            if not self.database_url.startswith('postgresql'):
                errors.append("Production database URL must use PostgreSQL")

        # Validate CORS origins
        if self.environment == 'production' and not self.cors_origins_list:
            errors.append("Production CORS origins cannot be empty")

        # Validate SMC configuration
        if self.smc_min_quality_score < 0 or self.smc_min_quality_score > 1:
            errors.append("SMC minimum quality score must be between 0 and 1")

        if self.smc_min_confidence < 0 or self.smc_min_confidence > 1:
            errors.append("SMC minimum confidence must be between 0 and 1")

        # Log validation results
        if errors:
            logger.error(f"Configuration validation failed: {len(errors)} errors")
            for error in errors:
                logger.error(f"  - {error}")
        else:
            logger.info("Configuration validation passed")

        return errors

    def get_configuration_snapshot(self) -> dict:
        """
        Get a snapshot of current configuration for audit purposes

        Returns:
            Dictionary of configuration values (sanitized)
        """
        # Get all settings as dict
        config_dict = self.model_dump()

        # Remove sensitive information
        sensitive_keys = [
            'secret_key',
            'angel_one_api_key_encrypted',
            'angel_one_client_id_encrypted',
            'angel_one_password_encrypted',
            'angel_one_totp_secret_encrypted',
            'gemini_api_key',
            'redis_password'
        ]

        for key in sensitive_keys:
            if key in config_dict:
                config_dict[key] = "***REDACTED***"

        return config_dict

    def export_configuration_for_audit(self, export_path: Path) -> None:
        """
        Export current configuration for audit purposes

        Args:
            export_path: Path to export configuration
        """
        try:
            config_snapshot = self.get_configuration_snapshot()
            config_snapshot['export_timestamp'] = datetime.utcnow().isoformat()
            config_snapshot['export_reason'] = 'audit_export'

            with open(export_path, 'w') as f:
                import json
                json.dump(config_snapshot, f, indent=2, default=str)

            logger.info(f"Configuration exported for audit: {export_path}")

        except Exception as e:
            logger.error(f"Failed to export configuration: {e}")
            raise


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export settings instance
settings = get_settings()
