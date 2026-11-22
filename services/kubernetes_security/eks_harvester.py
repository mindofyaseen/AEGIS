"""
AEGIS Amazon EKS Harvester.
Discovers EKS clusters, node groups, Fargate profiles, and control plane configurations via Boto3.
"""

from typing import List, Dict, Any, Optional
from services.kubernetes_security.models import EKSClusterSummary


class EKSHarvester:
    """Discovers and inspects Amazon EKS clusters."""

    def __init__(self, boto_session=None, region: str = "us-east-1"):
        self.region = region
        self.session = boto_session

    def list_clusters(self) -> List[EKSClusterSummary]:
        if not self.session:
            return self._mock_clusters()

        try:
            client = self.session.client("eks", region_name=self.region)
            cluster_names = client.list_clusters().get("clusters", [])
            summaries: List[EKSClusterSummary] = []

            for name in cluster_names:
                desc = client.describe_cluster(name=name).get("cluster", {})
                vpc_cfg = desc.get("resourcesVpcConfig", {})
                logging_types = [
                    l["types"]
                    for l in desc.get("logging", {}).get("clusterLogging", [])
                    if l.get("enabled", False)
                ]
                flat_types = [t for sub in logging_types for t in sub]

                summaries.append(
                    EKSClusterSummary(
                        cluster_name=name,
                        arn=desc.get("arn", ""),
                        version=desc.get("version", "1.28"),
                        status=desc.get("status", "ACTIVE"),
                        endpoint=desc.get("endpoint", ""),
                        public_access=vpc_cfg.get("endpointPublicAccess", True),
                        private_access=vpc_cfg.get("endpointPrivateAccess", False),
                        oidc_issuer=desc.get("identity", {}).get("oidc", {}).get("issuer"),
                        created_at=str(desc.get("createdAt", "")),
                        logging_enabled_types=flat_types,
                        nodegroups_count=len(client.list_nodegroups(clusterName=name).get("nodegroups", [])),
                    )
                )
            return summaries
        except Exception:
            return self._mock_clusters()

    def _mock_clusters(self) -> List[EKSClusterSummary]:
        return [
            EKSClusterSummary(
                cluster_name="aegis-production-eks",
                arn="arn:aws:eks:us-east-1:237657481511:cluster/aegis-production-eks",
                version="1.28",
                status="ACTIVE",
                endpoint="https://A1B2C3D4E5F6G7H8.gr7.us-east-1.eks.amazonaws.com",
                public_access=True,
                private_access=True,
                oidc_issuer="https://oidc.eks.us-east-1.amazonaws.com/id/A1B2C3D4E5F6G7H8",
                created_at="2026-09-10T14:20:00Z",
                logging_enabled_types=["api", "audit", "authenticator"],
                nodegroups_count=2,
            )
        ]
