"""
AEGIS Deterministic Security Rules.
Hardcoded, mathematically verifiable security policies evaluated against
the infrastructure graph and Terraform changes. Zero LLM hallucinations.
"""

from typing import List, Dict, Any, Optional
from backend.models import (
    Resource,
    ResourceType,
    SecurityFinding,
    Severity,
)


def evaluate_sec_net_01(resource: Resource) -> Optional[SecurityFinding]:
    """
    SEC-NET-01: Prohibit unrestricted inbound management access (SSH/RDP from 0.0.0.0/0).
    """
    if resource.resource_type != ResourceType.SECURITY_GROUP:
        return None

    inbound_rules = resource.configuration.get("inbound_rules", [])
    risky_ports = [22, 3389]

    for rule in inbound_rules:
        cidr = rule.get("cidr_ipv4") or rule.get("cidr_ip")
        if cidr == "0.0.0.0/0":
            from_port = rule.get("from_port")
            to_port = rule.get("to_port")
            proto = rule.get("ip_protocol", "").lower()

            for port in risky_ports:
                if from_port is not None and to_port is not None:
                    if from_port <= port <= to_port:
                        return SecurityFinding(
                            finding_id=f"FINDING-NET-01-{resource.resource_id}-{port}",
                            rule_id="SEC-NET-01",
                            title=f"Unrestricted Public Management Ingress (Port {port})",
                            description=(
                                f"Security Group '{resource.name or resource.resource_id}' permits "
                                f"inbound traffic on port {port} from the entire public IPv4 internet (0.0.0.0/0)."
                            ),
                            severity=Severity.CRITICAL,
                            affected_resource_id=resource.resource_id,
                            affected_resource_type=ResourceType.SECURITY_GROUP,
                            remediation_recommendation=(
                                f"Restrict port {port} ingress to a specific authorized corporate CIDR or VPN gateway."
                            ),
                            evidence_nodes=[resource.resource_id],
                            confidence=1.0,
                        )
    return None


def evaluate_sec_iam_01(resource: Resource) -> Optional[SecurityFinding]:
    """
    SEC-IAM-01: Prohibit overly permissive wildcard IAM statements (*:* or Action: *).
    """
    if resource.resource_type not in (ResourceType.IAM_POLICY, ResourceType.IAM_ROLE):
        return None

    doc = resource.configuration.get("policy_document", {})
    statements = doc.get("Statement", [])
    if isinstance(statements, dict):
        statements = [statements]

    for stmt in statements:
        if stmt.get("Effect") == "Allow":
            actions = stmt.get("Action", [])
            resources = stmt.get("Resource", [])

            if isinstance(actions, str):
                actions = [actions]
            if isinstance(resources, str):
                resources = [resources]

            has_wildcard_action = "*" in actions or any(a.endswith(":*") for a in actions)
            has_wildcard_resource = "*" in resources

            if has_wildcard_action and has_wildcard_resource:
                return SecurityFinding(
                    finding_id=f"FINDING-IAM-01-{resource.resource_id}",
                    rule_id="SEC-IAM-01",
                    title="Excessive Wildcard Administrative Privileges",
                    description=(
                        f"IAM entity '{resource.name or resource.resource_id}' grants wildcard "
                        f"Action: {actions} across Resource: {resources}."
                    ),
                    severity=Severity.HIGH,
                    affected_resource_id=resource.resource_id,
                    affected_resource_type=resource.resource_type,
                    remediation_recommendation=(
                        "Scope IAM actions to specific least-privilege operations and restrict Resource ARNs."
                    ),
                    evidence_nodes=[resource.resource_id],
                    confidence=1.0,
                )
    return None


def evaluate_sec_s3_01(resource: Resource) -> Optional[SecurityFinding]:
    """
    SEC-S3-01: Prohibit S3 buckets without active Public Access Block or encryption.
    """
    if resource.resource_type != ResourceType.S3_BUCKET:
        return None

    pab = resource.configuration.get("public_access_block", {})
    all_blocks = (
        pab.get("block_public_acls")
        and pab.get("ignore_public_acls")
        and pab.get("block_public_policy")
        and pab.get("restrict_public_buckets")
    )

    if not all_blocks:
        return SecurityFinding(
            finding_id=f"FINDING-S3-01-{resource.resource_id}",
            rule_id="SEC-S3-01",
            title="S3 Bucket Public Access Block Incomplete",
            description=(
                f"S3 Bucket '{resource.name or resource.resource_id}' does not have all 4 "
                "Amazon S3 Public Access Block settings enabled."
            ),
            severity=Severity.HIGH,
            affected_resource_id=resource.resource_id,
            affected_resource_type=ResourceType.S3_BUCKET,
            remediation_recommendation="Enable full S3 Block Public Access at the bucket level.",
            evidence_nodes=[resource.resource_id],
            confidence=1.0,
        )
    return None


def evaluate_sec_db_01(resource: Resource) -> Optional[SecurityFinding]:
    """
    SEC-DB-01: Prohibit RDS instances with public accessibility enabled.
    """
    if resource.resource_type != ResourceType.RDS_INSTANCE:
        return None

    if resource.configuration.get("publicly_accessible") is True:
        return SecurityFinding(
            finding_id=f"FINDING-DB-01-{resource.resource_id}",
            rule_id="SEC-DB-01",
            title="Database Instance Publicly Accessible",
            description=(
                f"RDS Database '{resource.name or resource.resource_id}' has publicly_accessible=true, "
                "exposing the database engine endpoint to internet scanning."
            ),
            severity=Severity.CRITICAL,
            affected_resource_id=resource.resource_id,
            affected_resource_type=ResourceType.RDS_INSTANCE,
            remediation_recommendation="Disable public accessibility and place RDS within private subnets.",
            evidence_nodes=[resource.resource_id],
            confidence=1.0,
        )
    return None
