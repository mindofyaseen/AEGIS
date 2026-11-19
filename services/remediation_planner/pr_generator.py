"""
AEGIS Automated Remediation PR & GitOps Patch Generator.
Generates ready-to-merge Git branches, unified git .patch files, and GitHub PR review payloads
incorporating Rule 14 minimal diffs, rollback plans, and verification checklists.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from backend.models import RemediationPatch, InvestigationReport


class RemediationPullRequest(BaseModel):
    pr_id: str
    target_branch: str = "main"
    remediation_branch: str
    commit_message: str
    pr_title: str
    pr_body_markdown: str
    patch_filename: str
    unified_patch_content: str
    target_resources: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RemediationPRGenerator:
    def __init__(self):
        pass

    def generate_pull_request(
        self,
        patch: RemediationPatch,
        investigation_id: str = "INV-001",
        account_id: str = "237657481511",
    ) -> RemediationPullRequest:
        """
        Synthesize a complete GitHub Pull Request payload from a Rule 14 RemediationPatch.
        """
        res_slug = patch.target_resource_id.replace("::", "-").replace("/", "-").lower()
        branch_name = f"aegis/security-patch-{res_slug}"
        pr_id = f"PR-{res_slug[:12]}"

        pr_title = f"[AEGIS Security Remediation] {patch.suggested_action} on {patch.target_resource_id}"
        commit_msg = (
            f"fix(security): {patch.suggested_action}\n\n"
            f"Automated remediation synthesized by AEGIS Security Platform.\n"
            f"Target: {patch.target_resource_id}\n"
            f"Investigation ID: {investigation_id}\n"
            f"Zero Mutation Rule 14 compliant."
        )

        # Build Unified Diff representation
        unified_diff = self.create_unified_diff(patch)

        # Build Rich Markdown PR Body
        body_lines = [
            "## 🛡️ AEGIS Automated Security Remediation Pull Request",
            f"**Investigation ID:** `{investigation_id}` | **Target AWS Account:** `{account_id}`",
            f"**Target Resource:** `{patch.target_resource_id}`\n",
            "### 1. Security Issue & Proposed Action",
            f"> **{patch.suggested_action}**\n",
            "### 2. Proposed Minimal Terraform Patch",
            "```hcl",
            patch.terraform_patch or "# No Terraform diff available",
            "```\n",
        ]

        if patch.cli_command_preview:
            body_lines.extend([
                "### 3. Direct AWS CLI Remediation Command (Preview)",
                "```bash",
                patch.cli_command_preview,
                "```\n",
            ])

        body_lines.extend([
            "### 4. Deterministic Rollback Plan",
            "```bash",
            patch.rollback_plan,
            "```\n",
            "### 5. Pre/Post Merge Verification Checklist",
        ])

        for step in patch.verification_steps:
            body_lines.append(f"- [ ] {step}")

        body_lines.extend([
            "",
            "---",
            "*Synthesized autonomously by AEGIS Security Engine — Governance Rule 14 Enforced*",
        ])

        return RemediationPullRequest(
            pr_id=pr_id,
            remediation_branch=branch_name,
            commit_message=commit_msg,
            pr_title=pr_title,
            pr_body_markdown="\n".join(body_lines),
            patch_filename=f"remediation-{res_slug}.patch",
            unified_patch_content=unified_diff,
            target_resources=[patch.target_resource_id],
        )

    def create_unified_diff(self, patch: RemediationPatch) -> str:
        """
        Create a standard unified diff (.patch) format string.
        """
        hcl = patch.terraform_patch or ""
        lines = [
            f"--- a/terraform/security_remediation_{patch.target_resource_id}.tf",
            f"+++ b/terraform/security_remediation_{patch.target_resource_id}.tf",
            "@@ -0,0 +1,15 @@",
        ]
        for line in hcl.splitlines():
            lines.append(f"+{line}")
        return "\n".join(lines) + "\n"
