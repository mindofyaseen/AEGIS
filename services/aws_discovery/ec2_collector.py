"""
AEGIS EC2 & VPC Network Topology Collector.
Performs read-only discovery of VPCs, subnets, route tables, internet gateways,
security groups, network interfaces, and compute instances.
"""

from typing import List, Tuple
from backend.models import (
    Resource,
    ResourceRelationship,
    ResourceType,
    RelationshipType,
)
from services.aws_discovery.base import BaseCollector


class Ec2Collector(BaseCollector):
    @property
    def collector_name(self) -> str:
        return "ec2_collector"

    def collect(self) -> Tuple[List[Resource], List[ResourceRelationship]]:
        client = self.session.client("ec2", region_name=self.region_name)
        resources: List[Resource] = []
        relationships: List[ResourceRelationship] = []

        # 1. VPCs
        vpcs_res = client.describe_vpcs()
        for vpc in vpcs_res.get("Vpcs", []):
            vpc_id = vpc["VpcId"]
            name = next((t["Value"] for t in vpc.get("Tags", []) if t["Key"] == "Name"), vpc_id)
            tags = {t["Key"]: t["Value"] for t in vpc.get("Tags", [])}
            r = Resource(
                resource_id=vpc_id,
                resource_type=ResourceType.VPC,
                name=name,
                arn=f"arn:aws:ec2:{self.region_name}:{self.account_id}:vpc/{vpc_id}",
                region=self.region_name,
                configuration={"cidr_block": vpc.get("CidrBlock"), "is_default": vpc.get("IsDefault", False)},
                tags=tags,
                evidence=self.create_evidence("ec2:DescribeVpcs"),
            )
            resources.append(r)

        # 2. Subnets
        subnets_res = client.describe_subnets()
        for subnet in subnets_res.get("Subnets", []):
            sub_id = subnet["SubnetId"]
            vpc_id = subnet.get("VpcId")
            name = next((t["Value"] for t in subnet.get("Tags", []) if t["Key"] == "Name"), sub_id)
            tags = {t["Key"]: t["Value"] for t in subnet.get("Tags", [])}
            r = Resource(
                resource_id=sub_id,
                resource_type=ResourceType.SUBNET,
                name=name,
                arn=subnet.get("SubnetArn", f"arn:aws:ec2:{self.region_name}:{self.account_id}:subnet/{sub_id}"),
                region=self.region_name,
                configuration={
                    "vpc_id": vpc_id,
                    "cidr_block": subnet.get("CidrBlock"),
                    "availability_zone": subnet.get("AvailabilityZone"),
                    "map_public_ip_on_launch": subnet.get("MapPublicIpOnLaunch", False),
                },
                tags=tags,
                evidence=self.create_evidence("ec2:DescribeSubnets"),
            )
            resources.append(r)
            if vpc_id:
                relationships.append(
                    ResourceRelationship(
                        source_id=vpc_id,
                        target_id=sub_id,
                        relationship=RelationshipType.CONTAINS,
                        evidence=self.create_evidence("ec2:DescribeSubnets"),
                    )
                )

        # 3. Security Groups
        sgs_res = client.describe_security_groups()
        for sg in sgs_res.get("SecurityGroups", []):
            sg_id = sg["GroupId"]
            name = sg.get("GroupName", sg_id)
            tags = {t["Key"]: t["Value"] for t in sg.get("Tags", [])}

            inbound_rules = []
            for perm in sg.get("IpPermissions", []):
                for ip_range in perm.get("IpRanges", []):
                    inbound_rules.append({
                        "ip_protocol": perm.get("IpProtocol"),
                        "from_port": perm.get("FromPort"),
                        "to_port": perm.get("ToPort"),
                        "cidr_ipv4": ip_range.get("CidrIp"),
                        "description": ip_range.get("Description", ""),
                    })

            r = Resource(
                resource_id=sg_id,
                resource_type=ResourceType.SECURITY_GROUP,
                name=name,
                arn=f"arn:aws:ec2:{self.region_name}:{self.account_id}:security-group/{sg_id}",
                region=self.region_name,
                configuration={"vpc_id": sg.get("VpcId"), "inbound_rules": inbound_rules},
                tags=tags,
                evidence=self.create_evidence("ec2:DescribeSecurityGroups"),
            )
            resources.append(r)

        # 4. EC2 Instances
        instances_res = client.describe_instances()
        for reservation in instances_res.get("Reservations", []):
            for inst in reservation.get("Instances", []):
                inst_id = inst["InstanceId"]
                name = next((t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"), inst_id)
                tags = {t["Key"]: t["Value"] for t in inst.get("Tags", [])}

                r = Resource(
                    resource_id=inst_id,
                    resource_type=ResourceType.EC2_INSTANCE,
                    name=name,
                    arn=f"arn:aws:ec2:{self.region_name}:{self.account_id}:instance/{inst_id}",
                    region=self.region_name,
                    configuration={
                        "instance_type": inst.get("InstanceType"),
                        "state": inst.get("State", {}).get("Name"),
                        "subnet_id": inst.get("SubnetId"),
                        "vpc_id": inst.get("VpcId"),
                        "public_ip": inst.get("PublicIpAddress"),
                        "private_ip": inst.get("PrivateIpAddress"),
                        "iam_instance_profile": inst.get("IamInstanceProfile", {}).get("Arn"),
                    },
                    tags=tags,
                    evidence=self.create_evidence("ec2:DescribeInstances"),
                )
                resources.append(r)

                # Relationships to Subnet and Security Groups
                if inst.get("SubnetId"):
                    relationships.append(
                        ResourceRelationship(
                            source_id=inst.get("SubnetId"),
                            target_id=inst_id,
                            relationship=RelationshipType.CONTAINS,
                            evidence=self.create_evidence("ec2:DescribeInstances"),
                        )
                    )
                for sg in inst.get("SecurityGroups", []):
                    relationships.append(
                        ResourceRelationship(
                            source_id=sg["GroupId"],
                            target_id=inst_id,
                            relationship=RelationshipType.APPLIES_TO,
                            evidence=self.create_evidence("ec2:DescribeInstances"),
                        )
                    )

        return resources, relationships
