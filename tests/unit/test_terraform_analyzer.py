"""
Unit tests for AEGIS Terraform Change Analyzer.
Validates static AST inspection, security violation blocking, and malformed plan handling.
"""

from services.change_analysis.terraform_parser import TerraformChangeAnalyzer


def test_terraform_analyzer_clean_plan():
    analyzer = TerraformChangeAnalyzer()
    plan_data = {
        "resource_changes": [
            {
                "type": "aws_security_group_rule",
                "change": {
                    "actions": ["create"],
                    "after": {
                        "from_port": 443,
                        "to_port": 443,
                        "cidr_blocks": ["198.51.100.0/24"],
                    },
                },
            }
        ]
    }
    result = analyzer.analyze_plan(plan_data)
    assert result["has_blocking_violations"] is False
    assert len(result["findings"]) == 0


def test_terraform_analyzer_public_ssh_blocked():
    analyzer = TerraformChangeAnalyzer()
    plan_data = {
        "resource_changes": [
            {
                "type": "aws_security_group_rule",
                "change": {
                    "actions": ["create"],
                    "after": {
                        "from_port": 22,
                        "to_port": 22,
                        "cidr_blocks": ["0.0.0.0/0"],
                    },
                },
            }
        ]
    }
    result = analyzer.analyze_plan(plan_data)
    assert result["has_blocking_violations"] is True
    assert len(result["findings"]) == 1
    assert result["findings"][0].rule_id == "SEC-TF-01"


def test_terraform_analyzer_s3_public_access_block_deletion():
    analyzer = TerraformChangeAnalyzer()
    plan_data = {
        "resource_changes": [
            {
                "type": "aws_s3_bucket_public_access_block",
                "address": "aws_s3_bucket_public_access_block.vault_protection",
                "change": {
                    "actions": ["delete"],
                },
            }
        ]
    }
    result = analyzer.analyze_plan(plan_data)
    assert result["has_blocking_violations"] is True
    assert len(result["findings"]) == 1
    assert result["findings"][0].rule_id == "SEC-TF-02"


def test_terraform_analyzer_malformed_plan():
    analyzer = TerraformChangeAnalyzer()
    # Empty dictionary or missing resource_changes
    result = analyzer.analyze_plan({})
    assert result["has_blocking_violations"] is False
    assert len(result["findings"]) == 0
