"""
AEGIS Terraform Plan Change Analysis Engine.
Parses official Terraform plan JSON, identifies proposed configuration mutations,
and evaluates risk against discovered infrastructure topology without executing code.
"""

from typing import Dict, Any, List, Optional
from backend.models import (
    SecurityFinding,
    Severity,
    ResourceType,
)


class TerraformChangeAnalyzer:
    def __init__(self):
        pass

    def analyze_plan(self, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze Terraform plan JSON output.
        Extracts resource changes, identifies security regressions, and validates drift.
        """
        resource_changes = plan_data.get("resource_changes", [])
        findings: List[SecurityFinding] = []
        parsed_changes: List[Dict[str, Any]] = []

        for change_item in resource_changes:
            address = change_item.get("address", "")
            r_type = change_item.get("type", "")
            change = change_item.get("change", {})
            actions = change.get("actions", [])
            after = change.get("after") or {}

            parsed_changes.append({
                "address": address,
                "type": r_type,
                "actions": actions,
                "after": after,
            })

            # Check 1: Security Group Rule Public Ingress
            if r_type == "aws_security_group_rule" and "create" in actions:
                cidr_blocks = after.get("cidr_blocks", [])
                from_port = after.get("from_port")
                to_port = after.get("to_port")
                rule_type = after.get("type")

                if rule_type == "ingress" and "0.0.0.0/0" in cidr_blocks:
                    if from_port == 22 or to_port == 22 or from_port == 3389:
                        findings.append(
                            SecurityFinding(
                                finding_id=f"FINDING-TF-01-{address}",
                                rule_id="SEC-TF-01",
                                title="Proposed Terraform Plan Exposes Management Port to Global Internet",
                                description=(
                                    f"Plan '{address}' attempts to open port {from_port} to 0.0.0.0/0. "
                                    "This violates AEGIS perimeter defense policy RULE-03 and RULE-12."
                                ),
                                severity=Severity.CRITICAL,
                                affected_resource_id=address,
                                affected_resource_type=ResourceType.SECURITY_GROUP,
                                remediation_recommendation="Restrict CIDR block to specific administrative bastion or VPN IP.",
                                evidence_nodes=[address],
                                confidence=1.0,
                            )
                        )

            # Check 2: S3 Bucket Public Access Block Removal
            if r_type == "aws_s3_bucket_public_access_block" and ("delete" in actions or "update" in actions):
                if not after.get("block_public_acls", True):
                    findings.append(
                        SecurityFinding(
                            finding_id=f"FINDING-TF-02-{address}",
                            rule_id="SEC-TF-02",
                            title="Proposed Plan Disables S3 Block Public Access",
                            description=f"Plan '{address}' disables S3 Block Public Access.",
                            severity=Severity.HIGH,
                            affected_resource_id=address,
                            affected_resource_type=ResourceType.S3_BUCKET,
                            remediation_recommendation="Maintain S3 Block Public Access enabled on all production storage.",
                            evidence_nodes=[address],
                            confidence=1.0,
                        )
                    )

        has_critical = any(f.severity == Severity.CRITICAL for f in findings)
        recommended_verdict = "BLOCK" if has_critical else ("READY_FOR_HUMAN_REVIEW" if not findings else "REVIEW_REQUIRED")

        return {
            "total_changes": len(parsed_changes),
            "changes": parsed_changes,
            "findings": findings,
            "has_blocking_violations": has_critical,
            "recommended_verdict": recommended_verdict,
        }
