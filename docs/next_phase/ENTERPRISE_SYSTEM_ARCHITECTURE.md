# AEGIS — Enterprise System Architecture
## Multi-Layer Autonomous DevSecOps Platform Specification

**Document Version:** 3.0-PHASE-0  
**Status:** Architecture Blueprint Approved  

---

## 1. High-Level Enterprise System Topology

AEGIS is structured into five distinct operational tiers:

```
+-----------------------------------------------------------------------------------+
| 1. INGESTION & TELEMETRY TIER                                                     |
|    - AWS Boto3 Discovery Collectors (EC2, VPC, IAM, S3, RDS, EKS, CloudTrail)     |
|    - AppSec & Source Code Ingestors (Git Repositories, Semgrep AST, Gitleaks)     |
|    - Container & Registry Ingestors (Amazon ECR, Trivy Image Scanner, Syft SBOM)  |
|    - CI/CD & Change Ingestors (Terraform Plan JSON, CloudFormation, GitHub PRs)   |
|    - Runtime Threat Ingestors (Amazon GuardDuty, Security Hub Findings)           |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 2. KNOWLEDGE GRAPH & TELEMETRY FUSION TIER                                        |
|    - In-Memory NetworkX MultiDiGraph (Nodes: Assets, Edges: Network/IAM/Flows)   |
|    - Context Completeness Gate (Mathematical Score >= 0.85, Stale Telemetry Drop)|
|    - Graph BFS Multi-Hop Attack Path Tracer (Internet Ingress -> Crown Jewels)    |
|    - Blast Radius & Asset Criticality Weighting Engine                            |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 3. DETERMINISTIC POLICY & DECISION ARBITRATION TIER                               |
|    - Rule Engine: SEC-NET-01, SEC-IAM-01, SEC-S3-01, SEC-APP-01, SEC-K8S-01      |
|    - State Machine Decision Gate: BLOCK | INSUFFICIENT_CONTEXT | READY            |
|    - Regulatory Compliance Mapper: CIS AWS v3.0, SOC 2 Type II, PCI-DSS, HIPAA   |
|    - Immutable JSONL Audit Ledger with SHA-256 Record Signatures                  |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 4. AGENTIC REASONING & REMEDIATION TIER                                           |
|    - Amazon Bedrock AgentCore Managed Harness (Claude 3.5 Sonnet / Haiku)         |
|    - Strict Tool Allowlist Gateway (6 Read-Only Tools + Mode 2/3 Action Gates)    |
|    - Prompt Injection Sanitization & Pre-Processor Quarantine Filter              |
|    - Rule 14 Remediation Planner (Minimal Unified .patch, CLI Fixes, Rollbacks)   |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
| 5. CONTROL PLANE & INTERACTION TIER                                               |
|    - In-Account Serverless FastAPI REST Engine (AWS Lambda + Function URL)        |
|    - React 18 + Three.js 3D WebGL Spatial Explorer + Cytoscape 2D Schematic      |
|    - Dual Audience Control Plane: Executive Business View vs SecOps Technical View |
|    - CI/CD Gatekeeper CLI (`aegis_cli.py`) & GitHub PR Commenter Bot              |
+-----------------------------------------------------------------------------------+
```

---

## 2. In-Memory Graph Modeling vs. Database Selection (ADR-002)

| Criteria | In-Memory NetworkX MultiDiGraph (Selected) | Managed Neptune / Neo4j Graph DB |
| :--- | :--- | :--- |
| **Execution Latency** | **Sub-millisecond** (In-process memory pointer traversal). | 15–80ms network latency per Cypher/Gremlin query. |
| **AWS Operating Cost** | **$0.00 / month** (Runs inside Lambda RAM). | $150 – $400 / month provisioned cluster cost. |
| **Cold-Start Overhead**| Instantaneous initialization (< 5ms). | VPC peering, SSL connection pool, socket latency. |
| **Data Boundary** | Ephemeral: destroyed with Lambda execution context. | Persistent storage requiring separate customer KMS. |
| **Scalability** | Up to 100,000 nodes in 256MB RAM (ideal for single account).| Millions of nodes across entire multi-cloud orgs. |

### Architectural Decision:
For in-account customer deployment, **in-memory NetworkX MultiDiGraph** is selected. It completely eliminates managed database costs ($0.00 idle spend) while providing sub-25ms attack path BFS traversal. Snapshots are persisted ephemerally to customer S3 storage.
