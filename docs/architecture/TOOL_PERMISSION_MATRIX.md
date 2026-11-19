# AEGIS — Tool Permission Matrix & IAM Security Boundaries

## 1. Zero-Mutation Principle
In accordance with **RULE-02 (Read-Only Cloud Access)** and **RULE-03 (Zero Mutation Capability)**, AEGIS implements an immutable least-privilege IAM boundary. Under no circumstances can the agent perform mutating API calls against AWS accounts.

---

## 2. Comprehensive Tool Permission Matrix

| Service | Tool Name | Permitted Boto3 / AWS API Actions | Explicitly Denied Actions | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **EC2** | `EC2Collector` | `ec2:DescribeVpcs`<br>`ec2:DescribeSubnets`<br>`ec2:DescribeRouteTables`<br>`ec2:DescribeInternetGateways`<br>`ec2:DescribeNatGateways`<br>`ec2:DescribeSecurityGroups`<br>`ec2:DescribeInstances` | `ec2:AuthorizeSecurityGroupIngress`<br>`ec2:RevokeSecurityGroupIngress`<br>`ec2:RunInstances`<br>`ec2:TerminateInstances`<br>`ec2:ModifyVpcAttribute` | **READ-ONLY ALLOWED** |
| **IAM** | `IAMCollector` | `iam:GetAccountAuthorizationDetails`<br>`iam:ListRoles`<br>`iam:GetRole`<br>`iam:GetRolePolicy`<br>`iam:ListAttachedRolePolicies`<br>`iam:ListInstanceProfiles` | `iam:CreateRole`<br>`iam:AttachRolePolicy`<br>`iam:PutRolePolicy`<br>`iam:DeleteRole`<br>`iam:CreateAccessKey` | **READ-ONLY ALLOWED** |
| **S3** | `S3Collector` | `s3:ListAllMyBuckets`<br>`s3:GetBucketLocation`<br>`s3:GetBucketPolicy`<br>`s3:GetPublicAccessBlock`<br>`s3:GetEncryptionConfiguration` | `s3:PutObject`<br>`s3:DeleteObject`<br>`s3:PutBucketPolicy`<br>`s3:DeleteBucketPublicAccessBlock`<br>`s3:CreateBucket` | **READ-ONLY ALLOWED** |
| **RDS** | `RDSCollector` | `rds:DescribeDBInstances`<br>`rds:DescribeDBSubnetGroups` | `rds:CreateDBInstance`<br>`rds:ModifyDBInstance`<br>`rds:DeleteDBInstance`<br>`rds:RebootDBInstance` | **READ-ONLY ALLOWED** |
| **CloudTrail** | `CloudTrailCollector` | `cloudtrail:LookupEvents`<br>`cloudtrail:DescribeTrails` | `cloudtrail:CreateTrail`<br>`cloudtrail:DeleteTrail`<br>`cloudtrail:StopLogging` | **READ-ONLY ALLOWED** |
| **Secrets Manager** | *(Quarantined)* | **NONE** | `secretsmanager:GetSecretValue`<br>`secretsmanager:ListSecrets` | **HARD DENIED (RULE-08)** |
| **SSM Parameter Store** | *(Quarantined)* | **NONE** | `ssm:GetParameter`<br>`ssm:GetParameters` | **HARD DENIED (RULE-08)** |
| **Code Interpreter** | *(Quarantined)* | **NONE** | `bash`, `sh`, `powershell`, `cmd`, `eval` | **HARD DENIED (RULE-09)** |

---

## 3. Least-Privilege IAM Policy for AEGIS Execution Role
The following IAM policy defines the exact permissions granted to the AEGIS execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AegisReadOnlyInfrastructureDiscovery",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeRouteTables",
        "ec2:DescribeInternetGateways",
        "ec2:DescribeNatGateways",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeInstances",
        "iam:GetAccountAuthorizationDetails",
        "iam:ListRoles",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfiles",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:GetPublicAccessBlock",
        "s3:GetEncryptionConfiguration",
        "rds:DescribeDBInstances",
        "rds:DescribeDBSubnetGroups",
        "cloudtrail:LookupEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AegisExplicitDenyDestructiveMutations",
      "Effect": "Deny",
      "Action": [
        "ec2:*Ingress*",
        "ec2:*Egress*",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "iam:Create*",
        "iam:Put*",
        "iam:Attach*",
        "iam:Delete*",
        "s3:Put*",
        "s3:Delete*",
        "rds:Modify*",
        "rds:Delete*",
        "secretsmanager:*",
        "ssm:Get*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 4. Multi-Layer Enforcement
1. **Layer 1 (IAM Boundary):** AWS denies mutating API requests at the control plane.
2. **Layer 2 (AgentCore Harness Boundary):** Tools with mutating signatures do not exist in the Bedrock agent definition.
3. **Layer 3 (Backend Python Parameter Validator):** `AegisAgentHarness.execute_tool()` intercepts parameters and rejects any unexpected commands.
