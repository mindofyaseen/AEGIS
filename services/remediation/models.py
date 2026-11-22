"""
AEGIS Remediation Domain Models.
Contracts for 3-Tier Remediation progression, change plans, and atomic state transitions.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class RemediationMode(str, Enum):
    MODE_1_ADVISORY = "MODE_1_ADVISORY"
    MODE_2_HUMAN_APPROVED = "MODE_2_HUMAN_APPROVED"
    MODE_3_AUTONOMOUS = "MODE_3_AUTONOMOUS"


class RemediationTxStatus(str, Enum):
    PROPOSED = "PROPOSED"
    STAGED = "STAGED"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"


class RemediationPlan(BaseModel):
    plan_id: str
    finding_id: str
    target_resource_arn: str
    mode: RemediationMode
    title: str
    description: str
    terraform_patch_diff: Optional[str] = None
    cli_mutation_command: Optional[str] = None
    compensation_rollback_command: Optional[str] = None
    preconditions_validated: bool = False
    affected_dependencies_count: int = 0
    blast_radius_safe: bool = True
    is_production_resource: bool = False
    status: RemediationTxStatus = RemediationTxStatus.PROPOSED
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
