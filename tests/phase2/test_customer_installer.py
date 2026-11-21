"""
Unit tests for the AEGIS Customer-Deployable Installer & Preflight Engine.
"""

import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

from cli.installer import AegisCustomerInstaller, TEMPLATE_PATH
from cli.aegis_cli import AegisCLI


def test_customer_installer_template_exists():
    assert TEMPLATE_PATH.exists(), f"Deployment template missing at {TEMPLATE_PATH}"
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "AWSTemplateFormatVersion" in content
    assert "AegisScopedInspectorRole" in content
    assert "AegisCustomerWebBucket" in content
    assert "AegisConsoleCDN" in content
    assert "AegisServerlessBackendLambda" in content
    assert "AegisLambdaFunctionUrl" in content


def test_customer_installer_provisioning_manifest():
    installer = AegisCustomerInstaller()
    manifest = installer.get_provisioning_manifest()
    
    resources = manifest.get("resources_to_create", [])
    assert len(resources) == 5
    
    logical_ids = [r["logical_id"] for r in resources]
    assert "AegisScopedInspectorRole" in logical_ids
    assert "AegisCustomerWebBucket" in logical_ids
    assert "AegisConsoleCDN" in logical_ids
    assert "AegisServerlessBackendLambda" in logical_ids
    assert "AegisLambdaFunctionUrl" in logical_ids

    guarantees = manifest.get("safety_guarantee", [])
    assert len(guarantees) >= 4
    assert any("Zero existing EC2" in g for g in guarantees)
    assert any("Zero customer data or S3 object contents" in g for g in guarantees)


def test_customer_installer_preflight_checks_mocked():
    mock_sts = MagicMock()
    mock_sts.get_caller_identity.return_value = {
        "Account": "111222333444",
        "Arn": "arn:aws:iam::111222333444:user/test-devsecops"
    }

    mock_cfn = MagicMock()
    mock_cfn.validate_template.return_value = {"Description": "Valid"}

    mock_session = MagicMock()
    mock_session.client.side_effect = lambda service, **kwargs: (
        mock_sts if service == "sts" else (
            mock_cfn if service == "cloudformation" else MagicMock()
        )
    )

    installer = AegisCustomerInstaller(session=mock_session)
    installer.sts_client = mock_sts
    installer.cfn_client = mock_cfn

    preflight = installer.run_preflight_checks()
    assert preflight["passed"] is True
    assert preflight["account_id"] == "111222333444"
    assert preflight["template_valid"] is True
    assert len(preflight["checks"]) == 3


def test_cli_preflight_flag_execution():
    cli = AegisCLI()
    with patch("cli.installer.AegisCustomerInstaller.run_preflight_checks") as mock_run:
        mock_run.return_value = {
            "passed": True,
            "account_id": "111222333444",
            "region": "us-east-1",
            "caller_arn": "arn:aws:iam::111222333444:user/admin",
            "checks": []
        }
        exit_code = cli.run(["--preflight"])
        assert exit_code == 0
