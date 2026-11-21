# AEGIS Customer-Deployable Architecture
## In-Account Autonomous DevSecOps Engineer

**Document Version:** 2.0  
**Date:** November 21, 2026  
**Status:** Approved Architectural Directive  
**Target Platform:** Amazon Web Services (AWS)  

---

## 1. Executive Summary & Architectural Paradigm

AEGIS is an **in-account, customer-deployable AI DevSecOps Engineer**. It is **not** a centralized SaaS platform, a chatbot wrapper, or an agent-builder kit.

Customers deploy AEGIS directly into their own AWS account using a single, native AWS CloudFormation template (or the AEGIS interactive CLI installer). Once deployed, AEGIS operates entirely within the customer's security and data boundaries using explicitly scoped, read-only IAM permissions. It discovers existing infrastructure, models multi-directional relationship graphs, traces multi-hop attack paths, and conducts autonomous security investigations governed by Amazon Bedrock Managed Agents and deterministic Context Completeness Gates.

```
+-----------------------------------------------------------------------------------+
|                        CUSTOMER AWS ACCOUNT BOUNDARY                              |
|                                                                                   |
|  +-----------------------+     +--------------------+     +--------------------+  |
|  | Existing VPCs / EC2   |     | Existing IAM Roles |     | Existing S3 / RDS  |  |
|  +-----------------------+     +--------------------+     +--------------------+  |
|              ^                           ^                           ^            |
|              |                           |                           |            |
|     (Strict Read-Only Describe*)         | (Read-Only Get*/List*)    | (Metadata) |
|              |                           |                           |            |
|  +-----------------------------------------------------------------------------+  |
|  |                  AEGIS SCOPED READ-ONLY IAM ROLE                            |  |
|  |                  (No Mutation, No Put*, No Delete*)                         |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |               AEGIS SERVERLESS ENGINE (AWS Lambda / Runtime)                |  |
|  |  * Read-Only Collectors (EC2, VPC, Subnet, IAM, S3, RDS, CloudTrail)         |  |
|  |  * NetworkX In-Memory Knowledge Graph Engine                                |  |
|  |  * Attack Path BFS Graph Tracer (Public Entry -> Crown Jewels)              |  |
|  |  * Context Completeness Gate (Score >= 0.85, Stale Telemetry Reject)        |  |
|  |  * Deterministic Policy Engine (BLOCK | INSUFFICIENT_CONTEXT | READY)        |  |
|  +-----------------------------------------------------------------------------+  |
|            |                                              |                       |
|            v (Sanitized Metadata Only)                    v                       |
|  +------------------------------+     +----------------------------------------+  |
|  | AMAZON BEDROCK (In-Region)   |     | AEGIS PRIVATE WEB CONSOLE (S3 + CDN)   |  |
|  | * Claude 3.5 Sonnet / Haiku  |     | * Three.js 3D WebGL Topology Explorer  |  |
|  | * Bedrock Guardrails PII/AST |     | * Executive & SecOps Dual Views        |  |
|  | * Structured Tool Reasoning  |     | * Rule 14 Unified Patch Reviewer       |  |
|  +------------------------------+     +----------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Current Implementation vs. Customer Deployment Reality Audit

An audit of the existing repository reveals what currently exists and what requires packaging for customer deployment:

| Component | Current State in Repository | Customer Deployment Adaptation |
| :--- | :--- | :--- |
| **AWS Collectors** (`services/aws_discovery/`) | Functional Boto3 collectors for EC2, VPC, Subnets, IAM, S3, RDS, CloudTrail. | Packaged into the serverless Lambda execution bundle. Default execution uses the in-account scoped IAM role credentials. |
| **Knowledge Graph** (`services/infrastructure_graph/`) | NetworkX MultiDiGraph running in-memory. Zero database dependencies. | Executed in-memory inside Lambda (< 128 MB RAM, < 25ms graph generation). Zero managed database cost. |
| **Attack Path Tracer** (`services/attack_path/`) | Directed BFS path tracer finding hops from Internet Gateways to private databases/S3. | Fully reusable as-is inside in-account backend. |
| **Context Completeness Gate** (`services/policy_engine/`) | Mathematical fail-closed gate calculating collector success and telemetry freshness. | Fully reusable as-is. Prevents "Silent Green" false positives in customer account. |
| **Bedrock Harness** (`integrations/bedrock/harness.py`) | Boto3 `bedrock-runtime` caller with strict tool allowlist and prompt-injection quarantining. | Uses customer's in-region Bedrock access. Only metadata sent to model; zero secret transmission. |
| **FastAPI REST API** (`backend/api/main.py`) | Exposes 25+ investigation, graph, compliance, and scenario endpoints. Runs via Uvicorn locally. | Packaged using AWS Lambda Web Adapter or Mangum ASGI handler behind an in-account API Gateway HTTP API or Lambda Function URL. |
| **Web Frontend** (`apps/web/`) | Art-directed, unsloped React 18 + Three.js 3D WebGL console with 11 workspaces. | Hosted in a customer-owned private S3 bucket distributed via CloudFront with Origin Access Control (OAC). |
| **CI/CD Gatekeeper** (`cli/aegis_cli.py`) | Standalone CLI evaluating Terraform plan AST and CloudFormation templates. | Runs in customer CI/CD pipelines (GitHub Actions, GitLab CI, AWS CodePipeline) connecting to customer AEGIS instance. |

---

## 3. Deployment Options Evaluation & Decision Matrix

To ensure the highest customer adoption and lowest operational friction, we evaluated four primary deployment mechanisms:

| Criteria | AWS CloudFormation (Native) | AWS CDK | HashiCorp Terraform | Standalone Installer CLI |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Friction** | **Zero Friction** (1-Click Console Launch or single AWS CLI command). | **High** (Customer must install Node.js, CDK CLI, bootstrap account). | **Moderate** (Customer must manage tfstate backend, S3/DynamoDB locks). | **Low** (Automated script wrapping CloudFormation). |
| **Prerequisites** | Only AWS Account + IAM permissions. | Node.js, npm, CDK CLI, Docker. | Terraform CLI, Provider configuration. | Python or PowerShell + AWS CLI. |
| **Enterprise Standard** | Universal AWS standard; supported by Service Catalog & Control Tower. | Popular in engineering teams; rare for security vendor installs. | Standard in DevOps; requires state management. | Convenient companion tool. |
| **Clean Uninstall** | Single command `aws cloudformation delete-stack`. Leaves zero orphaned resources. | `cdk destroy` (may leave CDK toolkit artifacts). | `terraform destroy`. | Can invoke `cloudformation delete-stack`. |
| **Verdict** | **PRIMARY SELECTION (Foundation)** | Secondary/Alternative | Secondary/Alternative | **PRIMARY COMPANION (CLI)** |

### Architectural Decision (ADR-001):
1. **Primary Deployment Format:** Native AWS CloudFormation template (`deploy/aws/aegis_customer_deployable_stack.yml`). Enables 1-Click Launch in the AWS Console without requiring the customer to install any third-party tools.
2. **Interactive CLI Companion:** The `aegis install` CLI command provides an interactive preflight terminal experience for automated deployments.

---

## 4. Minimum Customer-Deployable Architecture

To preserve customer costs ($0 idle spend) and maintain operational simplicity, AEGIS intentionally avoids heavyweight components such as always-on EC2 instances, EKS clusters, NAT Gateways, or managed graph databases.

The complete AEGIS footprint consists of **exactly 5 serverless resources**:

```
1. AWS::IAM::Role                  (AegisScopedInspectorRole — Least-privilege read-only permissions)
2. AWS::Lambda::Function           (AegisServerlessEngine — Ephemeral FastAPI backend & graph engine)
3. AWS::ApiGatewayV2::Api          (AegisHttpApi — Lightweight REST gateway with CORS)
4. AWS::S3::Bucket                 (AegisCustomerWebBucket — Private bucket for static UI assets & snapshots)
5. AWS::CloudFront::Distribution   (AegisConsoleCDN — Secure HTTPS web console delivery with OAC)
```

### Resource Lifecycle & Zero Impact on Existing Workloads
- **Zero Modification:** AEGIS provisions its own isolated resources under the prefix `aegis-*`. It never modifies, stops, reboots, or alters any existing customer EC2, VPC, RDS, or IAM resources.
- **Zero Cost at Idle:** In the absence of active investigations, Lambda invocation count is zero and S3 storage is negligible. Estimated customer idle cost: **<$0.50/month**.

---

## 5. Customer Data Boundary & Security Model

```
+---------------------------------------------------------------------------------+
| DATA CLASSIFICATION & PROCESSING BOUNDARIES                                    |
+---------------------------------------------------------------------------------+
| STAYS 100% IN CUSTOMER ACCOUNT:                                                 |
| - All infrastructure topology graphs, node IDs, IP addresses, and CIDRs        |
| - All CloudTrail management audit logs and Security Hub findings                |
| - All generated remediation patches and rollback runbooks                       |
| - All IAM policy documents, trust relationships, and role definitions          |
| - All investigation history and context completeness scores                     |
+---------------------------------------------------------------------------------+
| SENT TO AMAZON BEDROCK (IN-REGION INFERENCE ONLY):                              |
| - Sanitized structural prompts (e.g. "Explain the attack path from IGW to S3")  |
| - Aggregated finding summaries (no plaintext secrets, no credentials)           |
| - IaC abstract syntax blocks for diff explanation                               |
+---------------------------------------------------------------------------------+
| STRICTLY NEVER TOUCHED OR ACCESSED:                                            |
| - S3 object contents or customer data files (`s3:GetObject` is FORBIDDEN)       |
| - Secrets Manager secrets or SSM SecureStrings                                  |
| - Database rows or RDS table data                                               |
| - EC2 instance operating system memory or user data scripts                     |
| - Private keys, SSL certificates, or authentication tokens                      |
+---------------------------------------------------------------------------------+
```

---

## 6. Multi-Mode Autonomy Progression

AEGIS supports three distinct operating modes to accommodate organizational risk tolerances:

1. **Mode 1 — Read-Only Investigation (Default & Mandatory):**
   - Full discovery, knowledge graph modeling, attack path tracing, and Rule 14 patch preview.
   - Strictly forbidden from executing mutations or applying changes.
2. **Mode 2 — Human-Approved Remediation (Future Optional):**
   - Synthesizes ready-to-merge GitHub Pull Requests or AWS Systems Manager change templates.
   - Requires explicit human approval and dual-engineer sign-off before execution.
3. **Mode 3 — Controlled Autonomous Operations (Long-Term Roadmap):**
   - Automated remediation of low-risk ephemeral perimeter violations with pre-flight dry-runs and automated rollbacks.
   - Requires organization-level policy authorization.
