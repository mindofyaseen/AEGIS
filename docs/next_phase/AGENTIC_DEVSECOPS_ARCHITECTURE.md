# AGENTIC DEVSECOPS & DATA BOUNDARY SPECIFICATION
**Document ID:** `AEGIS-ARCH-006-REV2` (Phase 0.5 Technical Correction)  
**Domain:** Amazon Bedrock AgentCore, LLM Inference Flow, Data Boundaries, Zero Data Leakage Truth  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Corrected data boundary statements; unpacked customer VPC boundary vs AWS managed Bedrock service plane; documented exact telemetry paths, regional inference, and client-side sanitization.

---

## 1. Executive Summary & Core Objective

Enterprise DevSecOps requires an AI agent capable of synthesizing complex infrastructure context, investigating security incidents, and reasoning over attack paths. However, enterprise security leaders and CISOs demand total clarity regarding where their data travels, where model inference occurs, and what access foundation models retain.

This specification documents the **verified architectural boundaries** of the AEGIS agentic execution engine, distinguishing customer-owned compute environments from AWS-managed regional service planes.

---

## 2. Real Data Flow & Architectural Trust Boundaries

```mermaid
flowchart TD
    subgraph Customer VPC & Compute Perimeter [Customer AWS Account Owned]
        APIGW[API Gateway HTTP API] --> Lambda[AEGIS Core Orchestrator (Lambda)]
        Lambda --> Boto[Boto3 Read-Only Harvesters]
        Boto --> CloudInfra[(Customer AWS Infrastructure: EC2, S3, IAM, EKS)]
        Lambda --> Sanitizer[Client-Side Data Hygiene & Masking Filter]
        Sanitizer --> S3Store[(Customer Encrypted S3 Bucket: Graph State & History)]
        Sanitizer --> Dynamo[(Customer DynamoDB Table: Findings & Sessions)]
    end

    subgraph AWS Managed Service Plane [AWS Shared Responsibility Perimeter]
        Sanitizer -->|HTTPS over AWS PrivateLink / VPC Endpoint| BedrockAPI[AWS Bedrock Runtime Endpoint]
        BedrockAPI --> Model[Anthropic Claude 3.5 Sonnet / AWS Bedrock]
    end

    subgraph External Public Internet [Strictly Prohibited]
        PublicWeb[External SaaS / Multi-Tenant Proxy]
    end

    Lambda -.->|BLOCKED: Zero Data Flow| PublicWeb
    Model -.->|AWS Contractual Zero-Retention Policy| Discard[Transient Memory - Discarded After Inference]
```

### 2.1 Boundary Breakdown: What Runs Where

| Architectural Component | Execution Location | Network Boundary | Customer Control Level |
| :--- | :--- | :--- | :--- |
| **Agent Core & State Machine** | Customer AWS Account | Customer VPC / AWS Lambda | 100% Customer Controlled |
| **Tool Execution & Collectors** | Customer AWS Account | Customer VPC / AWS PrivateLink | 100% Customer Controlled |
| **Telemetry & State Storage** | Customer AWS Account | Amazon S3 & DynamoDB (KMS CMK) | 100% Customer Controlled |
| **Investigation History & Logs** | Customer AWS Account | CloudWatch Logs & S3 WORM Bucket | 100% Customer Controlled |
| **Foundation Model Inference** | AWS Managed Bedrock Plane | AWS Regional Managed Endpoint | Managed AWS Service (Regional) |

---

## 3. AWS Bedrock Inference Truth & Privacy Commitments

### 3.1 What "In-Account" Truly Means
Model inference **does not run inside the customer's private VPC instances** (which would require massive dedicated GPU clusters). Instead, inference is invoked via the **AWS Bedrock Runtime Regional API** (`bedrock-runtime.<region>.amazonaws.com`).

### 3.2 Key Privacy & Security Guarantees:
1. **AWS Bedrock Zero-Retention Commitment:** Under standard AWS Bedrock terms, customer prompts and completions:
   - Are **never used to train base models**.
   - Are **never shared with third-party model providers** (e.g. Anthropic).
   - Are processed in transient memory and discarded immediately upon completion of the response stream.
2. **Private Network Routing via AWS PrivateLink:** All traffic between the AEGIS Lambda backend and Amazon Bedrock routes across an **Interface VPC Endpoint (AWS PrivateLink)** for Bedrock. Traffic traverses the private AWS global network backbone and **never traverses the public internet**.
3. **Strict Regional Isolation:** Inference is strictly pinned to the customer's selected AWS region (e.g., `us-east-1` or `eu-central-1`). Cross-region inference routing is explicitly disabled in the Boto3 Bedrock configuration (`enforce_regional_endpoint=True`).

---

## 4. Client-Side Data Hygiene & Context Minimization Pipeline

To adhere to the principle of least privilege, AEGIS minimizes and sanitizes context *before* transmitting prompts to Bedrock:

1. **Context Minimization:** Rather than sending entire raw CloudFormation templates or tens of thousands of lines of CloudTrail logs, AEGIS extracts only the specific AST nodes, graph edges, and relevant log records associated with the investigation.
2. **Automated Secret Redaction:** A deterministic regex filter intercepts all prompt text, redacting:
   - AWS Access Key IDs (`AKIA[0-9A-Z]{16}`) $\rightarrow$ `[REDACTED_AWS_KEY]`
   - Sensitive Headers & Bearer Tokens $\rightarrow$ `[REDACTED_TOKEN]`
   - Private Keys (RSA/EC headers) $\rightarrow$ `[REDACTED_PRIVATE_KEY]`
   - Database Connection URIs with embedded passwords $\rightarrow$ `[REDACTED_DB_URI]`
3. **Prompt Injection Quarantine:** Untrusted metadata (resource tags, commit messages) is encapsulated inside strict XML delimiters (`<untrusted_data>`) and parsed as string literals.
