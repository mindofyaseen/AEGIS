"""
Unit and Integration tests for AEGIS CI/CD Pull Request Gatekeeper CLI.
Verifies command-line interface execution, exit code enforcement, and report formatting.
"""

import sys
from pathlib import Path
from cli.aegis_cli import AegisCLI

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "fixtures"


def test_cli_gatekeeper_runs_with_defaults(capsys):
    cli = AegisCLI()
    exit_code = cli.run([])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "AEGIS AUTONOMOUS CLOUD SECURITY & DEVSECOPS GATEKEEPER" in captured.out
    assert "Context Completeness:" in captured.out


def test_cli_gatekeeper_markdown_format(capsys):
    cli = AegisCLI()
    exit_code = cli.run(["--format", "markdown"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "## 🛡️ AEGIS Security Gatekeeper Report" in captured.out
    assert "| Rule | Severity | Resource |" in captured.out


def test_cli_gatekeeper_json_format(capsys):
    cli = AegisCLI()
    exit_code = cli.run(["--format", "json"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert '"verdict":' in captured.out
    assert '"investigation_id":' in captured.out


def test_cli_gatekeeper_fail_on_block_exit_code():
    cli = AegisCLI()
    tf_plan_path = str(FIXTURES_DIR / "terraform_plans" / "risky_ssh_exposure.json")
    # Must return exit code 1 when --fail-on-block is set and plan triggers BLOCK
    exit_code = cli.run([
        "--terraform-plan", tf_plan_path,
        "--fail-on-block",
    ])
    assert exit_code == 1


def test_cli_gatekeeper_writes_output_file(tmp_path):
    out_file = tmp_path / "aegis_report.md"
    cli = AegisCLI()
    exit_code = cli.run([
        "--format", "markdown",
        "--output", str(out_file),
    ])
    assert exit_code == 0
    assert out_file.exists()
    content = out_file.read_text(encoding="utf-8")
    assert "AEGIS Security Gatekeeper Report" in content


def test_cli_gatekeeper_github_pr_format(capsys):
    cli = AegisCLI()
    exit_code = cli.run(["--format", "github-pr"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "## 🛡️ AEGIS Security Gatekeeper — Automated PR Review" in captured.out
    assert "CIS AWS Foundations Benchmark" in captured.out


def test_cli_gatekeeper_slack_format(capsys):
    cli = AegisCLI()
    exit_code = cli.run(["--format", "slack"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert '"blocks":' in captured.out
    assert "AEGIS Security Verdict" in captured.out


def test_cli_gatekeeper_cfn_template_detection(tmp_path, capsys):
    cfn_file = tmp_path / "vulnerable_cfn.json"
    cfn_file.write_text(
        '{"Resources": {"InsecureSG": {"Type": "AWS::EC2::SecurityGroup", "Properties": {"SecurityGroupIngress": [{"FromPort": 22, "ToPort": 22, "CidrIp": "0.0.0.0/0"}]}}}}',
        encoding="utf-8"
    )
    cli = AegisCLI()
    exit_code = cli.run([
        "--cfn-template", str(cfn_file),
        "--fail-on-block"
    ])
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "CloudFormation template contains" in captured.out

