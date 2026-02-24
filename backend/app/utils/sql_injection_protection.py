"""
SQL Injection Protection Utilities
Validation and sanitization for database queries
"""

import re
from typing import List, Set, Optional, Any, Dict
from loguru import logger


class SQLInjectionValidator:
    """
    Comprehensive SQL injection protection validator
    """

    # Dangerous SQL keywords and patterns
    DANGEROUS_KEYWORDS = {
        'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE',
        'EXEC', 'EXECUTE', 'UNION', 'SELECT', 'SCRIPT', 'EVAL', 'SYSTEM',
        'SHELL', 'CMD', 'COMMAND', 'SHUTDOWN', 'KILL', 'TERMINATE'
    }

    # SQL injection patterns
    INJECTION_PATTERNS = [
        r';\s*--',  # Semicolon followed by comment
        r';\s*/\*',  # Semicolon followed by block comment
        r'union\s+select',  # Union select
        r';\s*drop\s+table',  # Drop table
        r';\s*delete\s+from',  # Delete from
        r';\s*update\s+.*\s+set',  # Update set
        r';\s*insert\s+into',  # Insert into
        r';\s*alter\s+table',  # Alter table
        r';\s*create\s+.*\s+table',  # Create table
        r';\s*exec',  # Exec
        r';\s*execute',  # Execute
        r'--\s*$',  # Line ending with comment
        r'#\s*$',  # Line ending with hash comment
        r'/\*.*\*/',  # Block comments
        r'<script',  # Script tags
        r'javascript:',  # JavaScript protocol
        r'vbscript:',  # VBScript protocol
        r'onload\s*=',  # onload attribute
        r'onerror\s*=',  # onerror attribute
    ]

    # Allowed table names (whitelist approach)
    ALLOWED_TABLES = {
        'users', 'tenants', 'portfolios', 'signals', 'orders', 'positions',
        'audit_logs', 'api_keys', 'market_data', 'institutional_data',
        'trades', 'portfolio_history', 'signal_history', 'user_sessions',
        'rate_limits', 'notifications', 'user_preferences', 'system_config'
    }

    # Allowed column names
    ALLOWED_COLUMNS = {
        'id', 'user_id', 'tenant_id', 'email', 'mobile', 'first_name', 'last_name',
        'hashed_password', 'role', 'plan', 'is_active', 'is_verified', 'created_at',
        'updated_at', 'symbol', 'exchange', 'action', 'direction', 'status',
        'probability', 'confidence', 'entry_price', 'stop_loss', 'target_1',
        'target_2', 'target_3', 'strategy', 'trace_id', 'signal_time',
        'order_id', 'quantity', 'price', 'average_price', 'side', 'order_type',
        'product_type', 'broker', 'order_time', 'current_price', 'exit_price',
        'unrealized_pnl', 'realized_pnl', 'entry_time', 'name', 'slug',
        'contact_email', 'max_users', 'max_signals_per_day', 'max_api_calls_per_day',
        'initial_capital', 'current_capital', 'available_capital', 'invested_capital',
        'total_pnl', 'total_trades', 'winning_trades', 'losing_trades', 'win_rate',
        'risk_per_trade', 'max_positions', 'key_hash', 'key_prefix', 'scopes',
        'expires_at', 'last_used_at', 'total_requests', 'event_type', 'details',
        'severity', 'ip_address', 'user_agent', 'request_path', 'request_method',
        'status_code', 'response_time_ms', 'description', 'session_id', 'expires',
        'iat', 'type', 'sub', 'city', 'state', 'onboarding_completed'
    }

    @classmethod
    def validate_table_name(cls, table_name: str) -> bool:
        """
        Validate table name against whitelist

        Args:
            table_name: Table name to validate

        Returns:
            True if valid, False otherwise
        """
        if not table_name or not isinstance(table_name, str):
            return False

        # Convert to lowercase for comparison
        table_lower = table_name.lower().strip()

        # Check against whitelist
        if table_lower not in cls.ALLOWED_TABLES:
            logger.warning(f"Rejected table name: {table_name}")
            return False

        # Check for dangerous characters
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            logger.warning(f"Invalid table name format: {table_name}")
            return False

        return True

    @classmethod
    def validate_column_name(cls, column_name: str) -> bool:
        """
        Validate column name against whitelist

        Args:
            column_name: Column name to validate

        Returns:
            True if valid, False otherwise
        """
        if not column_name or not isinstance(column_name, str):
            return False

        # Convert to lowercase for comparison
        column_lower = column_name.lower().strip()

        # Check against whitelist
        if column_lower not in cls.ALLOWED_COLUMNS:
            logger.warning(f"Rejected column name: {column_name}")
            return False

        # Check for dangerous characters
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', column_name):
            logger.warning(f"Invalid column name format: {column_name}")
            return False

        return True

    @classmethod
    def validate_input_string(cls, input_str: str, max_length: int = 1000) -> bool:
        """
        Validate input string for SQL injection

        Args:
            input_str: String to validate
            max_length: Maximum allowed length

        Returns:
            True if valid, False otherwise
        """
        if not isinstance(input_str, str):
            return False

        # Check length
        if len(input_str) > max_length:
            logger.warning(f"Input too long: {len(input_str)} > {max_length}")
            return False

        # Check for null bytes
        if '\x00' in input_str:
            logger.warning("Input contains null bytes")
            return False

        # Check for dangerous patterns
        input_lower = input_str.lower()
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, input_lower, re.IGNORECASE):
                logger.warning(f"Detected dangerous pattern in input: {pattern}")
                return False

        # Check for dangerous keywords
        words = re.findall(r'\b\w+\b', input_lower)
        for word in words:
            if word.upper() in cls.DANGEROUS_KEYWORDS:
                logger.warning(f"Detected dangerous keyword: {word}")
                return False

        return True

    @classmethod
    def sanitize_query_parameter(cls, param: Any) -> Any:
        """
        Sanitize query parameter

        Args:
            param: Parameter to sanitize

        Returns:
            Sanitized parameter or None if invalid
        """
        if param is None:
            return None

        if isinstance(param, str):
            if not cls.validate_input_string(param):
                return None
            return param.strip()

        if isinstance(param, (int, float, bool)):
            return param

        if isinstance(param, list):
            return [cls.sanitize_query_parameter(item) for item in param]

        # For other types, convert to string and validate
        param_str = str(param)
        if cls.validate_input_string(param_str):
            return param

        return None

    @classmethod
    def validate_parameterized_query(cls, query: str, params: Dict[str, Any]) -> bool:
        """
        Validate parameterized query and parameters

        Args:
            query: SQL query string
            params: Query parameters

        Returns:
            True if valid, False otherwise
        """
        # Check that query uses proper parameterization
        if not query or not isinstance(query, str):
            return False

        # Ensure query uses named parameters (:param)
        param_pattern = r':([a-zA-Z_][a-zA-Z0-9_]*)'
        query_params = set(re.findall(param_pattern, query))

        # Check that all query parameters are provided
        provided_params = set(params.keys()) if params else set()

        if query_params != provided_params:
            missing = query_params - provided_params
            extra = provided_params - query_params
            if missing:
                logger.warning(f"Missing parameters in query: {missing}")
            if extra:
                logger.warning(f"Extra parameters provided: {extra}")
            return False

        # Validate each parameter
        for param_name, param_value in params.items():
            sanitized = cls.sanitize_query_parameter(param_value)
            if sanitized != param_value:
                logger.warning(f"Parameter {param_name} failed sanitization")
                return False

        return True


