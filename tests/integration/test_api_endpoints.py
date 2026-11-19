"""
Integration tests for AEGIS FastAPI endpoints.
Verifies all public routes, scenarios, graph payloads, and CloudTrail forensics.
"""

from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["mode"] == "read_only"
    assert data["enforced_rules"] == 15


def test_root_spa_serves_html():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "AEGIS" in response.text


def test_rules_endpoint():
    response = client.get("/api/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 15
    assert "RULE-01" in data["rules_document"]


def test_scenarios_list():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) == 4


def test_scenario_block_ssh():
    response = client.post("/api/investigate/scenario/block-ssh")
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "BLOCK"
    assert len(data["findings"]) > 0
    assert len(data["remediation_patches"]) > 0


def test_scenario_insufficient_context():
    response = client.post("/api/investigate/scenario/insufficient-context")
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "INSUFFICIENT_CONTEXT"
    assert data["context_completeness"]["completeness_score"] < 1.0


def test_scenario_ready_review():
    response = client.post("/api/investigate/scenario/ready-review")
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "READY_FOR_HUMAN_REVIEW"
    assert data["context_completeness"]["completeness_score"] == 1.0


def test_graph_elements():
    response = client.get("/api/graph/elements?scenario=ecommerce")
    assert response.status_code == 200
    data = response.json()
    assert data["total_nodes"] > 0
    assert data["total_edges"] > 0


def test_cloudtrail_timeline():
    response = client.get("/api/cloudtrail/timeline")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(event["is_suspicious"] for event in data)


def test_adversarial_tests_status():
    response = client.get("/api/adversarial/tests")
    assert response.status_code == 200
    data = response.json()
    assert data["total_tests"] == 14
    assert data["passed"] == 14
    assert data["failed"] == 0


def test_phase2_multi_account_endpoint():
    response = client.get("/api/phase2/multi-account")
    assert response.status_code == 200
    data = response.json()
    assert "harvest_report" in data
    assert data["harvest_report"]["total_accounts_targeted"] == 2
    assert len(data["topology"]["resources"]) > 0


def test_phase2_correlate_threats_endpoint():
    response = client.post("/api/phase2/correlate-threats")
    assert response.status_code == 200
    data = response.json()
    assert data["active_threats_count"] >= 1
    assert data["correlated_findings_count"] >= 1


def test_phase2_generate_pr_endpoint():
    patch_payload = {
        "target_resource_id": "sg-bastion-public",
        "suggested_action": "Restrict SSH to corporate CIDR",
        "terraform_patch": "resource \"aws_security_group_rule\" \"ssh\" {}",
        "cli_command_preview": "aws ec2 revoke-security-group-ingress",
        "rollback_plan": "Revert rule",
        "verification_steps": ["Verify connection fails from external IP"],
    }
    response = client.post("/api/phase2/generate-pr", json=patch_payload)
    assert response.status_code == 200
    data = response.json()
    assert "aegis/security-patch-sg-bastion-public" in data["remediation_branch"]
    assert "remediation-sg-bastion-public.patch" in data["patch_filename"]
    assert "## 🛡️ AEGIS Automated Security Remediation Pull Request" in data["pr_body_markdown"]
