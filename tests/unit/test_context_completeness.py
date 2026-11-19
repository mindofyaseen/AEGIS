"""
Unit tests for AEGIS Context Completeness Gate.
Validates mathematical formulation, edge cases, and deterministic refusal gates.
"""

from datetime import datetime, timezone, timedelta
from backend.models import CollectorRunReport, CollectorStatus
from services.policy_engine.context_completeness import ContextCompletenessEngine


def test_context_completeness_all_success():
    engine = ContextCompletenessEngine(min_success_rate=0.85)
    reports = [
        CollectorRunReport(collector_name="vpc_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="subnet_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="route_table_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="security_group_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="iam_collector", status=CollectorStatus.SUCCESS, resource_count=3),
    ]
    res = engine.evaluate(collector_reports=reports, discovered_resources_count=9)
    assert res.completeness_score >= 0.85
    assert res.verdict_eligible is True
    assert len(res.missing_critical_evidence) == 0


def test_context_completeness_missing_essential_collector():
    engine = ContextCompletenessEngine(min_success_rate=0.85)
    # Missing iam_collector
    reports = [
        CollectorRunReport(collector_name="vpc_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="subnet_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="route_table_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="security_group_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="iam_collector", status=CollectorStatus.FAILED, resource_count=0),
    ]
    res = engine.evaluate(collector_reports=reports, discovered_resources_count=6)
    assert res.verdict_eligible is False
    assert "iam_collector" in res.missing_critical_evidence
    assert res.completeness_score < 0.85


def test_context_completeness_stale_snapshot():
    engine = ContextCompletenessEngine(max_age_hours=24)
    reports = [
        CollectorRunReport(collector_name="vpc_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="subnet_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="route_table_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="security_group_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="iam_collector", status=CollectorStatus.SUCCESS, resource_count=3),
    ]
    # Timestamp is 28 hours old
    old_time = datetime.now(timezone.utc) - timedelta(hours=28)
    res = engine.evaluate(
        collector_reports=reports,
        discovered_resources_count=9,
        snapshot_timestamp=old_time,
    )
    assert res.stale_snapshots_detected is True
    assert res.verdict_eligible is False


def test_context_completeness_unresolved_dependencies():
    engine = ContextCompletenessEngine()
    reports = [
        CollectorRunReport(collector_name="vpc_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="subnet_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="route_table_collector", status=CollectorStatus.SUCCESS, resource_count=1),
        CollectorRunReport(collector_name="security_group_collector", status=CollectorStatus.SUCCESS, resource_count=2),
        CollectorRunReport(collector_name="iam_collector", status=CollectorStatus.SUCCESS, resource_count=3),
    ]
    res = engine.evaluate(
        collector_reports=reports,
        discovered_resources_count=9,
        unresolved_dependencies=["role-unknown-99", "sg-missing-01"],
    )
    assert len(res.unresolved_dependencies) == 2
    assert res.completeness_score < 1.0


def test_context_completeness_empty_reports():
    engine = ContextCompletenessEngine()
    res = engine.evaluate(collector_reports=[], discovered_resources_count=0)
    assert res.completeness_score == 0.0
    assert res.verdict_eligible is False
