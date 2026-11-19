"""
AEGIS FastAPI Application Server.
Exposes read-only security investigation, graph topology, and adversarial testing APIs.
Enforces RULE-02 (Read-Only) and RULE-03 (Zero Mutation).
"""

import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional

from backend.models import InvestigationReport, Verdict, CollectorRunReport, CollectorStatus
from backend.orchestration.investigator import AegisInvestigator

app = FastAPI(
    title="AEGIS Cloud Security & DevSecOps Platform",
    description="Autonomous, evidence-backed AWS security investigation with deterministic context completeness.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "fixtures"
investigator = AegisInvestigator()


def load_fixture_json(filename: str) -> Dict[str, Any]:
    path = FIXTURES_DIR / "aws_topologies" / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Fixture '{filename}' not found.")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AEGIS Security & DevSecOps Platform",
        "mode": "read_only",
        "enforced_rules": 15,
        "active_account": "237657481511",
        "default_region": "us-east-1",
    }


@app.get("/api/rules")
def list_governance_rules():
    rules_path = Path(__file__).resolve().parent.parent.parent / "AEGIS_AGENT_RULES.md"
    content = ""
    if rules_path.exists():
        with open(rules_path, "r", encoding="utf-8") as f:
            content = f.read()
    return {
        "count": 15,
        "rules_document": content,
    }


@app.post("/api/investigate/synthetic", response_model=InvestigationReport)
def run_synthetic_investigation():
    """Run full investigation on synthetic enterprise e-commerce VPC fixture."""
    topo = load_fixture_json("ecommerce_vpc.json")
    report = investigator.run_investigation(topology_data=topo)
    return report


@app.post("/api/investigate/terraform", response_model=InvestigationReport)
def run_terraform_investigation(plan_json: Dict[str, Any] = Body(...)):
    """Run investigation against live/synthetic topology correlated with a proposed Terraform plan."""
    topo = load_fixture_json("ecommerce_vpc.json")
    report = investigator.run_investigation(
        topology_data=topo,
        terraform_plan_data=plan_json,
    )
    return report


@app.get("/api/graph/elements")
def get_graph_elements():
    """Return Cytoscape/3D nodes and edges for topology visualization."""
    topo = load_fixture_json("ecommerce_vpc.json")
    from services.infrastructure_graph.graph_engine import InfrastructureGraphEngine
    engine = InfrastructureGraphEngine()
    engine.load_topology(topo)
    return {
        "elements": engine.to_cytoscape_elements(),
        "total_nodes": len(engine.graph.nodes),
        "total_edges": len(engine.graph.edges),
    }
