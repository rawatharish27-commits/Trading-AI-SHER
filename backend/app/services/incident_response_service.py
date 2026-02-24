"""
Security Incident Response Service
Automated incident detection, response, and recovery procedures
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db_context
from app.core.config import settings
from app.core.security import security_audit


class IncidentSeverity(Enum):
    """Incident severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(Enum):
    """Incident status"""
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    ERADICATED = "eradicated"
    RECOVERED = "recovered"
    CLOSED = "closed"


class IncidentType(Enum):
    """Types of security incidents"""
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_BREACH = "data_breach"
    MALWARE_INFECTION = "malware_infection"
    DENIAL_OF_SERVICE = "denial_of_service"
    INSIDER_THREAT = "insider_threat"
    PHISHING_ATTACK = "phishing_attack"
    BRUTE_FORCE_ATTACK = "brute_force_attack"
    SQL_INJECTION = "sql_injection"
    XSS_ATTACK = "xss_attack"
    CONFIGURATION_ERROR = "configuration_error"
    SYSTEM_FAILURE = "system_failure"


@dataclass
class SecurityIncident:
    """Security incident record"""
    incident_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    title: str
    description: str
    detected_at: datetime
    reported_by: Optional[str]
    affected_systems: List[str]
    affected_users: List[int]
    indicators: Dict[str, Any]
    evidence: List[Dict[str, Any]]
    actions_taken: List[Dict[str, Any]]
    assigned_to: Optional[str]
    resolved_at: Optional[datetime]
    resolution_summary: Optional[str]
    metadata: Dict[str, Any]


@dataclass
class IncidentResponsePlan:
    """Incident response plan"""
    plan_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    automated_actions: List[Dict[str, Any]]
    manual_steps: List[str]
    escalation_contacts: List[Dict[str, str]]
    communication_template: str
    created_at: datetime
    updated_at: datetime


