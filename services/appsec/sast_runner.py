"""
AEGIS SAST Runner.
Executes static application security analysis using Semgrep subprocess isolation,
with a deterministic built-in rule matcher fallback to guarantee zero-dependency execution.
Enforces strict LGPL 2.1 compliance via external process separation.
"""

import os
import re
import subprocess
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

from services.appsec.models import AppSecFinding, AppSecCategory, VulnSeverity, CodeLocation

# Built-in deterministic security rules (OWASP Top 10 patterns)
BUILTIN_SAST_PATTERNS = [
    {
        "rule_id": "aegis-sast-sqli",
        "title": "Potential SQL Injection via String Concatenation",
        "severity": VulnSeverity.HIGH,
        "pattern": r"(?:execute|raw|cursor\.execute)\s*\(\s*f?[\"'].*?%s|(?:\.format\(|\+\s*\w+)",
        "description": "Constructing SQL queries using dynamic string concatenation allows attackers to execute arbitrary database queries.",
        "remediation": "Use parameterized queries or prepared statements (e.g. cursor.execute(query, (param,)))",
        "cwe": "CWE-89",
    },
    {
        "rule_id": "aegis-sast-cmdi",
        "title": "Command Injection via Shell Execution",
        "severity": VulnSeverity.CRITICAL,
        "pattern": r"(?:os\.system|subprocess\.Popen|subprocess\.run|subprocess\.call)\s*\(\s*(?:f?[\"'].*?\{|.*?\+\s*\w+).*?shell\s*=\s*True",
        "description": "Passing unvalidated inputs to subprocesses with shell=True allows arbitrary OS command injection.",
        "remediation": "Set shell=False and pass command arguments as an explicit array of strings.",
        "cwe": "CWE-78",
    },
    {
        "rule_id": "aegis-sast-ssrf",
        "title": "Server-Side Request Forgery (SSRF) Risk",
        "severity": VulnSeverity.HIGH,
        "pattern": r"(?:requests\.get|requests\.post|urllib\.request\.urlopen|httpx\.get)\s*\(\s*(?:url|req_url|target_url|request\.(?:args|form|json))",
        "description": "Fetching remote URLs provided directly by users without IP/DNS allowlist validation enables SSRF into internal networks.",
        "remediation": "Validate target URLs against an explicit allowlist and block private IP ranges (10.0.0.0/8, 169.254.169.254).",
        "cwe": "CWE-918",
    },
    {
        "rule_id": "aegis-sast-insecure-deserialization",
        "title": "Insecure Deserialization via Pickle / Yaml",
        "severity": VulnSeverity.CRITICAL,
        "pattern": r"(?:pickle\.loads|yaml\.load)\s*\([^)]*?(?:request|input|data)",
        "description": "Deserializing untrusted data with pickle or yaml.load leads to remote code execution.",
        "remediation": "Use json.loads or yaml.safe_load for untrusted data serialization.",
        "cwe": "CWE-502",
    },
    {
        "rule_id": "aegis-sast-weak-crypto",
        "title": "Use of Broken Cryptographic Hash (MD5 / SHA-1)",
        "severity": VulnSeverity.MEDIUM,
        "pattern": r"hashlib\.(?:md5|sha1)\s*\(",
        "description": "MD5 and SHA-1 have known collision vulnerabilities and should not be used for security purposes.",
        "remediation": "Upgrade to SHA-256, SHA-3, or bcrypt/argon2 for password hashing.",
        "cwe": "CWE-327",
    },
]


class SASTRunner:
    """Executes SAST scans with fallback built-in analysis."""

    def __init__(self, semgrep_bin: str = "semgrep"):
        self.semgrep_bin = semgrep_bin

    def scan_directory(self, target_dir: str) -> List[AppSecFinding]:
        target_path = Path(target_dir)
        if not target_path.exists():
            return []

        findings: List[AppSecFinding] = []

        # Attempt to run external Semgrep CLI if available
        semgrep_findings = self._run_semgrep_cli(target_path)
        if semgrep_findings:
            findings.extend(semgrep_findings)
        else:
            # Fall back to deterministic AST/regex pattern scanner
            findings.extend(self._run_builtin_scanner(target_path))

        return findings

    def _run_semgrep_cli(self, target_path: Path) -> Optional[List[AppSecFinding]]:
        try:
            cmd = [
                self.semgrep_bin,
                "scan",
                "--json",
                "--config=auto",
                "--metrics=off",
                str(target_path),
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
            if result.returncode in (0, 1) and result.stdout:
                data = json.loads(result.stdout)
                parsed: List[AppSecFinding] = []
                for hit in data.get("results", []):
                    sev = VulnSeverity.MEDIUM
                    s_str = hit.get("extra", {}).get("severity", "").upper()
                    if s_str == "ERROR":
                        sev = VulnSeverity.HIGH
                    elif s_str == "WARNING":
                        sev = VulnSeverity.MEDIUM

                    finding = AppSecFinding(
                        finding_id=f"sast-{uuid.uuid4().hex[:8]}",
                        category=AppSecCategory.SAST,
                        title=hit.get("check_id", "Semgrep Finding"),
                        severity=sev,
                        rule_id=hit.get("check_id", "semgrep-rule"),
                        description=hit.get("extra", {}).get("message", "Semgrep detection"),
                        remediation_guidance=hit.get("extra", {}).get("fix", "Review and sanitize input"),
                        location=CodeLocation(
                            file_path=hit.get("path", ""),
                            start_line=hit.get("start", {}).get("line", 1),
                            end_line=hit.get("end", {}).get("line", 1),
                            snippet=hit.get("extra", {}).get("lines", ""),
                        ),
                    )
                    parsed.append(finding)
                return parsed
        except Exception:
            return None
        return None

    def _run_builtin_scanner(self, target_path: Path) -> List[AppSecFinding]:
        results: List[AppSecFinding] = []
        extensions = (".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go")

        for root, _, files in os.walk(target_path):
            for file in files:
                if not file.endswith(extensions):
                    continue
                full_path = Path(root) / file
                rel_path = str(full_path.relative_to(target_path))
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                except Exception:
                    continue

                for line_idx, line in enumerate(lines, 1):
                    for rule in BUILTIN_SAST_PATTERNS:
                        if re.search(rule["pattern"], line):
                            finding = AppSecFinding(
                                finding_id=f"sast-{uuid.uuid4().hex[:8]}",
                                category=AppSecCategory.SAST,
                                title=rule["title"],
                                severity=rule["severity"],
                                rule_id=rule["rule_id"],
                                description=rule["description"],
                                remediation_guidance=rule["remediation"],
                                cwe=rule.get("cwe"),
                                location=CodeLocation(
                                    file_path=rel_path,
                                    start_line=line_idx,
                                    end_line=line_idx,
                                    snippet=line.strip()[:160],
                                ),
                            )
                            results.append(finding)
        return results
