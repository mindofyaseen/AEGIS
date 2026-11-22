# ARCHITECTURAL DECISION REGISTRY (ADRs) & SIGN-OFF
**Document ID:** `AEGIS-ARCH-022`  
**Domain:** Architecture Decision Records (ADRs), Technical Trade-Offs, Executive Founder Sign-Off  
**Author:** Principal Product Architect & Enterprise Cloud Security Architect  
**Status:** Architecture Blueprint / Discovery Phase  

---

## 1. Executive Summary & Purpose

Architectural clarity requires documenting not just *what* will be built, but *why* specific technical alternatives were selected or rejected. This registry captures the seven pivotal Architectural Decision Records (ADRs) that define the next generation of AEGIS.

Each ADR details the business context, decision drivers, considered options, chosen direction, and trade-offs. These decisions establish the engineering baseline for Phase 1 implementation.

---

## 2. Architectural Decision Records (ADR 001 - 007)

### ADR-001: Compute Hosting Architecture
- **Status:** APPROVED
- **Context:** AEGIS must be deployed directly into customer AWS accounts with minimal operational overhead and zero unnecessary cloud spend.
- **Considered Options:**
  1. Dedicated Amazon EKS Kubernetes Cluster.
  2. Always-on Amazon ECS Fargate Fleet.
  3. Serverless-First: AWS Lambda (Python 3.12) + On-Demand Fargate for Long Scans.
- **Decision:** **Option 3 (Serverless-First)**.
- **Rationale:** Keeps customer idle monthly spend at \$0.00 - \$0.50. Provides instantaneous auto-scaling, eliminates Kubernetes maintenance friction, and adheres to AWS well-architected serverless best practices.

---

### ADR-002: Infrastructure Graph Storage Backend
- **Context:** AEGIS builds a comprehensive dependency graph of AWS resources to trace attack paths and calculate blast radius.
- **Considered Options:**
  1. Amazon Neptune (Managed Graph DB).
  2. Neo4j Community / Enterprise Container.
  3. In-Memory NetworkX MultiDiGraph with S3 Compressed JSON Snapshots.
- **Decision:** **Option 3 (In-Memory NetworkX + S3 Snapshots)**.
- **Rationale:** Neptune costs \$150 - \$400+/month idle. Over 99% of customer AWS accounts contain under 25,000 resources. NetworkX performs BFS shortest-path queries in $< 15\text{ms}$ in local RAM, saving customers over \$2,500/year while reducing operational complexity to zero.

---

### ADR-003: Cloud Runtime Threat Detection Strategy
- **Status:** APPROVED
- **Context:** Detecting active attacks and credential exfiltration in customer cloud environments.
- **Considered Options:**
  1. Host-Level Kernel Agents (eBPF / Falco / Osquery DaemonSets on all EC2/EKS nodes).
  2. Agentless Cloud-Native Ingestion (GuardDuty, Security Hub ASFF, CloudTrail via EventBridge).
- **Decision:** **Option 2 (Agentless Cloud-Native Ingestion)**.
- **Rationale:** In-host agents introduce major friction: kernel compatibility issues, node performance overhead, and potential workload crash risks. Agentless ingestion provides 100% AWS control plane and VPC telemetry out of the box with zero workload interference.

---

### ADR-004: Bedrock AI Model Inference Flow
- **Status:** APPROVED
- **Context:** Processing natural language DevSecOps investigations and remediation generation.
- **Considered Options:**
  1. Centralized SaaS Proxy (Customer calls AEGIS vendor backend, vendor calls LLM).
  2. In-Account Direct Bedrock (Customer AEGIS deployment calls AWS Bedrock directly).
- **Decision:** **Option 2 (In-Account Direct Bedrock)**.
- **Rationale:** Guarantees zero data leakage. Customer security metadata and prompts never leave their AWS account perimeter. Leverages customer AWS enterprise discount agreements and complies with strict enterprise CISO requirements.

---

### ADR-005: Remediation Mode 3 (Autonomous Self-Healing) Default Guardrail
- **Status:** APPROVED
- **Context:** Automated execution of cloud infrastructure modifications without human approval.
- **Considered Options:**
  1. Opt-Out (Autonomous remediation enabled everywhere by default).
  2. Opt-In Strict Whitelist with Hard Tag Boundaries.
- **Decision:** **Option 2 (Opt-In Strict Whitelist)**.
- **Rationale:** Preventing production outages is paramount. Resources tagged `Environment=Production` or critical database/peering resources are immutably locked out of Mode 3 auto-remediation, falling back automatically to Mode 2 (human sign-off).

---

### ADR-006: Security Scanner Execution Boundary (Semgrep LGPL Compliance)
- **Status:** APPROVED
- **Context:** Running static application security (SAST) scanning using Semgrep without triggering LGPL 2.1 copyleft contamination.
- **Considered Options:**
  1. Direct Python Import (`import semgrep`).
  2. Decoupled Subprocess / Container Execution with JSON Data Streaming.
- **Decision:** **Option 2 (Decoupled Subprocess Execution)**.
- **Rationale:** Executing Semgrep as an external binary communicating over OS pipes via serialized JSON guarantees strict separation under copyright law, safeguarding AEGIS's Apache 2.0 intellectual property.

---

### ADR-007: Enterprise Multi-Account Architecture
- **Status:** APPROVED
- **Context:** Discovering and securing multiple AWS accounts across an AWS Organization.
- **Considered Options:**
  1. Full Stack Deployment in every AWS account.
  2. Hub-and-Spoke STS AssumeRole Architecture.
- **Decision:** **Option 2 (Hub-and-Spoke STS AssumeRole)**.
- **Rationale:** AEGIS is deployed in a single Central Security / Tooling account. Spoke accounts deploy a minimal read-only IAM role (`aegis-spoke-role`) trusting the Hub account with an `ExternalId`. Centralizes governance, reduces deployment costs, and simplifies management.
