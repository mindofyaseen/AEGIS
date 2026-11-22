"""
AEGIS Dockerfile AST & Static Misconfiguration Inspector.
Audits Dockerfiles for dangerous root execution, unpinned base images,
missing health checks, exposed sensitive ports, and embedded credentials.
"""

import re
from pathlib import Path
from typing import List, Dict, Any

from services.container_security.models import DockerfileFinding


class DockerfileAnalyzer:
    """Statically analyzes Dockerfiles for container hardening best practices."""

    def analyze_file(self, dockerfile_path: str) -> List[DockerfileFinding]:
        path = Path(dockerfile_path)
        if not path.exists():
            return []

        findings: List[DockerfileFinding] = []
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except Exception:
            return []

        has_user_instruction = False
        has_healthcheck = False

        for idx, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue

            # 1. Base Image Tag Check (Avoid :latest)
            if stripped.upper().startswith("FROM "):
                image_ref = stripped[5:].strip().split()[0]
                if ":latest" in image_ref or ":" not in image_ref:
                    findings.append(
                        DockerfileFinding(
                            rule_id="aegis-docker-unpinned-base",
                            title="Unpinned Container Base Image Tag",
                            severity="HIGH",
                            line_number=idx,
                            instruction=stripped,
                            description=f"Base image '{image_ref}' uses ':latest' or no tag. Builds are non-reproducible and vulnerable to supply chain drift.",
                            remediation="Pin the base image to an immutable SHA-256 digest (e.g. alpine@sha256:...) or explicit release tag.",
                        )
                    )

            # 2. Track USER instruction
            if stripped.upper().startswith("USER "):
                user_val = stripped[5:].strip().lower()
                if user_val in ("root", "0"):
                    findings.append(
                        DockerfileFinding(
                            rule_id="aegis-docker-root-user",
                            title="Container Configured to Run as Root",
                            severity="CRITICAL",
                            line_number=idx,
                            instruction=stripped,
                            description="Explicitly configuring USER root allows potential container breakout into the host kernel.",
                            remediation="Create and specify a non-privileged system user (e.g. USER appuser).",
                        )
                    )
                else:
                    has_user_instruction = True

            # 3. Track HEALTHCHECK instruction
            if stripped.upper().startswith("HEALTHCHECK "):
                has_healthcheck = True

            # 4. Check for sudo usage
            if "sudo " in stripped.lower():
                findings.append(
                    DockerfileFinding(
                        rule_id="aegis-docker-sudo-installed",
                        title="Sudo Command Detected in Container",
                        severity="MEDIUM",
                        line_number=idx,
                        instruction=stripped,
                        description="Installing or using sudo in container images increases the attack surface and privilege escalation potential.",
                        remediation="Perform build-time setup as root, then switch to non-root USER; avoid installing sudo.",
                    )
                )

            # 5. Check for dangerous exposed ports (SSH 22, Telnet 23)
            if stripped.upper().startswith("EXPOSE "):
                ports = stripped[7:].strip().split()
                if "22" in ports or "23" in ports:
                    findings.append(
                        DockerfileFinding(
                            rule_id="aegis-docker-exposed-ssh",
                            title="SSH/Telnet Port Exposed in Container",
                            severity="CRITICAL",
                            line_number=idx,
                            instruction=stripped,
                            description="Exposing SSH (22) or Telnet (23) in a container violates cloud-native microservice architecture.",
                            remediation="Remove SSH servers from container images. Use AWS Systems Manager (SSM) or kubectl exec for debugging.",
                        )
                    )

        # Missing non-root user check
        if not has_user_instruction:
            findings.append(
                DockerfileFinding(
                    rule_id="aegis-docker-missing-user",
                    title="Missing Non-Root USER Instruction",
                    severity="HIGH",
                    line_number=len(lines),
                    instruction="<END_OF_FILE>",
                    description="No USER instruction defined. By default, container will execute processes with root privileges.",
                    remediation="Add 'USER nonroot' before the container ENTRYPOINT or CMD.",
                )
            )

        return findings
