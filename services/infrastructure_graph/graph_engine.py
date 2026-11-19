"""
AEGIS Infrastructure Knowledge Graph Engine.
Constructs, validates, and traverses directional dependency and attack graphs
using NetworkX with full evidence attribution on every node and edge.
"""

from typing import Dict, List, Optional, Tuple, Any
import networkx as nx
from backend.models import (
    Resource,
    ResourceRelationship,
    RelationshipType,
    ResourceType,
    ResourceEvidence,
)


class InfrastructureGraphEngine:
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.resources: Dict[str, Resource] = {}

    def add_resource(self, resource: Resource) -> None:
        """Add a discovered cloud resource as a node in the graph with evidence."""
        self.resources[resource.resource_id] = resource
        self.graph.add_node(
            resource.resource_id,
            resource_type=resource.resource_type.value,
            name=resource.name or resource.resource_id,
            arn=resource.arn,
            account_id=resource.account_id,
            region=resource.region,
            configuration=resource.configuration,
            tags=resource.tags,
            source_collector=resource.evidence.source_collector,
            discovered_at=resource.evidence.discovered_at.isoformat(),
            confidence=resource.evidence.confidence,
        )

    def add_relationship(self, rel: ResourceRelationship) -> None:
        """Add a directed relationship edge with verified evidence."""
        if not self.graph.has_node(rel.source_id):
            # Create placeholder node if not yet discovered
            self.graph.add_node(rel.source_id, resource_type=ResourceType.UNKNOWN.value)
        if not self.graph.has_node(rel.target_id):
            self.graph.add_node(rel.target_id, resource_type=ResourceType.UNKNOWN.value)

        self.graph.add_edge(
            rel.source_id,
            rel.target_id,
            key=rel.relationship.value,
            relationship=rel.relationship.value,
            source_collector=rel.evidence.source_collector,
            confidence=rel.evidence.confidence,
            inferred=rel.inferred,
        )

    def load_topology(self, topology_data: Dict[str, Any]) -> None:
        """Populate graph from structured topology dictionary or JSON."""
        for r_data in topology_data.get("resources", []):
            evidence = ResourceEvidence(
                source_collector=r_data.get("evidence", {}).get("source_collector", "synthetic_fixture"),
                confidence=r_data.get("evidence", {}).get("confidence", 1.0),
            )
            resource = Resource(
                resource_id=r_data["resource_id"],
                resource_type=ResourceType(r_data["resource_type"]),
                name=r_data.get("name"),
                arn=r_data.get("arn"),
                account_id=topology_data.get("account_id", "237657481511"),
                region=topology_data.get("region", "us-east-1"),
                configuration=r_data.get("configuration", {}),
                tags=r_data.get("tags", {}),
                evidence=evidence,
            )
            self.add_resource(resource)

        for rel_data in topology_data.get("relationships", []):
            evidence = ResourceEvidence(
                source_collector="topology_loader",
                confidence=1.0,
            )
            rel = ResourceRelationship(
                source_id=rel_data["source_id"],
                target_id=rel_data["target_id"],
                relationship=RelationshipType(rel_data["relationship"]),
                evidence=evidence,
            )
            self.add_relationship(rel)

    def find_paths_between(self, source_id: str, target_id: str) -> List[List[str]]:
        """Find all simple directional paths between source and target nodes."""
        if not self.graph.has_node(source_id) or not self.graph.has_node(target_id):
            return []
        try:
            return list(nx.all_simple_paths(self.graph, source_id, target_id, cutoff=8))
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def get_public_ingress_nodes(self) -> List[str]:
        """Identify nodes directly connected to internet gateways or with public IPs."""
        igw_nodes = []
        ec2_nodes = []
        for node_id, data in self.graph.nodes(data=True):
            r_type = data.get("resource_type")
            if r_type == ResourceType.INTERNET_GATEWAY.value:
                igw_nodes.append(node_id)
            elif r_type == ResourceType.EC2_INSTANCE.value:
                cfg = data.get("configuration", {})
                if cfg.get("public_ip"):
                    ec2_nodes.append(node_id)
        return igw_nodes + ec2_nodes

    def get_sensitive_data_targets(self) -> List[str]:
        """Identify high-value sensitive data assets (S3 buckets, databases)."""
        targets = []
        for node_id, data in self.graph.nodes(data=True):
            r_type = data.get("resource_type")
            if r_type in (ResourceType.S3_BUCKET.value, ResourceType.RDS_INSTANCE.value):
                targets.append(node_id)
        return targets

    def to_cytoscape_elements(self) -> List[Dict[str, Any]]:
        """Serialize graph to Cytoscape/React-flow compatible elements for UI visualization."""
        elements = []
        for node_id, data in self.graph.nodes(data=True):
            elements.append({
                "data": {
                    "id": node_id,
                    "label": data.get("name", node_id),
                    "type": data.get("resource_type", "UNKNOWN"),
                    "confidence": data.get("confidence", 1.0),
                }
            })
        for u, v, k, data in self.graph.edges(keys=True, data=True):
            elements.append({
                "data": {
                    "source": u,
                    "target": v,
                    "label": data.get("relationship", k),
                    "confidence": data.get("confidence", 1.0),
                }
            })
        return elements
