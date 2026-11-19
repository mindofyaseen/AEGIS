import json
import pytest
from services.change_analysis.cloudformation_parser import CloudFormationAnalyzer
from backend.models import Severity

def test_cfn_analyzer_open_ssh():
    analyzer = CloudFormationAnalyzer()
    template = json.dumps({
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": {
            "BastionSecurityGroup": {
                "Type": "AWS::EC2::SecurityGroup",
                "Properties": {
                    "GroupDescription": "Bastion SG",
                    "SecurityGroupIngress": [
                        {
                            "IpProtocol": "tcp",
                            "FromPort": 22,
                            "ToPort": 22,
                            "CidrIp": "0.0.0.0/0"
                        }
                    ]
                }
            }
        }
    })
    findings = analyzer.analyze(template)
    assert len(findings) == 1
    assert findings[0].rule_id == "SEC-CFN-01"
    assert findings[0].severity == Severity.CRITICAL
    assert "SSH (port 22)" in findings[0].title

def test_cfn_analyzer_s3_missing_public_access_block():
    analyzer = CloudFormationAnalyzer()
    template = json.dumps({
        "Resources": {
            "DataBucket": {
                "Type": "AWS::S3::Bucket",
                "Properties": {
                    "BucketName": "unprotected-data-bucket"
                }
            }
        }
    })
    findings = analyzer.analyze(template)
    assert len(findings) == 1
    assert findings[0].rule_id == "SEC-CFN-02"
    assert findings[0].severity == Severity.HIGH

def test_cfn_analyzer_iam_wildcard():
    analyzer = CloudFormationAnalyzer()
    template = json.dumps({
        "Resources": {
            "AdminRole": {
                "Type": "AWS::IAM::Role",
                "Properties": {
                    "AssumeRolePolicyDocument": {},
                    "Policies": [
                        {
                            "PolicyName": "FullAdmin",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": "*",
                                        "Resource": "*"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    })
    findings = analyzer.analyze(template)
    assert len(findings) == 1
    assert findings[0].rule_id == "SEC-CFN-03"
    assert findings[0].severity == Severity.CRITICAL

def test_cfn_analyzer_rds_public():
    analyzer = CloudFormationAnalyzer()
    template = json.dumps({
        "Resources": {
            "ProdDatabase": {
                "Type": "AWS::RDS::DBInstance",
                "Properties": {
                    "DBInstanceClass": "db.t3.micro",
                    "PubliclyAccessible": True
                }
            }
        }
    })
    findings = analyzer.analyze(template)
    assert len(findings) == 1
    assert findings[0].rule_id == "SEC-CFN-04"
    assert findings[0].severity == Severity.CRITICAL

def test_cfn_analyzer_clean_template():
    analyzer = CloudFormationAnalyzer()
    template = json.dumps({
        "Resources": {
            "SafeBucket": {
                "Type": "AWS::S3::Bucket",
                "Properties": {
                    "BucketName": "safe-secure-bucket",
                    "PublicAccessBlockConfiguration": {
                        "BlockPublicAcls": True,
                        "IgnorePublicAcls": True,
                        "BlockPublicPolicy": True,
                        "RestrictPublicBuckets": True
                    }
                }
            }
        }
    })
    findings = analyzer.analyze(template)
    assert len(findings) == 0
