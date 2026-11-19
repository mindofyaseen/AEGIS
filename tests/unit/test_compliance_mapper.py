import pytest
from backend.models import SecurityFinding, Severity, ResourceType
from services.security_engine.compliance_mapper import ComplianceEngine, RULE_COMPLIANCE_MAP

def test_compliance_mapper_evaluates_clean_findings():
    engine = ComplianceEngine()
    report = engine.evaluate([])
    assert report.overall_compliance_pct == 100.0
    assert report.total_findings_mapped == 0
    assert report.frameworks["cis"].compliance_score_pct == 100.0
    assert report.frameworks["soc2"].compliance_score_pct == 100.0

def test_compliance_mapper_with_violations():
    engine = ComplianceEngine()
    findings = [
        SecurityFinding(
            finding_id="FIND-01",
            rule_id="SEC-RULE-01",
            severity=Severity.CRITICAL,
            title="Public SSH Exposure",
            description="Port 22 open",
            affected_resource_id="sg-bastion",
            affected_resource_type=ResourceType.SECURITY_GROUP,
            remediation_recommendation="Restrict CIDR",
            confidence=1.0,
            evidence_nodes=["sg-bastion"]
        ),
        SecurityFinding(
            finding_id="FIND-02",
            rule_id="SEC-RULE-02",
            severity=Severity.CRITICAL,
            title="Wildcard IAM",
            description="Action * on Resource *",
            affected_resource_id="role-admin",
            affected_resource_type=ResourceType.IAM_ROLE,
            remediation_recommendation="Scope down",
            confidence=1.0,
            evidence_nodes=["role-admin"]
        )
    ]
    report = engine.evaluate(findings)
    assert report.total_findings_mapped == 2
    assert report.overall_compliance_pct < 100.0
    
    cis = report.frameworks["cis"]
    assert cis.failed_checks == 2  # CIS 4.1 and CIS 1.16
    assert cis.compliance_score_pct == 80.0
    assert any(v["control_id"] == "CIS-4.1" for v in cis.violations)
    assert any(v["control_id"] == "CIS-1.16" for v in cis.violations)

    soc2 = report.frameworks["soc2"]
    assert soc2.failed_checks == 2  # CC6.6 and CC6.1
    assert soc2.compliance_score_pct == 80.0