class IncidentDetectionEngine:
    """
    Automated incident detection engine
    """

    def __init__(self):
        self.incident_thresholds = {
            "failed_login_attempts": {"count": 5, "timeframe_minutes": 15, "severity": IncidentSeverity.MEDIUM},
            "suspicious_requests": {"count": 10, "timeframe_minutes": 5, "severity": IncidentSeverity.HIGH},
            "unauthorized_access": {"count": 1, "severity": IncidentSeverity.CRITICAL},
            "data_breach_indicators": {"count": 1, "severity": IncidentSeverity.CRITICAL},
            "system_errors": {"count": 50, "timeframe_minutes": 10, "severity": IncidentSeverity.HIGH},
            "rate_limit_exceeded": {"count": 20, "timeframe_minutes": 5, "severity": IncidentSeverity.MEDIUM}
        }

    async def analyze_security_events(self) -> List[SecurityIncident]:
        """
        Analyze recent security events for potential incidents

        Returns:
            List of detected incidents
        """
        incidents = []

        # Check for brute force attacks
        brute_force_incidents = await self._detect_brute_force_attacks()
        incidents.extend(brute_force_incidents)

        # Check for suspicious activity patterns
        suspicious_activity_incidents = await self._detect_suspicious_activity()
        incidents.extend(suspicious_activity_incidents)

        # Check for system anomalies
        system_anomaly_incidents = await self._detect_system_anomalies()
        incidents.extend(system_anomaly_incidents)

        # Check for data breach indicators
        data_breach_incidents = await self._detect_data_breach_indicators()
        incidents.extend(data_breach_incidents)

        return incidents

    async def _detect_brute_force_attacks(self) -> List[SecurityIncident]:
        """Detect brute force login attempts"""
        incidents = []

        async with get_db_context() as session:
            # Check for failed login attempts in the last 15 minutes
            fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)

            result = await session.execute(text("""
                SELECT
                    details->>'username' as username,
                    details->>'ip_address' as ip_address,
                    COUNT(*) as failed_attempts
                FROM audit_logs
                WHERE event_type = 'failed_authentication'
                AND timestamp > :cutoff_time
                GROUP BY details->>'username', details->>'ip_address'
                HAVING COUNT(*) >= :threshold
            """), {
                "cutoff_time": fifteen_minutes_ago,
                "threshold": self.incident_thresholds["failed_login_attempts"]["count"]
            })

            for row in result.fetchall():
                username, ip_address, failed_attempts = row

                incident = SecurityIncident(
                    incident_id=f"brute_force_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{hash(username + ip_address) % 10000}",
                    incident_type=IncidentType.BRUTE_FORCE_ATTACK,
                    severity=IncidentSeverity.MEDIUM,
                    status=IncidentStatus.DETECTED,
                    title=f"Brute Force Attack Detected - {failed_attempts} failed attempts",
                    description=f"Multiple failed login attempts detected for user {username} from IP {ip_address}",
                    detected_at=datetime.utcnow(),
                    reported_by="automated_detection",
                    affected_systems=["authentication_system"],
                    affected_users=[],
                    indicators={
                        "failed_attempts": failed_attempts,
                        "target_username": username,
                        "source_ip": ip_address,
                        "timeframe_minutes": 15
                    },
                    evidence=[],
                    actions_taken=[],
                    assigned_to=None,
                    resolved_at=None,
                    resolution_summary=None,
                    metadata={"detection_method": "brute_force_pattern"}
                )

                incidents.append(incident)

        return incidents

    async def _detect_suspicious_activity(self) -> List[SecurityIncident]:
        """Detect suspicious activity patterns"""
        incidents = []

        async with get_db_context() as session:
            # Check for unusual access patterns
            five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)

            result = await session.execute(text("""
                SELECT
                    user_id,
                    details->>'ip_address' as ip_address,
                    COUNT(*) as request_count
                FROM audit_logs
                WHERE event_type = 'suspicious_request'
                AND timestamp > :cutoff_time
                GROUP BY user_id, details->>'ip_address'
                HAVING COUNT(*) >= :threshold
            """), {
                "cutoff_time": five_minutes_ago,
                "threshold": self.incident_thresholds["suspicious_requests"]["count"]
            })

            for row in result.fetchall():
                user_id, ip_address, request_count = row

                incident = SecurityIncident(
                    incident_id=f"suspicious_activity_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id}",
                    incident_type=IncidentType.UNAUTHORIZED_ACCESS,
                    severity=IncidentSeverity.HIGH,
                    status=IncidentStatus.DETECTED,
                    title=f"Suspicious Activity Detected - {request_count} suspicious requests",
                    description=f"Multiple suspicious requests detected from user {user_id} at IP {ip_address}",
                    detected_at=datetime.utcnow(),
                    reported_by="automated_detection",
                    affected_systems=["api_endpoints"],
                    affected_users=[user_id] if user_id else [],
                    indicators={
                        "suspicious_requests": request_count,
                        "source_ip": ip_address,
                        "timeframe_minutes": 5
                    },
                    evidence=[],
                    actions_taken=[],
                    assigned_to=None,
                    resolved_at=None,
                    resolution_summary=None,
                    metadata={"detection_method": "suspicious_pattern"}
                )

                incidents.append(incident)

        return incidents

    async def _detect_system_anomalies(self) -> List[SecurityIncident]:
        """Detect system anomalies that may indicate security issues"""
        incidents = []

        async with get_db_context() as session:
            # Check for high error rates
            ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)

            result = await session.execute(text("""
                SELECT COUNT(*) as error_count
                FROM audit_logs
                WHERE severity IN ('error', 'critical')
                AND timestamp > :cutoff_time
            """), {"cutoff_time": ten_minutes_ago})

            error_count = result.scalar() or 0

            if error_count >= self.incident_thresholds["system_errors"]["count"]:
                incident = SecurityIncident(
                    incident_id=f"system_anomaly_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    incident_type=IncidentType.SYSTEM_FAILURE,
                    severity=IncidentSeverity.HIGH,
                    status=IncidentStatus.DETECTED,
                    title=f"System Anomaly Detected - {error_count} errors in 10 minutes",
                    description="High rate of system errors detected, may indicate security compromise or system issues",
                    detected_at=datetime.utcnow(),
                    reported_by="automated_detection",
                    affected_systems=["core_system"],
                    affected_users=[],
                    indicators={
                        "error_count": error_count,
                        "timeframe_minutes": 10,
                        "error_threshold": self.incident_thresholds["system_errors"]["count"]
                    },
                    evidence=[],
                    actions_taken=[],
                    assigned_to=None,
                    resolved_at=None,
                    resolution_summary=None,
                    metadata={"detection_method": "error_rate_analysis"}
                )

                incidents.append(incident)

        return incidents

    async def _detect_data_breach_indicators(self) -> List[SecurityIncident]:
        """Detect potential data breach indicators"""
        incidents = []

        async with get_db_context() as session:
            # Check for unauthorized data access patterns
            result = await session.execute(text("""
                SELECT
                    user_id,
                    event_type,
                    COUNT(*) as event_count
                FROM audit_logs
                WHERE event_type IN ('data_access', 'unauthorized_access')
                AND timestamp > :cutoff_time
                GROUP BY user_id, event_type
                HAVING COUNT(*) >= :threshold
            """), {
                "cutoff_time": datetime.utcnow() - timedelta(hours=1),
                "threshold": self.incident_thresholds["data_breach_indicators"]["count"]
            })

            for row in result.fetchall():
                user_id, event_type, event_count = row

                incident = SecurityIncident(
                    incident_id=f"data_breach_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id}",
                    incident_type=IncidentType.DATA_BREACH,
                    severity=IncidentSeverity.CRITICAL,
                    status=IncidentStatus.DETECTED,
                    title=f"Potential Data Breach - {event_count} unauthorized access events",
                    description=f"Multiple unauthorized data access events detected for user {user_id}",
                    detected_at=datetime.utcnow(),
                    reported_by="automated_detection",
                    affected_systems=["data_layer"],
                    affected_users=[user_id] if user_id else [],
                    indicators={
                        "unauthorized_events": event_count,
                        "event_type": event_type,
                        "timeframe_hours": 1
                    },
                    evidence=[],
                    actions_taken=[],
                    assigned_to=None,
                    resolved_at=None,
                    resolution_summary=None,
                    metadata={"detection_method": "data_access_pattern"}
                )

                incidents.append(incident)

        return incidents


