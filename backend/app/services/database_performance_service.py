"""
Database Performance Monitoring Service
Comprehensive monitoring of database performance, queries, and health metrics
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger
from sqlalchemy import text, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_context, engine
from app.core.config import settings
from app.core.metrics import MetricsCollector


class QueryPerformanceLevel(Enum):
    """Query performance classification"""
    FAST = "fast"        # < 100ms
    NORMAL = "normal"    # 100ms - 1s
    SLOW = "slow"        # 1s - 10s
    CRITICAL = "critical"  # > 10s


@dataclass
class QueryMetrics:
    """Query performance metrics"""
    query: str
    execution_time: float
    timestamp: datetime
    connection_id: Optional[str] = None
    transaction_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    stack_trace: Optional[str] = None


@dataclass
class DatabaseMetrics:
    """Database performance metrics"""
    timestamp: datetime
    active_connections: int
    idle_connections: int
    total_connections: int
    connection_pool_size: int
    connection_pool_overflow: int
    queries_per_second: float
    slow_queries_count: int
    average_query_time: float
    memory_usage_mb: Optional[float] = None
    disk_usage_mb: Optional[float] = None
    cache_hit_ratio: Optional[float] = None


class DatabasePerformanceMonitor:
    """
    Comprehensive database performance monitoring
    """

    def __init__(self):
        self.query_metrics: List[QueryMetrics] = []
        self.slow_query_threshold = 1.0  # seconds
        self.critical_query_threshold = 10.0  # seconds
        self.max_metrics_history = 10000
        self.is_monitoring = False

        # Performance thresholds
        self.alert_thresholds = {
            "slow_queries_per_minute": 10,
            "average_query_time": 2.0,  # seconds
            "connection_pool_usage": 0.9,  # 90%
            "memory_usage_mb": 1000,  # 1GB
        }

    async def start_monitoring(self) -> None:
        """Start database performance monitoring"""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        logger.info("🔍 Starting database performance monitoring")

        # Set up SQLAlchemy event listeners
        self._setup_query_monitoring()

        # Start background monitoring tasks
        asyncio.create_task(self._periodic_metrics_collection())
        asyncio.create_task(self._slow_query_alert_monitor())
        asyncio.create_task(self._performance_health_check())

        logger.info("✅ Database performance monitoring started")

    async def stop_monitoring(self) -> None:
        """Stop database performance monitoring"""
        self.is_monitoring = False
        logger.info("🛑 Database performance monitoring stopped")

    def _setup_query_monitoring(self) -> None:
        """Set up SQLAlchemy query monitoring"""

        @event.listens_for(engine.sync_engine, "before_execute")
        def before_execute(conn, clauseelement, multiparams, params):
            """Track query execution start"""
            conn._query_start_time = time.time()
            conn._query_text = str(clauseelement)

        @event.listens_for(engine.sync_engine, "after_execute")
        def after_execute(conn, clauseelement, multiparams, params, result):
            """Track query execution completion"""
            if hasattr(conn, '_query_start_time'):
                execution_time = time.time() - conn._query_start_time

                # Create metrics
                metrics = QueryMetrics(
                    query=conn._query_text,
                    execution_time=execution_time,
                    timestamp=datetime.utcnow(),
                    connection_id=str(id(conn)),
                    parameters=params if isinstance(params, dict) else None
                )

                # Add to metrics history
                self._add_query_metrics(metrics)

                # Log slow queries
                if execution_time > self.slow_query_threshold:
                    self._log_slow_query(metrics)

                # Clean up
                delattr(conn, '_query_start_time')
                delattr(conn, '_query_text')

    def _add_query_metrics(self, metrics: QueryMetrics) -> None:
        """Add query metrics to history"""
        self.query_metrics.append(metrics)

        # Maintain history size limit
        if len(self.query_metrics) > self.max_metrics_history:
            self.query_metrics = self.query_metrics[-self.max_metrics_history:]

    def _log_slow_query(self, metrics: QueryMetrics) -> None:
        """Log slow query with appropriate level"""
        level = "WARNING" if metrics.execution_time < self.critical_query_threshold else "ERROR"

        logger.log(level, f"Slow query detected: {metrics.execution_time:.3f}s - {metrics.query[:100]}...")

        # Update metrics
        MetricsCollector.update_metric(
            "database_slow_queries_total",
            MetricsCollector.get_metric("database_slow_queries_total", 0) + 1
        )

    async def _periodic_metrics_collection(self) -> None:
        """Collect database metrics periodically"""
        while self.is_monitoring:
            try:
                metrics = await self._collect_database_metrics()

                # Update global metrics
                MetricsCollector.update_metric("database_active_connections", metrics.active_connections)
                MetricsCollector.update_metric("database_total_connections", metrics.total_connections)
                MetricsCollector.update_metric("database_queries_per_second", metrics.queries_per_second)
                MetricsCollector.update_metric("database_average_query_time", metrics.average_query_time)

                # Check for alerts
                await self._check_performance_alerts(metrics)

                await asyncio.sleep(60)  # Collect every minute

            except Exception as e:
                logger.error(f"Error collecting database metrics: {e}")
                await asyncio.sleep(30)

    async def _collect_database_metrics(self) -> DatabaseMetrics:
        """Collect comprehensive database metrics"""
        metrics = DatabaseMetrics(
            timestamp=datetime.utcnow(),
            active_connections=0,
            idle_connections=0,
            total_connections=0,
            connection_pool_size=0,
            connection_pool_overflow=0,
            queries_per_second=0.0,
            slow_queries_count=0,
            average_query_time=0.0
        )

        try:
            # Get connection pool stats
            pool = engine.pool
            metrics.connection_pool_size = pool.size() if hasattr(pool, 'size') else 0
            metrics.connection_pool_overflow = pool.overflow() if hasattr(pool, 'overflow') else 0
            metrics.total_connections = pool.checkedout() + (pool.size() - pool.checkedout()) if hasattr(pool, 'checkedout') else 0
            metrics.active_connections = pool.checkedout() if hasattr(pool, 'checkedout') else 0
            metrics.idle_connections = metrics.total_connections - metrics.active_connections

            # Calculate query performance metrics
            recent_queries = [q for q in self.query_metrics if (datetime.utcnow() - q.timestamp).seconds < 60]

            if recent_queries:
                metrics.queries_per_second = len(recent_queries) / 60.0
                metrics.average_query_time = sum(q.execution_time for q in recent_queries) / len(recent_queries)
                metrics.slow_queries_count = sum(1 for q in recent_queries if q.execution_time > self.slow_query_threshold)

            # Database-specific metrics (PostgreSQL)
            if "postgresql" in str(engine.url):
                await self._collect_postgresql_metrics(metrics)

        except Exception as e:
            logger.error(f"Error collecting database metrics: {e}")

        return metrics

    async def _collect_postgresql_metrics(self, metrics: DatabaseMetrics) -> None:
        """Collect PostgreSQL-specific metrics"""
        try:
            async with get_db_context() as session:
                # Active connections
                result = await session.execute(text("""
                    SELECT count(*) as active_connections
                    FROM pg_stat_activity
                    WHERE state = 'active'
                """))
                metrics.active_connections = result.fetchone()[0]

                # Cache hit ratio
                result = await session.execute(text("""
                    SELECT
                        round(100 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2) as cache_hit_ratio
                    FROM pg_stat_database
                    WHERE datname = current_database()
                """))
                cache_ratio = result.fetchone()[0]
                metrics.cache_hit_ratio = float(cache_ratio) if cache_ratio else None

                # Database size
                result = await session.execute(text("""
                    SELECT pg_database_size(current_database()) / 1024 / 1024 as size_mb
                """))
                metrics.disk_usage_mb = float(result.fetchone()[0])

        except Exception as e:
            logger.warning(f"Error collecting PostgreSQL metrics: {e}")

    async def _check_performance_alerts(self, metrics: DatabaseMetrics) -> None:
        """Check for performance alerts"""
        alerts = []

        # Slow queries alert
        if metrics.slow_queries_count > self.alert_thresholds["slow_queries_per_minute"]:
            alerts.append(f"High slow query count: {metrics.slow_queries_count}/min")

        # Average query time alert
        if metrics.average_query_time > self.alert_thresholds["average_query_time"]:
            alerts.append(f"High average query time: {metrics.average_query_time:.2f}s")

        # Connection pool usage alert
        pool_usage = metrics.active_connections / max(metrics.connection_pool_size, 1)
        if pool_usage > self.alert_thresholds["connection_pool_usage"]:
            alerts.append(f"High connection pool usage: {pool_usage:.1%}")

        # Log alerts
        for alert in alerts:
            logger.warning(f"🚨 Database Performance Alert: {alert}")

            # Could integrate with alerting system here
            # await alert_service.send_alert("database_performance", alert, "warning")

    async def _slow_query_alert_monitor(self) -> None:
        """Monitor for slow query patterns"""
        while self.is_monitoring:
            try:
                # Check for query patterns every 5 minutes
                recent_slow_queries = [
                    q for q in self.query_metrics
                    if (datetime.utcnow() - q.timestamp).seconds < 300
                    and q.execution_time > self.slow_query_threshold
                ]

                if recent_slow_queries:
                    # Group by query pattern
                    query_patterns = {}
                    for query in recent_slow_queries:
                        pattern = query.query.split()[0] if query.query else "unknown"
                        if pattern not in query_patterns:
                            query_patterns[pattern] = []
                        query_patterns[pattern].append(query)

                    # Alert on patterns with multiple slow queries
                    for pattern, queries in query_patterns.items():
                        if len(queries) >= 3:
                            avg_time = sum(q.execution_time for q in queries) / len(queries)
                            logger.warning(f"🚨 Slow query pattern detected: {pattern} ({len(queries)} queries, avg {avg_time:.2f}s)")

                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                logger.error(f"Error in slow query monitor: {e}")
                await asyncio.sleep(60)

    async def _performance_health_check(self) -> None:
        """Perform periodic health checks"""
        while self.is_monitoring:
            try:
                # Basic connectivity check
                async with get_db_context() as session:
                    start_time = time.time()
                    await session.execute(text("SELECT 1"))
                    response_time = time.time() - start_time

                    if response_time > 5.0:  # 5 second threshold
                        logger.warning(f"🚨 Slow database response: {response_time:.2f}s")
                    elif response_time > 1.0:  # 1 second warning
                        logger.info(f"⚠️ Elevated database response time: {response_time:.2f}s")

                await asyncio.sleep(300)  # Health check every 5 minutes

            except Exception as e:
                logger.error(f"🚨 Database health check failed: {e}")
                # Could trigger alerts here
                await asyncio.sleep(60)

    async def get_performance_report(self, hours: int = 1) -> Dict[str, Any]:
        """Generate performance report for the last N hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        # Filter recent metrics
        recent_queries = [q for q in self.query_metrics if q.timestamp > cutoff_time]

        if not recent_queries:
            return {"error": "No query metrics available for the specified period"}

        # Calculate statistics
        total_queries = len(recent_queries)
        total_time = sum(q.execution_time for q in recent_queries)
        avg_time = total_time / total_queries

        slow_queries = [q for q in recent_queries if q.execution_time > self.slow_query_threshold]
        critical_queries = [q for q in recent_queries if q.execution_time > self.critical_query_threshold]

        # Query type breakdown
        query_types = {}
        for query in recent_queries:
            query_type = query.query.split()[0].upper() if query.query else "UNKNOWN"
            query_types[query_type] = query_types.get(query_type, 0) + 1

        return {
            "period_hours": hours,
            "total_queries": total_queries,
            "queries_per_second": total_queries / (hours * 3600),
            "average_query_time": avg_time,
            "slow_queries": len(slow_queries),
            "critical_queries": len(critical_queries),
            "query_types": query_types,
            "slow_query_threshold": self.slow_query_threshold,
            "critical_query_threshold": self.critical_query_threshold,
            "top_slow_queries": [
                {
                    "query": q.query[:100] + "..." if len(q.query) > 100 else q.query,
                    "execution_time": q.execution_time,
                    "timestamp": q.timestamp.isoformat()
                }
                for q in sorted(slow_queries, key=lambda x: x.execution_time, reverse=True)[:10]
            ]
        }

    def set_slow_query_threshold(self, threshold: float) -> None:
        """Set the slow query threshold"""
        self.slow_query_threshold = threshold
        logger.info(f"Updated slow query threshold to {threshold}s")

    def set_critical_query_threshold(self, threshold: float) -> None:
        """Set the critical query threshold"""
        self.critical_query_threshold = threshold
        logger.info(f"Updated critical query threshold to {threshold}s")


# Global performance monitor instance
db_performance_monitor = DatabasePerformanceMonitor()


# Utility functions
async def start_database_monitoring() -> None:
    """Start database performance monitoring"""
    await db_performance_monitor.start_monitoring()


async def stop_database_monitoring() -> None:
    """Stop database performance monitoring"""
    await db_performance_monitor.stop_monitoring()


async def get_database_performance_report(hours: int = 1) -> Dict[str, Any]:
    """Get database performance report"""
    return await db_performance_monitor.get_performance_report(hours)


# Export functions
__all__ = [
    "DatabasePerformanceMonitor",
    "QueryPerformanceLevel",
    "QueryMetrics",
    "DatabaseMetrics",
    "db_performance_monitor",
    "start_database_monitoring",
    "stop_database_monitoring",
    "get_database_performance_report"
]
