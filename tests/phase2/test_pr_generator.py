"""
Unit tests for AEGIS Automated Remediation PR Generator.
Validates branch name generation, unified .patch diff formatting, and PR review markdown.
"""

from services.remediation_planner.pr_generator import RemediationPRGenerator
from backend.models import RemediationPatch


def test_remediation_pr_generator_synthesizes_pr():
    generator = RemediationPRGenerator()
    patch = RemediationPatch(
        target_resource_id="sg-bastion-public",
        suggested_action="Restrict Security Group ingress to authorized CIDR",
        terraform_patch="""resource "aws_security_group_rule" "restricted_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["198.51.100.0/24"]
  security_group_id = "sg-bastion-public"
}""",
        cli_command_preview="aws ec2 revoke-security-group-ingress --group-id sg-bastion-public --protocol tcp --port 22 --cidr 0.0.0.0/0",
        rollback_plan="Re-apply state with aws ec2 authorize-security-group-ingress",
        verification_steps=[
            "Verify external connection fails.",
            "Verify corporate VPN connects.",
        ],
    )

    pr = generator.generate_pull_request(
        patch=patch,
        investigation_id="INV-TEST-001",
        account_id="237657481511",
    )

    assert "aegis/security-patch-sg-bastion-public" in pr.remediation_branch
    assert "Restrict Security Group ingress" in pr.pr_title
    assert "fix(security):" in pr.commit_message
    assert "## 🛡️ AEGIS Automated Security Remediation Pull Request" in pr.pr_body_markdown
    assert "--- a/terraform/security_remediation_sg-bastion-public.tf" in pr.unified_patch_content
    assert "+  cidr_blocks       = [\"198.51.100.0/24\"]" in pr.unified_patch_content
    assert "- [ ] Verify external connection fails." in pr.pr_body_markdown
    assert pr.patch_filename == "remediation-sg-bastion-public.patch"
