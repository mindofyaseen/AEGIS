# ARCHITECTURAL DECISION REGISTRY (ADRs) — PHASE 0.5 REVISED
**Document ID:** `AEGIS-ARCH-022-REV2` (Phase 0.5 Technical Correction)  
**Domain:** Architectural Decision Records (ADRs), Trade-Offs, Formal Status Classification  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Re-evaluated all 7 ADRs; added formal statuses; explicitly identified unresolved questions and founder approvals required.

---

## 1. Formal ADR Evaluation Matrix

| ADR # | Architectural Topic | Options Considered | Recommended Decision | Formal Status |
| :---: | :--- | :--- | :--- | :--- |
| **ADR-001** | Compute Hosting Architecture | Dedicated EKS vs ECS Fargate vs Serverless Lambda + Fargate | **Hybrid: Serverless Lambda Core + Ephemeral Fargate Tasks** | **RECOMMENDED** |
| **ADR-002** | Infrastructure Graph Storage | Amazon Neptune vs Neo4j vs In-Memory NetworkX + S3 | **In-Memory NetworkX + S3 Compressed Snapshots** | **RECOMMENDED** |
| **ADR-003** | Runtime Threat Strategy | Host eBPF Agent vs Agentless CloudTrail/GuardDuty Ingestion | **Progressive: EventBridge Ingestion (Tier 1) -> GuardDuty RM (Tier 2)** | **CONDITIONALLY_APPROVED** |
| **ADR-004** | Bedrock Inference Flow | SaaS Central Relay vs Direct In-Account Bedrock Inference | **Direct In-Account Bedrock via AWS PrivateLink** | **RECOMMENDED** |
| **ADR-005** | Autonomous Remediation Model | Default Auto-Remediation vs Progressive 3-Tier Guardrails | **Progressive: Mode 1 Default -> Mode 2 Approved -> Mode 3 Opt-In** | **REQUIRES_FOUNDER_DECISION** |
| **ADR-006** | Scanner Isolation & Licensing | Embedded Python vs Ephemeral Fargate Subprocess | **Ephemeral Fargate Tasks with Pipe JSON Streaming (LGPL Safe)** | **RECOMMENDED** |
| **ADR-007** | Customer Deployment Scope | Multi-Account Org Stack vs Single-Account Primary Deployment | **Single-Account Core First; Hub-and-Spoke STS as Enterprise Addon** | **RECOMMENDED** |

---

## 2. Detailed ADR Specifications

### ADR-001: Compute Hosting Architecture
- **Context:** Minimizing customer idle spend while supporting heavy scanner workloads.
- **Decision:** Hybrid model: AWS Lambda (Python 3.12) runs the core API, EventBridge handlers, and fast scans ($0.00 idle); ephemeral single-use Amazon ECS Fargate tasks are dispatched for deep container unpacking and monorepo AST analysis.
- **Status:** **RECOMMENDED**.

### ADR-002: Infrastructure Graph Storage Backend
- **Context:** Graph traversal latency vs provisioned database costs.
- **Decision:** In-memory NetworkX with S3 JSON snapshots. 99% of AWS environments have $< 25,000$ resources. Traversal takes $< 15\text{ms}$ in RAM, saving customers over $2,500/year compared to Amazon Neptune.
- **Status:** **RECOMMENDED**.

### ADR-003: Runtime Threat Detection Strategy
- **Context:** Host agent friction vs agentless visibility.
- **Decision:** Tier 1 implements 100% agentless ingestion of GuardDuty and Security Hub findings via EventBridge. Tier 2 enables AWS-managed GuardDuty Runtime Monitoring upon customer opt-in. Third-party host agents (Falco) are deferred.
- **Status:** **CONDITIONALLY_APPROVED** (Requires validation against live GuardDuty finding fixtures).

### ADR-004: Bedrock AI Model Inference Flow
- **Context:** Enterprise data privacy and zero data leakage.
- **Decision:** In-account direct Bedrock invocation over AWS PrivateLink. Prompts are sanitized client-side, encrypted in transit, and discarded post-inference under AWS Bedrock zero-retention terms. Zero third-party SaaS proxy.
- **Status:** **RECOMMENDED**.

### ADR-005: Remediation Governance & Safety Guardrails
- **Context:** Automated cloud mutations vs risk of production outages.
- **Decision:** Mode 1 (Advisory) is the immutable default. Mode 2 (Human-Approved) requires cryptographic sign-off. Mode 3 (Autonomous) is strictly opt-in for narrow, pre-validated, low-risk actions on non-production resources.
- **Status:** **REQUIRES_FOUNDER_DECISION** (Founder must sign off on whether Mode 3 should be included in initial packaging or deferred to Phase 2).

### ADR-006: Security Scanner Isolation & Open-Source Licensing
- **Context:** Semgrep LGPL 2.1 copyleft obligations and untrusted code sandboxing.
- **Decision:** Scanners run inside isolated, ephemeral ECS Fargate containers communicating via standard OS pipes and JSON data streams, ensuring strict copyright process boundary separation and zero environment residue.
- **Status:** **RECOMMENDED**.

### ADR-007: Single-Account Deployment vs Multi-Account Complexities
- **Context:** Frictionless initial customer onboarding.
- **Decision:** Optimize initial packaging for a single customer AWS account. Cross-account AWS Organizations harvesting via STS AssumeRole is architected as an advanced modular enterprise addon.
- **Status:** **RECOMMENDED**.
