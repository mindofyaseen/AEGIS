"""
AEGIS Kubernetes & Amazon EKS Data Models.
Contracts for clusters, node groups, pod security, and RBAC evaluations.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class PSSStandard(str, Enum):
    PRIVILEGED = "PRIVILEGED"
    BASELINE = "BASELINE"
    RESTRICTED = "RESTRICTED"


class EKSClusterSummary(BaseModel):
    cluster_name: str
    arn: str
    version: str
    status: str
    endpoint: str
    public_access: bool = True
    private_access: bool = False
    oidc_issuer: Optional[str] = None
    created_at: str = ""
    logging_enabled_types: List[str] = Field(default_factory=list)
    nodegroups_count: int = 0


class WorkloadSecurityFinding(BaseModel):
    finding_id: str
    namespace: str
    workload_type: str  # Deployment, DaemonSet, Pod
    workload_name: str
    container_name: str
    rule_id: str
    title: str
    severity: str
    pss_violation: PSSStandard
    description: str
    remediation: str


class RBACBindingFinding(BaseModel):
    finding_id: str
    subject_kind: str  # ServiceAccount, User, Group
    subject_name: str
    namespace: Optional[str] = None
    role_name: str
    is_cluster_role: bool
    has_wildcard: bool = False
    grants_cluster_admin: bool = False
    severity: str = "HIGH"
    description: str
