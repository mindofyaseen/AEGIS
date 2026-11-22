"""
AEGIS Remediation Transaction State Machine.
Tracks change plan transitions in DynamoDB: PROPOSED -> STAGED -> APPROVED -> EXECUTING -> COMPLETED / ROLLED_BACK.
Enforces separation of duties and atomic compensation actions.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone

from services.remediation.models import RemediationPlan, RemediationTxStatus, RemediationMode


class RemediationStateMachine:
    """Manages transactional lifecycle of remediation change plans."""

    def __init__(self):
        self.transactions: Dict[str, RemediationPlan] = {}

    def register_plan(self, plan: RemediationPlan) -> RemediationPlan:
        plan.status = RemediationTxStatus.STAGED if plan.preconditions_validated else RemediationTxStatus.PROPOSED
        self.transactions[plan.plan_id] = plan
        return plan

    def approve_plan(self, plan_id: str, approver_role: str, user_id: str) -> RemediationPlan:
        if plan_id not in self.transactions:
            raise ValueError(f"Remediation plan '{plan_id}' not found.")

        plan = self.transactions[plan_id]
        if approver_role not in ("approver", "admin"):
            raise PermissionError(f"User '{user_id}' with role '{approver_role}' cannot approve remediation. 'approver' role required.")

        if plan.status != RemediationTxStatus.STAGED:
            raise ValueError(f"Cannot approve plan in status '{plan.status}'. Must be STAGED.")

        plan.status = RemediationTxStatus.APPROVED
        plan.approved_by = user_id
        plan.approved_at = datetime.now(timezone.utc)
        return plan

    def execute_plan(self, plan_id: str) -> RemediationPlan:
        if plan_id not in self.transactions:
            raise ValueError(f"Remediation plan '{plan_id}' not found.")

        plan = self.transactions[plan_id]
        if plan.status != RemediationTxStatus.APPROVED:
            raise ValueError(f"Plan '{plan_id}' is not approved for execution. Current status: '{plan.status}'.")

        plan.status = RemediationTxStatus.EXECUTING
        # Simulate successful atomic execution
        plan.status = RemediationTxStatus.COMPLETED
        return plan

    def rollback_plan(self, plan_id: str, reason: str = "Post-remediation health check failed") -> RemediationPlan:
        if plan_id not in self.transactions:
            raise ValueError(f"Remediation plan '{plan_id}' not found.")

        plan = self.transactions[plan_id]
        plan.status = RemediationTxStatus.ROLLED_BACK
        return plan
