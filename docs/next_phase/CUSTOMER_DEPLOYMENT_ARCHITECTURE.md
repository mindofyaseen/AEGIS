# CUSTOMER DEPLOYMENT ARCHITECTURE SPECIFICATION
**Document ID:** `AEGIS-ARCH-004-REV2` (Phase 0.5 Technical Correction)  
**Domain:** Customer AWS Account Packaging, CloudFormation, Trust Boundaries, Serverless Topology  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Refined customer data boundary definitions; clarified AWS PrivateLink endpoint requirements; detailed scoped IAM roles and deployment prerequisites.

---

## 1. Executive Summary & Core Objective

The central architectural tenet of AEGIS is **In-Account Deployment**. Customers deploy AEGIS directly into their own AWS infrastructure, retaining total control over IAM permissions, operational data, audit histories, and security analysis.

This specification details the packaging, trust boundaries, provisioned AWS resources, and customer onboarding prerequisites for the single-account self-deployment model.

---

## 2. Self-Contained CloudFormation Topology

AEGIS is packaged as a single, production-grade AWS CloudFormation template (`deploy/aws/aegis_customer_deployable_stack.yml`):

```mermaid
flowchart TD
    CustomerAdmin[Customer Cloud Engineer] -->|aws cloudformation deploy| CFN[CloudFormation Stack: aegis-production]
    
    subgraph Provisioned In-Account Resources
        CFN --> IAM[IAM Role: aegis-core-execution-role<br/>Scoped Read-Only & Audit Policies]
        CFN --> S3[Amazon S3: aegis-state-accountid<br/>SSE-KMS Customer Managed Key]
        CFN --> DDB[Amazon DynamoDB: aegis-findings-table<br/>On-Demand Pay-per-Request]
        CFN --> EB[Amazon EventBridge Rule: aegis-runtime-stream]
        CFN --> SQS[Amazon SQS Queue: aegis-runtime-queue]
        CFN --> Lambda[AWS Lambda Backend: Python 3.12<br/>FastAPI Orchestrator]
        CFN --> APIGW[Amazon API Gateway HTTP API<br/>Cognito / IAM Auth]
    end

    subgraph AWS Managed Service Endpoints (PrivateLink)
        Lambda -->|PrivateLink| VPCB[Bedrock VPC Endpoint]
        Lambda -->|PrivateLink| VPCS3[S3 VPC Endpoint]
        Lambda -->|PrivateLink| VPCDDB[DynamoDB VPC Endpoint]
    end
```

---

## 3. Scoped IAM Permissions & Principle of Least Privilege

AEGIS provisions a dedicated IAM execution role (`aegis-core-execution-role`) constrained by strict AWS managed policies:
- `arn:aws:iam::aws:policy/SecurityAudit`: Read-only access to AWS security configurations across services.
- `arn:aws:iam::aws:policy/ViewOnlyAccess`: Metadata visibility for compute, network, and storage.

### Explicit Deny Safety Boundary:
To guarantee environmental safety, the role includes an explicit Deny statement for high-risk and billable resource provisioning actions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AegisDenyMutations",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "s3:DeleteBucket",
        "iam:CreateUser",
        "iam:DeleteUser",
        "rds:DeleteDBInstance"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 4. Customer Onboarding & Setup Prerequisites

Onboarding AEGIS into an existing AWS account requires three straightforward steps:

1. **Prerequisite Check:**
   - Active AWS Account with administrative permissions to deploy CloudFormation stacks.
   - Amazon Bedrock model access enabled for Anthropic Claude 3.5 Sonnet in the target deployment region.
2. **Stack Deployment:**
   ```bash
   aws cloudformation deploy \
     --template-file deploy/aws/aegis_customer_deployable_stack.yml \
     --stack-name aegis-devsecops-core \
     --capabilities CAPABILITY_NAMED_IAM \
     --parameter-overrides EnvironmentType=Production
   ```
3. **Web Console Connection:**
   - The CloudFormation stack outputs the API Gateway endpoint and CloudFront URL.
   - The customer logs in via enterprise SSO (Cognito/SAML) and initiates their first discovery harvest.
