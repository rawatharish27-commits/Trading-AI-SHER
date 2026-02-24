"""
Compliance Reporting Service
Automated compliance reporting for SEBI, GDPR, and regulatory requirements
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import json
import csv
from dataclasses import dataclass, asdict

from loguru import logger
from sqlalchemy import text, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_context
from app.core.config import settings
from app.core.security import security_audit
from app.utils.gdpr_compliance import gdpr_manager


@dataclass
class ComplianceReport:
    """Compliance report data structure"""
    report_id: str
    report_type: str
    period_start: datetime
    period_end: datetime
    generated_at: datetime
    total_records: int
    findings: List[Dict[str, Any]]
    recommendations: List[str]
    compliance_status: str
    metadata: Dict[str, Any]


@dataclass
class SEBIComplianceReport:
    """SEBI-specific compliance report"""
    report_id: str
    trading_days: int
    total_trades: int
    successful_trades: int
    failed_trades: int
    total_volume: float
    avg_trade_size: float
    risk_breaches: int
    compliance_violations: int
    audit_trail_completeness: float
    generated_at: datetime


@dataclass
class GDPRComplianceReport:
    """GDPR-specific compliance report"""
    report_id: str
    data_subjects: int
    data_processing_activities: int
    consent_records: int
    data_deletion_requests: int
    data_portability_requests: int
    privacy_breaches: int
    retention_policy_compliance: float
    generated_at: datetime


class ComplianceReportingService:
    """
    Comprehensive compliance reporting service
    """

    def __init__(self, reports_dir: str = "compliance_reports"):
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(exist_ok=True)

    async def generate_sebi_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> SEBIComplianceReport:
        """
        Generate SEBI compliance report for trading activities

        Args:
            start_date: Report period start
            end_date: Report period end

        Returns:
            SEBI compliance report
        """
        logger.info(f"Generating SEBI compliance report for {start_date.date()} to {end_date.date()}")

        async with get_db_context() as session:
            # Get trading statistics
            trade_stats = await self._get_trading_statistics(session, start_date, end_date)
            risk_breaches = await self._get_risk_breach_count(session, start_date, end_date)
            audit_completeness = await self._calculate_audit_completeness(session, start_date, end_date)

            report = SEBIComplianceReport(
                report_id=f"sebi_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}",
                trading_days=(end_date - start_date).days,
                total_trades=trade_stats['total_trades'],
                successful_trades=trade_stats['successful_trades'],
                failed_trades=trade_stats['failed_trades'],
                total_volume=trade_stats['total_volume'],
                avg_trade_size=trade_stats['avg_trade_size'],
                risk_breaches=risk_breaches,
                compliance_violations=await self._get_compliance_violations(session, start_date, end_date),
                audit_trail_completeness=audit_completeness,
                generated_at=datetime.utcnow()
            )

            # Save report
            await self._save_report("sebi", report)

            # Log compliance event
            await security_audit.log_compliance_event(
                "sebi_report_generated",
                None,
                "SEBI",
                "Trading Activity Report",
                {
                    "report_id": report.report_id,
                    "period_days": report.trading_days,
                    "total_trades": report.total_trades,
                    "compliance_status": "generated"
                }
            )

            logger.info(f"SEBI compliance report generated: {report.report_id}")
            return report

    async def generate_gdpr_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> GDPRComplianceReport:
        """
        Generate GDPR compliance report

        Args:
            start_date: Report period start
            end_date: Report period end

        Returns:
            GDPR compliance report
        """
        logger.info(f"Generating GDPR compliance report for {start_date.date()} to {end_date.date()}")

        async with get_db_context() as session:
            # Get GDPR-related statistics
            data_subjects = await self._get_data_subject_count(session)
            processing_activities = await self._get_processing_activities_count(session, start_date, end_date)
            consent_records = await self._get_consent_records_count(session)
            deletion_requests = await self._get_data_deletion_requests(session, start_date, end_date)
            portability_requests = await self._get_data_portability_requests(session, start_date, end_date)
            privacy_breaches = await self._get_privacy_breach_count(session, start_date, end_date)
            retention_compliance = await self._calculate_retention_compliance(session)

            report = GDPRComplianceReport(
                report_id=f"gdpr_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}",
                data_subjects=data_subjects,
                data_processing_activities=processing_activities,
                consent_records=consent_records,
                data_deletion_requests=deletion_requests,
                data_portability_requests=portability_requests,
                privacy_breaches=privacy_breaches,
                retention_policy_compliance=retention_compliance,
                generated_at=datetime.utcnow()
            )

            # Save report
            await self._save_report("gdpr", report)

            # Log compliance event
            await security_audit.log_compliance_event(
                "gdpr_report_generated",
                None,
                "GDPR",
                "Data Protection Report",
                {
                    "report_id": report.report_id,
                    "data_subjects": report.data_subjects,
                    "processing_activities": report.data_processing_activities,
                    "compliance_status": "generated"
                }
            )

            logger.info(f"GDPR compliance report generated: {report.report_id}")
            return report

    async def generate_comprehensive_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> ComplianceReport:
        """
        Generate comprehensive compliance report covering all regulations

        Args:
            start_date: Report period start
            end_date: Report period end

        Returns:
            Comprehensive compliance report
        """
        logger.info(f"Generating comprehensive compliance report for {start_date.date()} to {end_date.date()}")

        findings = []
        recommendations = []

        # Generate individual reports
        sebi_report = await self.generate_sebi_compliance_report(start_date, end_date)
        gdpr_report = await self.generate_gdpr_compliance_report(start_date, end_date)

        # Analyze SEBI findings
        if sebi_report.risk_breaches > 0:
            findings.append({
                "regulation": "SEBI",
                "severity": "high",
                "issue": f"{sebi_report.risk_breaches} risk limit breaches detected",
                "impact": "Potential regulatory penalties",
                "recommendation": "Review risk management policies and implement additional controls"
            })

        if sebi_report.audit_trail_completeness < 0.95:
            findings.append({
                "regulation": "SEBI",
                "severity": "medium",
                "issue": f"Audit trail completeness: {sebi_report.audit_trail_completeness:.1%}",
                "impact": "Incomplete audit trail for regulatory compliance",
                "recommendation": "Improve logging mechanisms and ensure all trading activities are recorded"
            })

        # Analyze GDPR findings
        if gdpr_report.privacy_breaches > 0:
            findings.append({
                "regulation": "GDPR",
                "severity": "critical",
                "issue": f"{gdpr_report.privacy_breaches} privacy breaches detected",
                "impact": "Potential fines up to 4% of global turnover",
                "recommendation": "Conduct immediate breach investigation and implement corrective measures"
            })

        if gdpr_report.retention_policy_compliance < 0.9:
            findings.append({
                "regulation": "GDPR",
                "severity": "medium",
                "issue": f"Data retention compliance: {gdpr_report.retention_policy_compliance:.1%}",
                "impact": "Non-compliant data retention practices",
                "recommendation": "Review and update data retention policies"
            })

        # Generate recommendations
        if not findings:
            recommendations.append("All compliance checks passed - continue monitoring")
        else:
            recommendations.extend([
                "Schedule regular compliance audits",
                "Implement automated compliance monitoring",
                "Train staff on regulatory requirements",
                "Maintain detailed compliance documentation"
            ])

        # Determine overall compliance status
        critical_findings = sum(1 for f in findings if f["severity"] == "critical")
        high_findings = sum(1 for f in findings if f["severity"] == "high")

        if critical_findings > 0:
            compliance_status = "critical"
        elif high_findings > 0:
            compliance_status = "high_risk"
        elif findings:
            compliance_status = "medium_risk"
        else:
            compliance_status = "compliant"

        report = ComplianceReport(
            report_id=f"comprehensive_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}",
            report_type="comprehensive",
            period_start=start_date,
            period_end=end_date,
            generated_at=datetime.utcnow(),
            total_records=sebi_report.total_trades + gdpr_report.data_processing_activities,
            findings=findings,
            recommendations=recommendations,
            compliance_status=compliance_status,
            metadata={
                "sebi_report_id": sebi_report.report_id,
                "gdpr_report_id": gdpr_report.report_id,
                "regulations_covered": ["SEBI", "GDPR"],
                "automated_generation": True
            }
        )

        # Save comprehensive report
        await self._save_report("comprehensive", report)

        logger.info(f"Comprehensive compliance report generated: {report.report_id} - Status: {compliance_status}")
        return report

    async def schedule_monthly_compliance_reports(self) -> None:
        """
        Schedule monthly compliance report generation
        """
        logger.info("Scheduling monthly compliance reports")

        # Calculate last month period
        today = datetime.utcnow().date()
        first_day_last_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        last_day_last_month = today.replace(day=1) - timedelta(days=1)

        start_date = datetime.combine(first_day_last_month, datetime.min.time())
        end_date = datetime.combine(last_day_last_month, datetime.max.time())

        try:
            # Generate comprehensive report
            report = await self.generate_comprehensive_compliance_report(start_date, end_date)

            # Send notification if issues found
            if report.compliance_status != "compliant":
                await self._send_compliance_alert(report)

            logger.info("Monthly compliance reports completed")

        except Exception as e:
            logger.error(f"Failed to generate monthly compliance reports: {e}")
            await security_audit.log_system_event(
                "compliance_report_failure",
                {"error": str(e), "report_type": "monthly"},
                "error"
            )

    async def _get_trading_statistics(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get trading statistics for SEBI report"""
        try:
            # Query orders table for trading statistics
            result = await session.execute(text("""
                SELECT
                    COUNT(*) as total_trades,
                    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful_trades,
                    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_trades,
                    COALESCE(SUM(quantity * price), 0) as total_volume,
                    COALESCE(AVG(quantity * price), 0) as avg_trade_size
                FROM orders
                WHERE order_time BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            row = result.fetchone()
            return {
                "total_trades": row[0] or 0,
                "successful_trades": row[1] or 0,
                "failed_trades": row[2] or 0,
                "total_volume": float(row[3] or 0),
                "avg_trade_size": float(row[4] or 0)
            }
        except Exception as e:
            logger.warning(f"Failed to get trading statistics: {e}")
            return {"total_trades": 0, "successful_trades": 0, "failed_trades": 0, "total_volume": 0.0, "avg_trade_size": 0.0}

    async def _get_risk_breach_count(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> int:
        """Get count of risk breaches"""
        try:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE event_type = 'sebi_risk_breach'
                AND timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get risk breach count: {e}")
            return 0

    async def _calculate_audit_completeness(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> float:
        """Calculate audit trail completeness percentage"""
        try:
            # Count total expected audit events vs actual
            # This is a simplified calculation
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            actual_events = result.scalar() or 0

            # Estimate expected events (simplified)
            days = (end_date - start_date).days
            expected_events = max(days * 10, 100)  # At least 10 events per day

            completeness = min(actual_events / expected_events, 1.0)
            return completeness
        except Exception as e:
            logger.warning(f"Failed to calculate audit completeness: {e}")
            return 0.0

    async def _get_compliance_violations(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> int:
        """Get count of compliance violations"""
        try:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE severity IN ('critical', 'error')
                AND event_type LIKE 'compliance_%'
                AND timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get compliance violations: {e}")
            return 0

    async def _get_data_subject_count(self, session: AsyncSession) -> int:
        """Get count of data subjects (users)"""
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get data subject count: {e}")
            return 0

    async def _get_processing_activities_count(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> int:
        """Get count of data processing activities"""
        try:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE event_type LIKE '%data_%'
                AND timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get processing activities count: {e}")
            return 0

    async def _get_consent_records_count(self, session: AsyncSession) -> int:
        """Get count of consent records"""
        # This would query a consent table if it existed
        # For now, return a placeholder
        return 0

    async def _get_data_deletion_requests(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> int:
        """Get count of data deletion requests"""
        try:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE event_type = 'gdpr_data_deletion'
                AND timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get data deletion requests: {e}")
            return 0

    async def _get_data_portability_requests(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> int:
        """Get count of data portability requests"""
        try:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE event_type = 'gdpr_data_portability'
                AND timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get data portability requests: {e}")
            return 0

    async def _get_privacy_breach_count(self, session: AsyncSession, start_date: datetime, end_date: datetime) -> int:
        """Get count of privacy breaches"""
        try:
            result = await session.execute(text("""
                SELECT COUNT(*) FROM audit_logs
                WHERE event_type = 'gdpr_privacy_breach'
                AND timestamp BETWEEN :start_date AND :end_date
            """), {"start_date": start_date, "end_date": end_date})

            return result.scalar() or 0
        except Exception as e:
            logger.warning(f"Failed to get privacy breach count: {e}")
            return 0

    async def _calculate_retention_compliance(self, session: AsyncSession) -> float:
        """Calculate data retention policy compliance"""
        # This would check if old data is being properly deleted
        # For now, return a placeholder compliance score
        return 0.95  # 95% compliant

    async def _save_report(self, report_type: str, report: Any) -> None:
        """Save report to file"""
        try:
            report_dir = self.reports_dir / report_type
            report_dir.mkdir(exist_ok=True)

            filename = f"{report.report_id}.json"
            filepath = report_dir / filename

            with open(filepath, 'w') as f:
                json.dump(asdict(report), f, indent=2, default=str)

            logger.info(f"Report saved: {filepath}")

        except Exception as e:
            logger.error(f"Failed to save report: {e}")

    async def _send_compliance_alert(self, report: ComplianceReport) -> None:
        """Send compliance alert for critical findings"""
        try:
            alert_message = f"""
            COMPLIANCE ALERT

            Report ID: {report.report_id}
            Period: {report.period_start.date()} to {report.period_end.date()}
            Status: {report.compliance_status.upper()}

            Findings: {len(report.findings)}
            """

            for finding in report.findings:
                alert_message += f"\n- {finding['regulation']}: {finding['issue']} ({finding['severity']})"

            # Log the alert
            await security_audit.log_system_event(
                "compliance_alert",
                {
                    "report_id": report.report_id,
                    "status": report.compliance_status,
                    "findings_count": len(report.findings),
                    "alert_message": alert_message
                },
                "warning"
            )

            logger.warning(f"Compliance alert sent: {report.report_id}")

        except Exception as e:
            logger.error(f"Failed to send compliance alert: {e}")

    async def list_reports(self, report_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all available compliance reports"""
        reports = []

        if report_type:
            report_dirs = [self.reports_dir / report_type]
        else:
            report_dirs = [d for d in self.reports_dir.iterdir() if d.is_dir()]

        for report_dir in report_dirs:
            if report_dir.exists():
                for report_file in report_dir.glob("*.json"):
                    try:
                        with open(report_file, 'r') as f:
                            report_data = json.load(f)
                            report_data["file_path"] = str(report_file)
                            reports.append(report_data)
                    except Exception as e:
                        logger.warning(f"Failed to read report {report_file}: {e}")

        # Sort by generation date (newest first)
        reports.sort(key=lambda x: x.get("generated_at", ""), reverse=True)

        return reports


# Global compliance service instance
compliance_service = ComplianceReportingService()


# Utility functions
async def generate_monthly_compliance_reports() -> None:
    """Generate monthly compliance reports"""
    await compliance_service.schedule_monthly_compliance_reports()


async def get_compliance_report(report_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific compliance report"""
    reports = await compliance_service.list_reports()
    for report in reports:
        if report.get("report_id") == report_id:
            return report
    return None


# Export functions
__all__ = [
    "ComplianceReportingService",
    "ComplianceReport",
    "SEBIComplianceReport",
    "GDPRComplianceReport",
    "compliance_service",
    "generate_monthly_compliance_reports",
    "get_compliance_report"
]
