"""
Prometheus Metrics for SMC Agent
Comprehensive monitoring and observability
"""

from prometheus_client import (
    Counter, Histogram, Gauge, Summary,
    generate_latest, CONTENT_TYPE_LATEST
)
from fastapi import Response
import time
from typing import Dict, Any
from contextlib import asynccontextmanager

# ===== REQUEST METRICS =====
http_requests_total = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

active_connections = Gauge(
    'active_connections',
    'Number of active WebSocket connections'
)

# ===== SMC ENGINE METRICS =====
smc_signals_generated_total = Counter(
    'smc_signals_generated_total',
    'Total number of SMC signals generated',
    ['symbol', 'direction', 'quality_level']
)

smc_signal_generation_duration = Histogram(
    'smc_signal_generation_duration_seconds',
    'Time taken to generate SMC signals',
    ['symbol', 'component'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

smc_component_success_total = Counter(
    'smc_component_success_total',
    'SMC component analysis success count',
    ['component', 'result']
)

smc_quality_score = Histogram(
    'smc_quality_score',
    'Distribution of SMC signal quality scores',
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

# ===== MARKET DATA METRICS =====
market_data_requests_total = Counter(
    'market_data_requests_total',
    'Total market data API requests',
    ['exchange', 'status']
)

market_data_cache_hits = Counter(
    'market_data_cache_hits_total',
    'Market data cache hits'
)

market_data_cache_misses = Counter(
    'market_data_cache_misses_total',
    'Market data cache misses'
)

# ===== RISK ENGINE METRICS =====
risk_validations_total = Counter(
    'risk_validations_total',
    'Total risk validations performed',
    ['result', 'risk_level']
)

risk_validation_duration = Histogram(
    'risk_validation_duration_seconds',
    'Time taken for risk validation',
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0]
)

# ===== DATABASE METRICS =====
db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['operation', 'table'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

# ===== SYSTEM METRICS =====
memory_usage_bytes = Gauge(
    'memory_usage_bytes',
    'Current memory usage in bytes'
)

cpu_usage_percent = Gauge(
    'cpu_usage_percent',
    'Current CPU usage percentage'
)

# ===== ERROR METRICS =====
errors_total = Counter(
    'errors_total',
    'Total number of errors',
    ['type', 'component']
)

# ===== BUSINESS METRICS =====
active_signals = Gauge(
    'active_signals',
    'Number of currently active signals'
)

signals_created_today = Counter(
    'signals_created_today_total',
    'Signals created today',
    ['strategy', 'action']
)

user_sessions_active = Gauge(
    'user_sessions_active',
    'Number of active user sessions'
)


class MetricsCollector:
    """Metrics collection utilities"""

    @staticmethod
    def record_http_request(method: str, endpoint: str, status_code: int, duration: float):
        """Record HTTP request metrics"""
        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code
        ).inc()

        http_request_duration_seconds.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)

    @staticmethod
    def record_smc_signal_generation(symbol: str, direction: str, quality_score: float, duration: float):
        """Record SMC signal generation metrics"""
        # Determine quality level
        if quality_score >= 0.8:
            quality_level = "high"
        elif quality_score >= 0.6:
            quality_level = "medium"
        else:
            quality_level = "low"

        smc_signals_generated_total.labels(
            symbol=symbol,
            direction=direction,
            quality_level=quality_level
        ).inc()

        smc_signal_generation_duration.labels(
            symbol=symbol,
            component="full_analysis"
        ).observe(duration)

        smc_quality_score.observe(quality_score)

    @staticmethod
    def record_smc_component_result(component: str, success: bool):
        """Record SMC component analysis result"""
        result = "success" if success else "failure"
        smc_component_success_total.labels(
            component=component,
            result=result
        ).inc()

    @staticmethod
    def record_market_data_request(exchange: str, success: bool):
        """Record market data request"""
        status = "success" if success else "failure"
        market_data_requests_total.labels(
            exchange=exchange,
            status=status
        ).inc()

    @staticmethod
    def record_risk_validation(result: str, risk_level: str, duration: float):
        """Record risk validation metrics"""
        risk_validations_total.labels(
            result=result,
            risk_level=risk_level
        ).inc()

        risk_validation_duration.observe(duration)

    @staticmethod
    def record_error(error_type: str, component: str):
        """Record error metrics"""
        errors_total.labels(
            type=error_type,
            component=component
        ).inc()

    @staticmethod
    def update_system_metrics():
        """Update system resource metrics"""
        import psutil

        # Memory usage
        memory = psutil.virtual_memory()
        memory_usage_bytes.set(memory.used)

        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_usage_percent.set(cpu_percent)

    @staticmethod
    def update_business_metrics():
        """Update business-related metrics"""
        # These would be updated from database queries
        # For now, placeholders
        pass


@asynccontextmanager
async def metrics_context():
    """Context manager for metrics collection"""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        # Record metrics here if needed


def get_metrics_response() -> Response:
    """Get Prometheus metrics as HTTP response"""
    metrics_data = generate_latest()
    return Response(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST
    )


# Middleware for automatic metrics collection
class MetricsMiddleware:
    """FastAPI middleware for automatic metrics collection"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract request info
        method = scope["method"]
        path = scope["path"]

        # Skip metrics endpoint to avoid recursion
        if path.startswith("/metrics"):
            await self.app(scope, receive, send)
            return

        start_time = time.time()

        # Create a custom send function to capture response
        response_status = [200]  # Default

        async def custom_send(message):
            if message["type"] == "http.response.start":
                response_status[0] = message["status"]
            await send(message)

        # Process request
        await self.app(scope, receive, custom_send)

        # Record metrics
        duration = time.time() - start_time
        MetricsCollector.record_http_request(
            method=method,
            endpoint=path,
            status_code=response_status[0],
            duration=duration
        )
