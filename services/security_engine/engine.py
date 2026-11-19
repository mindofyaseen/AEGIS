"""
AEGIS Security Posture & Rule Evaluation Engine.
Executes deterministic security rules against the discovered resource inventory.
"""

from typing import List, Dict
from backend.models import Resource, SecurityFinding
from services.security_engine.rules import (
    evaluate_sec_net_01,
    evaluate_sec_iam_01,
    evaluate_sec_s3_01,
    evaluate_sec_db_01,
)


class SecurityEngine:
    def __init__(self):
        self.rules = [
            evaluate_sec_net_01,
            evaluate_sec_iam_01,
            evaluate_sec_s3_01,
            evaluate_sec_db_01,
        ]

    def evaluate_resources(self, resources: List[Resource]) -> List[SecurityFinding]:
        """Run all registered deterministic security checks against all resources."""
        findings: List[SecurityFinding] = []
        for resource in resources:
            for rule in self.rules:
                finding = rule(resource)
                if finding:
                    findings.append(finding)
        return findings
