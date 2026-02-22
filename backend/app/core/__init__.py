"""
Core Package - Simplified for Single Admin
"""

from app.core.database import (
    Base,
    get_db,
    get_db_context,
    init_db,
    close_db,
    check_db_health,
)
from app.core.admin_config import (
    admin_config,
    get_admin_config,
    get_broker_credentials,
    get_notification_settings,
    get_trading_settings,
)

__all__ = [
    "Base",
    "get_db",
    "get_db_context",
    "init_db",
    "close_db",
    "check_db_health",
    "admin_config",
    "get_admin_config",
    "get_broker_credentials",
    "get_notification_settings",
    "get_trading_settings",
]
