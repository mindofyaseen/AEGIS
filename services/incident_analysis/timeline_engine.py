"""
AEGIS Incident Investigation & CloudTrail Timeline Correlator.
Constructs chronological investigation timelines from management event history
to correlate security drift with specific identity and configuration changes.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel


class TimelineEvent(BaseModel):
    event_id: str
    event_time: str
    event_name: str
    event_source: str
    actor_arn: str
    actor_username: str
    source_ip: str
    target_resource_id: Optional[str] = None
    security_significance: str
    is_suspicious: bool = False


class CloudTrailTimelineEngine:
    def __init__(self):
        self.suspicious_event_names = [
            "AuthorizeSecurityGroupIngress",
            "PutBucketPolicy",
            "DeleteBucketPublicAccessBlock",
            "AttachRolePolicy",
            "PutRolePolicy",
            "CreateUser",
            "CreateAccessKey",
        ]

    def build_timeline(self, cloudtrail_records: List[Dict[str, Any]]) -> List[TimelineEvent]:
        """
        Parse raw CloudTrail management events into an explainable chronological timeline.
        """
        timeline: List[TimelineEvent] = []

        for record in cloudtrail_records:
            name = record.get("eventName", "UnknownEvent")
            user_identity = record.get("userIdentity", {})
            req_params = record.get("requestParameters") or {}

            # Target resource resolution
            target_id = req_params.get("groupId") or req_params.get("bucketName") or req_params.get("roleName")

            is_suspicious = name in self.suspicious_event_names

            significance = "Standard Management Operation"
            if name == "AuthorizeSecurityGroupIngress":
                significance = "Security Group perimeter modification (Ingress rule added)"
            elif name == "PutBucketPolicy":
                significance = "Storage bucket access policy modified"
            elif name == "DeleteBucketPublicAccessBlock":
                significance = "S3 Block Public Access protection disabled"

            event = TimelineEvent(
                event_id=record.get("eventID", str(len(timeline) + 1)),
                event_time=record.get("eventTime", datetime.now(timezone.utc).isoformat()),
                event_name=name,
                event_source=record.get("eventSource", "aws"),
                actor_arn=user_identity.get("arn", "UnknownPrincipal"),
                actor_username=user_identity.get("userName", "system"),
                source_ip=record.get("sourceIPAddress", "0.0.0.0"),
                target_resource_id=target_id,
                security_significance=significance,
                is_suspicious=is_suspicious,
            )
            timeline.append(event)

        # Sort chronologically
        timeline.sort(key=lambda x: x.event_time, reverse=True)
        return timeline
