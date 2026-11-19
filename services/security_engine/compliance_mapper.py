"""
AEGIS — CIS AWS Foundations Benchmark (v3.0) & SOC 2 Type II Compliance Engine
Deterministic regulatory and industry standard mapping.
Enforces Rule 08 (Risk Verdict) and Rule 10 (Adversarial Resistance).
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.models import SecurityFinding, Severity


class ComplianceControl(BaseModel):
    standard: str
    control_id: str
    title: str
    description: str


class FrameworkScorecard(BaseModel):
    framework_name: str
    version: str
    total_checks: int
    passed_checks: int
    failed_checks: int
    compliance_score_pct: float
    violations: List[Dict[str, Any]] = Field(default_factory=list)


class FullComplianceReport(BaseModel):
    overall_compliance_pct: float
    frameworks: Dict[str, FrameworkScorecard]
    total_findings_mapped: int


# Deterministic mapping database
RULE_COMPLIANCE_MAP: Dict[str, Dict[str, Any]] = {
    # Public SSH Ingress
    "SEC-RULE-01": {
        "cis": {"id": "CIS-4.1", "title": "Ensure no security groups allow ingress from 0.0.0.0/0 to port 22"},
        "soc2": {"id": "CC6.6", "title": "Logical and physical access controls to prevent unauthorized access"},
        "pci": {"id": "1.3.1", "title": "Inbound and outbound traffic to/from cardholder data environment is restricted"},
        "nist": {"id": "SC-7", "title": "Boundary Protection"}
    },
    # Wildcard IAM Admin Permissions
    "SEC-RULE-02": {
        "cis": {"id": "CIS-1.16", "title": "Ensure IAM policies that allow full '*:*' administrative privileges are not created"},
        "soc2": {"id": "CC6.1", "title": "Logical access security software and infrastructure"},
        "pci": {"id": "7.2.1", "title": "Access is granted based on need-to-know and least privilege"},
        "nist": {"id": "AC-6", "title": "Least Privilege"}
    },
    # S3 Public Access Disabled
    "SEC-RULE-03": {
        "cis": {"id": "CIS-2.1.5", "title": "Ensure that S3 Buckets are configured with 'Block Public Access'"},
        "soc2": {"id": "CC6.1", "title": "Protection of assets from unauthorized exposure"},
        "pci": {"id": "1.2.1", "title": "Configuration standards for network security controls"},
        "nist": {"id": "AC-3", "title": "Access Enforcement"}
    },
    # CloudFormation Public SSH
    "SEC-CFN-01": {
        "cis": {"id": "CIS-4.1", "title": "Ensure no security groups allow ingress from 0.0.0.0/0 to port 22"},
        "soc2": {"id": "CC6.6", "title": "Logical and physical access controls"},
        "pci": {"id": "1.3.1", "title": "Inbound traffic restricted"},
        "nist": {"id": "SC-7", "title": "Boundary Protection"}
    },
    # CloudFormation S3 PAB
    "SEC-CFN-02": {
        "cis": {"id": "CIS-2.1.5", "title": "Ensure S3 Buckets enforce Block Public Access"},
        "soc2": {"id": "CC6.1", "title": "Asset Protection"},
        "pci": {"id": "1.2.1", "title": "Network controls"},
        "nist": {"id": "AC-3", "title": "Access Enforcement"}
    },
    # CloudFormation IAM Wildcard
    "SEC-CFN-03": {
        "cis": {"id": "CIS-1.16", "title": "Ensure IAM policies do not allow full '*:*' admin privileges"},
        "soc2": {"id": "CC6.1", "title": "Least Privilege and Identity Management"},
        "pci": {"id": "7.2.1", "title": "Least privilege access"},
        "nist": {"id": "AC-6", "title": "Least Privilege"}
    },
    # Active Threat Finding (GuardDuty / Security Hub)
    "SEC-THREAT-01": {
        "cis": {"id": "CIS-3.1", "title": "Ensure AWS GuardDuty is enabled and findings addressed"},
        "soc2": {"id": "CC7.2", "title": "Monitoring system components for anomalies and security incidents"},
        "pci": {"id": "10.2.1", "title": "Automated audit trails and threat detection"},
        "nist": {"id": "SI-4", "title": "Information System Monitoring"}
    },
    # Terraform Public Ingress
    "SEC-TF-01": {
        "cis": {"id": "CIS-4.1", "title": "Ensure no security groups allow ingress from 0.0.0.0/0 to port 22"},
        "soc2": {"id": "CC6.6", "title": "IaC Boundary Enforcement"},
        "pci": {"id": "1.3.1", "title": "Restrict Ingress"},
        "nist": {"id": "SC-7", "title": "Boundary Protection"}
    },
    # Terraform S3 PAB Deletion
    "SEC-TF-02": {
        "cis": {"id": "CIS-2.1.5", "title": "Ensure S3 Buckets enforce Block Public Access"},
        "soc2": {"id": "CC6.1", "title": "Data Loss Prevention"},
        "pci": {"id": "1.2.1", "title": "Configuration standards"},
        "nist": {"id": "AC-3", "title": "Access Enforcement"}
    }
}


class ComplianceEngine:
    """
    Evaluates findings against regulatory compliance frameworks:
    1. CIS AWS Foundations Benchmark v3.0
    2. SOC 2 Type II Security & Confidentiality Criteria
    3. PCI-DSS v4.0 Network & IAM Requirements
    4. NIST SP 800-53 Rev 5 High Baseline
    """

    BASELINE_CONTROLS = {
        "cis": 10,
        "soc2": 10,
        "pci": 8,
        "nist": 8
    }

    def evaluate(self, findings: List[SecurityFinding]) -> FullComplianceReport:
        """Evaluates findings and returns framework scorecards."""
        framework_violations: Dict[str, List[Dict[str, Any]]] = {
            "cis": [],
            "soc2": [],
            "pci": [],
            "nist": []
        }

        total_mapped = 0
        for f in findings:
            mapping = RULE_COMPLIANCE_MAP.get(f.rule_id)
            if mapping:
                total_mapped += 1
                for fw, ctrl in mapping.items():
                    if fw in framework_violations:
                        framework_violations[fw].append({
                            "rule_id": f.rule_id,
                            "control_id": ctrl["id"],
                            "control_title": ctrl["title"],
                            "resource_id": f.affected_resource_id,
                            "severity": f.severity.value
                        })

        frameworks = {}
        total_score_sum = 0.0

        specs = [
            ("cis", "CIS AWS Foundations Benchmark", "v3.0"),
            ("soc2", "SOC 2 Type II (Security/Availability)", "2017 TSC"),
            ("pci", "PCI-DSS Payment Card Security", "v4.0"),
            ("nist", "NIST Special Publication 800-53", "Rev 5")
        ]

        for key, name, ver in specs:
            violations = framework_violations[key]
            # Unique control failures
            failed_controls = len(set(v["control_id"] for v in violations))
            total_ctrls = max(self.BASELINE_CONTROLS[key], failed_controls)
            passed_ctrls = max(0, total_ctrls - failed_controls)
            score_pct = round((passed_ctrls / total_ctrls) * 100.0, 1) if total_ctrls > 0 else 100.0

            frameworks[key] = FrameworkScorecard(
                framework_name=name,
                version=ver,
                total_checks=total_ctrls,
                passed_checks=passed_ctrls,
                failed_checks=failed_controls,
                compliance_score_pct=score_pct,
                violations=violations
            )
            total_score_sum += score_pct

        overall_pct = round(total_score_sum / len(specs), 1)

        return FullComplianceReport(
            overall_compliance_pct=overall_pct,
            frameworks=frameworks,
            total_findings_mapped=total_mapped
        )
