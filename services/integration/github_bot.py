"""
AEGIS — GitHub Pull Request Security Bot
Formats deterministic, rich GitHub Pull Request audit comments.
Enforces Rule 08 (Risk Verdict), Rule 14 (Deterministic Patches), Rule 15 (Immutable Audit Trail).
"""

from typing import Optional, Dict, Any
from backend.models import InvestigationReport, Verdict, Severity
from services.security_engine.compliance_mapper import ComplianceEngine, FullComplianceReport


class GitHubPRBot:
    """
    Synthesizes executive GitHub PR review comments with collapsible sections,
    attack path breakdowns, compliance scorecards, and unified diff patches.
    """

    @staticmethod
    def generate_badge(verdict: Verdict) -> str:
        if verdict == Verdict.BLOCK:
            return "🔴 **`VERDICT: BLOCK`** — Deployment blocked due to critical security risk or perimeter exposure."
        elif verdict == Verdict.INSUFFICIENT_CONTEXT:
            return "🟡 **`VERDICT: INSUFFICIENT_CONTEXT`** — Safety determination refused due to missing or stale telemetry."
        else:
            return "🟢 **`VERDICT: READY_FOR_HUMAN_REVIEW`** — Infrastructure compliant with automated security boundaries."

    @classmethod
    def format_pr_comment(
        cls,
        report: InvestigationReport,
        patch_text: Optional[str] = None,
        compliance_report: Optional[FullComplianceReport] = None
    ) -> str:
        """
        Generates standard GitHub Flavored Markdown for PR comments.
        """
        score_pct = round(report.context_completeness.completeness_score * 100, 1)
        lines = [
            "## 🛡️ AEGIS Security Gatekeeper — Automated PR Review",
            "",
            cls.generate_badge(report.verdict),
            "",
            "| Metric | Status | Details |",
            "| :--- | :--- | :--- |",
            f"| **Risk Verdict** | `{report.verdict.value}` | Evaluated against 15 AEGIS deterministic rules |",
            f"| **Context Completeness** | `{score_pct}%` | {'Passed' if report.context_completeness.verdict_eligible else 'Failed - Refusal Triggered'} |",
            f"| **Critical Violations** | `{report.critical_findings}` | Ingress, IAM wildcards, or active exploits |",
            f"| **Attack Paths Detected** | `{len(report.attack_paths)}` | Lateral movement perimeter breaches |",
            ""
        ]

        # Context Gate Alert if Refused
        if not report.context_completeness.verdict_eligible:
            lines.extend([
                "> ⚠️ **CONTEXT REFUSAL TRIGGERED (Rule 06 & Rule 07):**",
                f"> {report.context_completeness.explanation or 'Telemetry is incomplete, stale, or contradictory.'}",
                ""
            ])

        # Security Findings Table
        if report.findings:
            lines.extend([
                "<details>",
                f"<summary><b>⚠️ Security Violations Detected ({len(report.findings)}) — Click to Expand</b></summary>",
                "",
                "| Severity | Rule ID | Resource ID | Finding Title | Remediation |",
                "| :--- | :--- | :--- | :--- | :--- |"
            ])
            for f in report.findings:
                lines.append(
                    f"| `{f.severity.value}` | `{f.rule_id}` | `{f.affected_resource_id}` | {f.title} | {f.remediation_recommendation} |"
                )
            lines.extend(["", "</details>", ""])

        # Attack Paths Section
        if report.attack_paths:
            lines.extend([
                "<details>",
                f"<summary><b>🚨 Critical Attack Path Analysis ({len(report.attack_paths)}) — Click to Expand</b></summary>",
                ""
            ])
            for idx, ap in enumerate(report.attack_paths, 1):
                lines.extend([
                    f"#### Path #{idx}: {ap.title} (`{ap.entry_point}` $\\to$ `{ap.target_asset}`)",
                    f"- **Severity:** `{ap.severity.value}`",
                    f"- **Narrative:** {ap.narrative}",
                    "",
                    "| Hop | Source Node | Target Node | Action / Exploited Mechanism |",
                    "| :--- | :--- | :--- | :--- |"
                ])
                for hop in ap.hops:
                    lines.append(
                        f"| {hop.hop_index} | `{hop.source_node}` | `{hop.target_node}` | {hop.description} ({hop.relationship}) |"
                    )
                lines.append("")
            lines.extend(["</details>", ""])

        # Compliance Scorecard (CIS & SOC 2)
        comp = compliance_report or ComplianceEngine().evaluate(report.findings)
        lines.extend([
            "<details>",
            f"<summary><b>📋 Compliance Scorecard (Overall: {comp.overall_compliance_pct}%) — Click to Expand</b></summary>",
            "",
            "| Framework | Total Controls | Passed | Failed | Compliance % |",
            "| :--- | :--- | :--- | :--- | :--- |"
        ])
        for fw_key, fw in comp.frameworks.items():
            lines.append(
                f"| {fw.framework_name} ({fw.version}) | {fw.total_checks} | {fw.passed_checks} | {fw.failed_checks} | `{fw.compliance_score_pct}%` |"
            )
        lines.extend(["", "</details>", ""])

        # One-Click Remediation Patch
        if patch_text:
            lines.extend([
                "<details>",
                "<summary><b>🛠️ One-Click Remediation Patch (.patch) — Click to Expand</b></summary>",
                "",
                "Apply this patch locally using `git apply <patch-file>`:",
                "```diff",
                patch_text.strip(),
                "```",
                "",
                "</details>",
                ""
            ])

        lines.extend([
            "---",
            "*Audited deterministically by [AEGIS](https://github.com/mindofyaseen/aegis) · Amazon Bedrock Managed Agents · Zero Cloud Mutation.*"
        ])

        return "\n".join(lines)
