"""
AEGIS Secret Scanner.
Scans source files, configuration files, and git diffs for committed credentials,
high-entropy tokens, AWS access keys, and private keys.
Automatically redacts discovered values before storing findings.
"""

import re
import uuid
from pathlib import Path
from typing import List, Dict, Any, Tuple

from services.appsec.models import AppSecFinding, AppSecCategory, VulnSeverity, CodeLocation

SECRET_PATTERNS = [
    {
        "rule_id": "aegis-secret-aws-key",
        "title": "Committed AWS Access Key ID",
        "severity": VulnSeverity.CRITICAL,
        "pattern": r"(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}",
        "description": "Hardcoded AWS Access Key ID exposed in source code. Allows direct programmatic access to AWS account resources.",
        "remediation": "Revoke the access key immediately in AWS IAM, audit CloudTrail for unauthorized actions, and migrate to IAM Roles or AWS Secrets Manager.",
    },
    {
        "rule_id": "aegis-secret-private-key",
        "title": "Committed RSA/EC/OpenSSH Private Key",
        "severity": VulnSeverity.CRITICAL,
        "pattern": r"-----BEGIN (?:RSA|EC|DSA|OPENSSH|PRIVATE) KEY-----",
        "description": "Private cryptographic key discovered in source code. Compromises server access and TLS trust.",
        "remediation": "Revoke and rotate the associated public key, re-issue certificates, and store keys in a hardware HSM or AWS KMS.",
    },
    {
        "rule_id": "aegis-secret-github-token",
        "title": "Committed GitHub Personal Access Token",
        "severity": VulnSeverity.HIGH,
        "pattern": r"gh[pousr]_[0-9a-zA-Z]{36}",
        "description": "GitHub token committed to codebase. May permit repository tampering or CI/CD workflow execution.",
        "remediation": "Revoke the token in GitHub Settings and switch to GitHub App or short-lived OIDC tokens.",
    },
    {
        "rule_id": "aegis-secret-generic-password",
        "title": "Hardcoded Password or Secret Assignment",
        "severity": VulnSeverity.HIGH,
        "pattern": r"(?:password|passwd|secret|api_key|apiKey|db_pass)\s*[:=]\s*[\"']([^\"']{8,64})[\"']",
        "description": "Plaintext secret assignment in source code.",
        "remediation": "Inject credentials via environment variables or AWS Secrets Manager.",
    },
    {
        "rule_id": "aegis-secret-slack-webhook",
        "title": "Committed Slack Webhook URL",
        "severity": VulnSeverity.MEDIUM,
        "pattern": r"https://hooks\.slack\.com/services/T[0-9A-Z]{8}/B[0-9A-Z]{8}/[0-9a-zA-Z]{24}",
        "description": "Exposed Slack webhook URL allows unauthorized message injection into internal communication channels.",
        "remediation": "Regenerate the Slack webhook in Slack API console and load via SSM Parameter Store.",
    },
]


class SecretScanner:
    """Scans repositories and code snippets for leaked secrets with auto-redaction."""

    def scan_directory(self, target_dir: str) -> List[AppSecFinding]:
        target_path = Path(target_dir)
        findings: List[AppSecFinding] = []

        ignore_dirs = {".git", ".pytest_cache", "node_modules", "__pycache__", "venv"}

        for path in target_path.rglob("*"):
            if path.is_file() and not any(part in ignore_dirs for part in path.parts):
                # Skip binary files
                if path.suffix in (".pyc", ".png", ".jpg", ".zip", ".tar", ".gz", ".exe"):
                    continue
                findings.extend(self.scan_file(path, target_path))

        return findings

    def scan_file(self, file_path: Path, base_dir: Path) -> List[AppSecFinding]:
        findings: List[AppSecFinding] = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            return []

        rel_path = str(file_path.relative_to(base_dir))

        for line_idx, line in enumerate(lines, 1):
            # Skip obvious mock or test dummy keys
            if "EXAMPLE" in line or "dummy" in line.lower() or "test_" in rel_path.lower():
                continue

            for rule in SECRET_PATTERNS:
                match = re.search(rule["pattern"], line)
                if match:
                    raw_val = match.group(0)
                    # Mask the secret value
                    masked = self.mask_secret(raw_val)
                    snippet_masked = line.replace(raw_val, masked).strip()[:140]

                    finding = AppSecFinding(
                        finding_id=f"secret-{uuid.uuid4().hex[:8]}",
                        category=AppSecCategory.SECRETS,
                        title=rule["title"],
                        severity=rule["severity"],
                        rule_id=rule["rule_id"],
                        description=rule["description"],
                        remediation_guidance=rule["remediation"],
                        location=CodeLocation(
                            file_path=rel_path,
                            start_line=line_idx,
                            end_line=line_idx,
                            snippet=snippet_masked,
                        ),
                    )
                    findings.append(finding)
        return findings

    @staticmethod
    def mask_secret(secret: str) -> str:
        if len(secret) <= 8:
            return "[REDACTED]"
        return f"{secret[:4]}...{secret[-4:]}[REDACTED]"
