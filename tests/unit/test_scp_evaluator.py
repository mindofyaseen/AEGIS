import pytest
from services.policy_engine.scp_evaluator import SCPEvaluator, SCPRule
from backend.models import SecurityFinding, Severity, ResourceType

def test_scp_blocks_s3_public_access_block_deletion():
    evaluator = SCPEvaluator([
        SCPRule(
            scp_id="scp-deny-s3-pab-removal",
            name="Enforce S3 Public Access Block",
            description="Denies all attempts to disable S3 Block Public Access",
            target_type="ROOT",
            target_id="r-root01",
            effect="Deny",
            actions=["s3:PutBucketPublicAccessBlock", "s3:DeleteBucketPublicAccessBlock"],
            resources=["*"]
        )
    ])

    res = evaluator.evaluate_action(
        account_id="111122223333",
        action="s3:DeleteBucketPublicAccessBlock"
    )
    assert res.is_blocked is True
    assert res.mitigated is True
    assert "Enforce S3 Public Access Block" in res.reason

def test_scp_allows_unrestricted_action_when_no_deny():
    evaluator = SCPEvaluator([
        SCPRule(
            scp_id="scp-region-lock",
            name="Region Lockdown",
            description="Denies actions outside allowed regions",
            target_type="OU",
            target_id="ou-core-prod",
            effect="Deny",
            actions=["ec2:*"],
            resources=["*"],
            conditions={"StringNotEquals": {"aws:RequestedRegion": ["us-east-1"]}}
        )
    ])

    # In allowed region
    res = evaluator.evaluate_action(
        account_id="111122223333",
        action="ec2:RunInstances",
        context_vars={"aws:RequestedRegion": "us-east-1"}
    )
    assert res.is_blocked is False

    # In disallowed region
    res2 = evaluator.evaluate_action(
        account_id="111122223333",
        action="ec2:RunInstances",
        context_vars={"aws:RequestedRegion": "eu-central-1"}
    )
    assert res2.is_blocked is True

def test_scp_mitigates_finding():
    evaluator = SCPEvaluator([
        SCPRule(
            scp_id="scp-deny-s3-delete-pab",
            name="Deny S3 PAB Delete",
            description="Prevents S3 public access disabling",
            target_type="ROOT",
            target_id="r-root01",
            effect="Deny",
            actions=["s3:DeleteBucketPublicAccessBlock"],
            resources=["*"]
        )
    ])

    finding = SecurityFinding(
        finding_id="TF-FIND-01",
        rule_id="SEC-TF-02",
        severity=Severity.CRITICAL,
        title="Terraform S3 PAB Deletion",
        description="Destroying PAB",
        affected_resource_id="bucket-01",
        affected_resource_type=ResourceType.S3_BUCKET,
        remediation_recommendation="Do not delete",
        confidence=1.0,
        evidence_nodes=["bucket-01"]
    )

    mitigation_reason = evaluator.mitigate_finding_with_scp("111122223333", finding)
    assert mitigation_reason is not None
    assert "explicitly denied" in mitigation_reason
