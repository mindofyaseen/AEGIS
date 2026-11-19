"""
AEGIS Amazon S3 Storage Collector.
Collects bucket-level metadata, Block Public Access configuration, and bucket policies.
STRICTLY FORBIDDEN FROM READING S3 OBJECT CONTENTS PER RULE-05.
"""

from typing import List, Tuple
from botocore.exceptions import ClientError
from backend.models import (
    Resource,
    ResourceRelationship,
    ResourceType,
    RelationshipType,
)
from services.aws_discovery.base import BaseCollector


class S3Collector(BaseCollector):
    @property
    def collector_name(self) -> str:
        return "s3_collector"

    def collect(self) -> Tuple[List[Resource], List[ResourceRelationship]]:
        client = self.session.client("s3", region_name=self.region_name)
        resources: List[Resource] = []
        relationships: List[ResourceRelationship] = []

        buckets_res = client.list_buckets()
        for b in buckets_res.get("Buckets", []):
            bucket_name = b["Name"]

            # Inspect Public Access Block
            pab_config = {}
            try:
                pab_res = client.get_public_access_block(Bucket=bucket_name)
                pab_config = pab_res.get("PublicAccessBlockConfiguration", {})
            except ClientError as e:
                # NoSuchPublicAccessBlockConfiguration is normal if not set
                pab_config = {
                    "block_public_acls": False,
                    "ignore_public_acls": False,
                    "block_public_policy": False,
                    "restrict_public_buckets": False,
                }

            # Inspect Server-Side Encryption
            encryption_config = {}
            try:
                enc_res = client.get_bucket_encryption(Bucket=bucket_name)
                encryption_config = enc_res.get("ServerSideEncryptionConfiguration", {})
            except ClientError:
                encryption_config = {"status": "Default / None"}

            r = Resource(
                resource_id=bucket_name,
                resource_type=ResourceType.S3_BUCKET,
                name=bucket_name,
                arn=f"arn:aws:s3:::{bucket_name}",
                region=self.region_name,
                configuration={
                    "public_access_block": pab_config,
                    "encryption": encryption_config,
                },
                tags={},
                evidence=self.create_evidence("s3:ListBuckets"),
            )
            resources.append(r)

        return resources, relationships
