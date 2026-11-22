"""
AEGIS Emergency Containment SOP Generator.
Synthesizes verified, deterministic containment actions with corresponding compensation rollback runbooks.
"""

import uuid
from typing import List, Dict, Any
from services.forensics.models import ContainmentSOP, ContainmentActionType


class ContainmentSOPGenerator:
    """Generates emergency containment playbooks requiring Mode 2 human approval."""

    def generate_iam_containment(self, user_name: str, access_key_id: str) -> ContainmentSOP:
        return ContainmentSOP(
            sop_id=f"sop-{uuid.uuid4().hex[:8]}",
            action_type=ContainmentActionType.DEACTIVATE_ACCESS_KEY,
            target_resource_arn=f"arn:aws:iam::237657481511:user/{user_name}",
            title=f"Deactivate Leaked Access Key {access_key_id}",
            justification=f"Compromised credential detected by GuardDuty; deactivation prevents lateral control plane abuse.",
            mutation_cli_command=f"aws iam update-access-key --user-name {user_name} --access-key-id {access_key_id} --status Inactive",
            rollback_compensation_command=f"aws iam update-access-key --user-name {user_name} --access-key-id {access_key_id} --status Active",
            requires_approval_role="approver",
        )

    def generate_ec2_quarantine(self, instance_id: str) -> ContainmentSOP:
        return ContainmentSOP(
            sop_id=f"sop-{uuid.uuid4().hex[:8]}",
            action_type=ContainmentActionType.ISOLATE_EC2_SECURITY_GROUP,
            target_resource_arn=f"arn:aws:ec2:us-east-1:237657481511:instance/{instance_id}",
            title=f"Quarantine Host {instance_id}",
            justification=f"Reverse shell or crypto-mining activity detected on instance; quarantine severs C2 network connections.",
            mutation_cli_command=f"aws ec2 modify-instance-attribute --instance-id {instance_id} --groups sg-quarantine-isolated",
            rollback_compensation_command=f"aws ec2 modify-instance-attribute --instance-id {instance_id} --groups sg-original-production",
            requires_approval_role="approver",
        )
