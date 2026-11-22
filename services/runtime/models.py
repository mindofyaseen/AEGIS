"""
AEGIS Runtime Threat Streaming Models.
Contracts for Amazon EventBridge security events, GuardDuty findings, and threat elevation scores.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class RuntimeFindingSeverity(str, Enum):
    P0_CRITICAL_ACTIVE_BREACH = "P0_CRITICAL_ACTIVE_BREACH"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class RuntimeSecurityEvent(BaseModel):
    event_id: str
    source: str  # aws.guardduty, aws.securityhub, aws.cloudtrail
    event_type: str
    resource_arn: str
    resource_type: str
    raw_severity: float  # GuardDuty 0.0 - 10.0 scale
    normalized_severity: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actor_ip: Optional[str] = None
    actor_asn: Optional[str] = None
    action_type: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class CorrelatedThreat(BaseModel):
    threat_id: str
    resource_arn: str
    associated_node_id: Optional[str] = None
    static_vulnerabilities_count: int = 0
    on_attack_path: bool = False
    base_severity: str
    elevated_priority: RuntimeFindingSeverity
    elevation_rationale: str
    recommended_action: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
