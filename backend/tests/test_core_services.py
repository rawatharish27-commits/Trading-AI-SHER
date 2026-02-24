"""
Core Services Tests
Tests for configuration, logging, metrics, and core utilities
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path

from app.core.config import Settings
from app.core.logging import setup_logging
from app.core.metrics import MetricsCollector
from app.core.database import check_db_health, validate_connection_pool
from app.core.security import InputValidator


class TestSettings:
    """Test application settings"""

    def test_settings_initialization(self):
        """Test settings initialization with validation"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
            'DATABASE_URL': 'postgresql+asyncpg://test:test@localhost/test'
        }):
            settings = Settings()

            assert settings.secret_key == 'test_secret_key_32_chars_long_enough'
            assert 'postgresql' in settings.effective_database_url

    def test_settings_validation(self):
        """Test settings validation"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'short',  # Too short
        }):
            with pytest.raises(ValueError, match="SECRET_KEY must be at least 32 characters"):
                Settings()

    def test_cors_origins_list(self):
        """Test CORS origins parsing"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
        }):
            settings = Settings()

            # Test development origins
            assert isinstance(settings.cors_origins_list, list)
            assert len(settings.cors_origins_list) > 0

    def test_smc_config_parsing(self):
        """Test SMC configuration parsing"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
        }):
            settings = Settings()

            # Test SMC symbol configs
            configs = settings.smc_symbol_configs_dict
            assert isinstance(configs, dict)
            assert 'default' in configs

    @pytest.mark.asyncio
    async def test_configuration_audit(self):
        """Test configuration change auditing"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
        }):
            settings = Settings()

            with patch('app.core.config.security_audit') as mock_audit:
                await settings.audit_configuration_change(
                    user_id=123,
                    config_key="test_config",
                    old_value="old_value",
                    new_value="new_value",
                    change_reason="Testing",
                    ip_address="192.168.1.1",
                    user_agent="Test Browser"
                )

                mock_audit.log_system_configuration_change.assert_called_once()

    def test_configuration_validation(self):
        """Test configuration validation on startup"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
        }):
            settings = Settings()

            # Mock production environment
            settings.environment = "production"
            settings.database_url = "postgresql+asyncpg://test:test@localhost/test"

            errors = settings.validate_configuration_on_startup()

            # Should pass basic validation
            assert isinstance(errors, list)

    def test_configuration_snapshot(self):
        """Test configuration snapshot generation"""
        with patch.dict('os.environ', {
            'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
        }):
            settings = Settings()

            snapshot = settings.get_configuration_snapshot()

            assert isinstance(snapshot, dict)
            assert 'app_name' in snapshot
            # Sensitive data should be redacted
            assert snapshot.get('secret_key') == '***REDACTED***'


class TestMetricsCollector:
    """Test metrics collection"""

    def test_metrics_initialization(self):
        """Test metrics collector initialization"""
        collector = MetricsCollector()
        assert collector is not None

    def test_metric_updates(self):
        """Test metric updates"""
        MetricsCollector.update_metric("test_metric", 42)
        # Should not raise exceptions
        assert True

    def test_system_metrics_update(self):
        """Test system metrics update"""
        MetricsCollector.update_system_metrics()
        # Should not raise exceptions
        assert True

    def test_business_metrics_update(self):
        """Test business metrics update"""
        MetricsCollector.update_business_metrics()
        # Should not raise exceptions
        assert True


class TestInputValidator:
    """Test input validation utilities"""

    def test_string_sanitization(self):
        """Test string sanitization"""
        # Valid input
        result = InputValidator.sanitize_string("test input")
        assert result == "test input"

        # Input with null bytes
        result = InputValidator.sanitize_string("test\x00input")
        assert result == "testinput"

        # Too long input
        with pytest.raises(ValueError):
            InputValidator.sanitize_string("a" * 1001, max_length=1000)

    def test_symbol_validation(self):
        """Test trading symbol validation"""
        # Valid symbols
        assert InputValidator.validate_symbol("RELIANCE") == "RELIANCE"
        assert InputValidator.validate_symbol("TCS.NS") == "TCS.NS"

        # Invalid symbols
        with pytest.raises(ValueError):
            InputValidator.validate_symbol("INVALID SYMBOL")

        with pytest.raises(ValueError):
            InputValidator.validate_symbol("SYMBOL@INVALID")

    def test_email_validation(self):
        """Test email validation"""
        # Valid emails
        assert InputValidator.validate_email("test@example.com") == "test@example.com"
        assert InputValidator.validate_email("user.name+tag@domain.co.uk") == "user.name+tag@domain.co.uk"

        # Invalid emails
        with pytest.raises(ValueError):
            InputValidator.validate_email("invalid-email")

        with pytest.raises(ValueError):
            InputValidator.validate_email("test@.com")


class TestDatabaseHealth:
    """Test database health checks"""

    @pytest.mark.asyncio
    async def test_db_health_check(self):
        """Test database health check"""
        with patch('app.core.database.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock successful query
            mock_result = MagicMock()
            mock_result.scalar.return_value = 1
            mock_session.execute.return_value = mock_result

            # Mock pool stats
            with patch('app.core.database.engine') as mock_engine:
                mock_pool = MagicMock()
                mock_pool.size.return_value = 10
                mock_pool.checkedout.return_value = 3
                mock_pool.overflow.return_value = 0
                mock_engine.pool = mock_pool

                health = await check_db_health()

                assert health["status"] == "healthy"
                assert "latency_ms" in health
                assert health["pool"]["size"] == 10

    @pytest.mark.asyncio
    async def test_db_health_check_failure(self):
        """Test database health check failure"""
        with patch('app.core.database.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock failed query
            mock_session.execute.side_effect = Exception("Connection failed")

            health = await check_db_health()

            assert health["status"] == "unhealthy"
            assert "error" in health

    @pytest.mark.asyncio
    async def test_connection_pool_validation(self):
        """Test connection pool validation"""
        with patch('app.core.database.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            with patch('app.core.database.validate_connection_pool') as mock_validate:
                mock_validate.return_value = {
                    "pool_config_valid": True,
                    "connection_test_passed": True,
                    "warnings": [],
                    "recommendations": []
                }

                result = await validate_connection_pool()

                assert result["pool_config_valid"] is True
                assert result["connection_test_passed"] is True


# Integration Tests
@pytest.mark.asyncio
async def test_settings_and_database_integration():
    """Test settings and database integration"""
    with patch.dict('os.environ', {
        'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
        'DATABASE_URL': 'sqlite+aiosqlite:///test.db'
    }):
        settings = Settings()

        # Test database URL resolution
        assert 'sqlite' in settings.effective_database_url

        # Test configuration validation
        errors = settings.validate_configuration_on_startup()
        assert isinstance(errors, list)


@pytest.mark.asyncio
async def test_metrics_and_monitoring_integration():
    """Test metrics and monitoring integration"""
    # Test metrics collection
    MetricsCollector.update_metric("test_counter", 1)
    MetricsCollector.update_metric("test_gauge", 42.5)

    # Test system metrics
    MetricsCollector.update_system_metrics()

    # Should not raise exceptions
    assert True


@pytest.mark.asyncio
async def test_input_validation_comprehensive():
    """Test comprehensive input validation"""
    # Test various inputs
    test_cases = [
        ("valid_symbol", "RELIANCE", True),
        ("invalid_symbol_spaces", "REL IANCE", False),
        ("invalid_symbol_special", "REL@IANCE", False),
        ("valid_email", "test@example.com", True),
        ("invalid_email", "test@", False),
    ]

    for test_name, input_value, should_pass in test_cases:
        if "symbol" in test_name:
            if should_pass:
                result = InputValidator.validate_symbol(input_value)
                assert result == input_value.upper()
            else:
                with pytest.raises(ValueError):
                    InputValidator.validate_symbol(input_value)
        elif "email" in test_name:
            if should_pass:
                result = InputValidator.validate_email(input_value)
                assert result == input_value.lower()
            else:
                with pytest.raises(ValueError):
                    InputValidator.validate_email(input_value)


@pytest.mark.asyncio
async def test_configuration_export():
    """Test configuration export functionality"""
    with patch.dict('os.environ', {
        'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
    }):
        settings = Settings()

        with patch('builtins.open', create=True) as mock_open:
            mock_file = MagicMock()
            mock_open.return_value.__enter__.return_value = mock_file

            await settings.export_configuration_for_audit(Path("/tmp/test_config.json"))

            # Verify JSON dump was called
            import json
            mock_file.write.assert_called()


# Performance Tests
def test_settings_performance():
    """Test settings initialization performance"""
    import time

    with patch.dict('os.environ', {
        'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
    }):
        start_time = time.time()

        # Initialize settings multiple times
        for _ in range(100):
            settings = Settings()

        end_time = time.time()

        avg_time = (end_time - start_time) / 100
        # Should initialize quickly (< 1ms)
        assert avg_time < 0.001


def test_input_validation_performance():
    """Test input validation performance"""
    import time

    test_inputs = ["test@example.com", "RELIANCE", "normal_string"] * 100

    start_time = time.time()

    for input_str in test_inputs:
        InputValidator.sanitize_string(input_str)

    end_time = time.time()

    avg_time = (end_time - start_time) / len(test_inputs)
    # Should validate quickly (< 0.1ms per validation)
    assert avg_time < 0.0001


# Security Tests
@pytest.mark.asyncio
async def test_configuration_audit_security():
    """Test that configuration audit properly sanitizes sensitive data"""
    with patch.dict('os.environ', {
        'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
    }):
        settings = Settings()

        snapshot = settings.get_configuration_snapshot()

        # Ensure sensitive fields are redacted
        sensitive_fields = ['secret_key', 'angel_one_api_key_encrypted', 'redis_password']
        for field in sensitive_fields:
            if field in snapshot:
                assert snapshot[field] == '***REDACTED***'


@pytest.mark.asyncio
async def test_input_validation_security():
    """Test input validation security"""
    # Test SQL injection attempts
    malicious_inputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>",
        "../../../etc/passwd",
        "javascript:alert('xss')",
    ]

    for malicious_input in malicious_inputs:
        # Should either sanitize or reject
        try:
            result = InputValidator.sanitize_string(malicious_input)
            # If not rejected, ensure dangerous chars are removed
            assert '<' not in result
            assert 'javascript:' not in result
        except ValueError:
            # Rejection is also acceptable
            pass


# Error Handling Tests
@pytest.mark.asyncio
async def test_database_health_error_handling():
    """Test database health check error handling"""
    with patch('app.core.database.get_db_context') as mock_context:
        mock_context.side_effect = Exception("Database unavailable")

        health = await check_db_health()

        assert health["status"] == "unhealthy"
        assert "error" in health


@pytest.mark.asyncio
async def test_configuration_validation_error_handling():
    """Test configuration validation error handling"""
    with patch.dict('os.environ', {
        'SECRET_KEY': 'test_secret_key_32_chars_long_enough',
    }):
        settings = Settings()

        # Force validation errors
        settings.environment = "production"
        settings.database_url = "invalid_url"

        errors = settings.validate_configuration_on_startup()

        assert len(errors) > 0
        assert any("database" in error.lower() for error in errors)