class IncidentResponseCoordinator:
    """
    Coordinates incident response activities
    """

    def __init__(self):
        self.response_plans = self._load_response_plans()
        self.escalation_contacts = {
            IncidentSeverity.LOW: ["security_team@company.com"],
            IncidentSeverity.MEDIUM: ["security_team@company.com", "it_manager@company.com"],
            IncidentSeverity.HIGH: ["security_team@company.com", "it_manager@company.com", "ciso@company.com"],
            IncidentSeverity.CRITICAL: ["security_team@company.com", "it_manager@company.com", "ciso@company.com", "ceo@company.com"]
        }

    def _load_response_plans(self) -> Dict[str, IncidentResponsePlan]:
        """Load predefined incident response plans"""
        return {
            "brute_force": IncidentResponsePlan(
                plan_id="brute_force_response",
                incident_type=IncidentType.BRUTE_FORCE_ATTACK,
                severity=IncidentSeverity.MEDIUM,
                automated_actions=[
                    {"action": "block_ip", "duration_minutes": 30, "description": "Temporarily block source IP"},
                    {"action": "notify_user", "description": "Notify affected user of suspicious activity"},
                    {"action": "enable_2fa_prompt", "description": "Prompt user to enable 2FA"}
                ],
                manual_steps=[
                    "Review login attempt patterns",
                    "Check for compromised credentials",
                    "Consider password reset requirement",
                    "Monitor for further attempts"
                ],
                escalation_contacts=[
                    {"name": "Security Team", "email": "security@company.com", "phone": "+1-555-0101"},
                    {"name": "IT Manager", "email": "it@company.com", "phone": "+1-555-0102"}
                ],
                communication_template="""Brute force attack detected on user account. Automated protective measures have been implemented.""",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            "data_breach": IncidentResponsePlan(
                plan_id="data_breach_response",
                incident_type=IncidentType.DATA_BREACH,
                severity=IncidentSeverity.CRITICAL,
                automated_actions=[
                    {"action": "isolate_system", "description": "Isolate affected systems"},
                    {"action": "disable_access", "description": "Disable unauthorized access"},
                    {"action": "backup_data", "description": "Create emergency backup"}
                ],
                manual_steps=[
                    "Assess breach scope and impact",
                    "Notify affected individuals",
                    "Report to regulatory authorities",
                    "Implement containment measures",
                    "Conduct forensic analysis",
                    "Review and update security controls"
                ],
                escalation_contacts=[
                    {"name": "CISO", "email": "ciso@company.com", "phone": "+1-555-0103"},
                    {"name": "Legal Counsel", "email": "legal@company.com", "phone": "+1-555-0104"},
                    {"name": "PR Team", "email": "pr@company.com", "phone": "+1-555-0105"}
                ],
                communication_template="""CRITICAL: Data breach detected. Immediate response team activation required.""",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        }

    async def initiate_incident_response(self, incident: SecurityIncident) -> None:
        """
        Initiate automated incident response

        Args:
            incident: Detected security incident
        """
        logger.warning(f"Initiating incident response for: {incident.incident_id} - {incident.title}")

        # Update incident status
        incident.status = IncidentStatus.INVESTIGATING
        incident.assigned_to = "automated_response_system"

        # Get response plan
        plan_key = incident.incident_type.value.lower().replace("_", "_")
        response_plan = self.response_plans.get(plan_key)

        if response_plan:
            # Execute automated actions
            await self._execute_automated_actions(incident, response_plan)

            # Log response initiation
            await security_audit.log_security_event(
                "incident_response_initiated",
                None,
                {
                    "incident_id": incident.incident_id,
                    "response_plan": response_plan.plan_id,
                    "automated_actions": len(response_plan.automated_actions)
                },
                "warning"
            )

        # Escalate if necessary
        await self._escalate_incident(incident)

        # Save incident to database
        await self._save_incident(incident)

    async def _execute_automated_actions(self, incident: SecurityIncident, plan: IncidentResponsePlan) -> None:
        """Execute automated response actions"""
        for action in plan.automated_actions:
            try:
                action_result = await self._execute_action(action, incident)
                incident.actions_taken.append({
                    "action": action["action"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "result": action_result,
                    "status": "completed"
                })

                logger.info(f"Executed automated action: {action['action']} for incident {incident.incident_id}")

            except Exception as e:
                logger.error(f"Failed to execute action {action['action']}: {e}")
                incident.actions_taken.append({
                    "action": action["action"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e),
                    "status": "failed"
                })

    async def _execute_action(self, action: Dict[str, Any], incident: SecurityIncident) -> str:
        """Execute a specific automated action"""
        action_type = action["action"]

        if action_type == "block_ip":
            # Implement IP blocking logic
            duration = action.get("duration_minutes", 30)
            # This would integrate with firewall/network security systems
            return f"IP blocking initiated for {duration} minutes"

        elif action_type == "notify_user":
            # Send notification to affected user
            # This would integrate with notification system
            return "User notification sent"

        elif action_type == "enable_2fa_prompt":
            # Prompt user to enable 2FA
            return "2FA enable prompt sent"

        elif action_type == "isolate_system":
            # Isolate affected systems
            return "System isolation initiated"

        elif action_type == "disable_access":
            # Disable unauthorized access
            return "Access controls updated"

        elif action_type == "backup_data":
            # Create emergency backup
            return "Emergency backup initiated"

        else:
            return f"Unknown action type: {action_type}"

    async def _escalate_incident(self, incident: SecurityIncident) -> None:
        """Escalate incident to appropriate contacts"""
        contacts = self.escalation_contacts.get(incident.severity, [])

        escalation_message = f"""
INCIDENT ALERT - {incident.severity.value.upper()}

Incident ID: {incident.incident_id}
Type: {incident.incident_type.value}
Title: {incident.title}
Description: {incident.description}
Detected: {incident.detected_at.isoformat()}

Affected Systems: {', '.join(incident.affected_systems)}
Affected Users: {len(incident.affected_users)}

Please respond immediately.
"""

        # Log escalation
        await security_audit.log_security_event(
            "incident_escalated",
            None,
            {
                "incident_id": incident.incident_id,
                "severity": incident.severity.value,
                "escalation_contacts": contacts,
                "escalation_message": escalation_message
            },
            "critical" if incident.severity == IncidentSeverity.CRITICAL else "warning"
        )

        logger.warning(f"Incident {incident.incident_id} escalated to {len(contacts)} contacts")

    async def _save_incident(self, incident: SecurityIncident) -> None:
        """Save incident to database"""
        # This would save to an incidents table
        # For now, just log it
        await security_audit.log_security_event(
            "incident_recorded",
            None,
            {
                "incident_id": incident.incident_id,
                "type": incident.incident_type.value,
                "severity": incident.severity.value,
                "status": incident.status.value,
                "title": incident.title
            },
            "info"
        )

    async def update_incident_status(
        self,
        incident_id: str,
        new_status: IncidentStatus,
        resolution_summary: Optional[str] = None
    ) -> None:
        """
        Update incident status

        Args:
            incident_id: Incident identifier
            new_status: New incident status
            resolution_summary: Resolution summary if closing incident
        """
        # Update incident status logic would go here
        await security_audit.log_security_event(
            "incident_status_updated",
            None,
            {
                "incident_id": incident_id,
                "new_status": new_status.value,
                "resolution_summary": resolution_summary
            },
            "info"
        )

        logger.info(f"Incident {incident_id} status updated to {new_status.value}")


class IncidentReportingService:
    """
    Incident reporting and analytics
    """

    async def generate_incident_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Generate comprehensive incident report

        Args:
            start_date: Report period start
            end_date: Report period end

        Returns:
            Incident report data
        """
        async with get_db_context() as session:
            # Query incident statistics
            result = await session.execute(text("""
                SELECT
                    COUNT(*) as total_incidents,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_incidents,
                    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_incidents,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) as resolved_incidents,
                    AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))/3600) as avg_resolution_hours
                FROM incidents
                WHERE detected_at BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            stats = result.fetchone()

            # Get incidents by type
            type_result = await session.execute(text("""
                SELECT incident_type, COUNT(*) as count
                FROM incidents
                WHERE detected_at BETWEEN :start_date AND :end_date
                GROUP BY incident_type
                ORDER BY count DESC
            """), {"start_date": start_date, "end_date": end_date})

            incidents_by_type = {row[0]: row[1] for row in type_result.fetchall()}

            report = {
                "report_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "summary": {
                    "total_incidents": stats[0] or 0,
                    "critical_incidents": stats[1] or 0,
                    "high_incidents": stats[2] or 0,
                    "resolved_incidents": stats[3] or 0,
                    "avg_resolution_hours": round(stats[4] or 0, 2)
                },
                "incidents_by_type": incidents_by_type,
                "generated_at": datetime.utcnow().isoformat()
            }

            return report

    async def get_incident_trends(self, days: int = 30) -> Dict[str, Any]:
        """
        Get incident trends over time

        Args:
            days: Number of days to analyze

        Returns:
            Incident trend data
        """
        start_date = datetime.utcnow() - timedelta(days=days)

        async with get_db_context() as session:
            result = await session.execute(text("""
                SELECT
                    DATE(detected_at) as incident_date,
                    COUNT(*) as incident_count,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count
                FROM incidents
                WHERE detected_at >= :start_date
                GROUP BY DATE(detected_at)
                ORDER BY incident_date
            """), {"start_date": start_date})

            trends = []
            for row in result.fetchall():
                trends.append({
                    "date": row[0].isoformat(),
                    "total_incidents": row[1],
                    "critical_incidents": row[2]
                })

            return {
                "trends": trends,
                "analysis_period_days": days,
                "generated_at": datetime.utcnow().isoformat()
            }


