"""
Unit tests for AEGIS Multi-Account Cross-Account Discovery Harvester.
Validates AWS Organizations enumeration, cross-account trust resolution, and Rule 01 boundary enforcement.
"""

from services.aws_discovery.multi_account import MultiAccountHarvester, AccountHarvestTarget


def test_multi_account_harvester_synthetic_aggregation():
    harvester = MultiAccountHarvester(authorized_account_ids=["237657481511", "999888777666"])

    targets = [
        AccountHarvestTarget(account_id="237657481511", account_name="Production-Core"),
        AccountHarvestTarget(account_id="999888777666", account_name="Staging-Workloads"),
    ]

    synthetic_fixtures = {
        "237657481511": {
            "resources": [
                {"resource_id": "vpc-prod-01", "resource_type": "AWS::EC2::VPC", "evidence": {"source_collector": "test"}},
                {"resource_id": "role-prod-admin", "resource_type": "AWS::IAM::Role", "evidence": {"source_collector": "test"}},
            ],
            "relationships": [],
        },
        "999888777666": {
            "resources": [
                {"resource_id": "vpc-stage-01", "resource_type": "AWS::EC2::VPC", "evidence": {"source_collector": "test"}},
                {"resource_id": "s3-stage-data", "resource_type": "AWS::S3::Bucket", "evidence": {"source_collector": "test"}},
            ],
            "relationships": [],
        },
    }

    result = harvester.harvest_multi_account_topology(targets, synthetic_fixtures)
    report = result["harvest_report"]
    assert report["total_accounts_targeted"] == 2
    assert len(report["successful_accounts"]) == 2
    assert report["total_resources_harvested"] == 4
    assert len(result["topology"]["resources"]) == 4


def test_multi_account_harvester_enforces_rule_01_unauthorized():
    # Only 237657481511 is authorized
    harvester = MultiAccountHarvester(authorized_account_ids=["237657481511"])

    targets = [
        AccountHarvestTarget(account_id="237657481511", account_name="Production-Core"),
        AccountHarvestTarget(account_id="444555666777", account_name="Unauthorized-Rogue-Account"),
    ]

    result = harvester.harvest_multi_account_topology(targets, synthetic_account_topologies={})
    report = result["harvest_report"]
    assert "444555666777" in report["unauthorized_accounts_rejected"]
    assert "444555666777" not in report["successful_accounts"]


def test_multi_account_detects_cross_account_trust_relationships():
    harvester = MultiAccountHarvester(authorized_account_ids=["111111111111", "222222222222"])

    resources = [
        {
            "resource_id": "AegisCrossAccountRole",
            "resource_type": "AWS::IAM::Role",
            "account_id": "111111111111",
            "configuration": {
                "assume_role_policy": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "arn:aws:iam::222222222222:root"},
                            "Action": "sts:AssumeRole",
                        }
                    ]
                }
            },
        },
        {
            "resource_id": "vpc-account-2",
            "resource_type": "AWS::EC2::VPC",
            "account_id": "222222222222",
        },
    ]

    cross_edges = harvester.detect_cross_account_relationships(resources)
    assert len(cross_edges) == 1
    edge = cross_edges[0]
    assert edge["source_id"] == "AegisCrossAccountRole"
    assert "222222222222" in edge["target_id"]
    assert edge["relationship"] == "GRANTS"
