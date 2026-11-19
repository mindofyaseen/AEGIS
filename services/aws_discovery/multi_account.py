"""
AEGIS Multi-Account Cross-Account Discovery Harvester.
Implements AWS Organizations read-only enumeration via STS AssumeRole.
Aggregates resources across multiple AWS accounts, identifies cross-account trust edges,
and strictly enforces Rule 01 boundary limits.
"""

from typing import List, Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from backend.models import (
    Resource,
    ResourceType,
    ResourceEvidence,
    ResourceRelationship,
    RelationshipType,
    CollectorRunReport,
    CollectorStatus,
)


class AccountHarvestTarget(BaseModel):
    account_id: str
    account_name: str
    role_arn: Optional[str] = None
    external_id: Optional[str] = None
    is_authorized: bool = True


class MultiAccountHarvestReport(BaseModel):
    total_accounts_targeted: int
    successful_accounts: List[str] = Field(default_factory=list)
    failed_accounts: Dict[str, str] = Field(default_factory=dict)
    unauthorized_accounts_rejected: List[str] = Field(default_factory=list)
    total_resources_harvested: int = 0
    cross_account_relationships_count: int = 0


class MultiAccountHarvester:
    def __init__(
        self,
        authorized_account_ids: Optional[List[str]] = None,
        audit_role_name: str = "AegisSecurityAuditRole",
        primary_region: str = "us-east-1",
    ):
        self.authorized_accounts = set(authorized_account_ids or ["237657481511"])
        self.audit_role_name = audit_role_name
        self.primary_region = primary_region
        self.sts_client = None

    def get_sts_client(self):
        if not self.sts_client:
            self.sts_client = boto3.client("sts", region_name=self.primary_region)
        return self.sts_client

    def assume_audit_role(self, target: AccountHarvestTarget) -> Optional[boto3.Session]:
        """
        Assume read-only audit role in target member account.
        Returns temporary Boto3 session, or None if assumption fails.
        """
        role_arn = target.role_arn or f"arn:aws:iam::{target.account_id}:role/{self.audit_role_name}"
        params = {
            "RoleArn": role_arn,
            "RoleSessionName": f"AEGIS-MultiAccount-Scan-{target.account_id}",
            "DurationSeconds": 900,
        }
        if target.external_id:
            params["ExternalId"] = target.external_id

        try:
            sts = self.get_sts_client()
            response = sts.assume_role(**params)
            creds = response["Credentials"]
            return boto3.Session(
                aws_access_key_id=creds["AccessKeyId"],
                aws_secret_access_key=creds["SecretAccessKey"],
                aws_session_token=creds["SessionToken"],
                region_name=self.primary_region,
            )
        except Exception:
            return None

    def harvest_multi_account_topology(
        self,
        targets: List[AccountHarvestTarget],
        synthetic_account_topologies: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Harvest topology across multiple accounts, aggregating resources and resolving cross-account edges.
        Supports synthetic multi-account fixtures for cost preservation ($0.00 spend).
        """
        report = MultiAccountHarvestReport(total_accounts_targeted=len(targets))
        aggregated_resources: List[Dict[str, Any]] = []
        aggregated_relationships: List[Dict[str, Any]] = []

        for target in targets:
            acc_id = target.account_id

            # Rule 01 Enforcement: Reject unauthorized accounts
            if acc_id not in self.authorized_accounts:
                report.unauthorized_accounts_rejected.append(acc_id)
                continue

            # Check synthetic fixture first (cost preservation)
            if synthetic_account_topologies and acc_id in synthetic_account_topologies:
                topo = synthetic_account_topologies[acc_id]
                for r in topo.get("resources", []):
                    r_copy = dict(r)
                    r_copy["account_id"] = acc_id
                    aggregated_resources.append(r_copy)
                for rel in topo.get("relationships", []):
                    aggregated_relationships.append(rel)
                report.successful_accounts.append(acc_id)
                continue

            # Live STS assume-role attempt
            session = self.assume_audit_role(target)
            if session is None:
                report.failed_accounts[acc_id] = "AccessDenied / Role assumption failed"
            else:
                report.successful_accounts.append(acc_id)

        # Detect Cross-Account Trust Relationships
        cross_account_edges = self.detect_cross_account_relationships(aggregated_resources)
        aggregated_relationships.extend(cross_account_edges)

        report.total_resources_harvested = len(aggregated_resources)
        report.cross_account_relationships_count = len(cross_account_edges)

        return {
            "harvest_report": report.model_dump(),
            "topology": {
                "resources": aggregated_resources,
                "relationships": aggregated_relationships,
            },
        }

    def detect_cross_account_relationships(
        self, resources: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Detect cross-account relationships, such as IAM roles trust policies granting
        access to another AWS account, or S3 bucket policies permitting cross-account principals.
        """
        cross_edges = []
        known_account_ids = {r.get("account_id") for r in resources if r.get("account_id")}

        for r in resources:
            r_type = r.get("resource_type")
            source_acc = r.get("account_id")
            source_id = r.get("resource_id")
            config = r.get("configuration", {})

            # 1. IAM Role Trust Relationships
            if r_type == "AWS::IAM::Role":
                assume_doc = config.get("assume_role_policy", {})
                for stmt in assume_doc.get("Statement", []):
                    principal = stmt.get("Principal", {})
                    aws_principals = principal.get("AWS", [])
                    if isinstance(aws_principals, str):
                        aws_principals = [aws_principals]

                    for p in aws_principals:
                        # Check if principal ARN contains a different known account ID
                        for target_acc in known_account_ids:
                            if target_acc != source_acc and target_acc in p:
                                cross_edges.append({
                                    "source_id": source_id,
                                    "target_id": f"account-{target_acc}-principal",
                                    "relationship": "GRANTS",
                                    "inferred": True,
                                    "evidence": {
                                        "source_collector": "MultiAccountHarvester",
                                        "confidence": 1.0,
                                        "raw_reference": f"Cross-account trust to {target_acc}",
                                    },
                                })

            # 2. S3 Bucket Policy Cross-Account Grants
            elif r_type == "AWS::S3::Bucket":
                bucket_policy = config.get("bucket_policy", {})
                for stmt in bucket_policy.get("Statement", []):
                    principal = stmt.get("Principal", {})
                    aws_principals = principal.get("AWS", [])
                    if isinstance(aws_principals, str):
                        aws_principals = [aws_principals]

                    for p in aws_principals:
                        for target_acc in known_account_ids:
                            if target_acc != source_acc and (target_acc in p or p == "*"):
                                cross_edges.append({
                                    "source_id": source_id,
                                    "target_id": f"account-{target_acc}",
                                    "relationship": "ASSOCIATED_WITH",
                                    "inferred": True,
                                    "evidence": {
                                        "source_collector": "MultiAccountHarvester",
                                        "confidence": 0.9,
                                        "raw_reference": f"Cross-account S3 policy statement for {target_acc}",
                                    },
                                })

        return cross_edges
