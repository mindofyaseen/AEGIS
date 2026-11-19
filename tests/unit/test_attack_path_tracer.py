"""
Unit tests for AEGIS Multi-Hop Attack Path Tracer.
Validates BFS graph traversal, lateral movement detection, and loop prevention.
"""

from services.infrastructure_graph.graph_engine import InfrastructureGraphEngine
from services.attack_path.tracer import AttackPathTracer
from backend.models import Resource, ResourceType, ResourceEvidence, ResourceRelationship, RelationshipType


def test_attack_path_tracer_direct_and_lateral():
    engine = InfrastructureGraphEngine()
    ev = ResourceEvidence(source_collector="test")

    # Ingress node (IGW)
    engine.add_resource(Resource(resource_id="igw-01", resource_type=ResourceType.INTERNET_GATEWAY, evidence=ev))
    # Intermediate compute node
    engine.add_resource(Resource(resource_id="i-bastion", resource_type=ResourceType.EC2_INSTANCE, evidence=ev))
    # Target crown-jewel storage
    engine.add_resource(Resource(
        resource_id="s3-vault",
        resource_type=ResourceType.S3_BUCKET,
        tags={"DataClassification": "Confidential"},
        evidence=ev,
    ))

    # Add edges
    engine.add_relationship(ResourceRelationship(source_id="igw-01", target_id="i-bastion", relationship=RelationshipType.ROUTES_TO, evidence=ev))
    engine.add_relationship(ResourceRelationship(source_id="i-bastion", target_id="s3-vault", relationship=RelationshipType.GRANTS, evidence=ev))

    tracer = AttackPathTracer(engine)
    paths = tracer.trace_attack_paths()
    assert len(paths) >= 1
    path = paths[0]
    assert path.entry_point == "igw-01"
    assert path.target_asset == "s3-vault"
    assert len(path.hops) == 2


def test_attack_path_tracer_no_path():
    engine = InfrastructureGraphEngine()
    ev = ResourceEvidence(source_collector="test")

    # Ingress node
    engine.add_resource(Resource(resource_id="igw-isolated", resource_type=ResourceType.INTERNET_GATEWAY, evidence=ev))
    # Target node without connecting edge
    engine.add_resource(Resource(
        resource_id="s3-isolated",
        resource_type=ResourceType.S3_BUCKET,
        tags={"DataClassification": "Confidential"},
        evidence=ev,
    ))

    tracer = AttackPathTracer(engine)
    paths = tracer.trace_attack_paths()
    assert len(paths) == 0


def test_attack_path_tracer_cyclic_graph_termination():
    engine = InfrastructureGraphEngine()
    ev = ResourceEvidence(source_collector="test")

    engine.add_resource(Resource(resource_id="igw-02", resource_type=ResourceType.INTERNET_GATEWAY, evidence=ev))
    engine.add_resource(Resource(resource_id="node-a", resource_type=ResourceType.EC2_INSTANCE, evidence=ev))
    engine.add_resource(Resource(resource_id="node-b", resource_type=ResourceType.EC2_INSTANCE, evidence=ev))
    engine.add_resource(Resource(
        resource_id="s3-target",
        resource_type=ResourceType.S3_BUCKET,
        tags={"DataClassification": "Confidential"},
        evidence=ev,
    ))

    # Create cycle between node-a and node-b
    engine.add_relationship(ResourceRelationship(source_id="igw-02", target_id="node-a", relationship=RelationshipType.ROUTES_TO, evidence=ev))
    engine.add_relationship(ResourceRelationship(source_id="node-a", target_id="node-b", relationship=RelationshipType.ROUTES_TO, evidence=ev))
    engine.add_relationship(ResourceRelationship(source_id="node-b", target_id="node-a", relationship=RelationshipType.ROUTES_TO, evidence=ev))
    engine.add_relationship(ResourceRelationship(source_id="node-b", target_id="s3-target", relationship=RelationshipType.GRANTS, evidence=ev))

    tracer = AttackPathTracer(engine)
    # Must terminate without infinite loop and find the path
    paths = tracer.trace_attack_paths()
    assert len(paths) >= 1
    assert paths[0].target_asset == "s3-target"
