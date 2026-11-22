"""
AEGIS Forensics & Incident Response Data Models.
Contracts for chronological timelines, blast radius traversal, and emergency containment SOPs.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ContainmentActionType(str, Enum):
    REVOKE_IAM_SESSIONS = "REVOKE_IAM_SESSIONS"
    DEACTIVATE_ACCESS_KEY = "DEACTIVATE_ACCESS_KEY"
    ISOLATE_EC2_SECURITY_GROUP = "ISOLATE_EC2_SECURITY_GROUP"
    LOCKDOWN_S3_BUCKET = "LOCKDOWN_S3_BUCKET"


class ForensicEventRecord(BaseModel):
    event_id: str
    timestamp: datetime
    event_name: str
    source_service: str
    actor_principal: str
    source_ip: str
    status: str  # Success, AccessDenied, Failed
    details: Dict[str, Any] = Field(default_factory=dict)


class BlastRadiusReport(BaseModel):
    target_entity: str
    total_reachable_resources: int
    critical_crown_jewels_at_risk: List[str] = Field(default_factory=list)
    lateral_movement_paths: List[List[str]] = Field(default_factory=list)
    max_path_depth: int = 0
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContainmentSOP(BaseModel):
    sop_id: str
    action_type: ContainmentActionType
    target_resource_arn: str
    title: str
    justification: str
    mutation_cli_command: str
    rollback_compensation_command: str
    requires_approval_role: str = "approver"
    staged_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
