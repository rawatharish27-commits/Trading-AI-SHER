"""
GDPR Compliance Utilities
Data protection, anonymization, and privacy compliance features
"""

import hashlib
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass
from cryptography.fernet import Fernet

from loguru import logger


@dataclass
class DataRetentionPolicy:
    """Data retention policy configuration"""
    data_type: str
    retention_period_days: int
    legal_basis: str
    purpose: str
    auto_delete: bool = True


@dataclass
class PrivacyImpactAssessment:
    """Privacy Impact Assessment result"""
    assessment_id: str
    data_types: List[str]
    processing_purposes: List[str]
    risk_level: str
    mitigation_measures: List[str]
    assessment_date: datetime
    next_review_date: datetime


class DataAnonymizer:
    """
    Data anonymization utilities for GDPR compliance
    """

    def __init__(self, salt: Optional[str] = None):
        self.salt = salt or "sher_gdpr_salt_2024"
        self.encryption_key = self._derive_key()

    def _derive_key(self) -> bytes:
        """Derive encryption key from salt"""
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        import base64

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt.encode(),
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(self.salt.encode()))

    def hash_personal_data(self, data: str) -> str:
        """Create irreversible hash of personal data"""
        if not data or not isinstance(data, str):
            return ""

        # Create salted hash
        salted_data = f"{self.salt}:{data}"
        return hashlib.sha256(salted_data.encode()).hexdigest()

    def pseudonymize_email(self, email: str) -> str:
        """Pseudonymize email address"""
        if not email or "@" not in email:
            return self.hash_personal_data(str(email))

        # Keep domain but hash username
        username, domain = email.split("@", 1)
        hashed_username = self.hash_personal_data(username)
        return f"{hashed_username[:8]}@{domain}"

    def pseudonymize_phone(self, phone: str) -> str:
        """Pseudonymize phone number"""
        if not phone:
            return ""

        # Keep last 4 digits, hash the rest
        phone_clean = re.sub(r'\D', '', phone)
        if len(phone_clean) <= 4:
            return self.hash_personal_data(phone)

        last_four = phone_clean[-4:]
        prefix_hash = self.hash_personal_data(phone_clean[:-4])
        return f"{prefix_hash[:6]}****{last_four}"

    def anonymize_ip_address(self, ip: str) -> str:
        """Anonymize IP address by masking last octet"""
        if not ip or ":" in ip:  # IPv6
            return self.hash_personal_data(ip)

        parts = ip.split(".")
        if len(parts) == 4:
            # IPv4: mask last octet
            return f"{parts[0]}.{parts[1]}.{parts[2]}.0"
        else:
            return self.hash_personal_data(ip)

    def tokenize_sensitive_data(self, data: str, token_prefix: str = "TOK") -> str:
        """Create token for sensitive data"""
        if not data:
            return ""

        token = self.hash_personal_data(data)
        return f"{token_prefix}_{token[:16]}"

    def anonymize_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Anonymize user data for GDPR compliance

        Args:
            user_data: Dictionary containing user information

        Returns:
            Anonymized user data
        """
        anonymized = user_data.copy()

        # Fields that need anonymization
        sensitive_fields = {
            'email': self.pseudonymize_email,
            'phone': self.pseudonymize_phone,
            'mobile': self.pseudonymize_phone,
            'first_name': lambda x: self.hash_personal_data(x)[:8] if x else "",
            'last_name': lambda x: self.hash_personal_data(x)[:8] if x else "",
            'full_name': lambda x: self.hash_personal_data(x)[:16] if x else "",
            'address': self.tokenize_sensitive_data,
            'city': self.tokenize_sensitive_data,
            'state': self.tokenize_sensitive_data,
            'postal_code': self.tokenize_sensitive_data,
            'ip_address': self.anonymize_ip_address,
            'user_agent': self.hash_personal_data,
        }

        for field, anonymizer in sensitive_fields.items():
            if field in anonymized and anonymized[field]:
                try:
                    anonymized[field] = anonymizer(anonymized[field])
                except Exception as e:
                    logger.warning(f"Failed to anonymize field {field}: {e}")
                    anonymized[field] = self.hash_personal_data(str(anonymized[field]))

        return anonymized


class GDPRComplianceManager:
    """
    GDPR Compliance Manager
    Handles data protection, consent, and privacy rights
    """

    def __init__(self):
        self.anonymizer = DataAnonymizer()
        self.retention_policies = self._load_retention_policies()

    def _load_retention_policies(self) -> Dict[str, DataRetentionPolicy]:
        """Load data retention policies"""
        return {
            'user_personal_data': DataRetentionPolicy(
                data_type='user_personal_data',
                retention_period_days=2555,  # 7 years
                legal_basis='GDPR Article 6(1)(f) - Legitimate Interest',
                purpose='User account management and service provision'
            ),
            'trading_history': DataRetentionPolicy(
                data_type='trading_history',
                retention_period_days=2555,  # 7 years
                legal_basis='GDPR Article 6(1)(c) - Legal Obligation',
                purpose='Regulatory compliance and audit trail'
            ),
            'audit_logs': DataRetentionPolicy(
                data_type='audit_logs',
                retention_period_days=2555,  # 7 years
                legal_basis='GDPR Article 6(1)(c) - Legal Obligation',
                purpose='Security and compliance monitoring'
            ),
            'session_data': DataRetentionPolicy(
                data_type='session_data',
                retention_period_days=30,  # 30 days
                legal_basis='GDPR Article 6(1)(f) - Legitimate Interest',
                purpose='Session management and security'
            ),
            'marketing_data': DataRetentionPolicy(
                data_type='marketing_data',
                retention_period_days=730,  # 2 years
                legal_basis='GDPR Article 6(1)(a) - Consent',
                purpose='Marketing communications'
            ),
        }

    def get_retention_policy(self, data_type: str) -> Optional[DataRetentionPolicy]:
        """Get retention policy for data type"""
        return self.retention_policies.get(data_type)

    def calculate_retention_date(self, data_type: str, created_date: Optional[datetime] = None) -> Optional[datetime]:
        """Calculate retention expiration date"""
        policy = self.get_retention_policy(data_type)
        if not policy:
            return None

        base_date = created_date or datetime.utcnow()
        return base_date + timedelta(days=policy.retention_period_days)

    def should_retain_data(self, data_type: str, created_date: datetime) -> bool:
        """Check if data should be retained based on policy"""
        retention_date = self.calculate_retention_date(data_type, created_date)
        if not retention_date:
            return True  # No policy means retain indefinitely

        return datetime.utcnow() < retention_date

    def anonymize_data_for_processing(self, data: Dict[str, Any], purpose: str) -> Dict[str, Any]:
        """
        Anonymize data based on processing purpose

        Args:
            data: Data to anonymize
            purpose: Processing purpose (marketing, analytics, etc.)

        Returns:
            Anonymized data
        """
        if purpose in ['marketing', 'analytics']:
            # Full anonymization for marketing/analytics
            return self.anonymizer.anonymize_user_data(data)
        elif purpose in ['security', 'audit']:
            # Partial anonymization for security/audit
            anonymized = data.copy()
            # Keep some identifiers but anonymize sensitive data
            sensitive_fields = ['email', 'phone', 'address', 'full_name']
            for field in sensitive_fields:
                if field in anonymized:
                    anonymized[field] = self.anonymizer.tokenize_sensitive_data(str(anonymized[field]))
            return anonymized
        else:
            # Minimal anonymization for operational purposes
            return data

    def check_data_portability_request(self, user_id: int) -> Dict[str, Any]:
        """
        Prepare user data for data portability request

        Returns:
            Structured user data export
        """
        # This would query all user data from database
        # For now, return structure
        return {
            'user_id': user_id,
            'export_date': datetime.utcnow().isoformat(),
            'data_categories': [
                'personal_information',
                'trading_history',
                'account_settings',
                'communication_history'
            ],
            'format': 'JSON',
            'anonymized': False
        }

    def process_data_deletion_request(self, user_id: int, data_types: List[str]) -> Dict[str, Any]:
        """
        Process GDPR right to erasure (right to be forgotten)

        Args:
            user_id: User ID
            data_types: Types of data to delete

        Returns:
            Deletion processing result
        """
        deletion_result = {
            'user_id': user_id,
            'request_date': datetime.utcnow().isoformat(),
            'data_types_requested': data_types,
            'deletion_status': {},
            'legal_basis': 'GDPR Article 17 - Right to Erasure'
        }

        for data_type in data_types:
            try:
                # Check if deletion is allowed
                if data_type in ['audit_logs', 'trading_history']:
                    # These may need to be retained for legal reasons
                    deletion_result['deletion_status'][data_type] = {
                        'status': 'retained',
                        'reason': 'Legal obligation for regulatory compliance',
                        'gdpr_article': 'GDPR Article 17(3)(b)'
                    }
                else:
                    # Can be deleted
                    deletion_result['deletion_status'][data_type] = {
                        'status': 'scheduled_for_deletion',
                        'deletion_date': (datetime.utcnow() + timedelta(days=30)).isoformat(),
                        'reason': 'User consent withdrawal'
                    }
            except Exception as e:
                deletion_result['deletion_status'][data_type] = {
                    'status': 'error',
                    'error': str(e)
                }

        return deletion_result

    def perform_privacy_impact_assessment(
        self,
        system_component: str,
        data_types: List[str],
        processing_purposes: List[str]
    ) -> PrivacyImpactAssessment:
        """
        Perform Privacy Impact Assessment

        Args:
            system_component: System component being assessed
            data_types: Types of personal data processed
            processing_purposes: Purposes of processing

        Returns:
            PIA assessment result
        """
        # Risk assessment logic
        high_risk_indicators = [
            'special_category_data' in data_types,
            'large_scale_processing' in processing_purposes,
            'vulnerable_individuals' in data_types,
            'automated_decision_making' in processing_purposes,
            len(data_types) > 5,
            'international_data_transfers' in processing_purposes
        ]

        risk_score = sum(high_risk_indicators)

        if risk_score >= 3:
            risk_level = "high"
        elif risk_score >= 1:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Mitigation measures based on risk level
        mitigation_measures = []
        if risk_level == "high":
            mitigation_measures = [
                "Data Protection Impact Assessment (DPIA) required",
                "Data Protection Officer consultation",
                "Privacy by design implementation",
                "Regular privacy audits",
                "User consent management",
                "Data minimization measures"
            ]
        elif risk_level == "medium":
            mitigation_measures = [
                "Privacy impact assessment documentation",
                "Data processing records maintenance",
                "User rights implementation",
                "Security measures validation"
            ]
        else:
            mitigation_measures = [
                "Basic privacy measures",
                "Data processing transparency"
            ]

        assessment = PrivacyImpactAssessment(
            assessment_id=f"pia_{system_component}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            data_types=data_types,
            processing_purposes=processing_purposes,
            risk_level=risk_level,
            mitigation_measures=mitigation_measures,
            assessment_date=datetime.utcnow(),
            next_review_date=datetime.utcnow() + timedelta(days=365)
        )

        logger.info(f"Completed PIA for {system_component}: Risk level {risk_level}")
        return assessment

    def check_consent_validity(self, user_id: int, consent_type: str) -> Dict[str, Any]:
        """
        Check if user consent is valid

        Args:
            user_id: User ID
            consent_type: Type of consent (marketing, data_processing, etc.)

        Returns:
            Consent validity status
        """
        # This would check consent records in database
        return {
            'user_id': user_id,
            'consent_type': consent_type,
            'is_valid': True,  # Assume valid for now
            'granted_date': datetime.utcnow().isoformat(),
            'expires_date': (datetime.utcnow() + timedelta(days=365)).isoformat(),
            'withdrawal_rights': 'User can withdraw consent at any time'
        }

    def log_data_processing_activity(
        self,
        user_id: Optional[int],
        activity_type: str,
        data_categories: List[str],
        legal_basis: str,
        purpose: str
    ) -> None:
        """
        Log data processing activity for GDPR Article 30 compliance

        Args:
            user_id: User ID (None for system activities)
            activity_type: Type of processing activity
            data_categories: Categories of personal data
            legal_basis: Legal basis for processing
            purpose: Purpose of processing
        """
        activity_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'activity_type': activity_type,
            'data_categories': data_categories,
            'legal_basis': legal_basis,
            'purpose': purpose,
            'gdpr_article': 'GDPR Article 30',
            'compliance_type': 'data_processing_record'
        }

        logger.bind(gdpr=True).info(f"Data processing activity: {activity_type}", extra=activity_record)


# Global GDPR compliance instance
gdpr_manager = GDPRComplianceManager()
data_anonymizer = DataAnonymizer()


# Utility functions
def anonymize_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Anonymize user data"""
    return data_anonymizer.anonymize_user_data(user_data)


def check_data_retention(data_type: str, created_date: datetime) -> bool:
    """Check if data should be retained"""
    return gdpr_manager.should_retain_data(data_type, created_date)


def perform_privacy_assessment(system_component: str, data_types: List[str], purposes: List[str]) -> PrivacyImpactAssessment:
    """Perform privacy impact assessment"""
    return gdpr_manager.perform_privacy_impact_assessment(system_component, data_types, purposes)


def log_gdpr_activity(user_id: Optional[int], activity: str, data_categories: List[str], legal_basis: str, purpose: str) -> None:
    """Log GDPR-compliant data processing activity"""
    gdpr_manager.log_data_processing_activity(user_id, activity, data_categories, legal_basis, purpose)


# Export functions
__all__ = [
    "DataAnonymizer",
    "GDPRComplianceManager",
    "DataRetentionPolicy",
    "PrivacyImpactAssessment",
    "data_anonymizer",
    "gdpr_manager",
    "anonymize_user_data",
    "check_data_retention",
    "perform_privacy_assessment",
    "log_gdpr_activity"
]
