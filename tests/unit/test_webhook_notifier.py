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
from services.integration.webhook_notifier import WebhookNotifier

@pytest.fixture
def mock_report():
    return InvestigationReport(
        investigation_id="INV-WH-01",
        account_id="111122223333",
        region="us-east-1",
        verdict=Verdict.BLOCK,
        verdict_reason="Active Bastion SSH Attack Path Discovered",
        total_resources=12,
        total_findings=2,
        critical_findings=1,
        agent_reasoning_summary="Perimeter compromised.",
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
                description="Port 22 open",
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
                title="Internet to DB Pivot",
                entry_point="igw-01",
                target_asset="i-01",
                severity=Severity.CRITICAL,
                narrative="Bastion SSH allows pivot to internal subnet.",
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

def test_build_slack_payload(mock_report):
    payload = WebhookNotifier.build_slack_payload(mock_report)
    assert "blocks" in payload
    blocks = payload["blocks"]
    assert len(blocks) >= 4
    header_block = blocks[0]
    assert "BLOCK" in header_block["text"]["text"]
    assert "111122223333" in str(blocks[1])
    assert "Internet to DB Pivot" in str(blocks[3]) or "igw-01" in str(blocks[3])

def test_build_discord_payload(mock_report):
    payload = WebhookNotifier.build_discord_payload(mock_report)
    assert "embeds" in payload
    embed = payload["embeds"][0]
    assert "BLOCK" in embed["title"]
    assert embed["color"] == 0xE11D48
    fields = {f["name"]: f["value"] for f in embed["fields"]}
    assert "`111122223333`" in fields["Account"]
    assert "🚨 Exposed Attack Vector" in fields
