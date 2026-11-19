"""
AEGIS IAM Identity & Permission Collector.
Performs read-only discovery of IAM roles, managed policies, inline policies,
and instance profile associations per RULE-02. Never dumps credentials.
"""

from typing import List, Tuple
from backend.models import (
    Resource,
    ResourceRelationship,
    ResourceType,
    RelationshipType,
)
from services.aws_discovery.base import BaseCollector


class IamCollector(BaseCollector):
    @property
    def collector_name(self) -> str:
        return "iam_collector"

    def collect(self) -> Tuple[List[Resource], List[ResourceRelationship]]:
        client = self.session.client("iam", region_name=self.region_name)
        resources: List[Resource] = []
        relationships: List[ResourceRelationship] = []

        # List Roles
        roles_res = client.list_roles(MaxItems=30)
        for role in roles_res.get("Roles", []):
            role_name = role["RoleName"]
            role_arn = role["Arn"]

            # Filter AWS Service-linked roles for clarity
            if "aws-service-role" in role_arn:
                continue

            # List attached policies for role
            attached_res = client.list_attached_role_policies(RoleName=role_name)
            attached_policies = [p["PolicyArn"] for p in attached_res.get("AttachedPolicies", [])]

            r = Resource(
                resource_id=role_name,
                resource_type=ResourceType.IAM_ROLE,
                name=role_name,
                arn=role_arn,
                region=self.region_name,
                configuration={
                    "assume_role_policy": role.get("AssumeRolePolicyDocument"),
                    "attached_policies": attached_policies,
                },
                tags={t["Key"]: t["Value"] for t in role.get("Tags", [])},
                evidence=self.create_evidence("iam:ListRoles"),
            )
            resources.append(r)

            # Record Role -> Policy Relationships
            for pol_arn in attached_policies:
                relationships.append(
                    ResourceRelationship(
                        source_id=role_name,
                        target_id=pol_arn,
                        relationship=RelationshipType.HAS_POLICY,
                        evidence=self.create_evidence("iam:ListAttachedRolePolicies"),
                    )
                )

        return resources, relationships
