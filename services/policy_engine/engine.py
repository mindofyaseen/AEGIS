"""
AEGIS Policy Engine & Verdict Arbitrator.
Synthesizes findings, context completeness, and graph intelligence to determine
the official investigation verdict: BLOCK, INSUFFICIENT_CONTEXT, or READY_FOR_HUMAN_REVIEW.
"""

from typing import List, Optional
from backend.models import (
    Verdict,
    ContextCompleteness,
    SecurityFinding,
    Severity,
)


class PolicyEngine:
    def __init__(self):
        pass

    def determine_verdict(
        self,
        context_completeness: ContextCompleteness,
        findings: List[SecurityFinding],
        terraform_blocking: bool = False,
    ) -> (Verdict, str):
        """
        Arbitrate the definitive security verdict.
        Deterministic precedence:
        1. Context Incomplete -> INSUFFICIENT_CONTEXT (Hard Gate)
        2. Critical Security Violations -> BLOCK (Hard Gate)
        3. Passed Defined Checks with Complete Evidence -> READY_FOR_HUMAN_REVIEW
        """
        # Gate 1: Context Completeness
        if not context_completeness.verdict_eligible:
            return (
                Verdict.INSUFFICIENT_CONTEXT,
                f"Investigation halted by Context Completeness Gate: {context_completeness.explanation}",
            )

        # Gate 2: Deterministic Blocking Violations
        critical_findings = [f for f in findings if f.severity == Severity.CRITICAL]
        if critical_findings or terraform_blocking:
            reasons = [f.title for f in critical_findings]
            if terraform_blocking:
                reasons.append("Proposed Terraform plan introduces critical perimeter exposure.")
            return (
                Verdict.BLOCK,
                f"Release BLOCKED by deterministic policy: {'; '.join(reasons)}",
            )

        # Gate 3: Ready for Human Review (Never unqualified 'SAFE')
        return (
            Verdict.READY_FOR_HUMAN_REVIEW,
            "All in-scope deterministic checks passed with verified context completeness. Ready for human engineering review.",
        )
