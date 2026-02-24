"""
Database Indexing Service
Analyzes query patterns and implements optimal indexing strategies for production performance
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger
from sqlalchemy import text, inspect, Index, Column
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_context
from app.core.config import settings
from app.services.database_performance_service import db_performance_monitor


class IndexType(Enum):
    """Database index types"""
    BTREE = "btree"  # Default for most queries
    HASH = "hash"    # For equality only
    GIN = "gin"      # For array/json operations
    GIST = "gist"    # For geometric/spatial data
    BRIN = "brin"    # For large tables with correlation
    PARTIAL = "partial"  # Conditional indexes


class IndexPriority(Enum):
    """Index priority levels"""
    CRITICAL = "critical"  # Must have for core functionality
    HIGH = "high"          # Important for performance
    MEDIUM = "medium"      # Nice to have
    LOW = "low"           # Optional optimizations


@dataclass
class IndexRecommendation:
    """Index recommendation with metadata"""
    table: str
    columns: List[str]
    index_type: IndexType
    name: str
    priority: IndexPriority
    reason: str
    estimated_impact: str
    query_patterns: List[str] = field(default_factory=list)
    existing: bool = False
    created_at: Optional[datetime] = None


@dataclass
class IndexAnalysis:
    """Analysis of existing indexes"""
    table: str
    existing_indexes: List[Dict[str, Any]]
    missing_indexes: List[IndexRecommendation]
    redundant_indexes: List[Dict[str, Any]]
    performance_impact: Dict[str, Any]


class DatabaseIndexingService:
    """
    Service for database indexing strategy and optimization
    """

    def __init__(self):
        # Core tables that need indexing
        self.core_tables = [
            "users", "signals", "orders", "positions", "market_data",
            "audit_logs", "api_keys", "notifications", "trade_journal"
        ]

        # Query pattern analysis
        self.query_patterns = {
            "users": [
                "email",  # Login queries
                "created_at",  # User listing
                "last_login",  # Active users
            ],
            "signals": [
                "symbol",  # Symbol filtering
                "created_at",  # Time-based queries
                "strategy",  # Strategy filtering
                "status",  # Status filtering
                "user_id",  # User-specific signals
                ("symbol", "created_at"),  # Symbol + time range
                ("strategy", "status"),  # Strategy + status
            ],
            "orders": [
                "user_id",  # User orders
                "symbol",  # Symbol orders
                "status",  # Status filtering
                "created_at",  # Time-based queries
                "order_type",  # Type filtering
                ("user_id", "created_at"),  # User + time
                ("symbol", "status"),  # Symbol + status
            ],
            "positions": [
                "user_id",  # User positions
                "symbol",  # Symbol positions
                "status",  # Open/closed positions
                "created_at",  # Time-based queries
                ("user_id", "symbol"),  # User + symbol
                ("user_id", "status"),  # User + status
            ],
            "market_data": [
                "symbol",  # Symbol data
                "timestamp",  # Time series queries
                ("symbol", "timestamp"),  # Symbol + time range
            ],
            "audit_logs": [
                "user_id",  # User activity
                "action",  # Action type
                "created_at",  # Time-based queries
                "resource_type",  # Resource filtering
                ("user_id", "created_at"),  # User + time
                ("action", "created_at"),  # Action + time
            ],
            "api_keys": [
                "user_id",  # User API keys
                "key_hash",  # Authentication
                "status",  # Active keys
            ],
            "notifications": [
                "user_id",  # User notifications
                "status",  # Read/unread
                "created_at",  # Time-based queries
                ("user_id", "status"),  # User + status
            ],
            "trade_journal": [
                "user_id",  # User trades
                "symbol",  # Symbol trades
                "entry_date",  # Date filtering
                "strategy",  # Strategy analysis
                ("user_id", "entry_date"),  # User + date
                ("symbol", "entry_date"),  # Symbol + date
            ]
        }

    async def analyze_database_indexes(self) -> Dict[str, IndexAnalysis]:
        """
        Comprehensive analysis of database indexing strategy

        Returns:
            Analysis for each table
        """
        analysis_results = {}

        for table in self.core_tables:
            try:
                analysis = await self._analyze_table_indexes(table)
                analysis_results[table] = analysis
                logger.info(f"✅ Analyzed indexes for {table}: {len(analysis.existing_indexes)} existing, {len(analysis.missing_indexes)} recommended")
            except Exception as e:
                logger.error(f"❌ Failed to analyze indexes for {table}: {e}")
                analysis_results[table] = IndexAnalysis(
                    table=table,
                    existing_indexes=[],
                    missing_indexes=[],
                    redundant_indexes=[],
                    performance_impact={"error": str(e)}
                )

        return analysis_results

    async def _analyze_table_indexes(self, table: str) -> IndexAnalysis:
        """Analyze indexes for a specific table"""
        async with get_db_context() as session:
            # Get existing indexes
            existing_indexes = await self._get_existing_indexes(session, table)

            # Generate recommendations
            missing_indexes = await self._generate_index_recommendations(table, existing_indexes)

            # Check for redundant indexes
            redundant_indexes = self._identify_redundant_indexes(existing_indexes)

            # Estimate performance impact
            performance_impact = await self._estimate_performance_impact(session, table, missing_indexes)

            return IndexAnalysis(
                table=table,
                existing_indexes=existing_indexes,
                missing_indexes=missing_indexes,
                redundant_indexes=redundant_indexes,
                performance_impact=performance_impact
            )

    async def _get_existing_indexes(self, session: AsyncSession, table: str) -> List[Dict[str, Any]]:
        """Get existing indexes for a table"""
        indexes = []

        try:
            # PostgreSQL system query for indexes
            if "postgresql" in str(session.bind.url):
                query = text("""
                    SELECT
                        schemaname,
                        tablename,
                        indexname,
                        indexdef
                    FROM pg_indexes
                    WHERE tablename = :table_name
                    ORDER BY indexname
                """)

                result = await session.execute(query, {"table_name": table})
                rows = result.fetchall()

                for row in rows:
                    indexes.append({
                        "schema": row[0],
                        "table": row[1],
                        "name": row[2],
                        "definition": row[3],
                        "type": "btree"  # Default, could be enhanced
                    })

            else:
                # SQLite - use SQLAlchemy inspection
                from sqlalchemy import MetaData, Table
                from app.core.database import Base

                # Get table from metadata
                metadata = MetaData()
                table_obj = Table(table, metadata, autoload_with=session.bind)

                for index in table_obj.indexes:
                    indexes.append({
                        "name": index.name,
                        "columns": [col.name for col in index.columns],
                        "unique": index.unique,
                        "type": "btree"
                    })

        except Exception as e:
            logger.warning(f"Error getting existing indexes for {table}: {e}")

        return indexes

    async def _generate_index_recommendations(self, table: str, existing_indexes: List[Dict[str, Any]]) -> List[IndexRecommendation]:
        """Generate index recommendations based on query patterns"""
        recommendations = []

        if table not in self.query_patterns:
            return recommendations

        patterns = self.query_patterns[table]
        existing_index_cols = self._get_existing_index_columns(existing_indexes)

        for pattern in patterns:
            if isinstance(pattern, str):
                # Single column index
                columns = [pattern]
                index_name = f"idx_{table}_{pattern}"
            else:
                # Composite index
                columns = list(pattern)
                index_name = f"idx_{table}_{'_'.join(columns)}"

            # Check if index already exists
            if not self._index_exists(columns, existing_index_cols):
                # Determine priority and reason
                priority, reason = self._determine_index_priority(table, columns)

                recommendation = IndexRecommendation(
                    table=table,
                    columns=columns,
                    index_type=IndexType.BTREE,
                    name=index_name,
                    priority=priority,
                    reason=reason,
                    estimated_impact=self._estimate_index_impact(table, columns),
                    query_patterns=[f"WHERE {' AND '.join([f'{col} = ?' for col in columns])}"]
                )

                recommendations.append(recommendation)

        return recommendations

    def _get_existing_index_columns(self, existing_indexes: List[Dict[str, Any]]) -> Set[Tuple[str, ...]]:
        """Get set of existing index column combinations"""
        existing_cols = set()

        for index in existing_indexes:
            if "columns" in index:
                # Direct column list
                cols = tuple(sorted(index["columns"]))
                existing_cols.add(cols)
            elif "definition" in index:
                # Parse from PostgreSQL definition
                definition = index["definition"]
                # Extract column names from CREATE INDEX statement
                # This is a simplified parser - could be enhanced
                if "(" in definition and ")" in definition:
                    col_part = definition.split("(")[1].split(")")[0]
                    if "," in col_part:
                        cols = [c.strip().split()[0] for c in col_part.split(",")]
                    else:
                        cols = [col_part.strip().split()[0]]
                    existing_cols.add(tuple(sorted(cols)))

        return existing_cols

    def _index_exists(self, columns: List[str], existing_index_cols: Set[Tuple[str, ...]]) -> bool:
        """Check if an index already exists for the given columns"""
        target_cols = tuple(sorted(columns))

        # Check for exact match
        if target_cols in existing_index_cols:
            return True

        # Check for prefix match (composite index covers single column)
        for existing_cols in existing_index_cols:
            if len(existing_cols) > len(target_cols) and existing_cols[:len(target_cols)] == target_cols:
                return True

        return False

    def _determine_index_priority(self, table: str, columns: List[str]) -> Tuple[IndexPriority, str]:
        """Determine index priority and reason"""

        # Critical indexes for core functionality
        if table == "users" and "email" in columns:
            return IndexPriority.CRITICAL, "Required for user authentication and login"
        elif table == "api_keys" and "key_hash" in columns:
            return IndexPriority.CRITICAL, "Required for API authentication"
        elif table == "signals" and ("symbol" in columns or ("symbol", "created_at") == tuple(columns)):
            return IndexPriority.CRITICAL, "Required for real-time signal queries"

        # High priority for performance-critical queries
        elif table in ["orders", "positions"] and "user_id" in columns:
            return IndexPriority.HIGH, "Required for user-specific order/position queries"
        elif table == "market_data" and ("symbol", "timestamp") == tuple(columns):
            return IndexPriority.HIGH, "Required for time-series market data queries"

        # Medium priority for common filtering
        elif "created_at" in columns or "status" in columns:
            return IndexPriority.MEDIUM, "Improves query performance for time/status filtering"

        # Low priority for less common queries
        else:
            return IndexPriority.LOW, "Optional optimization for specific query patterns"

    def _estimate_index_impact(self, table: str, columns: List[str]) -> str:
        """Estimate the performance impact of an index"""
        # Rough estimates based on table size and query patterns
        table_sizes = {
            "users": "small",
            "signals": "large",
            "orders": "medium",
            "positions": "medium",
            "market_data": "very_large",
            "audit_logs": "large",
            "api_keys": "small",
            "notifications": "medium",
            "trade_journal": "medium"
        }

        size = table_sizes.get(table, "medium")

        if size == "very_large" and len(columns) >= 2:
            return "High - Significant improvement for complex queries on large dataset"
        elif size == "large" and "created_at" in columns:
            return "High - Critical for time-based filtering on large tables"
        elif len(columns) == 1:
            return "Medium - Good improvement for single-column filtering"
        else:
            return "Medium - Moderate improvement for composite queries"

    def _identify_redundant_indexes(self, existing_indexes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify potentially redundant indexes"""
        redundant = []

        # Simple redundancy check - could be enhanced
        index_cols = {}
        for index in existing_indexes:
            cols = tuple(sorted(index.get("columns", [])))
            if cols in index_cols:
                # Potential redundancy
                redundant.append({
                    "index": index,
                    "redundant_with": index_cols[cols],
                    "reason": "Duplicate column set"
                })
            else:
                index_cols[cols] = index

        return redundant

    async def _estimate_performance_impact(self, session: AsyncSession, table: str, recommendations: List[IndexRecommendation]) -> Dict[str, Any]:
        """Estimate performance impact of recommended indexes"""
        try:
            # Get table statistics
            if "postgresql" in str(session.bind.url):
                # Get row count
                count_query = text(f"SELECT COUNT(*) as count FROM {table}")
                result = await session.execute(count_query)
                row_count = result.scalar() or 0

                # Get table size
                size_query = text("SELECT pg_total_relation_size(:table) as size_bytes")
                result = await session.execute(size_query, {"table": table})
                size_bytes = result.scalar() or 0

                return {
                    "table_rows": row_count,
                    "table_size_mb": round(size_bytes / (1024 * 1024), 2),
                    "recommended_indexes": len(recommendations),
                    "estimated_benefit": self._calculate_estimated_benefit(row_count, recommendations)
                }
            else:
                return {"database_type": "sqlite", "note": "Performance estimation limited for SQLite"}

        except Exception as e:
            return {"error": f"Failed to estimate performance impact: {e}"}

    def _calculate_estimated_benefit(self, row_count: int, recommendations: List[IndexRecommendation]) -> str:
        """Calculate estimated benefit of indexes"""
        if row_count < 1000:
            return "Low - Table is small, indexes provide minimal benefit"
        elif row_count < 10000:
            return "Medium - Moderate performance improvement expected"
        elif row_count < 100000:
            return f"High - Significant improvement for {len(recommendations)} indexes on medium table"
        else:
            return f"Very High - Critical optimization for {len(recommendations)} indexes on large table"

    async def create_recommended_indexes(self, recommendations: List[IndexRecommendation], dry_run: bool = True) -> Dict[str, Any]:
        """
        Create recommended indexes

        Args:
            recommendations: List of index recommendations
            dry_run: If True, only show what would be created

        Returns:
            Creation results
        """
        results = {
            "created": [],
            "failed": [],
            "skipped": [],
            "dry_run": dry_run
        }

        async with get_db_context() as session:
            for rec in recommendations:
                try:
                    if rec.priority == IndexPriority.CRITICAL or not dry_run:
                        # Create the index
                        await self._create_index(session, rec)
                        results["created"].append({
                            "table": rec.table,
                            "index": rec.name,
                            "columns": rec.columns
                        })
                        logger.info(f"✅ Created index {rec.name} on {rec.table}")
                    else:
                        results["skipped"].append({
                            "table": rec.table,
                            "index": rec.name,
                            "reason": f"Skipped due to dry_run or low priority ({rec.priority.value})"
                        })

                except Exception as e:
                    results["failed"].append({
                        "table": rec.table,
                        "index": rec.name,
                        "error": str(e)
                    })
                    logger.error(f"❌ Failed to create index {rec.name}: {e}")

        return results

    async def _create_index(self, session: AsyncSession, recommendation: IndexRecommendation) -> None:
        """Create a database index"""
        if "postgresql" in str(session.bind.url):
            # PostgreSQL CREATE INDEX
            columns_str = ", ".join(recommendation.columns)
            concurrently = "CONCURRENTLY" if len(recommendation.columns) > 1 else ""  # Avoid blocking for composite indexes

            query = text(f"CREATE INDEX {concurrently} {recommendation.name} ON {recommendation.table} ({columns_str})")
            await session.execute(query)
            await session.commit()

        else:
            # SQLite - use SQLAlchemy
            from app.core.database import Base
            # This would require more complex implementation for SQLite
            logger.warning(f"Index creation not implemented for SQLite: {recommendation.name}")

    async def get_index_maintenance_report(self) -> Dict[str, Any]:
        """Generate index maintenance and optimization report"""
        analysis = await self.analyze_database_indexes()

        report = {
            "generated_at": datetime.utcnow(),
            "tables_analyzed": len(analysis),
            "total_existing_indexes": sum(len(a.existing_indexes) for a in analysis.values()),
            "total_recommended_indexes": sum(len(a.missing_indexes) for a in analysis.values()),
            "total_redundant_indexes": sum(len(a.redundant_indexes) for a in analysis.values()),
            "tables": {}
        }

        for table, analysis_result in analysis.items():
            report["tables"][table] = {
                "existing_indexes": len(analysis_result.existing_indexes),
                "missing_indexes": len(analysis_result.missing_indexes),
                "redundant_indexes": len(analysis_result.redundant_indexes),
                "performance_impact": analysis_result.performance_impact,
                "critical_missing": len([idx for idx in analysis_result.missing_indexes if idx.priority == IndexPriority.CRITICAL]),
                "high_priority_missing": len([idx for idx in analysis_result.missing_indexes if idx.priority == IndexPriority.HIGH])
            }

        return report


# Global indexing service instance
database_indexing_service = DatabaseIndexingService()


# Utility functions
async def analyze_database_indexes() -> Dict[str, IndexAnalysis]:
    """Analyze database indexing strategy"""
    return await database_indexing_service.analyze_database_indexes()


async def create_recommended_indexes(dry_run: bool = True) -> Dict[str, Any]:
    """Create recommended database indexes"""
    analysis = await analyze_database_indexes()

    # Flatten recommendations
    all_recommendations = []
    for analysis_result in analysis.values():
        all_recommendations.extend(analysis_result.missing_indexes)

    return await database_indexing_service.create_recommended_indexes(all_recommendations, dry_run)


async def get_index_maintenance_report() -> Dict[str, Any]:
    """Get comprehensive index maintenance report"""
    return await database_indexing_service.get_index_maintenance_report()


# Export functions
__all__ = [
    "DatabaseIndexingService",
    "IndexType",
    "IndexPriority",
    "IndexRecommendation",
    "IndexAnalysis",
    "database_indexing_service",
    "analyze_database_indexes",
    "create_recommended_indexes",
    "get_index_maintenance_report"
]
