"""
AEGIS AWS Security Hub & Amazon GuardDuty Threat Correlator.
Ingests AWS Security Finding Format (ASFF) records and GuardDuty runtime threat events,
correlating active adversary activity with static infrastructure attack paths and graph topology.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from backend.models import (
    SecurityFinding,
    Severity,
    ResourceType,
    AttackPath,
)


class RuntimeThreatEvent(BaseModel):
    threat_id: str
    service: str  # e.g., "GuardDuty", "SecurityHub"
    threat_type: str  # e.g., "UnauthorizedAccess:EC2/SSHBruteForce"
    affected_resource_id: str
    severity_score: float
    description: str
    detected_at: str
    source_ip: Optional[str] = None


class SecurityHubGuardDutyCorrelator:
    def __init__(self):
        self.critical_threat_types = [
            "UnauthorizedAccess:EC2/SSHBruteForce",
            "Recon:IAMUser/ResourcePermissions",
            "Trojan:EC2/DNSDataExfiltration",
            "PrivilegeEscalation:IAMUser/AdministrativeRoleAssumed",
            "Stealth:IAMUser/CloudTrailLoggingDisabled",
        ]

    def parse_guardduty_findings(self, raw_findings: List[Dict[str, Any]]) -> List[RuntimeThreatEvent]:
        events = []
        for rf in raw_findings:
            threat_id = rf.get("Id", rf.get("id", "THREAT-001"))
            threat_type = rf.get("Type", rf.get("type", "UnknownThreat"))
            resource = rf.get("Resource", {})
            inst_details = resource.get("InstanceDetails", {})
            res_id = inst_details.get("InstanceId", resource.get("resource_id", "unknown-resource"))

            service_info = rf.get("Service", {})
            action_info = service_info.get("Action", {})
            network_connection = action_info.get("NetworkConnectionAction", {})
            remote_ip = network_connection.get("RemoteIpDetails", {}).get("IpAddressV4")

            events.append(
                RuntimeThreatEvent(
                    threat_id=threat_id,
                    service="GuardDuty",
                    threat_type=threat_type,
                    affected_resource_id=res_id,
                    severity_score=float(rf.get("Severity", 7.0)),
                    description=rf.get("Description", rf.get("description", "Runtime threat detected")),
                    detected_at=rf.get("CreatedAt", rf.get("created_at", "2026-11-19T00:00:00Z")),
                    source_ip=remote_ip,
                )
            )
        return events

    def parse_security_hub_asff(self, raw_findings: List[Dict[str, Any]]) -> List[RuntimeThreatEvent]:
        events = []
        for finding in raw_findings:
            f_id = finding.get("Id", "")
            title = finding.get("Title", "Security Hub Finding")
            desc = finding.get("Description", "")
            resources = finding.get("Resources", [])
            target_id = resources[0].get("Id", "").split("/")[-1] if resources else "unknown"

            sev = finding.get("Severity", {}).get("Normalized", 50) / 10.0

            events.append(
                RuntimeThreatEvent(
                    threat_id=f_id,
                    service="SecurityHub",
                    threat_type=finding.get("Types", ["Software and Configuration Checks"])[0],
                    affected_resource_id=target_id,
                    severity_score=sev,
                    description=f"{title}: {desc}",
                    detected_at=finding.get("CreatedAt", "2026-11-19T00:00:00Z"),
                )
            )
        return events

    def correlate_threats_with_attack_paths(
        self,
        runtime_threats: List[RuntimeThreatEvent],
        attack_paths: List[AttackPath],
    ) -> List[SecurityFinding]:
        """
        Correlates runtime threats with known attack paths.
        If a runtime brute-force or privilege escalation alert matches an entry-point
        or intermediate hop on an evidenced attack path, generates an amplified CRITICAL finding.
        """
        correlated_findings = []

        # Index nodes in attack paths
        attack_path_nodes = set()
        for path in attack_paths:
            attack_path_nodes.add(path.entry_point)
            attack_path_nodes.add(path.target_asset)
            for hop in path.hops:
                attack_path_nodes.add(hop.source_node)
                attack_path_nodes.add(hop.target_node)

        for threat in runtime_threats:
            res_id = threat.affected_resource_id
            is_on_attack_path = res_id in attack_path_nodes or any(res_id in n for n in attack_path_nodes)

            if is_on_attack_path:
                correlated_findings.append(
                    SecurityFinding(
                        finding_id=f"CORR-THREAT-{threat.threat_id}",
                        rule_id="SEC-THREAT-01",
                        title=f"ACTIVE EXPLOIT DETECTED ON EVIDENCED ATTACK PATH: {threat.threat_type}",
                        description=(
                            f"Amazon GuardDuty / Security Hub detected active runtime threat '{threat.threat_type}' "
                            f"originating from {threat.source_ip or 'external network'} against resource '{res_id}'. "
                            f"This resource is actively situated on an evidenced lateral movement attack path!"
                        ),
                        severity=Severity.CRITICAL,
                        affected_resource_id=res_id,
                        affected_resource_type=ResourceType.EC2_INSTANCE,
                        remediation_recommendation=(
                            "IMMEDIATE INCIDENT RESPONSE: Sever inbound network routes, isolate instance via security group, "
                            "and revoke active instance profile session tokens."
                        ),
                        evidence_nodes=[res_id],
                        confidence=1.0,
                    )
                )
            else:
                sev = Severity.HIGH if threat.severity_score >= 7.0 else Severity.MEDIUM
                correlated_findings.append(
                    SecurityFinding(
                        finding_id=f"THREAT-{threat.threat_id}",
                        rule_id="SEC-THREAT-02",
                        title=f"External Posture Alert: {threat.threat_type}",
                        description=f"{threat.service} reported: {threat.description}",
                        severity=sev,
                        affected_resource_id=res_id,
                        affected_resource_type=ResourceType.UNKNOWN,
                        remediation_recommendation="Investigate threat event logs and review resource configuration.",
                        evidence_nodes=[res_id],
                        confidence=0.85,
                    )
                )

        return correlated_findings
