# AEGIS — AWS Prerequisites & Environment Checklist

Before deploying AEGIS into your AWS account, review these requirements:

---

## 1. AWS Account & Permissions

To deploy the AEGIS CloudFormation stack, your IAM user or deployment role requires permissions to:
- Create CloudFormation stacks (`cloudformation:*`)
- Create IAM roles with managed and inline policies (`iam:CreateRole`, `iam:PutRolePolicy`, `iam:AttachRolePolicy`)
- Create S3 buckets with server-side encryption and public access blocks (`s3:CreateBucket`, `s3:PutBucketPolicy`)
- Create CloudFront distributions and Origin Access Controls (`cloudfront:CreateDistribution`, `cloudfront:CreateOriginAccessControl`)
- Create Lambda functions and Function URLs (`lambda:CreateFunction`, `lambda:CreateFunctionUrlConfig`)

---

## 2. Amazon Bedrock Model Access

AEGIS utilizes Amazon Bedrock foundation models for reasoning, investigation explanations, and remediation patch synthesis.

1. Open the **Amazon Bedrock Console** in your target region (e.g. `us-east-1`).
2. Navigate to **Model Access** in the left sidebar.
3. Confirm that **Anthropic Claude** models are enabled:
   - `Anthropic Claude 3.5 Sonnet` or
   - `Anthropic Claude 3 / 3.5 Haiku`
4. If access is not yet requested, click **Modify model access**, select Claude, and submit (approval is typically instantaneous).

---

## 3. Supported AWS Regions

AEGIS can be deployed in any AWS region where Amazon Bedrock and AWS Lambda are available:
- `us-east-1` (US East - N. Virginia) — Recommended
- `us-west-2` (US West - Oregon)
- `eu-central-1` (Europe - Frankfurt)
- `eu-west-1` (Europe - Ireland)
- `ap-southeast-1` (Asia Pacific - Singapore)
- `ap-northeast-1` (Asia Pacific - Tokyo)

---

## 4. Workload Compatibility

AEGIS discovers and models relationships across:
- **Networking:** VPCs, Subnets, Route Tables, Internet Gateways, NAT Gateways, Security Groups, ENIs.
- **Compute:** EC2 instances, attached IAM profiles, Lambda functions, ECS tasks.
- **Identity:** IAM Roles, Customer Managed Policies, AWS Managed Policies, Trust Relationships.
- **Storage:** S3 Buckets, Public Access Blocks, Bucket Policies, Encryption metadata.
- **Databases:** Amazon RDS instances, DB Subnet Groups.
- **Forensics & Audit:** AWS CloudTrail management events, AWS Security Hub findings, Amazon GuardDuty alerts.
