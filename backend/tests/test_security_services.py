"""
Security Services Tests
Tests for compliance, incident response, and security monitoring
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.compliance_service import ComplianceReportingService
from app.services.incident_response_service import (
    IncidentDetectionEngine,
    IncidentResponseCoordinator,
    IncidentReportingService
)
from app.core.security import SecurityAudit


class TestComplianceReportingService:
    """Test compliance reporting service"""

    @pytest.fixture
    def compliance_service(self, tmp_path):
        """Create compliance service with temporary directory"""
        return ComplianceReportingService(reports_dir=str(tmp_path / "reports"))

    @pytest.mark.asyncio
    async def test_generate_sebi_compliance_report(self, compliance_service):
        """Test SEBI compliance report generation"""
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)

        with patch('app.services.compliance_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock database queries
            with patch.object(compliance_service, '_get_trading_statistics', return_value={
                'total_trades': 100, 'successful_trades': 95, 'failed_trades': 5,
                'total_volume': 1000000.0, 'avg_trade_size': 10000.0
            }):
                with patch.object(compliance_service, '_get_risk_breach_count', return_value=2):
                    with patch.object(compliance_service, '_calculate_audit_completeness', return_value=0.95):
                        with patch.object(compliance_service, '_get_compliance_violations', return_value=1):
                            with patch.object(compliance_service, '_save_report'):
                                report = await compliance_service.generate_sebi_compliance_report(start_date, end_date)

                                assert report.report_id.startswith("sebi_")
                                assert report.trading_days == 30
                                assert report.total_trades == 100
                                assert report.successful_trades == 95
                                assert report.risk_breaches == 2

    @pytest.mark.asyncio
    async def test_generate_comprehensive_compliance_report(self, compliance_service):
        """Test comprehensive compliance report generation"""
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)

        with patch.object(compliance_service, 'generate_sebi_compliance_report') as mock_sebi:
            with patch.object(compliance_service, 'generate_gdpr_compliance_report') as mock_gdpr:
                mock_sebi_report = MagicMock()
                mock_sebi_report.total_trades = 100
                mock_sebi_report.risk_breaches = 0
                mock_sebi_report.audit_trail_completeness = 0.98

                mock_gdpr_report = MagicMock()
                mock_gdpr_report.data_subjects = 50
                mock_gdpr_report.privacy_breaches = 0
                mock_gdpr_report.retention_policy_compliance = 0.95

                mock_sebi.return_value = mock_sebi_report
                mock_gdpr.return_value = mock_gdpr_report

                with patch.object(compliance_service, '_save_report'):
                    report = await compliance_service.generate_comprehensive_compliance_report(start_date, end_date)

                    assert report.report_type == "comprehensive"
                    assert report.compliance_status == "compliant"
                    assert len(report.findings) == 0  # No issues in mock data

    def test_compliance_report_data_structure(self, compliance_service):
        """Test compliance report data structure"""
        from app.services.compliance_service import SEBIComplianceReport, GDPRComplianceReport

        sebi_report = SEBIComplianceReport(
            report_id="test_sebi",
            trading_days=30,
            total_trades=100,
            successful_trades=95,
            failed_trades=5,
            total_volume=1000000.0,
            avg_trade_size=10000.0,
            risk_breaches=2,
            compliance_violations=1,
            audit_trail_completeness=0.95,
            generated_at=datetime.utcnow()
        )

        assert sebi_report.report_id == "test_sebi"
        assert sebi_report.total_trades == 100
        assert sebi_report.risk_breaches == 2

        gdpr_report = GDPRComplianceReport(
            report_id="test_gdpr",
            data_subjects=50,
            data_processing_activities=100,
            consent_records=45,
            data_deletion_requests=2,
            data_portability_requests=1,
            privacy_breaches=0,
            retention_policy_compliance=0.95,
            generated_at=datetime.utcnow()
        )

        assert gdpr_report.report_id == "test_gdpr"
        assert gdpr_report.data_subjects == 50
        assert gdpr_report.privacy_breaches == 0


class TestIncidentDetectionEngine:
    """Test incident detection engine"""

    @pytest.fixture
    def detection_engine(self):
        """Create incident detection engine"""
        return IncidentDetectionEngine()

    @pytest.mark.asyncio
    async def test_brute_force_detection(self, detection_engine):
        """Test brute force attack detection"""
        with patch('app.services.incident_response_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock failed login query
            mock_result = MagicMock()
            mock_result.fetchall.return_value = [
                ("test@example.com", "192.168.1.1", 8)  # 8 failed attempts
            ]
            mock_session.execute.return_value = mock_result

            incidents = await detection_engine._detect_brute_force_attacks()

            assert len(incidents) == 1
            assert incidents[0].incident_type.value == "brute_force_attack"
            assert incidents[0].severity.value == "medium"
            assert "test@example.com" in incidents[0].description

    @pytest.mark.asyncio
    async def test_suspicious_activity_detection(self, detection_engine):
        """Test suspicious activity detection"""
        with patch('app.services.incident_response_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock suspicious requests query
            mock_result = MagicMock()
            mock_result.fetchall.return_value = [
                (123, "192.168.1.1", 15)  # 15 suspicious requests
            ]
            mock_session.execute.return_value = mock_result

            incidents = await detection_engine._detect_suspicious_activity()

            assert len(incidents) == 1
            assert incidents[0].incident_type.value == "unauthorized_access"
            assert incidents[0].severity.value == "high"

    @pytest.mark.asyncio
    async def test_system_anomaly_detection(self, detection_engine):
        """Test system anomaly detection"""
        with patch('app.services.incident_response_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock error count query
            mock_result = MagicMock()
            mock_result.scalar.return_value = 60  # Above threshold
            mock_session.execute.return_value = mock_result

            incidents = await detection_engine._detect_system_anomalies()

            assert len(incidents) == 1
            assert incidents[0].incident_type.value == "system_failure"
            assert incidents[0].severity.value == "high"

    @pytest.mark.asyncio
    async def test_data_breach_detection(self, detection_engine):
        """Test data breach indicator detection"""
        with patch('app.services.incident_response_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock data access query
            mock_result = MagicMock()
            mock_result.fetchall.return_value = [
                (123, "data_access", 5)  # 5 unauthorized accesses
            ]
            mock_session.execute.return_value = mock_result

            incidents = await detection_engine._detect_data_breach_indicators()

            assert len(incidents) == 1
            assert incidents[0].incident_type.value == "data_breach"
            assert incidents[0].severity.value == "critical"


class TestIncidentResponseCoordinator:
    """Test incident response coordinator"""

    @pytest.fixture
    def response_coordinator(self):
        """Create incident response coordinator"""
        return IncidentResponseCoordinator()

    def test_response_plan_loading(self, response_coordinator):
        """Test response plan loading"""
        assert "brute_force" in response_coordinator.response_plans
        assert "data_breach" in response_coordinator.response_plans

        brute_force_plan = response_coordinator.response_plans["brute_force"]
        assert brute_force_plan.incident_type.value == "brute_force_attack"
        assert brute_force_plan.severity.value == "medium"
        assert len(brute_force_plan.automated_actions) > 0

    @pytest.mark.asyncio
    async def test_incident_response_initiation(self, response_coordinator):
        """Test incident response initiation"""
        from app.services.incident_response_service import SecurityIncident, IncidentType, IncidentSeverity, IncidentStatus

        incident = SecurityIncident(
            incident_id="test_incident_001",
            incident_type=IncidentType.BRUTE_FORCE_ATTACK,
            severity=IncidentSeverity.MEDIUM,
            status=IncidentStatus.DETECTED,
            title="Test Brute Force Attack",
            description="Test incident for brute force detection",
            detected_at=datetime.utcnow(),
            reported_by="test_system",
            affected_systems=["authentication"],
            affected_users=[],
            indicators={"failed_attempts": 10},
            evidence=[],
            actions_taken=[],
            assigned_to=None,
            resolved_at=None,
            resolution_summary=None,
            metadata={}
        )

        with patch.object(response_coordinator, '_execute_automated_actions'):
            with patch.object(response_coordinator, '_escalate_incident'):
                with patch.object(response_coordinator, '_save_incident'):
                    await response_coordinator.initiate_incident_response(incident)

                    assert incident.status == IncidentStatus.INVESTIGATING
                    assert incident.assigned_to == "automated_response_system"

    def test_incident_escalation(self, response_coordinator):
        """Test incident escalation logic"""
        from app.services.incident_response_service import IncidentSeverity

        # Test medium severity escalation
        contacts = response_coordinator.escalation_contacts[IncidentSeverity.MEDIUM]
        assert len(contacts) >= 2  # Should include security and IT

        # Test critical severity escalation
        contacts = response_coordinator.escalation_contacts[IncidentSeverity.CRITICAL]
        assert len(contacts) >= 3  # Should include CEO

    @pytest.mark.asyncio
    async def test_incident_status_update(self, response_coordinator):
        """Test incident status update"""
        with patch('app.core.security.security_audit.log_security_event') as mock_log:
            await response_coordinator.update_incident_status(
                incident_id="test_001",
                new_status=IncidentStatus.RESOLVED,
                resolution_summary="Issue resolved by blocking IP"
            )

            mock_log.assert_called_once()


class TestSecurityAudit:
    """Test security audit functionality"""

    @pytest.mark.asyncio
    async def test_security_event_logging(self):
        """Test security event logging"""
        with patch('app.core.security.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            await SecurityAudit.log_security_event(
                event_type="test_event",
                user_id=123,
                details={"test": "data"},
                severity="info"
            )

            # Verify audit log was created
            mock_session.add.assert_called()
            mock_session.commit.assert_called()

    @pytest.mark.asyncio
    async def test_failed_authentication_logging(self):
        """Test failed authentication logging"""
        with patch('app.core.security.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            await SecurityAudit.log_failed_authentication(
                username="test@example.com",
                ip_address="192.168.1.1",
                user_agent="Test Browser",
                reason="Invalid password"
            )

            mock_session.add.assert_called()

    @pytest.mark.asyncio
    async def test_sebi_compliance_logging(self):
        """Test SEBI compliance event logging"""
        with patch('app.core.security.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            await SecurityAudit.log_sebi_trade_execution(
                user_id=123,
                order_id="ORD_001",
                symbol="RELIANCE",
                side="BUY",
                quantity=10,
                price=2500.0,
                order_type="MARKET",
                exchange="NSE"
            )

            mock_session.add.assert_called()

    @pytest.mark.asyncio
    async def test_audit_trail_event_logging(self):
        """Test comprehensive audit trail logging"""
        with patch('app.core.security.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            await SecurityAudit.log_user_action_audit(
                user_id=123,
                action="create",
                target_resource="signal",
                target_id="SIG_001",
                details={"symbol": "RELIANCE", "action": "BUY"},
                ip_address="192.168.1.1",
                user_agent="Test Browser"
            )

            mock_session.add.assert_called()


class TestIncidentReportingService:
    """Test incident reporting service"""

    @pytest.fixture
    def reporting_service(self):
        """Create incident reporting service"""
        return IncidentReportingService()

    @pytest.mark.asyncio
    async def test_incident_report_generation(self, reporting_service):
        """Test incident report generation"""
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)

        with patch('app.services.incident_response_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock incident statistics
            mock_stats_result = MagicMock()
            mock_stats_result.fetchone.return_value = (10, 2, 1, 7, 2.5)  # total, critical, high, resolved, avg_resolution
            mock_session.execute.return_value = mock_stats_result

            # Mock incident types
            mock_type_result = MagicMock()
            mock_type_result.fetchall.return_value = [
                ("brute_force_attack", 5),
                ("unauthorized_access", 3),
                ("data_breach", 2)
            ]

            # Configure mock to return different results for different calls
            mock_session.execute.side_effect = [mock_stats_result, mock_type_result]

            report = await reporting_service.generate_incident_report(start_date, end_date)

            assert report["summary"]["total_incidents"] == 10
            assert report["summary"]["critical_incidents"] == 2
            assert report["summary"]["resolved_incidents"] == 7
            assert "brute_force_attack" in report["incidents_by_type"]
            assert report["incidents_by_type"]["brute_force_attack"] == 5

    @pytest.mark.asyncio
    async def test_incident_trends_analysis(self, reporting_service):
        """Test incident trends analysis"""
        with patch('app.services.incident_response_service.get_db_context') as mock_context:
            mock_session = AsyncMock()
            mock_context.return_value.__aenter__.return_value = mock_session

            # Mock trend data
            mock_result = MagicMock()
            mock_result.fetchall.return_value = [
                (datetime(2024, 1, 1).date(), 5, 1),
                (datetime(2024, 1, 2).date(), 3, 0),
                (datetime(2024, 1, 3).date(), 7, 2)
            ]
            mock_session.execute.return_value = mock_result

            trends = await reporting_service.get_incident_trends(days=7)

            assert len(trends["trends"]) == 3
            assert trends["trends"][0]["total_incidents"] == 5
            assert trends["trends"][0]["critical_incidents"] == 1
            assert trends["analysis_period_days"] == 7


# Integration tests
@pytest.mark.asyncio
async def test_complete_incident_response_workflow():
    """Test complete incident response workflow"""
    detection_engine = IncidentDetectionEngine()
    response_coordinator = IncidentResponseCoordinator()

    # Mock detection of incidents
    with patch.object(detection_engine, '_detect_brute_force_attacks') as mock_detect:
        mock_detect.return_value = []

        incidents = await detection_engine.analyze_security_events()
        assert isinstance(incidents, list)

    # Test response plan retrieval
    assert len(response_coordinator.response_plans) > 0
    assert "brute_force" in response_coordinator.response_plans


@pytest.mark.asyncio
async def test_compliance_reporting_workflow():
    """Test compliance reporting workflow"""
    compliance_service = ComplianceReportingService()

    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 1, 31)

    with patch.object(compliance_service, 'generate_sebi_compliance_report') as mock_sebi:
        with patch.object(compliance_service, 'generate_gdpr_compliance_report') as mock_gdpr:
            mock_sebi.return_value = MagicMock(
                total_trades=100,
                risk_breaches=0,
                audit_trail_completeness=0.98
            )
            mock_gdpr.return_value = MagicMock(
                data_subjects=50,
                privacy_breaches=0,
                retention_policy_compliance=0.95
            )

            with patch.object(compliance_service, '_save_report'):
                report = await compliance_service.generate_comprehensive_compliance_report(start_date, end_date)

                assert report.compliance_status == "compliant"
                assert report.period_start == start_date
                assert report.period_end == end_date
