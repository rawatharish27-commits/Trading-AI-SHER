"""
Data Retention Service
Automated cleanup of old data based on retention policies
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_context


class RetentionPolicy(Enum):
    """Data retention policy types"""
    DELETE = "delete"  # Delete old records
    ARCHIVE = "archive"  # Move to archive table
    ANONYMIZE = "anonymize"  # Anonymize sensitive data


@dataclass
class RetentionRule:
    """Data retention rule"""
    table: str
    column: str  # Date column to check
    retention_days: int
    policy: RetentionPolicy
    batch_size: int = 1000
    enabled: bool = True


class DataRetentionService:
    """
    Service for managing data retention and cleanup
    """

    def __init__(self):
        # Default retention rules - SEBI compliant
        self.retention_rules = [
            # Signals - keep for 2 years
            RetentionRule(
                table="signals",
                column="created_at",
                retention_days=730,
                policy=RetentionPolicy.DELETE,
                batch_size=500
            ),

            # Audit logs - keep for 7 years (SEBI requirement)
            RetentionRule(
                table="audit_logs",
                column="created_at",
                retention_days=2555,
                policy=RetentionPolicy.DELETE,
                batch_size=1000
            ),

            # Orders - keep for 5 years
            RetentionRule(
                table="orders",
                column="created_at",
                retention_days=1825,
                policy=RetentionPolicy.DELETE,
                batch_size=500
            ),

            # Positions - keep for 2 years
            RetentionRule(
                table="positions",
                column="created_at",
                retention_days=730,
                policy=RetentionPolicy.DELETE,
                batch_size=500
            ),

            # Market data - keep for 1 year
            RetentionRule(
                table="market_data",
                column="timestamp",
                retention_days=365,
                policy=RetentionPolicy.DELETE,
                batch_size=5000
            ),

            # User notifications - keep for 90 days
            RetentionRule(
                table="notifications",
                column="created_at",
                retention_days=90,
                policy=RetentionPolicy.DELETE,
                batch_size=1000
            ),

            # Trade journal - keep for 7 years but anonymize old data
            RetentionRule(
                table="trade_journal",
                column="entry_date",
                retention_days=2555,
                policy=RetentionPolicy.ANONYMIZE,
                batch_size=500
            ),
        ]

    async def apply_retention_policies(self) -> Dict[str, Any]:
        """
        Apply all retention policies

        Returns:
            Cleanup results
        """
        results = {
            "start_time": datetime.utcnow(),
            "rules_processed": 0,
            "total_records_deleted": 0,
            "total_records_archived": 0,
            "total_records_anonymized": 0,
            "errors": [],
            "rule_results": []
        }

        logger.info("🧹 Starting data retention cleanup...")

        for rule in self.retention_rules:
            if not rule.enabled:
                continue

            try:
                rule_result = await self._apply_rule(rule)
                results["rule_results"].append(rule_result)
                results["rules_processed"] += 1

                # Update totals
                results["total_records_deleted"] += rule_result.get("deleted", 0)
                results["total_records_archived"] += rule_result.get("archived", 0)
                results["total_records_anonymized"] += rule_result.get("anonymized", 0)

            except Exception as e:
                error_msg = f"Failed to apply rule for {rule.table}: {e}"
                logger.error(error_msg)
                results["errors"].append(error_msg)

        results["end_time"] = datetime.utcnow()
        results["duration_seconds"] = (results["end_time"] - results["start_time"]).total_seconds()

        logger.info(f"✅ Data retention cleanup completed: {results['total_records_deleted']} deleted, {results['total_records_archived']} archived, {results['total_records_anonymized']} anonymized")

        return results

    async def _apply_rule(self, rule: RetentionRule) -> Dict[str, Any]:
        """Apply a single retention rule"""
        cutoff_date = datetime.utcnow() - timedelta(days=rule.retention_days)

        result = {
            "table": rule.table,
            "policy": rule.policy.value,
            "cutoff_date": cutoff_date.isoformat(),
            "batch_size": rule.batch_size,
            "deleted": 0,
            "archived": 0,
            "anonymized": 0,
            "errors": []
        }

        logger.info(f"Applying {rule.policy.value} policy to {rule.table} (older than {rule.retention_days} days)")

        async with get_db_context() as session:
            if rule.policy == RetentionPolicy.DELETE:
                result["deleted"] = await self._delete_old_records(session, rule, cutoff_date)
            elif rule.policy == RetentionPolicy.ARCHIVE:
                result["archived"] = await self._archive_old_records(session, rule, cutoff_date)
            elif rule.policy == RetentionPolicy.ANONYMIZE:
                result["anonymized"] = await self._anonymize_old_records(session, rule, cutoff_date)

        return result

    async def _delete_old_records(self, session: AsyncSession, rule: RetentionRule, cutoff_date: datetime) -> int:
        """Delete old records in batches"""
        total_deleted = 0

        while True:
            # Delete in batches to avoid long-running transactions
            query = f"""
                DELETE FROM {rule.table}
                WHERE {rule.column} < :cutoff_date
                LIMIT {rule.batch_size}
            """

            try:
                result = await session.execute(
                    text(query),
                    {"cutoff_date": cutoff_date}
                )
                deleted_count = result.rowcount

                if deleted_count == 0:
                    break

                total_deleted += deleted_count
                await session.commit()

                logger.info(f"Deleted {deleted_count} records from {rule.table}")

                # Small delay to prevent overwhelming the database
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error deleting from {rule.table}: {e}")
                await session.rollback()
                break

        return total_deleted

    async def _archive_old_records(self, session: AsyncSession, rule: RetentionRule, cutoff_date: datetime) -> int:
        """Move old records to archive table"""
        archive_table = f"{rule.table}_archive"
        total_archived = 0

        # Ensure archive table exists
        await self._ensure_archive_table_exists(session, rule.table, archive_table)

        while True:
            # Move records to archive in batches
            query = f"""
                INSERT INTO {archive_table}
                SELECT * FROM {rule.table}
                WHERE {rule.column} < :cutoff_date
                LIMIT {rule.batch_size}
            """

            try:
                # Insert into archive
                result = await session.execute(
                    text(query),
                    {"cutoff_date": cutoff_date}
                )
                archived_count = result.rowcount

                if archived_count == 0:
                    break

                # Delete from original table
                delete_query = f"""
                    DELETE FROM {rule.table}
                    WHERE {rule.column} < :cutoff_date
                    LIMIT {rule.batch_size}
                """

                await session.execute(
                    text(delete_query),
                    {"cutoff_date": cutoff_date}
                )

                total_archived += archived_count
                await session.commit()

                logger.info(f"Archived {archived_count} records from {rule.table}")

                # Small delay
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error archiving from {rule.table}: {e}")
                await session.rollback()
                break

        return total_archived

    async def _anonymize_old_records(self, session: AsyncSession, rule: RetentionRule, cutoff_date: datetime) -> int:
        """Anonymize sensitive data in old records"""
        total_anonymized = 0

        # Define anonymization rules per table
        anonymization_rules = {
            "trade_journal": {
                "notes": "'[REDACTED]'",
                "profit_loss": "NULL",  # Remove P&L data
            }
        }

        if rule.table not in anonymization_rules:
            logger.warning(f"No anonymization rules defined for {rule.table}")
            return 0

        rules = anonymization_rules[rule.table]
        set_clause = ", ".join([f"{col} = {value}" for col, value in rules.items()])

        while True:
            query = f"""
                UPDATE {rule.table}
                SET {set_clause}
                WHERE {rule.column} < :cutoff_date
                LIMIT {rule.batch_size}
            """

            try:
                result = await session.execute(
                    text(query),
                    {"cutoff_date": cutoff_date}
                )
                anonymized_count = result.rowcount

                if anonymized_count == 0:
                    break

                total_anonymized += anonymized_count
                await session.commit()

                logger.info(f"Anonymized {anonymized_count} records in {rule.table}")

                # Small delay
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error anonymizing {rule.table}: {e}")
                await session.rollback()
                break

        return total_anonymized

    async def _ensure_archive_table_exists(self, session: AsyncSession, source_table: str, archive_table: str) -> None:
        """Ensure archive table exists with same structure"""
        try:
            # Check if archive table exists
            result = await session.execute(
                text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :table_name)"),
                {"table_name": archive_table}
            )
            exists = result.fetchone()[0]

            if not exists:
                # Create archive table with same structure
                await session.execute(
                    text(f"CREATE TABLE {archive_table} AS SELECT * FROM {source_table} WHERE 1=0")
                )

                # Add archive metadata columns
                await session.execute(
                    text(f"ALTER TABLE {archive_table} ADD COLUMN archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
                )
                await session.execute(
                    text(f"ALTER TABLE {archive_table} ADD COLUMN archive_reason VARCHAR(255) DEFAULT 'retention_policy'")
                )

                await session.commit()
                logger.info(f"Created archive table: {archive_table}")

        except Exception as e:
            logger.error(f"Error creating archive table {archive_table}: {e}")
            await session.rollback()

    async def get_retention_status(self) -> Dict[str, Any]:
        """Get current data retention status"""
        status = {
            "rules": [],
            "oldest_records": {},
            "total_records": {}
        }

        async with get_db_context() as session:
            for rule in self.retention_rules:
                try:
                    # Get oldest record
                    oldest_query = f"SELECT MIN({rule.column}) as oldest FROM {rule.table}"
                    result = await session.execute(text(oldest_query))
                    oldest = result.fetchone()[0]

                    # Get total count
                    count_query = f"SELECT COUNT(*) as total FROM {rule.table}"
                    result = await session.execute(text(count_query))
                    total = result.fetchone()[0]

                    # Calculate days old
                    days_old = None
                    if oldest:
                        days_old = (datetime.utcnow() - oldest).days

                    status["rules"].append({
                        "table": rule.table,
                        "retention_days": rule.retention_days,
                        "policy": rule.policy.value,
                        "oldest_record": oldest.isoformat() if oldest else None,
                        "days_old": days_old,
                        "total_records": total,
                        "needs_cleanup": days_old and days_old > rule.retention_days
                    })

                except Exception as e:
                    logger.warning(f"Error getting status for {rule.table}: {e}")
                    status["rules"].append({
                        "table": rule.table,
                        "error": str(e)
                    })

        return status

    def add_retention_rule(self, rule: RetentionRule) -> None:
        """Add a new retention rule"""
        self.retention_rules.append(rule)
        logger.info(f"Added retention rule for {rule.table}")

    def update_retention_rule(self, table: str, **updates) -> bool:
        """Update an existing retention rule"""
        for rule in self.retention_rules:
            if rule.table == table:
                for key, value in updates.items():
                    if hasattr(rule, key):
                        setattr(rule, key, value)
                logger.info(f"Updated retention rule for {table}")
                return True
        return False


# Global retention service instance
data_retention_service = DataRetentionService()


# Utility functions
async def run_data_retention_cleanup() -> Dict[str, Any]:
    """Run automated data retention cleanup"""
    return await data_retention_service.apply_retention_policies()


async def get_data_retention_status() -> Dict[str, Any]:
    """Get data retention status"""
    return await data_retention_service.get_retention_status()


# Export functions
__all__ = [
    "DataRetentionService",
    "RetentionPolicy",
    "RetentionRule",
    "data_retention_service",
    "run_data_retention_cleanup",
    "get_data_retention_status"
]
