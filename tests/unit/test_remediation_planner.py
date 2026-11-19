"""
Unit Tests for AEGIS Remediation Planner & Patch Generator.
Validates Rule 14 compliance: minimal diffs, rollback plans, and verification checklists.
"""

import pytest
from backend.models import SecurityFinding, Severity, ResourceType
from services.remediation_planner.patch_generator import RemediationPlanner


def test_remediation_planner_security_group_ssh():
    planner = RemediationPlanner()
    finding = SecurityFinding(
        finding_id="F-01",
        rule_id="SEC-NET-01",
        title="Public SSH Ingress",
        description="Port 22 open to 0.0.0.0/0",
        severity=Severity.CRITICAL,
        affected_resource_id="sg-bastion-01",
        affected_resource_type=ResourceType.SECURITY_GROUP,
        remediation_recommendation="Restrict to corporate CIDR",
    )
    patches = planner.generate_patches([finding])
    assert len(patches) == 1
    patch = patches[0]
    assert patch.target_resource_id == "sg-bastion-01"
    assert "198.51.100.0/24" in patch.terraform_patch
    assert "aws ec2 revoke-security-group-ingress" in patch.cli_command_preview
    assert "Rollback command" in patch.rollback_plan
    assert len(patch.verification_steps) >= 3


def test_remediation_planner_iam_wildcard():
    planner = RemediationPlanner()
    finding = SecurityFinding(
        finding_id="F-02",
        rule_id="SEC-IAM-01",
        title="Wildcard IAM Administrator",
        description="Action * on Resource *",
        severity=Severity.CRITICAL,
        affected_resource_id="AegisBastionEC2Role",
        affected_resource_type=ResourceType.IAM_ROLE,
        remediation_recommendation="Scope down",
    )
    patches = planner.generate_patches([finding])
    assert len(patches) == 1
    patch = patches[0]
    assert patch.target_resource_id == "AegisBastionEC2Role"
    assert "ScopedOperationalAccess" in patch.terraform_patch
    assert "aws iam put-role-policy" in patch.cli_command_preview
    assert "Rollback command" in patch.rollback_plan
    assert len(patch.verification_steps) >= 3


def test_remediation_planner_s3_public_access():
    planner = RemediationPlanner()
    finding = SecurityFinding(
        finding_id="F-03",
        rule_id="SEC-S3-01",
        title="S3 Public Access Block Disabled",
        description="Public access block is missing",
        severity=Severity.HIGH,
        affected_resource_id="corporate-customer-financial-records",
        affected_resource_type=ResourceType.S3_BUCKET,
        remediation_recommendation="Enable public access block",
    )
    patches = planner.generate_patches([finding])
    assert len(patches) == 1
    patch = patches[0]
    assert patch.target_resource_id == "corporate-customer-financial-records"
    assert "block_public_acls       = true" in patch.terraform_patch
    assert "aws s3control put-public-access-block" in patch.cli_command_preview


def test_remediation_planner_rds_public():
    planner = RemediationPlanner()
    finding = SecurityFinding(
        finding_id="F-04",
        rule_id="SEC-DB-01",
        title="RDS Publicly Accessible",
        description="RDS database exposed to internet",
        severity=Severity.CRITICAL,
        affected_resource_id="orders-db-prod",
        affected_resource_type=ResourceType.RDS_INSTANCE,
        remediation_recommendation="Disable public accessibility",
    )
    patches = planner.generate_patches([finding])
    assert len(patches) == 1
    patch = patches[0]
    assert patch.target_resource_id == "orders-db-prod"
    assert "publicly_accessible = false" in patch.terraform_patch
    assert "aws rds modify-db-instance" in patch.cli_command_preview
