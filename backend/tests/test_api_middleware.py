"""
API and Middleware Tests
Tests for API endpoints, middleware, and request processing
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.middleware.middleware import (
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    CORSSecurityMiddleware,
    APIVersionMiddleware
)
from app.core.security import SecurityAudit


class TestRateLimitMiddleware:
    """Test rate limiting middleware"""

    @pytest.fixture
    def rate_limit_middleware(self):
        """Create rate limit middleware"""
        return RateLimitMiddleware(app=MagicMock(), requests_per_minute=10, burst_size=5)

    def test_get_client_ip(self, rate_limit_middleware):
        """Test client IP extraction"""
        # Test with X-Forwarded-For
        mock_request = MagicMock()
        mock_request.headers = {"X-Forwarded-For": "192.168.1.1, 10.0.0.1"}
        mock_request.client = None

        ip = rate_limit_middleware._get_client_ip(mock_request)
        assert ip == "192.168.1.1"

        # Test with direct client
        mock_request.headers = {}
        mock_request.client = ("192.168.1.2", 12345)

        ip = rate_limit_middleware._get_client_ip(mock_request)
        assert ip == "192.168.1.2"

    @pytest.mark.asyncio
    async def test_rate_limit_enforcement(self, rate_limit_middleware):
        """Test rate limit enforcement"""
        mock_request = MagicMock()
        mock_request.method = "GET"
        mock_request.url.path = "/api/test"
        mock_request.headers = {"X-Forwarded-For": "192.168.1.1"}

        # First few requests should pass
        for i in range(3):
            response = await rate_limit_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=Response()))
            assert response.status_code != 429

        # Exceed burst limit
        for i in range(3):
            response = await rate_limit_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=Response()))
            if i >= 2:  # After burst limit
                assert response.status_code == 429

    def test_request_cleanup(self, rate_limit_middleware):
        """Test old request cleanup"""
        identifier = "test_user"

        # Add some old requests
        old_time = datetime.utcnow().timestamp() - 70  # 70 seconds ago
        rate_limit_middleware.requests[identifier] = [old_time, old_time + 10]

        rate_limit_middleware._cleanup_old_requests(identifier)

        # Should remove old requests
        assert len(rate_limit_middleware.requests[identifier]) == 0


class TestRequestLoggingMiddleware:
    """Test request logging middleware"""

    @pytest.fixture
    def logging_middleware(self):
        """Create request logging middleware"""
        return RequestLoggingMiddleware(app=MagicMock())

    def test_get_client_ip(self, logging_middleware):
        """Test client IP extraction for logging"""
        # Test with X-Forwarded-For
        mock_request = MagicMock()
        mock_request.headers = {"X-Forwarded-For": "192.168.1.1"}
        mock_request.client = None

        ip = logging_middleware._get_client_ip(mock_request)
        assert ip == "192.168.1.1"

        # Test with X-Real-IP
        mock_request.headers = {"X-Real-IP": "192.168.1.2"}
        ip = logging_middleware._get_client_ip(mock_request)
        assert ip == "192.168.1.2"

    @pytest.mark.asyncio
    async def test_request_logging(self, logging_middleware):
        """Test request logging"""
        mock_request = MagicMock()
        mock_request.method = "POST"
        mock_request.url.path = "/api/signals"
        mock_request.headers = {"X-Forwarded-For": "192.168.1.1"}

        mock_response = Response(status_code=201)

        with patch('app.middleware.middleware.logger') as mock_logger:
            response = await logging_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

            # Check that logging occurred
            mock_logger.info.assert_called()
            mock_logger.error.assert_not_called()  # 201 is success

            # Check response headers
            assert "X-Process-Time" in response.headers

    @pytest.mark.asyncio
    async def test_error_response_logging(self, logging_middleware):
        """Test error response logging"""
        mock_request = MagicMock()
        mock_request.method = "GET"
        mock_request.url.path = "/api/users"
        mock_request.headers = {"X-Forwarded-For": "192.168.1.1"}

        mock_response = Response(status_code=500)

        with patch('app.middleware.middleware.logger') as mock_logger:
            response = await logging_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

            # Check that error logging occurred
            mock_logger.error.assert_called()


class TestCORSSecurityMiddleware:
    """Test CORS security middleware"""

    @pytest.fixture
    def cors_middleware(self):
        """Create CORS security middleware"""
        return CORSSecurityMiddleware(app=MagicMock())

    @pytest.mark.asyncio
    async def test_security_headers_added(self, cors_middleware):
        """Test that security headers are added"""
        mock_request = MagicMock()
        mock_response = Response()

        response = await cors_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

        # Check security headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "Strict-Transport-Security" in response.headers


class TestAPIVersionMiddleware:
    """Test API version middleware"""

    @pytest.fixture
    def version_middleware(self):
        """Create API version middleware"""
        return APIVersionMiddleware(
            app=MagicMock(),
            current_version="v1",
            deprecated_versions=["v0"]
        )

    @pytest.mark.asyncio
    async def test_version_headers_added(self, version_middleware):
        """Test that version headers are added"""
        mock_request = MagicMock()
        mock_request.url.path = "/api/v1/signals"
        mock_response = Response()

        response = await version_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

        assert response.headers["X-API-Version"] == "v1"
        assert "X-API-Current-Version" in response.headers

    @pytest.mark.asyncio
    async def test_deprecated_version_warning(self, version_middleware):
        """Test deprecated version warning"""
        mock_request = MagicMock()
        mock_request.url.path = "/api/v0/signals"
        mock_response = Response()

        with patch('app.middleware.middleware.logger') as mock_logger:
            response = await version_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

            # Check deprecation headers
            assert response.headers["X-API-Deprecated"] == "true"
            assert "X-API-Deprecation-Message" in response.headers

            # Check logging
            mock_logger.warning.assert_called()


# API Endpoint Tests
@pytest.mark.asyncio
async def test_signals_endpoint():
    """Test signals API endpoint"""
    from app.api.v1.endpoints import signals

    # This would require more complex setup with FastAPI TestClient
    # For now, just test that the module can be imported
    assert signals is not None


@pytest.mark.asyncio
async def test_auth_endpoints():
    """Test authentication endpoints"""
    from app.api.v1.endpoints import auth

    # Test module import
    assert auth is not None


@pytest.mark.asyncio
async def test_market_data_endpoints():
    """Test market data endpoints"""
    from app.api.v1.endpoints import market

    # Test module import
    assert market is not None


# WebSocket Tests
@pytest.mark.asyncio
async def test_websocket_manager():
    """Test WebSocket manager"""
    from app.websocket.manager import WebSocketManager

    manager = WebSocketManager()

    # Test connection management
    mock_websocket = MagicMock()
    mock_websocket.client = ("test_client", 12345)

    # This would require more complex async WebSocket testing
    assert manager is not None


# Integration Tests
@pytest.mark.asyncio
async def test_middleware_stack():
    """Test middleware stack integration"""
    # Create a mock app
    mock_app = MagicMock()

    # Create middleware stack
    cors_middleware = CORSSecurityMiddleware(mock_app)
    version_middleware = APIVersionMiddleware(cors_middleware, current_version="v1")

    # Test request flow
    mock_request = MagicMock()
    mock_request.url.path = "/api/v1/signals"
    mock_response = Response()

    # Process through middleware stack
    response = await version_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

    # Check that all headers are added
    assert response.headers["X-API-Version"] == "v1"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"


@pytest.mark.asyncio
async def test_rate_limiting_with_logging():
    """Test rate limiting combined with request logging"""
    # Create mock app
    mock_app = MagicMock()

    # Create middleware stack: logging -> rate limiting
    rate_middleware = RateLimitMiddleware(mock_app, requests_per_minute=5, burst_size=3)
    logging_middleware = RequestLoggingMiddleware(rate_middleware)

    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.url.path = "/api/test"
    mock_request.headers = {"X-Forwarded-For": "192.168.1.1"}

    # Make requests up to burst limit
    for i in range(5):
        response = await logging_middleware.dispatch(mock_request, lambda: AsyncMock(return_value=Response()))

        if i < 3:  # Within burst limit
            assert response.status_code != 429
        else:  # Exceeded burst limit
            assert response.status_code == 429


@pytest.mark.asyncio
async def test_api_version_deprecation_flow():
    """Test API version deprecation flow"""
    from app.middleware.middleware import APIVersionMiddleware

    mock_app = MagicMock()
    middleware = APIVersionMiddleware(
        mock_app,
        current_version="v2",
        deprecated_versions=["v1"]
    )

    # Test deprecated version request
    mock_request = MagicMock()
    mock_request.url.path = "/api/v1/signals"
    mock_response = Response()

    with patch('app.middleware.middleware.logger') as mock_logger:
        response = await middleware.dispatch(mock_request, lambda: AsyncMock(return_value=mock_response))

        # Check deprecation warning
        assert response.headers["X-API-Deprecated"] == "true"
        assert "deprecat" in response.headers["X-API-Deprecation-Message"].lower()
        mock_logger.warning.assert_called()


# Error Handling Tests
@pytest.mark.asyncio
async def test_middleware_error_handling():
    """Test middleware error handling"""
    from app.middleware.middleware import RequestLoggingMiddleware

    mock_app = MagicMock()
    middleware = RequestLoggingMiddleware(mock_app)

    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.url.path = "/api/test"
    mock_request.headers = {}

    # Simulate app error
    async def failing_call_next():
        raise Exception("Test error")

    with patch('app.middleware.middleware.logger') as mock_logger:
        with pytest.raises(Exception):
            await middleware.dispatch(mock_request, failing_call_next)

        # Should still log the request
        mock_logger.info.assert_called()


# Security Integration Tests
@pytest.mark.asyncio
async def test_security_audit_integration():
    """Test security audit integration with middleware"""
    from app.core.security import SecurityAudit

    # Test audit logging from middleware context
    with patch('app.core.security.get_db_context') as mock_context:
        mock_session = AsyncMock()
        mock_context.return_value.__aenter__.return_value = mock_session

        # Simulate middleware triggering audit
        await SecurityAudit.log_security_event(
            "api_access",
            user_id=123,
            details={
                "endpoint": "/api/signals",
                "method": "GET",
                "ip_address": "192.168.1.1"
            },
            severity="info"
        )

        # Verify audit was recorded
        mock_session.add.assert_called()
        mock_session.commit.assert_called()


# Performance Tests
@pytest.mark.asyncio
async def test_middleware_performance():
    """Test middleware performance impact"""
    import time

    mock_app = MagicMock()
    middleware = RequestLoggingMiddleware(mock_app)

    mock_request = MagicMock()
    mock_request.method = "GET"
    mock_request.url.path = "/api/test"
    mock_request.headers = {"X-Forwarded-For": "192.168.1.1"}

    # Measure middleware overhead
    start_time = time.time()

    for _ in range(100):
        response = await middleware.dispatch(mock_request, lambda: AsyncMock(return_value=Response()))

    end_time = time.time()

    avg_time = (end_time - start_time) / 100
    # Middleware should add minimal overhead (< 1ms per request)
    assert avg_time < 0.001  # Less than 1ms
