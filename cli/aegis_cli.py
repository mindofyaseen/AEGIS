"""
AEGIS CI/CD Pull Request Gatekeeper CLI.
Automates Infrastructure as Code (IaC) security verification in continuous integration pipelines.
Evaluates Terraform plan JSON against live or synthetic topology, traces multi-hop attack paths,
and returns deterministic exit codes to prevent insecure infrastructure merges.
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

from backend.orchestration.investigator import AegisInvestigator
from backend.models import InvestigationReport, Verdict


class AegisCLI:
    def __init__(self):
        self.investigator = AegisInvestigator()

    def load_json_file(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def format_console_output(self, report: InvestigationReport) -> str:
        lines = []
        lines.append("=" * 70)
        lines.append(" AEGIS AUTONOMOUS CLOUD SECURITY & DEVSECOPS GATEKEEPER")
        lines.append("=" * 70)
        lines.append(f" Investigation ID: {report.investigation_id}")
        lines.append(f" Target Account:   {report.account_id} | Region: {report.region}")
        lines.append(f" Verdict:          {report.verdict.value}")
        lines.append(f" Reason:           {report.verdict_reason}")
        lines.append("-" * 70)
        lines.append(f" Context Completeness: {report.context_completeness.completeness_score * 100:.1f}% "
                     f"(Eligible: {report.context_completeness.verdict_eligible})")
        lines.append(f" Investigated Assets:  {report.total_resources}")
        lines.append(f" Findings:             {report.total_findings} ({report.critical_findings} Critical)")
        lines.append(f" Evidenced Attack Paths: {len(report.attack_paths)}")

        if report.attack_paths:
            lines.append("-" * 70)
            lines.append(" ATTACK PATH TRAVERSAL IDENTIFIED:")
            for p in report.attack_paths:
                lines.append(f"  * Entry: {p.entry_point} -> Target: {p.target_asset}")
                for h in p.hops:
                    lines.append(f"    - [{h.hop_index}] {h.source_node} --({h.relationship})--> {h.target_node}")

        if report.findings:
            lines.append("-" * 70)
            lines.append(" DETECTED SECURITY FINDINGS:")
            for f in report.findings:
                lines.append(f"  [{f.severity.value}] {f.rule_id}: {f.title}")
                lines.append(f"    Target: {f.affected_resource_id}")
                lines.append(f"    Fix:    {f.remediation_recommendation}")

        if report.remediation_patches:
            lines.append("-" * 70)
            lines.append(" RULE 14 REMEDIATION PLAN PREVIEWS:")
            for patch in report.remediation_patches:
                lines.append(f"  Target: {patch.target_resource_id}")
                lines.append(f"  Action: {patch.suggested_action}")
                if patch.cli_command_preview:
                    lines.append(f"  CLI:    {patch.cli_command_preview.splitlines()[0]}")

        lines.append("=" * 70)
        return "\n".join(lines)

    def format_markdown_output(self, report: InvestigationReport) -> str:
        badge_color = {
            Verdict.BLOCK: "critical",
            Verdict.INSUFFICIENT_CONTEXT: "yellow",
            Verdict.READY_FOR_HUMAN_REVIEW: "success",
        }.get(report.verdict, "lightgrey")

        md = []
        md.append(f"## 🛡️ AEGIS Security Gatekeeper Report")
        md.append(f"**Verdict:** ` {report.verdict.value} ` | **Account:** `{report.account_id}` | **Region:** `{report.region}`\n")
        md.append(f"> **Reason:** {report.verdict_reason}\n")

        # Telemetry summary
        md.append("### 📊 Telemetry & Context Completeness")
        md.append(f"- **Completeness Score:** `{report.context_completeness.completeness_score * 100:.1f}%`")
        md.append(f"- **Verdict Eligible:** `{'Yes' if report.context_completeness.verdict_eligible else 'No (Fail-Closed)'}`")
        md.append(f"- **Total Resources Evaluated:** `{report.total_resources}`")
        md.append(f"- **Critical Findings:** `{report.critical_findings}`\n")

        # Attack Paths
        if report.attack_paths:
            md.append("### ⚠️ Evidenced Multi-Hop Attack Paths")
            for p in report.attack_paths:
                md.append(f"**Path {p.path_id}:** `{p.entry_point}` ➔ `{p.target_asset}`")
                md.append(f"> {p.narrative}\n")
                md.append("```text")
                for h in p.hops:
                    md.append(f"[{h.hop_index}] {h.source_node}  --({h.relationship})-->  {h.target_node}")
                md.append("```\n")

        # Findings Table
        if report.findings:
            md.append("### 🔍 Security Violations")
            md.append("| Rule | Severity | Resource | Title | Recommendation |")
            md.append("| :--- | :--- | :--- | :--- | :--- |")
            for f in report.findings:
                md.append(f"| `{f.rule_id}` | **{f.severity.value}** | `{f.affected_resource_id}` | {f.title} | {f.remediation_recommendation} |")
            md.append("")

        # Remediation Patches
        if report.remediation_patches:
            md.append("### 🔧 Rule 14 Remediation Patches")
            for patch in report.remediation_patches:
                md.append(f"#### Target: `{patch.target_resource_id}`")
                md.append(f"**Action:** {patch.suggested_action}\n")
                if patch.terraform_patch:
                    md.append("```hcl")
                    md.append(patch.terraform_patch)
                    md.append("```\n")
                if patch.cli_command_preview:
                    md.append("**AWS CLI Repair:**")
                    md.append("```bash")
                    md.append(patch.cli_command_preview)
                    md.append("```\n")

        md.append("---")
        md.append("*Generated by AEGIS Autonomous Cloud Security Engine — Zero Mutation Enforced*")
        return "\n".join(md)

    def run(self, argv=None) -> int:
        parser = argparse.ArgumentParser(
            description="AEGIS CI/CD Pull Request Gatekeeper CLI",
            formatter_class=argparse.RawDescriptionHelpFormatter,
        )
        parser.add_argument(
            "--terraform-plan",
            type=Path,
            required=False,
            help="Path to Terraform Plan JSON (generated via `terraform show -json tfplan`)",
        )
        parser.add_argument(
            "--topology",
            type=Path,
            required=False,
            help="Path to AWS Topology JSON fixture (defaults to ecommerce_vpc.json baseline)",
        )
        parser.add_argument(
            "--fail-on-block",
            action="store_true",
            help="Exit with non-zero exit code if verdict is BLOCK or INSUFFICIENT_CONTEXT",
        )
        parser.add_argument(
            "--format",
            choices=["console", "markdown", "json"],
            default="console",
            help="Output formatting (default: console)",
        )
        parser.add_argument(
            "--output",
            type=Path,
            required=False,
            help="Write report to specified output file",
        )

        args = parser.parse_args(argv)

        # 1. Resolve Topology
        if args.topology:
            topology_data = self.load_json_file(args.topology)
        else:
            default_topo = Path(__file__).resolve().parent.parent / "fixtures" / "aws_topologies" / "ecommerce_vpc.json"
            topology_data = self.load_json_file(default_topo)

        # 2. Resolve Terraform Plan
        tf_plan_data = None
        if args.terraform_plan:
            tf_plan_data = self.load_json_file(args.terraform_plan)

        # 3. Execute Investigation
        report = self.investigator.run_investigation(
            topology_data=topology_data,
            terraform_plan_data=tf_plan_data,
        )

        # 4. Format Output
        if args.format == "json":
            output_str = json.dumps(report.model_dump(), indent=2, default=str)
        elif args.format == "markdown":
            output_str = self.format_markdown_output(report)
        else:
            output_str = self.format_console_output(report)

        # 5. Emit
        print(output_str)
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output_str)

        # 6. Determine Exit Code
        if args.fail_on_block:
            if report.verdict == Verdict.BLOCK:
                return 1
            elif report.verdict == Verdict.INSUFFICIENT_CONTEXT:
                return 2

        return 0


def main():
    cli = AegisCLI()
    sys.exit(cli.run())


if __name__ == "__main__":
    main()
