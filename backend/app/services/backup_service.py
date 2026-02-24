"""
Database Backup Service with Encryption
Production-grade backup and restore functionality
"""

import os
import json
import gzip
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_context, engine
from app.core.config import settings
from app.core.security import data_encryption


class BackupEncryption:
    """
    Backup encryption utilities using Fernet symmetric encryption
    """

    def __init__(self, key: Optional[bytes] = None):
        """
        Initialize with encryption key

        Args:
            key: Optional encryption key, generates new if None
        """
        if key:
            self.key = key
        else:
            # Get or generate encryption key
            key_env = os.getenv("BACKUP_ENCRYPTION_KEY")
            if key_env:
                # Derive key using PBKDF2 for better security
                salt = b"sher_backup_salt_2024"
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                self.key = base64.urlsafe_b64encode(kdf.derive(key_env.encode()))
            else:
                # Generate new key (development only)
                logger.warning("BACKUP_ENCRYPTION_KEY not set, using generated key")
                self.key = Fernet.generate_key()

        self.cipher = Fernet(self.key)

    def encrypt_data(self, data: bytes) -> bytes:
        """Encrypt binary data"""
        return self.cipher.encrypt(data)

    def decrypt_data(self, encrypted_data: bytes) -> bytes:
        """Decrypt binary data"""
        try:
            return self.cipher.decrypt(encrypted_data)
        except InvalidToken:
            raise ValueError("Invalid encryption key or corrupted data")

    def encrypt_file(self, input_path: Path, output_path: Path) -> None:
        """Encrypt a file"""
        with open(input_path, 'rb') as f:
            data = f.read()

        encrypted_data = self.encrypt_data(data)

        with open(output_path, 'wb') as f:
            f.write(encrypted_data)

    def decrypt_file(self, input_path: Path, output_path: Path) -> None:
        """Decrypt a file"""
        with open(input_path, 'rb') as f:
            encrypted_data = f.read()

        decrypted_data = self.decrypt_data(encrypted_data)

        with open(output_path, 'wb') as f:
            f.write(decrypted_data)


