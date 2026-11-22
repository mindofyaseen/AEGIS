# ENTERPRISE SYSTEM ARCHITECTURE SPECIFICATION
**Document ID:** `AEGIS-ARCH-005-REV2` (Phase 0.5 Technical Correction)  
**Domain:** System Architecture, Enterprise Integration, Network Topology, Component Mapping  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Unified 5-tier architecture; integrated AWS PrivateLink endpoints; mapped hybrid Lambda/Fargate execution; aligned with task-specific context completeness.

---

## 1. Executive Summary & System Topology

AEGIS is structured into 5 decoupled architectural tiers operating entirely within the customer's AWS account perimeter:

```mermaid
flowchart TD
    subgraph Tier 1: Presentation & Web Control Plane
        Browser[Modern Web Browser / Engineer Workstation] -->|HTTPS TLS 1.3| S3Web[Amazon S3 Static Hosting + CloudFront CDN]
        Browser -->|API Calls via Cognito JWT| APIGW[Amazon API Gateway HTTP API]
    end

    subgraph Tier 2: Orchestration & Ingress Gateway
        APIGW --> AuthMiddleware[FastAPI Auth & RBAC Middleware]
        AuthMiddleware --> TaskRouter{Workload Router}
    end

    subgraph Tier 3: Compute & Processing Core
        TaskRouter -->|Lightweight / API| CoreLambda[AWS Lambda Orchestrator]
        TaskRouter -->|Heavy Scan / Image Unpack| FargateWorker[Amazon ECS Fargate Ephemeral Tasks]
        CoreLambda --> Harvesters[AWS Boto3 Harvesters: EC2, S3, IAM, EKS, RDS]
        CoreLambda --> GraphEngine[In-Memory NetworkX Graph Builder]
        CoreLambda --> Gatekeeper[Task-Specific Context Completeness Gate]
        CoreLambda --> AttackPath[Deterministic BFS Attack Path Tracer]
    end

    subgraph Tier 4: Storage, Audit & State
        CoreLambda --> DDB[(Amazon DynamoDB: Findings, Sessions, Remediations)]
        CoreLambda --> S3State[(Amazon S3: Graph Snapshots & Evidence in Governance Mode)]
        CoreLambda --> KMS[AWS KMS Customer Managed Key CMK]
    end

    subgraph Tier 5: AWS Managed Intelligence & Event Streaming
        EventBridge[Amazon EventBridge] --> SQS[Amazon SQS Runtime Queue]
        SQS --> CoreLambda
        CoreLambda -->|PrivateLink VPC Endpoint| Bedrock[Amazon Bedrock Claude 3.5 Sonnet]
    end
```

---

## 2. Architectural Tier Specifications

1. **Tier 1 (Presentation):** React 18, TypeScript, Tailwind CSS, Cytoscape.js, Three.js WebGL explorer, packaged as static assets served securely over TLS 1.3.
2. **Tier 2 (Gateway):** HTTP API Gateway with Cognito/SAML JWT validation, rate limiting, and RBAC authorization middleware enforcing 4 enterprise personas.
3. **Tier 3 (Compute):** Serverless Lambda backend for continuous discovery, paired with on-demand ECS Fargate tasks for deep container image unpacking and monorepo AST scans.
4. **Tier 4 (Persistence):** Customer-owned DynamoDB tables (pay-per-request) and KMS-encrypted S3 storage with Object Lock in Governance Mode for forensic evidence.
5. **Tier 5 (Intelligence):** Direct PrivateLink integration to Amazon Bedrock for regional foundation model inference with zero prompt retention.
