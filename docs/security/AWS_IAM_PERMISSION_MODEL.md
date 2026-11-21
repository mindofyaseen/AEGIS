# AEGIS — AWS IAM Permission & Least-Privilege Model

**Document Version:** 2.0  
**Security Classification:** Strict Least Privilege  

---

## 1. Core Principle: Absolute Read-Only Boundary

AEGIS operates under an immutable **Zero-Mutation Mandate (RULE-02 & RULE-03)**:
- **No Mutating APIs:** `Create*`, `Modify*`, `Update*`, `Delete*`, `Put*`, `Attach*`, `Detach*`, and `Terminate*` permissions are strictly absent from the AEGIS role.
- **No Direct Shell Access:** Zero SSM RunCommand or EC2 instance connect capabilities.
- **No Data Content Inspection:** Zero access to S3 object contents (`s3:GetObject` on data buckets is forbidden).
- **No Secret Access:** Zero access to AWS Secrets Manager (`secretsmanager:GetSecretValue`) or SSM Parameter Store SecureStrings.

---

## 2. The `AegisScopedInspectorRole` Definition

The role consists of standard AWS managed audit policies augmented by an explicit action allowlist:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ExplicitNetworkAndComputeDiscovery",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSecurityGroupRules",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeRouteTables",
        "ec2:DescribeInternetGateways",
        "ec2:DescribeNatGateways",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceAttribute"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ExplicitIamStructuralInspection",
      "Effect": "Allow",
      "Action": [
        "iam:ListRoles",
        "iam:GetRole",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListInstanceProfiles"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ExplicitS3MetadataOnlyInspection",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicyStatus",
        "s3:GetBucketAcl",
        "s3:GetBucketPublicAccessBlock",
        "s3:GetEncryptionConfiguration",
        "s3:GetBucketTagging"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ExplicitForensicsInspection",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBSubnetGroups",
        "cloudtrail:LookupEvents",
        "securityhub:GetFindings",
        "guardduty:ListFindings",
        "guardduty:GetFindings"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockModelInvocation",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }
  ]
}
```

---

## 3. Explicit Prohibitions

| Prohibited Capability | Justification |
| :--- | :--- |
| `s3:GetObject` on Customer Buckets | AEGIS inspects bucket policies and public access blocks, never customer files or records. |
| `secretsmanager:GetSecretValue` | AEGIS verifies whether encryption is enabled, never secrets or keys. |
| `ec2:RunInstances`, `ec2:TerminateInstances` | AEGIS is strictly read-only; compute resources cannot be created or deleted. |
| `iam:CreateUser`, `iam:AttachUserPolicy` | AEGIS audits identity topologies; identity mutation is prohibited. |