class DatabaseBackupService:
    """
    Comprehensive database backup service with encryption
    """

    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)

        # Initialize encryption
        self.encryption = BackupEncryption()

        # Tables to backup
        self.backup_tables = [
            'users', 'portfolios', 'signals', 'orders',
            'positions', 'audit_logs', 'api_keys', 'tenants'
        ]

    async def create_backup(self, backup_name: Optional[str] = None) -> str:
        """
        Create encrypted database backup

        Args:
            backup_name: Optional custom backup name

        Returns:
            Backup file path
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_name = backup_name or f"backup_{timestamp}"
        backup_file = self.backup_dir / f"{backup_name}.json.gz.enc"

        logger.info(f"Starting database backup: {backup_name}")

        try:
            # Export data from all tables
            backup_data = await self._export_database_data()

            # Convert to JSON
            json_data = json.dumps(backup_data, default=str, indent=2)
            json_bytes = json_data.encode('utf-8')

            # Compress
            compressed_data = gzip.compress(json_bytes)

            # Encrypt
            encrypted_data = self.encryption.encrypt_data(compressed_data)

            # Write to file
            with open(backup_file, 'wb') as f:
                f.write(encrypted_data)

            # Create metadata file
            metadata = {
                "backup_name": backup_name,
                "timestamp": datetime.utcnow().isoformat(),
                "tables": list(backup_data.keys()),
                "record_counts": {table: len(records) for table, records in backup_data.items()},
                "file_size": backup_file.stat().st_size,
                "encrypted": True,
                "compressed": True
            }

            metadata_file = self.backup_dir / f"{backup_name}.meta.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"✅ Backup completed: {backup_file} ({len(backup_data)} tables, {sum(len(records) for records in backup_data.values())} records)")

            return str(backup_file)

        except Exception as e:
            logger.error(f"❌ Backup failed: {e}")
            # Clean up partial backup
            if backup_file.exists():
                backup_file.unlink()
            raise

    async def restore_backup(self, backup_file: str, confirm_destructive: bool = False) -> bool:
        """
        Restore database from encrypted backup

        Args:
            backup_file: Path to backup file
            confirm_destructive: Must be True to allow destructive restore

        Returns:
            Success status
        """
        if not confirm_destructive:
            raise ValueError("Destructive restore requires confirm_destructive=True")

        backup_path = Path(backup_file)
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_file}")

        logger.info(f"Starting database restore from: {backup_file}")

        try:
            # Read and decrypt backup
            with open(backup_path, 'rb') as f:
                encrypted_data = f.read()

            decrypted_data = self.encryption.decrypt_data(encrypted_data)
            decompressed_data = gzip.decompress(decrypted_data)
            backup_data = json.loads(decompressed_data.decode('utf-8'))

            # Restore data to database
            await self._import_database_data(backup_data)

            logger.info(f"✅ Restore completed successfully")
            return True

        except Exception as e:
            logger.error(f"❌ Restore failed: {e}")
            raise

    async def _export_database_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Export all data from backup tables"""
        backup_data = {}

        async with get_db_context() as session:
            for table in self.backup_tables:
                try:
                # Get all records from table
                    # Note: Table names cannot be parameterized in SQLAlchemy
                    # Using whitelist validation instead
                    from app.utils.sql_injection_protection import validate_table_name
                    if not validate_table_name(table):
                        raise ValueError(f"Invalid table name: {table}")

                    result = await session.execute(text(f"SELECT * FROM {table}"))
                    records = result.fetchall()

                    # Convert to dicts
                    column_names = result.keys()
                    table_data = []
                    for record in records:
                        record_dict = dict(zip(column_names, record))
                        table_data.append(record_dict)

                    backup_data[table] = table_data
                    logger.info(f"Exported {len(table_data)} records from {table}")

                except Exception as e:
                    logger.warning(f"Failed to export table {table}: {e}")
                    backup_data[table] = []

        return backup_data

    async def _import_database_data(self, backup_data: Dict[str, List[Dict[str, Any]]]) -> None:
        """Import data to database tables"""
        async with get_db_context() as session:
            for table, records in backup_data.items():
                if not records:
                    continue

                try:
                    # Clear existing data (destructive restore)
                    await session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
                    await session.commit()

                    # Insert records in batches
                    batch_size = 1000
                    for i in range(0, len(records), batch_size):
                        batch = records[i:i + batch_size]

                        # Build INSERT statement
                        if batch:
                            columns = list(batch[0].keys())
                            placeholders = ', '.join([f":{col}" for col in columns])
                            column_names = ', '.join(columns)

                            insert_sql = f"INSERT INTO {table} ({column_names}) VALUES ({placeholders})"

                            # Handle conflicts
                            if table == 'users':
                                insert_sql += " ON CONFLICT (email) DO UPDATE SET updated_at = EXCLUDED.updated_at"
                            elif table in ['signals', 'orders', 'positions']:
                                insert_sql += " ON CONFLICT DO NOTHING"

                            await session.execute(text(insert_sql), batch)

                    await session.commit()
                    logger.info(f"Imported {len(records)} records to {table}")

                except Exception as e:
                    logger.error(f"Failed to import table {table}: {e}")
                    await session.rollback()
                    raise

    async def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups with metadata"""
        backups = []

        for meta_file in self.backup_dir.glob("*.meta.json"):
            try:
                with open(meta_file, 'r') as f:
                    metadata = json.load(f)

                # Check if backup file exists
                backup_name = metadata.get("backup_name")
                backup_file = self.backup_dir / f"{backup_name}.json.gz.enc"
                metadata["file_exists"] = backup_file.exists()
                metadata["file_size_mb"] = backup_file.stat().st_size / (1024 * 1024) if backup_file.exists() else 0

                backups.append(metadata)

            except Exception as e:
                logger.warning(f"Failed to read metadata {meta_file}: {e}")

        # Sort by timestamp (newest first)
        backups.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        return backups

    async def delete_backup(self, backup_name: str) -> bool:
        """Delete a backup and its metadata"""
        try:
            backup_file = self.backup_dir / f"{backup_name}.json.gz.enc"
            meta_file = self.backup_dir / f"{backup_name}.meta.json"

            deleted = False
            if backup_file.exists():
                backup_file.unlink()
                deleted = True

            if meta_file.exists():
                meta_file.unlink()
                deleted = True

            if deleted:
                logger.info(f"Deleted backup: {backup_name}")

            return deleted

        except Exception as e:
            logger.error(f"Failed to delete backup {backup_name}: {e}")
            return False

    async def cleanup_old_backups(self, keep_days: int = 30) -> int:
        """
        Clean up backups older than specified days

        Returns:
            Number of backups deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=keep_days)
        deleted_count = 0

        backups = await self.list_backups()

        for backup in backups:
            try:
                backup_date = datetime.fromisoformat(backup["timestamp"])
                if backup_date < cutoff_date:
                    await self.delete_backup(backup["backup_name"])
                    deleted_count += 1

            except Exception as e:
                logger.warning(f"Failed to process backup {backup.get('backup_name')}: {e}")

        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old backups")

        return deleted_count

    async def verify_backup(self, backup_file: str) -> Dict[str, Any]:
        """
        Verify backup integrity

        Returns:
            Verification results
        """
        try:
            backup_path = Path(backup_file)

            # Read and decrypt backup
            with open(backup_path, 'rb') as f:
                encrypted_data = f.read()

            decrypted_data = self.encryption.decrypt_data(encrypted_data)
            decompressed_data = gzip.decompress(decrypted_data)
            backup_data = json.loads(decompressed_data.decode('utf-8'))

            # Verify structure
            verification = {
                "valid": True,
                "tables_found": list(backup_data.keys()),
                "total_records": sum(len(records) for records in backup_data.values()),
                "table_counts": {table: len(records) for table, records in backup_data.items()},
                "errors": []
            }

            # Check expected tables
            missing_tables = set(self.backup_tables) - set(backup_data.keys())
            if missing_tables:
                verification["errors"].append(f"Missing tables: {missing_tables}")

            # Validate record structure (basic check)
            for table, records in backup_data.items():
                if not isinstance(records, list):
                    verification["errors"].append(f"Table {table} is not a list")
                    continue

                if records and not isinstance(records[0], dict):
                    verification["errors"].append(f"Table {table} records are not dictionaries")

            if verification["errors"]:
                verification["valid"] = False

            return verification

        except Exception as e:
            return {
                "valid": False,
                "error": str(e),
                "tables_found": [],
                "total_records": 0,
                "errors": [str(e)]
            }

    async def rotate_encryption_key(self, new_key: Optional[str] = None) -> bool:
        """
        Rotate encryption key for backups

        Args:
            new_key: New encryption key, generates if None

        Returns:
            Success status
        """
        try:
            # Generate new key
            if new_key:
                salt = b"sher_backup_salt_2024"
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                new_key_bytes = base64.urlsafe_b64encode(kdf.derive(new_key.encode()))
            else:
                new_key_bytes = Fernet.generate_key()

            # Create new encryption instance
            new_encryption = BackupEncryption(new_key_bytes)

            # Re-encrypt all existing backups
            backups = await self.list_backups()
            re_encrypted = 0

            for backup in backups:
                if not backup.get("file_exists", False):
                    continue

                backup_name = backup["backup_name"]
                backup_file = self.backup_dir / f"{backup_name}.json.gz.enc"

                try:
                    # Decrypt with old key
                    with open(backup_file, 'rb') as f:
                        encrypted_data = f.read()

                    decrypted_data = self.encryption.decrypt_data(encrypted_data)

                    # Re-encrypt with new key
                    new_encrypted_data = new_encryption.encrypt_data(decrypted_data)

                    # Write back
                    with open(backup_file, 'wb') as f:
                        f.write(new_encrypted_data)

                    re_encrypted += 1
                    logger.info(f"Re-encrypted backup: {backup_name}")

                except Exception as e:
                    logger.error(f"Failed to re-encrypt {backup_name}: {e}")

            # Update encryption instance
            self.encryption = new_encryption

            # Store new key securely (in environment or key management system)
            if new_key:
                logger.info("Encryption key rotated successfully")
            else:
                logger.warning("Encryption key rotated with generated key - set BACKUP_ENCRYPTION_KEY env var")

            logger.info(f"Re-encrypted {re_encrypted} backups with new key")
            return True

        except Exception as e:
            logger.error(f"Key rotation failed: {e}")
            return False


# Global backup service instance
backup_service = DatabaseBackupService()


# Utility functions for backup operations
async def create_automated_backup() -> str:
    """Create automated daily backup"""
    backup_name = f"auto_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    return await backup_service.create_backup(backup_name)


async def schedule_backup_cleanup() -> None:
    """Clean up old backups (keep last 30 days)"""
    await backup_service.cleanup_old_backups(keep_days=30)


# Export functions
__all__ = [
    "DatabaseBackupService",
    "BackupEncryption",
    "backup_service",
    "create_automated_backup",
    "schedule_backup_cleanup"
]
