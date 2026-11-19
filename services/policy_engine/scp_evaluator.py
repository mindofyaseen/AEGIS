"""
AEGIS — AWS Organizations Service Control Policy (SCP) Evaluation Engine
Evaluates organization-level guardrails, explicit Denies, and boundary mitigation.
Enforces Rule 01 (Cloud Boundaries), Rule 08 (Risk Verdict), Rule 10 (Adversarial Resistance).
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SCPRule(BaseModel):
    scp_id: str
    name: str
    description: str
    target_type: str  # ROOT, OU, ACCOUNT
    target_id: str
    effect: str       # Deny or Allow
    actions: List[str]
    resources: List[str] = Field(default_factory=lambda: ["*"])
    conditions: Dict[str, Any] = Field(default_factory=dict)


class SCPEvaluationResult(BaseModel):
    is_blocked: bool
    blocking_scp: Optional[SCPRule] = None
    reason: str
    mitigated: bool = False


class SCPEvaluator:
    """
    Evaluates AWS Organizations Service Control Policies (SCPs) against risky IAM operations.
    In AWS IAM, an explicit DENY in any inherited SCP in the organization hierarchy
    (Root -> OU -> Account) definitively blocks the action, preventing false-positive blocks.
    """

    def __init__(self, scps: Optional[List[SCPRule]] = None):
        self.scps: List[SCPRule] = scps or []

    def add_scp(self, scp: SCPRule) -> None:
        self.scps.append(scp)

    def evaluate_action(
        self,
        account_id: str,
        action: str,
        resource_arn: str = "*",
        context_vars: Optional[Dict[str, Any]] = None
    ) -> SCPEvaluationResult:
        """
        Evaluates whether an action attempted by a role in an account is blocked by an SCP.
        """
        context = context_vars or {}

        for scp in self.scps:
            # Check if effect is Deny
            if scp.effect.upper() != "DENY":
                continue

            # Check action match (supports wildcards like "s3:*" or "*")
            action_match = False
            for scp_action in scp.actions:
                if scp_action == "*" or scp_action == "*:*":
                    action_match = True
                    break
                if scp_action.lower() == action.lower():
                    action_match = True
                    break
                if scp_action.endswith("*"):
                    prefix = scp_action[:-1].lower()
                    if action.lower().startswith(prefix):
                        action_match = True
                        break

            if not action_match:
                continue

            # Check condition match if present (e.g., region lockdown or unauthorized principals)
            conditions_met = True
            if scp.conditions:
                for cond_type, cond_dict in scp.conditions.items():
                    if cond_type == "StringNotEquals":
                        for key, allowed_vals in cond_dict.items():
                            val = context.get(key)
                            if isinstance(allowed_vals, list):
                                if val in allowed_vals:
                                    conditions_met = False
                            elif val == allowed_vals:
                                conditions_met = False

            if conditions_met:
                return SCPEvaluationResult(
                    is_blocked=True,
                    blocking_scp=scp,
                    reason=f"Action '{action}' is explicitly denied by Service Control Policy '{scp.name}' ({scp.scp_id})",
                    mitigated=True
                )

        return SCPEvaluationResult(
            is_blocked=False,
            blocking_scp=None,
            reason=f"Action '{action}' is permitted under active Service Control Policies.",
            mitigated=False
        )

    def mitigate_finding_with_scp(self, account_id: str, finding: Any) -> Optional[str]:
        """
        Inspects finding and determines if an SCP mitigates the threat.
        """
        rule_action_map = {
            "SEC-RULE-02": "iam:*",
            "SEC-RULE-03": "s3:DeleteBucketPublicAccessBlock",
            "SEC-TF-02": "s3:DeleteBucketPublicAccessBlock",
            "SEC-CFN-03": "iam:*"
        }

        action = rule_action_map.get(getattr(finding, "rule_id", ""))
        if not action:
            return None

        result = self.evaluate_action(account_id, action)
        if result.is_blocked:
            return result.reason
        return None
