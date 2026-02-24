"""
Structured Logging Configuration
Loguru-based logging with rotation and monitoring
"""

import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings


def setup_logging():
    """Setup structured logging with loguru"""

    # Remove default handler
    logger.remove()

    # Console handler for development
    if settings.environment == "development":
        logger.add(
            sys.stdout,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level="DEBUG",
            colorize=True
        )

    # File handler with rotation
    log_dir = Path("backend/logs")
    log_dir.mkdir(exist_ok=True)

    # Application logs
    logger.add(
        log_dir / "app.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        level="INFO",
        rotation="10 MB",
        retention="30 days",
        compression="gz",
        serialize=True  # JSON format for structured logging
    )

    # Error logs
    logger.add(
        log_dir / "error.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message} | {extra}",
        level="ERROR",
        rotation="10 MB",
        retention="90 days",
        compression="gz",
        serialize=True,
        backtrace=True,
        diagnose=True
    )

    # Security logs
    logger.add(
        log_dir / "security.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | SECURITY | {message}",
        level="INFO",
        rotation="10 MB",
        retention="1 year",
        compression="gz",
        serialize=True,
        filter=lambda record: record["extra"].get("security", False)
    )

    # Performance logs
    logger.add(
        log_dir / "performance.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | PERF | {name}:{function} | {message} | duration={extra[duration]}ms",
        level="INFO",
        rotation="10 MB",
        retention="30 days",
        compression="gz",
        serialize=True,
        filter=lambda record: record["extra"].get("performance", False)
    )

    # Database logs (only in development)
    if settings.environment == "development":
        logger.add(
            log_dir / "database.log",
            format="{time:YYYY-MM-DD HH:mm:ss} | DB | {message}",
            level="WARNING",
            rotation="10 MB",
            retention="7 days",
            compression="gz",
            serialize=False
        )

    logger.info("📝 Structured logging initialized", environment=settings.environment)


def get_logger(name: str):
    """Get a logger instance with the specified name"""
    return logger.bind(name=name)


# Global logger instance
app_logger = logger.bind(name="trading_sher")
