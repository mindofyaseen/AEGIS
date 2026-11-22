"""
AEGIS Application Security Domain Models and Pydantic Schemas.
Covers SAST, SCA, Secret Scanning, and CycloneDX SBOM models.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AppSecCategory(str, Enum):
    SAST = "SAST"
    SECRETS = "SECRETS"
    SCA = "SCA"
    SBOM = "SBOM"


class VulnSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFORMATIONAL"


class CodeLocation(BaseModel):
    file_path: str
    start_line: int
    end_line: Optional[int] = None
    start_col: Optional[int] = None
    end_col: Optional[int] = None
    snippet: Optional[str] = None


class AppSecFinding(BaseModel):
    finding_id: str
    category: AppSecCategory
    title: str
    severity: VulnSeverity
    rule_id: str
    description: str
    remediation_guidance: str
    location: CodeLocation
    cwe: Optional[str] = None
    cve: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    discovered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw_evidence: Optional[Dict[str, Any]] = None


class SBOMComponent(BaseModel):
    name: str
    version: str
    purl: str
    type: str  # library, framework, container
    license: Optional[str] = "Unknown"
    direct_dependency: bool = True
    vulnerabilities: List[str] = Field(default_factory=list)


class AppSecScanReport(BaseModel):
    scan_id: str
    repository: str
    commit_sha: Optional[str] = None
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_files_scanned: int = 0
    duration_seconds: float = 0.0
    findings: List[AppSecFinding] = Field(default_factory=list)
    sbom_components: List[SBOMComponent] = Field(default_factory=list)
    summary_by_severity: Dict[str, int] = Field(default_factory=dict)
    clean_sandbox_verified: bool = True