class SafeQueryBuilder:
    """
    Safe query builder with SQL injection protection
    """

    def __init__(self):
        self.validator = SQLInjectionValidator()

    def build_select_query(
        self,
        table: str,
        columns: Optional[List[str]] = None,
        where_clause: Optional[str] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None
    ) -> tuple[str, Dict[str, Any]]:
        """
        Build safe SELECT query

        Returns:
            Tuple of (query, params)
        """
        if not self.validator.validate_table_name(table):
            raise ValueError(f"Invalid table name: {table}")

        # Build column list
        if columns:
            for col in columns:
                if not self.validator.validate_column_name(col):
                    raise ValueError(f"Invalid column name: {col}")
            column_str = ", ".join(columns)
        else:
            column_str = "*"

        query = f"SELECT {column_str} FROM {table}"

        params = {}

        if where_clause:
            # Parse where clause for parameters
            # This is a simplified implementation
            query += f" WHERE {where_clause}"

        if order_by:
            if not self.validator.validate_column_name(order_by.replace(" DESC", "").replace(" ASC", "")):
                raise ValueError(f"Invalid ORDER BY column: {order_by}")
            query += f" ORDER BY {order_by}"

        if limit:
            if not isinstance(limit, int) or limit < 0 or limit > 10000:
                raise ValueError(f"Invalid LIMIT value: {limit}")
            query += f" LIMIT {limit}"

        return query, params

    def build_count_query(self, table: str, where_clause: Optional[str] = None) -> tuple[str, Dict[str, Any]]:
        """
        Build safe COUNT query

        Returns:
            Tuple of (query, params)
        """
        if not self.validator.validate_table_name(table):
            raise ValueError(f"Invalid table name: {table}")

        query = f"SELECT COUNT(*) FROM {table}"
        params = {}

        if where_clause:
            query += f" WHERE {where_clause}"

        return query, params


# Global instances
sql_validator = SQLInjectionValidator()
safe_query_builder = SafeQueryBuilder()


# Utility functions
def validate_sql_input(input_str: str, max_length: int = 1000) -> bool:
    """Validate SQL input string"""
    return sql_validator.validate_input_string(input_str, max_length)


def sanitize_sql_parameter(param: Any) -> Any:
    """Sanitize SQL parameter"""
    return sql_validator.sanitize_query_parameter(param)


def validate_table_name(table_name: str) -> bool:
    """Validate table name"""
    return sql_validator.validate_table_name(table_name)


def validate_parameterized_query(query: str, params: Dict[str, Any]) -> bool:
    """Validate parameterized query"""
    return sql_validator.validate_parameterized_query(query, params)


# Export functions
__all__ = [
    "SQLInjectionValidator",
    "SafeQueryBuilder",
    "sql_validator",
    "safe_query_builder",
    "validate_sql_input",
    "sanitize_sql_parameter",
    "validate_table_name",
    "validate_parameterized_query"
]
