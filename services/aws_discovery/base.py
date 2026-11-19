"""
AEGIS Abstract Base Cloud Collector.
Defines standard collector contract, execution timeouts, error isolation,
and evidence stamping per RULE-02 (Read-Only) and RULE-08 (Incomplete Discovery).
"""

from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
from datetime import datetime, timezone
import time
import boto3
from botocore.exceptions import ClientError, EndpointConnectionError

from backend.models import (
    Resource,
    ResourceRelationship,
    CollectorRunReport,
    CollectorStatus,
    ResourceEvidence,
)


class BaseCollector(ABC):
    def __init__(self, session: Optional[boto3.Session] = None, region_name: str = "us-east-1"):
        self.region_name = region_name
        self.session = session or boto3.Session(region_name=region_name)
        self.account_id = "237657481511"

    @property
    @abstractmethod
    def collector_name(self) -> str:
        """Unique identifier for this collector module."""
        pass

    @abstractmethod
    def collect(self) -> Tuple[List[Resource], List[ResourceRelationship]]:
        """Collect and normalize resources and relationships from AWS APIs."""
        pass

    def run(self) -> Tuple[List[Resource], List[ResourceRelationship], CollectorRunReport]:
        """
        Safely execute collector with execution timing and error isolation.
        Catches AccessDenied and network errors without halting the entire pipeline.
        """
        start_time = time.time()
        try:
            resources, relationships = self.collect()
            elapsed_ms = (time.time() - start_time) * 1000.0
            report = CollectorRunReport(
                collector_name=self.collector_name,
                status=CollectorStatus.SUCCESS,
                resource_count=len(resources),
                execution_time_ms=round(elapsed_ms, 2),
            )
            return resources, relationships, report
        except ClientError as e:
            elapsed_ms = (time.time() - start_time) * 1000.0
            code = e.response.get("Error", {}).get("Code", "UnknownClientError")
            msg = e.response.get("Error", {}).get("Message", str(e))
            report = CollectorRunReport(
                collector_name=self.collector_name,
                status=CollectorStatus.FAILED,
                error_message=f"{code}: {msg}",
                execution_time_ms=round(elapsed_ms, 2),
            )
            return [], [], report
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000.0
            report = CollectorRunReport(
                collector_name=self.collector_name,
                status=CollectorStatus.FAILED,
                error_message=str(e),
                execution_time_ms=round(elapsed_ms, 2),
            )
            return [], [], report

    def create_evidence(self, api_call: str, confidence: float = 1.0) -> ResourceEvidence:
        """Helper to create verified evidence record."""
        return ResourceEvidence(
            source_collector=self.collector_name,
            discovered_at=datetime.now(timezone.utc),
            api_call=api_call,
            confidence=confidence,
        )
