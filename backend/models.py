"""
AEGIS Core Domain Data Contracts and Pydantic Schemas.
Implements provider-neutral models for AWS resources, graph relationships,
deterministic security findings, context completeness, and investigation verdicts.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ResourceType(str, Enum):
    VPC = "AWS::EC2::VPC"
    SUBNET = "AWS::EC2::Subnet"
    ROUTE_TABLE = "AWS::EC2::RouteTable"
    INTERNET_GATEWAY = "AWS::EC2::InternetGateway"
    NAT_GATEWAY = "AWS::EC2::NatGateway"
    SECURITY_GROUP = "AWS::EC2::SecurityGroup"
    NETWORK_INTERFACE = "AWS::EC2::NetworkInterface"
    EC2_INSTANCE = "AWS::EC2::Instance"
    IAM_ROLE = "AWS::IAM::Role"
    IAM_POLICY = "AWS::IAM::Policy"
    S3_BUCKET = "AWS::S3::Bucket"
    RDS_INSTANCE = "AWS::RDS::DBInstance"
    UNKNOWN = "AWS::Unknown::Resource"


class RelationshipType(str, Enum):
    CONTAINS = "CONTAINS"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    ROUTES_TO = "ROUTES_TO"
    ATTACHED_TO = "ATTACHED_TO"
    APPLIES_TO = "APPLIES_TO"
    ASSUMES = "ASSUMES"
    HAS_POLICY = "HAS_POLICY"
    GRANTS = "GRANTS"
    DEPENDS_ON = "DEPENDS_ON"


class CollectorStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    NOT_REQUESTED = "NOT_REQUESTED"
    STALE = "STALE"


class Verdict(str, Enum):
    BLOCK = "BLOCK"
    INSUFFICIENT_CONTEXT = "INSUFFICIENT_CONTEXT"
    READY_FOR_HUMAN_REVIEW = "READY_FOR_HUMAN_REVIEW"


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class ResourceEvidence(BaseModel):
    source_collector: str
    discovered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    api_call: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    raw_reference: Optional[str] = None


class Resource(BaseModel):
    resource_id: str
    resource_type: ResourceType
    name: Optional[str] = None
    arn: Optional[str] = None
    account_id: str = "237657481511"
    region: str = "us-east-1"
    configuration: Dict[str, Any] = Field(default_factory=dict)
    tags: Dict[str, str] = Field(default_factory=dict)
    evidence: ResourceEvidence


class ResourceRelationship(BaseModel):
    source_id: str
    target_id: str
    relationship: RelationshipType
    evidence: ResourceEvidence
    inferred: bool = False


class CollectorRunReport(BaseModel):
    collector_name: str
    status: CollectorStatus
    resource_count: int = 0
    error_message: Optional[str] = None
    execution_time_ms: float = 0.0


class ContextCompleteness(BaseModel):
    completeness_score: float = Field(default=1.0, ge=0.0, le=1.0)
    total_collectors_run: int = 0
    successful_collectors: int = 0
    failed_collectors: List[str] = Field(default_factory=list)
    missing_critical_evidence: List[str] = Field(default_factory=list)
    stale_snapshots_detected: bool = False
    unresolved_dependencies: List[str] = Field(default_factory=list)
    verdict_eligible: bool = True
    explanation: str = "Context completeness evaluated."


class SecurityFinding(BaseModel):
    finding_id: str
    rule_id: str
    title: str
    description: str
    severity: Severity
    affected_resource_id: str
    affected_resource_type: ResourceType
    remediation_recommendation: str
    evidence_nodes: List[str] = Field(default_factory=list)
    confidence: float = 1.0


class AttackPathHop(BaseModel):
    hop_index: int
    source_node: str
    target_node: str
    relationship: str
    description: str
    evidenced: bool = True
    assumptions: List[str] = Field(default_factory=list)


class AttackPath(BaseModel):
    path_id: str
    title: str
    severity: Severity
    entry_point: str
    target_asset: str
    hops: List[AttackPathHop]
    is_fully_evidenced: bool = True
    narrative: str


class RemediationPatch(BaseModel):
    target_resource_id: str
    suggested_action: str
    terraform_patch: Optional[str] = None
    cli_command_preview: Optional[str] = None
    rollback_plan: str
    verification_steps: List[str] = Field(default_factory=list)


class InvestigationReport(BaseModel):
    investigation_id: str
    account_id: str
    region: str
    investigated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verdict: Verdict
    verdict_reason: str
    context_completeness: ContextCompleteness
    total_resources: int
    total_findings: int
    critical_findings: int
    findings: List[SecurityFinding] = Field(default_factory=list)
    attack_paths: List[AttackPath] = Field(default_factory=list)
    remediation_patches: List[RemediationPatch] = Field(default_factory=list)
    agent_reasoning_summary: str
    enforced_rules_evaluated: List[str] = Field(default_factory=list)
    business_impact_summary: Optional[str] = None
    estimated_financial_exposure: Optional[str] = None
    customer_data_at_risk: Optional[bool] = None
