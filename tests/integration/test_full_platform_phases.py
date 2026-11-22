"""
AEGIS Comprehensive Integration Test Suite for Platform Expansions (Phases 1 - 4).
Tests:
1. Enterprise Identity & RBAC (Viewer, Analyst, Approver, Admin personas).
2. Application Security (SAST Semgrep runner, Gitleaks Secret scanner, Syft/Grype SCA).
3. Container Security (Amazon ECR discovery, Dockerfile AST misconfiguration auditor).
4. Kubernetes Security (Amazon EKS discovery, Pod Security Standards PSS, RBAC overprivilege).
5. Runtime Security (EventBridge ingestion, Graph threat correlation, P0 dynamic elevation).
6. Forensics & Incident Response (CloudTrail timeline, Blast radius calculation, Containment SOPs).
7. Autonomous Remediation (Mode 1 Advisory diffs, Mode 2 Human Approval gates, Mode 3 Production Lockout).
8. Live FastAPI API Endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.auth import create_access_token, decode_token, hash_api_key, ROLE_PERMISSIONS
from services.appsec.orchestrator import AppSecOrchestrator
from services.appsec.models import VulnSeverity, AppSecCategory
from services.container_security.dockerfile_analyzer import DockerfileAnalyzer
from services.container_security.ecr_harvester import ECRHarvester
from services.kubernetes_security.eks_harvester import EKSHarvester
from services.kubernetes_security.posture_evaluator import KubernetesPostureEvaluator
from services.runtime.event_dispatcher import RuntimeEventDispatcher
from services.runtime.threat_correlator import GraphThreatCorrelator
from services.runtime.models import RuntimeFindingSeverity
from services.forensics.cloudtrail_engine import CloudTrailForensicEngine
from services.forensics.blast_radius import BlastRadiusCalculator
from services.forensics.containment_sops import ContainmentSOPGenerator
from services.remediation.state_machine import RemediationStateMachine
from services.remediation.mode1_advisory import Mode1AdvisoryGenerator
from services.remediation.mode2_approvals import Mode2ApprovalEngine
from services.remediation.mode3_autonomous import Mode3AutonomousEngine
from services.remediation.models import RemediationMode, RemediationTxStatus


@pytest.fixture
def client():
    return TestClient(app)


# ==============================================================================
# 1. Identity & RBAC Tests
# ==============================================================================

def test_rbac_token_creation_and_validation():
    token = create_access_token(user_id="alice", email="alice@test.com", role="approver")
    session = decode_token(token)
    assert session.user_id == "alice"
    assert session.role == "approver"
    assert "remediation:approve" in session.permissions


def test_rbac_invalid_role_raises_error():
    with pytest.raises(ValueError):
        create_access_token(user_id="bob", email="bob@test.com", role="super-god-mode")


def test_api_key_hashing():
    raw_key = "aegis_live_1234567890abcdef"
    h1 = hash_api_key(raw_key)
    h2 = hash_api_key(raw_key)
    assert h1 == h2
    assert len(h1) == 64  # SHA-256


# ==============================================================================
# 2. Application Security (AppSec) Tests
# ==============================================================================

def test_appsec_sast_and_secrets(tmp_path):
    # Create vulnerable test source file
    test_file = tmp_path / "vulnerable_app.py"
    test_file.write_text(
        "import os\n"
        "os.system('rm -rf ' + user_input, shell=True)\n"
        "aws_key = 'AKIA1234567890ABCDEF'\n"
    )

    orchestrator = AppSecOrchestrator()
    report = orchestrator.scan_directory(str(tmp_path))

    assert report.total_files_scanned >= 1
    rule_ids = [f.rule_id for f in report.findings]
    assert "aegis-sast-cmdi" in rule_ids
    assert "aegis-secret-aws-key" in rule_ids

    # Verify secret value was masked in the snippet
    secret_findings = [f for f in report.findings if f.category == AppSecCategory.SECRETS]
    assert len(secret_findings) > 0
    assert "AKIA1234567890ABCDEF" not in secret_findings[0].location.snippet
    assert "[REDACTED]" in secret_findings[0].location.snippet


# ==============================================================================
# 3. Container & ECR Security Tests
# ==============================================================================

def test_dockerfile_misconfiguration_analyzer(tmp_path):
    df = tmp_path / "Dockerfile"
    df.write_text("FROM alpine:latest\nUSER root\nEXPOSE 22\n")

    analyzer = DockerfileAnalyzer()
    findings = analyzer.analyze_file(str(df))

    rule_ids = [f.rule_id for f in findings]
    assert "aegis-docker-unpinned-base" in rule_ids
    assert "aegis-docker-root-user" in rule_ids
    assert "aegis-docker-exposed-ssh" in rule_ids


def test_ecr_harvester():
    harvester = ECRHarvester()
    repos = harvester.list_repositories()
    assert len(repos) >= 1
    report = harvester.get_image_scan_findings(repos[0]["repository_name"])
    assert report.total_vulnerabilities >= 1


# ==============================================================================
# 4. Kubernetes & EKS Posture Tests
# ==============================================================================

def test_kubernetes_pss_and_rbac_evaluation():
    evaluator = KubernetesPostureEvaluator()

    # Workload test
    workloads = [
        {
            "namespace": "prod",
            "kind": "Deployment",
            "name": "critical-api",
            "spec": {
                "containers": [
                    {"name": "web", "securityContext": {"privileged": True, "runAsNonRoot": False}}
                ]
            }
        }
    ]
    findings = evaluator.evaluate_manifests(workloads)
    rule_ids = [f.rule_id for f in findings]
    assert "aegis-k8s-privileged-container" in rule_ids
    assert "aegis-k8s-root-execution" in rule_ids

    # RBAC test
    rbac = [
        {
            "subject_kind": "ServiceAccount",
            "subject_name": "app-runner",
            "role_name": "cluster-admin",
            "is_cluster_role": True,
            "rules": [{"verbs": ["*"], "resources": ["*"]}],
        }
    ]
    rbac_findings = evaluator.evaluate_rbac(rbac)
    assert any(f.grants_cluster_admin for f in rbac_findings)
    assert any(f.has_wildcard for f in rbac_findings)


# ==============================================================================
# 5. Runtime Security & Threat Correlation Tests
# ==============================================================================

def test_runtime_event_dispatch_and_threat_elevation():
    dispatcher = RuntimeEventDispatcher()
    correlator = GraphThreatCorrelator()

    # Simulate GuardDuty IAM Credential Exfiltration
    event_payload = {
        "id": "gd-evt-101",
        "source": "aws.guardduty",
        "detail-type": "GuardDuty Finding",
        "detail": {
            "type": "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS",
            "severity": 8.0,
            "resource": {
                "accessKeyDetails": {"userName": "compromised-role"}
            }
        }
    }

    event = dispatcher.process_event_payload(event_payload)
    assert event is not None
    assert event.normalized_severity in ("HIGH", "CRITICAL")

    threat = correlator.correlate_event(event)
    assert threat.elevated_priority == RuntimeFindingSeverity.P0_CRITICAL_ACTIVE_BREACH
    assert threat.on_attack_path is True


# ==============================================================================
# 6. Forensics & Blast Radius Tests
# ==============================================================================

def test_forensics_and_blast_radius():
    forensics = CloudTrailForensicEngine()
    timeline = forensics.query_principal_activity("alice-dev")
    assert len(timeline) >= 2

    blast_calc = BlastRadiusCalculator()
    report = blast_calc.compute_blast_radius("i-compromised-ec2")
    assert report.total_reachable_resources > 0
    assert len(report.critical_crown_jewels_at_risk) > 0

    containment_gen = ContainmentSOPGenerator()
    sop = containment_gen.generate_iam_containment("alice-dev", "AKIAEXAMPLENOTREAL")
    assert "aws iam update-access-key" in sop.mutation_cli_command
    assert sop.requires_approval_role == "approver"


# ==============================================================================
# 7. Remediation Modes 1, 2, 3 & Production Lockout Tests
# ==============================================================================

def test_remediation_modes_and_governance():
    sm = RemediationStateMachine()
    m1 = Mode1AdvisoryGenerator()
    m2 = Mode2ApprovalEngine()
    m3 = Mode3AutonomousEngine()

    # Mode 1: Advisory (Zero mutation)
    plan_m1 = m1.generate_security_group_patch("sg-0123")
    assert plan_m1.mode == RemediationMode.MODE_1_ADVISORY
    assert "+++ b/terraform/security_groups.tf" in plan_m1.terraform_patch_diff

    # Mode 2: Staged and Approved
    plan_m2 = m2.stage_security_group_revocation("sg-0123", 22)
    sm.register_plan(plan_m2)
    assert plan_m2.status == RemediationTxStatus.STAGED

    # Rejection by viewer
    with pytest.raises(PermissionError):
        sm.approve_plan(plan_m2.plan_id, approver_role="viewer", user_id="viewer-bob")

    # Approval by approver
    approved = sm.approve_plan(plan_m2.plan_id, approver_role="approver", user_id="approver-charlie")
    assert approved.status == RemediationTxStatus.APPROVED

    # Execution
    executed = sm.execute_plan(plan_m2.plan_id)
    assert executed.status == RemediationTxStatus.COMPLETED

    # Mode 3: Production Lockout Rule
    plan_m3_prod = m3.auto_heal_s3_encryption("prod-vault", {"Environment": "Production"})
    assert plan_m3_prod.mode == RemediationMode.MODE_2_HUMAN_APPROVED
    assert plan_m3_prod.is_production_resource is True
    assert "Production lockout policy prevented Mode 3" in plan_m3_prod.description

    # Mode 3: Safe Non-Production Auto-Heal
    plan_m3_dev = m3.auto_heal_s3_encryption("dev-vault", {"Environment": "Development"})
    assert plan_m3_dev.mode == RemediationMode.MODE_3_AUTONOMOUS
    assert plan_m3_dev.is_production_resource is False


# ==============================================================================
# 8. Live FastAPI Endpoint Tests
# ==============================================================================

def test_api_endpoints_full_lifecycle(client):
    # Auth
    auth_resp = client.post("/api/v1/auth/token?user_id=test-lead&role=admin")
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # AppSec
    appsec_resp = client.get("/api/v1/appsec/summary", headers=headers)
    assert appsec_resp.status_code == 200
    assert appsec_resp.json()["status"] == "OPERATIONAL"

    # Containers
    cont_resp = client.get("/api/v1/containers/repositories", headers=headers)
    assert cont_resp.status_code == 200
    assert len(cont_resp.json()["repositories"]) >= 1

    # Kubernetes
    k8s_resp = client.get("/api/v1/k8s/clusters", headers=headers)
    assert k8s_resp.status_code == 200
    assert len(k8s_resp.json()["clusters"]) >= 1

    # Forensics
    forensic_resp = client.get("/api/v1/forensics/blast-radius?entity_id=i-test", headers=headers)
    assert forensic_resp.status_code == 200
    assert forensic_resp.json()["total_reachable_resources"] > 0

    # Remediation
    rem_resp = client.post("/api/v1/remediations/plan/advisory?sg_id=sg-test&port=22", headers=headers)
    assert rem_resp.status_code == 200
    assert rem_resp.json()["plan"]["mode"] == "MODE_1_ADVISORY"
