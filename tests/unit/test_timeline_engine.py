"""
Unit tests for AEGIS CloudTrail Forensic Timeline Engine.
Validates suspicious mutation classification, chronological sorting, and malformed event handling.
"""

from services.incident_analysis.timeline_engine import CloudTrailTimelineEngine


def test_timeline_engine_classifies_suspicious_operations():
    engine = CloudTrailTimelineEngine()
    records = [
        {
            "eventID": "evt-01",
            "eventTime": "2026-11-19T10:00:00Z",
            "eventName": "AuthorizeSecurityGroupIngress",
            "eventSource": "ec2.amazonaws.com",
            "userIdentity": {"arn": "arn:aws:iam::237657481511:user/admin", "userName": "admin"},
            "sourceIPAddress": "203.0.113.195",
            "requestParameters": {"groupId": "sg-bastion"},
        },
        {
            "eventID": "evt-02",
            "eventTime": "2026-11-19T10:05:00Z",
            "eventName": "DescribeInstances",
            "eventSource": "ec2.amazonaws.com",
            "userIdentity": {"arn": "arn:aws:iam::237657481511:user/readonly", "userName": "readonly"},
            "sourceIPAddress": "198.51.100.5",
        },
    ]

    timeline = engine.build_timeline(records)
    assert len(timeline) == 2
    # Verify chronological sorting (newest first)
    assert timeline[0].event_id == "evt-02"
    assert timeline[1].event_id == "evt-01"

    # Verify suspicious detection
    assert timeline[1].is_suspicious is True
    assert "Security Group perimeter modification" in timeline[1].security_significance
    assert timeline[1].target_resource_id == "sg-bastion"

    # Verify standard operation
    assert timeline[0].is_suspicious is False


def test_timeline_engine_empty_records():
    engine = CloudTrailTimelineEngine()
    timeline = engine.build_timeline([])
    assert len(timeline) == 0


def test_timeline_engine_handles_missing_fields_gracefully():
    engine = CloudTrailTimelineEngine()
    # Record with minimal/missing fields
    records = [{}]
    timeline = engine.build_timeline(records)
    assert len(timeline) == 1
    assert timeline[0].event_name == "UnknownEvent"
    assert timeline[0].actor_username == "system"
    assert timeline[0].source_ip == "0.0.0.0"
