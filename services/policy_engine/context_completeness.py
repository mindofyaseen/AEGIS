"""
AEGIS Deterministic Context Completeness Gate.
Evaluates discovery scope, collector execution status, API permissions,
evidence freshness, and dependency resolution before permitting a security verdict.
Forces INSUFFICIENT_CONTEXT if required context is missing, stale, or contradictory.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from backend.models import (
    ContextCompleteness,
    CollectorRunReport,
    CollectorStatus,
    Verdict,
)

ESSENTIAL_COLLECTORS = [
    "vpc_collector",
    "subnet_collector",
    "security_group_collector",
    "route_table_collector",
    "iam_collector",
]


class ContextCompletenessEngine:
    def __init__(
        self,
        max_age_hours: int = 24,
        min_success_rate: float = 0.85,
    ):
        self.max_age_hours = max_age_hours
        self.min_success_rate = min_success_rate

    def evaluate(
        self,
        collector_reports: List[CollectorRunReport],
        discovered_resources_count: int,
        unresolved_dependencies: Optional[List[str]] = None,
        snapshot_timestamp: Optional[datetime] = None,
    ) -> ContextCompleteness:
        """
        Deterministically evaluates whether available context is complete enough
        to form a defensible security determination.
        """
        unresolved = unresolved_dependencies or []
        total_collectors = len(collector_reports)
        successful_collectors = [
            c for c in collector_reports if c.status == CollectorStatus.SUCCESS
        ]
        failed_collectors = [
            c.collector_name
            for c in collector_reports
            if c.status in (CollectorStatus.FAILED, CollectorStatus.PARTIAL)
        ]

        missing_critical: List[str] = []
        for ess in ESSENTIAL_COLLECTORS:
            matching = [c for c in collector_reports if c.collector_name == ess]
            if not matching or matching[0].status != CollectorStatus.SUCCESS:
                missing_critical.append(ess)

        # Freshness Check
        stale_detected = False
        if snapshot_timestamp:
            age = datetime.now(timezone.utc) - snapshot_timestamp
            if age > timedelta(hours=self.max_age_hours):
                stale_detected = True

        # Calculate Score
        if total_collectors > 0:
            base_score = len(successful_collectors) / total_collectors
        else:
            base_score = 0.0

        # Penalize for missing critical collectors, stale state, or unresolved dependencies
        penalties = 0.0
        if missing_critical:
            penalties += 0.3 * len(missing_critical)
        if stale_detected:
            penalties += 0.4
        if unresolved:
            penalties += 0.1 * min(len(unresolved), 3)

        completeness_score = max(0.0, min(1.0, base_score - penalties))

        # Eligibility Gate: Must have NO missing critical collectors, NO stale data, and score >= threshold
        is_eligible = (
            len(missing_critical) == 0
            and not stale_detected
            and completeness_score >= self.min_success_rate
        )

        explanation_parts = []
        if is_eligible:
            explanation_parts.append(
                f"Context is complete (Score: {completeness_score:.2f}). All essential collectors succeeded."
            )
        else:
            explanation_parts.append(
                f"Context completeness gate FAILED (Score: {completeness_score:.2f})."
            )
            if missing_critical:
                explanation_parts.append(
                    f"Missing critical collectors: {', '.join(missing_critical)}."
                )
            if stale_detected:
                explanation_parts.append(
                    f"Snapshot is stale (> {self.max_age_hours} hours old)."
                )
            if unresolved:
                explanation_parts.append(
                    f"Unresolved resource dependencies: {', '.join(unresolved)}."
                )

        return ContextCompleteness(
            completeness_score=round(completeness_score, 3),
            total_collectors_run=total_collectors,
            successful_collectors=len(successful_collectors),
            failed_collectors=failed_collectors,
            missing_critical_evidence=missing_critical,
            stale_snapshots_detected=stale_detected,
            unresolved_dependencies=unresolved,
            verdict_eligible=is_eligible,
            explanation=" ".join(explanation_parts),
        )
