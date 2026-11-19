"""
Integration tests for AEGIS FastAPI endpoints.
Verifies all public routes, scenarios, graph payloads, and CloudTrail forensics.
"""

import json
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


def test_cfn_analyze_endpoint():
    template = {
        "Resources": {
            "OpenSG": {
                "Type": "AWS::EC2::SecurityGroup",
                "Properties": {
                    "SecurityGroupIngress": [
                        {"FromPort": 22, "ToPort": 22, "CidrIp": "0.0.0.0/0"}
                    ]
                }
            }
        }
    }
    response = client.post("/api/v1/analyze/cloudformation", json={"template_content": json.dumps(template)})
    assert response.status_code == 200
    data = response.json()
    assert data["findings_count"] == 1
    assert data["findings"][0]["rule_id"] == "SEC-CFN-01"


def test_compliance_report_endpoint():
    response = client.get("/api/v1/compliance/report?scenario_id=block-ssh")
    assert response.status_code == 200
    data = response.json()
    assert "overall_compliance_pct" in data
    assert "cis" in data["frameworks"]
    assert "soc2" in data["frameworks"]
    assert data["frameworks"]["cis"]["compliance_score_pct"] <= 100.0


def test_github_pr_comment_endpoint():
    response = client.post("/api/v1/integrations/github/comment?scenario_id=block-ssh")
    assert response.status_code == 200
    data = response.json()
    assert "comment_markdown" in data
    assert "## 🛡️ AEGIS Security Gatekeeper" in data["comment_markdown"]
    assert data["verdict"] == "BLOCK"


def test_webhook_payload_endpoint():
    # Slack
    resp_slack = client.post("/api/v1/integrations/webhook/payload?service=slack&scenario_id=block-ssh")
    assert resp_slack.status_code == 200
    assert "blocks" in resp_slack.json()

    # Discord
    resp_discord = client.post("/api/v1/integrations/webhook/payload?service=discord&scenario_id=block-ssh")
    assert resp_discord.status_code == 200
    assert "embeds" in resp_discord.json()


def test_bedrock_guardrails_spec_endpoint():
    response = client.get("/api/v1/bedrock/guardrails-spec")
    assert response.status_code == 200
    data = response.json()
    assert "boto3_create_guardrail_payload" in data
    assert "cloudformation_template" in data
    assert data["boto3_create_guardrail_payload"]["name"] == "aegis-cloud-security-guardrail"


def test_custom_infrastructure_investigation_endpoint():
    payload = {
        "account_id": "999111222333",
        "region": "us-west-2",
        "role_arn": "arn:aws:iam::999111222333:role/AegisSecurityAuditRole"
    }
    response = client.post("/api/v1/investigate/custom", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "999111222333"
    assert data["region"] == "us-west-2"
    assert "business_impact_summary" in data
    assert data["business_impact_summary"] is not None
    assert "estimated_financial_exposure" in data


