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

            # Check 1: aws_security_group_rule with 0.0.0.0/0 on port 22 or 3389
            if r_type == "aws_security_group_rule" and ("create" in actions or "update" in actions):
                cidr_blocks = after.get("cidr_blocks") or []
                from_port = after.get("from_port")
                to_port = after.get("to_port")
                rule_type = after.get("type", "ingress")

                if rule_type == "ingress" and "0.0.0.0/0" in cidr_blocks:
                    if from_port == 22 or to_port == 22 or from_port == 3389 or to_port == 3389:
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

            # Check 2: aws_security_group with inline ingress rules
            elif r_type == "aws_security_group" and ("create" in actions or "update" in actions):
                ingress_rules = after.get("ingress") or []
                for rule in ingress_rules:
                    cidr_blocks = rule.get("cidr_blocks") or []
                    from_port = rule.get("from_port")
                    to_port = rule.get("to_port")
                    if "0.0.0.0/0" in cidr_blocks and (from_port == 22 or to_port == 22 or from_port == 3389):
                        findings.append(
                            SecurityFinding(
                                finding_id=f"FINDING-TF-01-{address}",
                                rule_id="SEC-TF-01",
                                title="Proposed Security Group Ingress Exposes Management Port Globally",
                                description=f"Plan '{address}' contains inline ingress rule opening port {from_port} to 0.0.0.0/0.",
                                severity=Severity.CRITICAL,
                                affected_resource_id=address,
                                affected_resource_type=ResourceType.SECURITY_GROUP,
                                remediation_recommendation="Restrict CIDR block to authorized corporate network.",
                                evidence_nodes=[address],
                                confidence=1.0,
                            )
                        )

            # Check 3: S3 Bucket Public Access Block Removal or Disabling
            if r_type == "aws_s3_bucket_public_access_block":
                is_deleted = "delete" in actions
                is_disabled = ("update" in actions or "create" in actions) and (
                    not after.get("block_public_acls", True)
                    or not after.get("block_public_policy", True)
                    or not after.get("ignore_public_acls", True)
                    or not after.get("restrict_public_buckets", True)
                )

                if is_deleted or is_disabled:
                    findings.append(
                        SecurityFinding(
                            finding_id=f"FINDING-TF-02-{address}",
                            rule_id="SEC-TF-02",
                            title="Proposed Plan Disables or Destroys S3 Block Public Access",
                            description=f"Plan '{address}' {'deletes' if is_deleted else 'disables'} S3 Block Public Access protection.",
                            severity=Severity.CRITICAL,
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
