"""
AEGIS Multi-Collector Discovery Orchestrator.
Manages concurrent or sequential execution of all AWS read-only collectors,
isolates failures, generates execution reports, and aggregates unified topology.
"""

import json
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import boto3

from backend.models import (
    Resource,
    ResourceRelationship,
    CollectorRunReport,
    CollectorStatus,
    ResourceType,
    ResourceEvidence,
)
from services.aws_discovery.ec2_collector import Ec2Collector
from services.aws_discovery.iam_collector import IamCollector
from services.aws_discovery.s3_collector import S3Collector

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "fixtures"


class DiscoveryOrchestrator:
    def __init__(
        self,
        session: Optional[boto3.Session] = None,
        region_name: str = "us-east-1",
        use_synthetic: bool = True,
    ):
        self.region_name = region_name
        self.session = session or boto3.Session(region_name=region_name)
        self.use_synthetic = use_synthetic
        self.collectors = [
            Ec2Collector(session=self.session, region_name=region_name),
            IamCollector(session=self.session, region_name=region_name),
            S3Collector(session=self.session, region_name=region_name),
        ]

    def discover(self) -> Tuple[List[Resource], List[ResourceRelationship], List[CollectorRunReport]]:
        """
        Execute discovery across all registered collectors or load synthetic baseline.
        """
        if self.use_synthetic:
            return self._load_synthetic_baseline()

        all_resources: List[Resource] = []
        all_relationships: List[ResourceRelationship] = []
        reports: List[CollectorRunReport] = []

        for collector in self.collectors:
            resources, relationships, report = collector.run()
            all_resources.extend(resources)
            all_relationships.extend(relationships)
            reports.append(report)

        return all_resources, all_relationships, reports

    def _load_synthetic_baseline(self) -> Tuple[List[Resource], List[ResourceRelationship], List[CollectorRunReport]]:
        """Load synthetic e-commerce VPC topology without making live cloud calls."""
        path = FIXTURES_DIR / "aws_topologies" / "ecommerce_vpc.json"
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        resources: List[Resource] = []
        for r in data.get("resources", []):
            resources.append(
                Resource(
                    resource_id=r["resource_id"],
                    resource_type=ResourceType(r["resource_type"]),
                    name=r.get("name"),
                    arn=r.get("arn"),
                    account_id=data.get("account_id", "237657481511"),
                    region=data.get("region", "us-east-1"),
                    configuration=r.get("configuration", {}),
                    tags=r.get("tags", {}),
                    evidence=ResourceEvidence(source_collector="synthetic_orchestrator", confidence=1.0),
                )
            )

        relationships: List[ResourceRelationship] = []
        for rel in data.get("relationships", []):
            relationships.append(
                ResourceRelationship(
                    source_id=rel["source_id"],
                    target_id=rel["target_id"],
                    relationship=rel["relationship"],
                    evidence=ResourceEvidence(source_collector="synthetic_orchestrator", confidence=1.0),
                )
            )

        reports = [
            CollectorRunReport(collector_name="vpc_collector", status=CollectorStatus.SUCCESS, resource_count=1),
            CollectorRunReport(collector_name="subnet_collector", status=CollectorStatus.SUCCESS, resource_count=2),
            CollectorRunReport(collector_name="route_table_collector", status=CollectorStatus.SUCCESS, resource_count=1),
            CollectorRunReport(collector_name="security_group_collector", status=CollectorStatus.SUCCESS, resource_count=1),
            CollectorRunReport(collector_name="iam_collector", status=CollectorStatus.SUCCESS, resource_count=2),
            CollectorRunReport(collector_name="s3_collector", status=CollectorStatus.SUCCESS, resource_count=1),
            CollectorRunReport(collector_name="ec2_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        ]

        return resources, relationships, reports
