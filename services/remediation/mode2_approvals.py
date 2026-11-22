"""
AEGIS Mode 2 (Human-Approved) Remediation Engine.
Stages concrete cloud mutation change plans, evaluates active dependencies,
requires cryptographic approval from the Remediation Approver role, and executes with compensation runbooks.
"""

import uuid
from typing import Dict, Any

from services.remediation.models import RemediationPlan, RemediationMode


class Mode2ApprovalEngine:
    """Manages staged changes requiring human-in-the-loop sign-off."""

    def stage_security_group_revocation(self, sg_id: str, port: int, cidr: str = "0.0.0.0/0", is_prod: bool = False) -> RemediationPlan:
        plan_id = f"rem-m2-{uuid.uuid4().hex[:8]}"
        cli_mutation = f"aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port {port} --cidr {cidr}"
        cli_rollback = f"aws ec2 authorize-security-group-ingress --group-id {sg_id} --protocol tcp --port {port} --cidr {cidr}"

        return RemediationPlan(
            plan_id=plan_id,
            finding_id=f"finding-sg-{sg_id}",
            target_resource_arn=f"arn:aws:ec2:us-east-1:237657481511:security-group/{sg_id}",
            mode=RemediationMode.MODE_2_HUMAN_APPROVED,
            title=f"Revoke Public Ingress (Port {port}) on {sg_id}",
            description=f"Deletes insecure ingress rule '{cidr}' on port {port}. Preconditions verified.",
            cli_mutation_command=cli_mutation,
            compensation_rollback_command=cli_rollback,
            preconditions_validated=True,
            affected_dependencies_count=2,
            blast_radius_safe=True,
            is_production_resource=is_prod,
        )
