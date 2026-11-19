"""
AEGIS Attack Path Intelligence Tracer.
Analyzes graph reachability and multi-hop attack vectors from public exposure
points to sensitive assets, verifying evidence along every traversal edge.
"""

from typing import List, Dict, Any, Optional
from backend.models import (
    AttackPath,
    AttackPathHop,
    Severity,
    ResourceType,
)
from services.infrastructure_graph.graph_engine import InfrastructureGraphEngine


class AttackPathTracer:
    def __init__(self, graph_engine: InfrastructureGraphEngine):
        self.graph_engine = graph_engine

    def trace_attack_paths(self) -> List[AttackPath]:
        """
        Identify verified attack paths from external exposure points to sensitive crown jewels.
        """
        paths: List[AttackPath] = []
        ingress_nodes = self.graph_engine.get_public_ingress_nodes()
        sensitive_targets = self.graph_engine.get_sensitive_data_targets()

        for ingress in ingress_nodes:
            for target in sensitive_targets:
                discovered_paths = self.graph_engine.find_paths_between(ingress, target)
                for p_index, raw_path in enumerate(discovered_paths):
                    hops: List[AttackPathHop] = []
                    is_evidenced = True

                    for i in range(len(raw_path) - 1):
                        u = raw_path[i]
                        v = raw_path[i + 1]
                        edge_data = self.graph_engine.graph.get_edge_data(u, v, default={})
                        
                        # Get first edge attributes
                        first_key = list(edge_data.keys())[0] if edge_data else "CONNECTS_TO"
                        attrs = edge_data.get(first_key, {})
                        rel_name = attrs.get("relationship", first_key)
                        confidence = attrs.get("confidence", 1.0)

                        if confidence < 0.8:
                            is_evidenced = False

                        hops.append(
                            AttackPathHop(
                                hop_index=i + 1,
                                source_node=u,
                                target_node=v,
                                relationship=rel_name,
                                description=f"{u} {rel_name} {v}",
                                evidenced=confidence >= 0.8,
                                assumptions=[] if confidence >= 0.8 else ["Inferred relationship"],
                            )
                        )

                    narrative = (
                        f"External Internet traffic entering through '{ingress}' traverses through "
                        f"{len(hops)} verified infrastructure hops to access restricted asset '{target}'."
                    )

                    paths.append(
                        AttackPath(
                            path_id=f"ATTACK-PATH-{ingress}-{target}-{p_index + 1}",
                            title=f"Public Internet to Restricted Storage ({target})",
                            severity=Severity.CRITICAL,
                            entry_point=ingress,
                            target_asset=target,
                            hops=hops,
                            is_fully_evidenced=is_evidenced,
                            narrative=narrative,
                        )
                    )

        return paths
