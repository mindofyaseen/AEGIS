"""
AEGIS Runtime Event Dispatcher.
Ingests and normalizes security events from Amazon EventBridge and SQS queues,
de-duplicating rapid alerts and routing them to the threat correlation engine.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from services.runtime.models import RuntimeSecurityEvent


class RuntimeEventDispatcher:
    """Consumes and normalizes AWS GuardDuty and Security Hub event payloads."""

    def __init__(self):
        self.seen_events: set = set()

    def process_event_payload(self, raw_payload: Dict[str, Any]) -> Optional[RuntimeSecurityEvent]:
        detail = raw_payload.get("detail", raw_payload)
        event_id = raw_payload.get("id", detail.get("id", "evt-unknown"))
        
        # De-duplicate
        if event_id in self.seen_events:
            return None
        self.seen_events.add(event_id)

        source = raw_payload.get("source", "aws.guardduty")
        event_type = detail.get("type", raw_payload.get("detail-type", "Security Alert"))

        # Extract resource ARN
        resource_data = detail.get("resource", {})
        resource_arn = "arn:aws:unknown:us-east-1:237657481511:resource/unknown"
        res_type = "AWS::Generic::Resource"

        if "resourceArn" in resource_data:
            resource_arn = resource_data["resourceArn"]
        elif "instanceDetails" in resource_data:
            inst_id = resource_data["instanceDetails"].get("instanceId", "unknown")
            resource_arn = f"arn:aws:ec2:us-east-1:237657481511:instance/{inst_id}"
            res_type = "AWS::EC2::Instance"
        elif "accessKeyDetails" in resource_data:
            user_name = resource_data["accessKeyDetails"].get("userName", "unknown")
            resource_arn = f"arn:aws:iam::237657481511:user/{user_name}"
            res_type = "AWS::IAM::User"
        elif "s3BucketDetails" in resource_data:
            b_name = resource_data["s3BucketDetails"][0].get("name", "unknown") if resource_data["s3BucketDetails"] else "bucket"
            resource_arn = f"arn:aws:s3:::{b_name}"
            res_type = "AWS::S3::Bucket"

        # Severity parsing
        raw_sev = float(detail.get("severity", 4.0))
        norm_sev = "MEDIUM"
        if raw_sev >= 7.0:
            norm_sev = "HIGH"
        elif raw_sev >= 9.0:
            norm_sev = "CRITICAL"
        elif raw_sev < 4.0:
            norm_sev = "LOW"

        # Extract service details
        service_data = detail.get("service", {})
        action_data = service_data.get("action", {})
        network_data = action_data.get("networkConnectionAction", {})

        return RuntimeSecurityEvent(
            event_id=event_id,
            source=source,
            event_type=event_type,
            resource_arn=resource_arn,
            resource_type=res_type,
            raw_severity=raw_sev,
            normalized_severity=norm_sev,
            actor_ip=network_data.get("remoteIpDetails", {}).get("ipAddressV4"),
            actor_asn=network_data.get("remoteIpDetails", {}).get("organization", {}).get("asnOrg"),
            action_type=action_data.get("actionType"),
            details=detail,
        )
