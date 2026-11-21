# AEGIS — AWS Installation Guide
## Deploying Your In-Account Autonomous DevSecOps Engineer

This guide provides instructions for deploying AEGIS directly into your AWS account.

---

## Deployment Options

You can deploy AEGIS using either:
1. **Option A: AWS Management Console (1-Click CloudFormation Launch)** — Easiest for administrators.
2. **Option B: AWS CLI / Terminal** — Standard for DevOps engineers.
3. **Option C: AEGIS Interactive CLI (`aegis install`)** — Includes automated preflight checks.

---

## Option A: 1-Click AWS Console Deployment

1. Sign in to your AWS Management Console in your target region (e.g. `us-east-1`).
2. Navigate to **CloudFormation** $\to$ **Create Stack** (With new resources).
3. Choose **Upload a template file** and select `deploy/aws/aegis_customer_deployable_stack.yml`.
4. Specify Stack Details:
   - **Stack name:** `aegis-devsecops-engineer`
   - **EnvironmentName:** `prod` (or `staging`)
   - **BedrockModelId:** `anthropic.claude-haiku-4-5-20251001-v1:0` (or `anthropic.claude-3-5-sonnet-20241022-v2:0`)
   - **ContextCompletenessThreshold:** `0.85`
5. Acknowledge IAM capabilities (`CAPABILITY_NAMED_IAM`) and click **Submit**.
6. Stack creation completes in approximately 2 minutes.

---

## Option B: AWS CLI Deployment

Run the following command in your terminal:

```bash
aws cloudformation deploy \
  --template-file deploy/aws/aegis_customer_deployable_stack.yml \
  --stack-name aegis-devsecops-engineer \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      EnvironmentName=prod \
      BedrockModelId=anthropic.claude-haiku-4-5-20251001-v1:0 \
      ContextCompletenessThreshold=0.85
```

Retrieve your private deployment endpoints:
```bash
aws cloudformation describe-stacks \
  --stack-name aegis-devsecops-engineer \
  --query "Stacks[0].Outputs" \
  --output table
```

---

## Option C: AEGIS Interactive CLI (`aegis install`)

Run the preflight audit first to verify permissions and Bedrock model access:
```bash
python cli/aegis_cli.py --preflight
```

Execute automated deployment:
```bash
python -m cli.installer
```

---

## Resources Provisioned During Installation

AEGIS creates **only 5 isolated supporting resources** in your account:

1. **`AegisScopedInspectorRole`** (`AWS::IAM::Role`): Scoped read-only IAM role.
2. **`AegisCustomerWebBucket`** (`AWS::S3::Bucket`): Encrypted private storage for web console assets.
3. **`AegisConsoleCDN`** (`AWS::CloudFront::Distribution`): CloudFront distribution delivering the web console over HTTPS with OAC.
4. **`AegisServerlessBackendLambda`** (`AWS::Lambda::Function`): Ephemeral Python execution engine.
5. **`AegisLambdaFunctionUrl`** (`AWS::Lambda::Url`): Direct HTTPS endpoint.

> **Important:** Installing AEGIS does **not** touch, modify, reboot, or delete any existing EC2 instances, VPCs, subnets, or databases in your account.
