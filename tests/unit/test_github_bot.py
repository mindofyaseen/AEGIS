import pytest
from datetime import datetime, timezone
from backend.models import (
    InvestigationReport,
    Verdict,
    ContextCompleteness,
    SecurityFinding,
    Severity,
    ResourceType,
    AttackPath,
    AttackPathHop
)
from services.integration.github_bot import GitHubPRBot

def test_github_bot_formats_block_comment():
    report = InvestigationReport(
        investigation_id="INV-TEST-PR",
        account_id="111122223333",
        region="us-east-1",
        verdict=Verdict.BLOCK,
        verdict_reason="Public SSH exposure detected",
        total_resources=10,
        total_findings=1,
        critical_findings=1,
        agent_reasoning_summary="Critical ingress violation requires block.",
        context_completeness=ContextCompleteness(
            completeness_score=1.0,
            verdict_eligible=True,
            total_collectors_run=4,
            successful_collectors=4,
            failed_collectors=[],
            stale_snapshots_detected=False,
            missing_critical_evidence=[]
        ),
        findings=[
            SecurityFinding(
                finding_id="F-01",
                rule_id="SEC-RULE-01",
                severity=Severity.CRITICAL,
                title="Public SSH Exposed",
                description="Port 22 open to 0.0.0.0/0",
                affected_resource_id="sg-bastion",
                affected_resource_type=ResourceType.SECURITY_GROUP,
                remediation_recommendation="Restrict to VPN",
                confidence=1.0,
                evidence_nodes=["sg-bastion"]
            )
        ],
        attack_paths=[
            AttackPath(
                path_id="AP-01",
                title="Internet to Bastion Path",
                entry_point="igw-01",
                target_asset="i-01",
                severity=Severity.CRITICAL,
                narrative="Internet traffic penetrates bastion host via port 22.",
                hops=[
                    AttackPathHop(
                        hop_index=1,
                        source_node="igw-01",
                        target_node="i-01",
                        relationship="ATTACHED_TO",
                        description="Direct SSH ingress"
                    )
                ]
            )
        ],
        investigated_at=datetime.now(timezone.utc)
    )

    patch_text = "--- a/sg.tf\n+++ b/sg.tf\n- 0.0.0.0/0\n+ 10.0.0.0/16"
    comment = GitHubPRBot.format_pr_comment(report, patch_text=patch_text)

    assert "AEGIS Security Gatekeeper" in comment
    assert "VERDICT: BLOCK" in comment
    assert "sg-bastion" in comment
    assert "igw-01" in comment
    assert "CIS AWS Foundations Benchmark" in comment
    assert "git apply" in comment
    assert patch_text in comment

def test_github_bot_formats_refused_comment():
    report = InvestigationReport(
        investigation_id="INV-TEST-REFUSED",
        account_id="111122223333",
        region="us-east-1",
        verdict=Verdict.INSUFFICIENT_CONTEXT,
        verdict_reason="Telemetry incomplete",
        total_resources=5,
        total_findings=0,
        critical_findings=0,
        agent_reasoning_summary="Refusal triggered due to collector failure.",
        context_completeness=ContextCompleteness(
            completeness_score=0.4,
            verdict_eligible=False,
            explanation="Essential collector 'iam_collector' failed.",
            total_collectors_run=4,
            successful_collectors=1,
            failed_collectors=["iam_collector", "vpc_collector", "s3_collector"],
            stale_snapshots_detected=False,
            missing_critical_evidence=["iam_collector"]
        ),
        findings=[],
        attack_paths=[],
        investigated_at=datetime.now(timezone.utc)
    )

    comment = GitHubPRBot.format_pr_comment(report)
    assert "VERDICT: INSUFFICIENT_CONTEXT" in comment
    assert "CONTEXT REFUSAL TRIGGERED" in comment
    assert "iam_collector" in comment