# Global incident response service
incident_response_service = IncidentResponseCoordinator()
incident_detection_engine = IncidentDetectionEngine()
incident_reporting_service = IncidentReportingService()


# Background monitoring task
async def run_incident_monitoring():
    """
    Background task to continuously monitor for security incidents
    """
    logger.info("Starting incident monitoring service")

    while True:
        try:
            # Analyze security events for incidents
            incidents = await incident_detection_engine.analyze_security_events()

            # Process detected incidents
            for incident in incidents:
                await incident_response_service.initiate_incident_response(incident)

            # Wait before next check (every 5 minutes)
            await asyncio.sleep(300)

        except Exception as e:
            logger.error(f"Error in incident monitoring: {e}")
            await asyncio.sleep(60)  # Wait 1 minute before retry


# Utility functions
async def report_security_incident(
    incident_type: IncidentType,
    severity: IncidentSeverity,
    title: str,
    description: str,
    affected_systems: List[str] = None,
    indicators: Dict[str, Any] = None
) -> str:
    """
    Manually report a security incident

    Returns:
        Incident ID
    """
    incident = SecurityIncident(
        incident_id=f"manual_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{hash(title) % 10000}",
        incident_type=incident_type,
        severity=severity,
        status=IncidentStatus.DETECTED,
        title=title,
        description=description,
        detected_at=datetime.utcnow(),
        reported_by="manual_report",
        affected_systems=affected_systems or [],
        affected_users=[],
        indicators=indicators or {},
        evidence=[],
        actions_taken=[],
        assigned_to=None,
        resolved_at=None,
        resolution_summary=None,
        metadata={"report_method": "manual"}
    )

    await incident_response_service.initiate_incident_response(incident)

    return incident.incident_id


# Export functions
__all__ = [
    "IncidentSeverity",
    "IncidentStatus",
    "IncidentType",
    "SecurityIncident",
    "IncidentResponsePlan",
    "IncidentDetectionEngine",
    "IncidentResponseCoordinator",
    "IncidentReportingService",
    "incident_response_service",
    "incident_detection_engine",
    "incident_reporting_service",
    "run_incident_monitoring",
    "report_security_incident"
]
