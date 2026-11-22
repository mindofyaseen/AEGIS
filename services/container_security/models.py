"""
AEGIS Container Security Data Models and Contracts.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ContainerVulnSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNKNOWN = "UNKNOWN"


class ContainerVulnerability(BaseModel):
    vulnerability_id: str  # e.g. CVE-2023-1234
    package_name: str
    installed_version: str
    fixed_version: Optional[str] = None
    severity: ContainerVulnSeverity
    description: str
    cvss_score: Optional[float] = None
    layer_id: Optional[str] = None


class ContainerImageReport(BaseModel):
    repository_name: str
    image_tag: str
    image_digest: str
    registry_id: str
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_vulnerabilities: int = 0
    vulnerabilities: List[ContainerVulnerability] = Field(default_factory=list)
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0


class DockerfileFinding(BaseModel):
    rule_id: str
    title: str
    severity: str
    line_number: int
    instruction: str
    description: str
    remediation: str
