"""
Unit tests for AEGIS AWS Security Hub & Amazon GuardDuty Threat Correlator.
Validates ASFF parsing, GuardDuty runtime alert ingestion, and attack path exploit escalation.
"""

from services.security_engine.security_hub_correlator import (
    SecurityHubGuardDutyCorrelator,
    RuntimeThreatEvent,
)
from backend.models import AttackPath, AttackPathHop, Severity


def test_guardduty_finding_parsing():
    correlator = SecurityHubGuardDutyCorrelator()
    raw_gd = [
        {
            "Id": "gd-threat-99",
            "Type": "UnauthorizedAccess:EC2/SSHBruteForce",
            "Severity": 8.0,
            "Description": "EC2 instance is undergoing SSH brute-force attacks.",
            "Resource": {
                "InstanceDetails": {
                    "InstanceId": "i-0a1b2c3d4e5f67890",
                }
            },
            "Service": {
                "Action": {
                    "NetworkConnectionAction": {
                        "RemoteIpDetails": {
                            "IpAddressV4": "198.51.100.99",
                        }
                    }
                }
            },
            "CreatedAt": "2026-11-19T14:30:00Z",
        }
    ]

    events = correlator.parse_guardduty_findings(raw_gd)
    assert len(events) == 1
    evt = events[0]
    assert evt.threat_id == "gd-threat-99"
    assert evt.threat_type == "UnauthorizedAccess:EC2/SSHBruteForce"
    assert evt.affected_resource_id == "i-0a1b2c3d4e5f67890"
    assert evt.source_ip == "198.51.100.99"
    assert evt.severity_score == 8.0


def test_threat_correlation_escalates_attack_path_node():
    correlator = SecurityHubGuardDutyCorrelator()

    # Threat against bastion host
    threats = [
        RuntimeThreatEvent(
            threat_id="threat-ssh-bruteforce",
            service="GuardDuty",
            threat_type="UnauthorizedAccess:EC2/SSHBruteForce",
            affected_resource_id="i-0a1b2c3d4e5f67890",
            severity_score=8.5,
            description="Active SSH brute force attack against bastion instance",
            detected_at="2026-11-19T15:00:00Z",
            source_ip="203.0.113.88",
        )
    ]

    # Evidenced attack path containing the bastion host
    attack_paths = [
        AttackPath(
            path_id="PATH-001",
            title="Public Ingress to Customer Database",
            severity=Severity.CRITICAL,
            entry_point="igw-01234567",
            target_asset="corporate-customer-financial-records",
            hops=[
                AttackPathHop(
                    hop_index=1,
                    source_node="igw-01234567",
                    target_node="i-0a1b2c3d4e5f67890",
                    relationship="ROUTES_TO",
                    description="Ingress to bastion",
                ),
                AttackPathHop(
                    hop_index=2,
                    source_node="i-0a1b2c3d4e5f67890",
                    target_node="corporate-customer-financial-records",
                    relationship="GRANTS",
                    description="Admin role access",
                ),
            ],
            narrative="Attack path via bastion",
        )
    ]

    findings = correlator.correlate_threats_with_attack_paths(threats, attack_paths)
    assert len(findings) == 1
    f = findings[0]
    assert f.rule_id == "SEC-THREAT-01"
    assert f.severity == Severity.CRITICAL
    assert "ACTIVE EXPLOIT DETECTED ON EVIDENCED ATTACK PATH" in f.title
    assert "203.0.113.88" in f.description
