# AEGIS — Strategic Product Direction
## The Customer-Deployable Autonomous AI DevSecOps Engineer

**Document Version:** 3.0-PHASE-0  
**Classification:** Enterprise Engineering Blueprint  
**Status:** In-Scope Strategy Approved  

---

## 1. Product Thesis & Positioning

Modern organizations do not suffer from a lack of security scanners. An average cloud engineering team operates 6 to 12 disconnected tools (CSPM, SAST, SCA, container scanners, CWPP, and CI linters). The fundamental breakdown occurs at **synthesis, prioritization, correlation, and remediation**:
- Security tools generate thousands of noisy, un-contextualized alerts.
- High-severity static findings (e.g., an open port or unpinned library) are often non-exploitable because there is no reachable network path or execution vector.
- Conversely, a chain of low-severity configurations (e.g., an EC2 instance with an unhardened profile attached to a public subnet) forms a catastrophic **multi-hop attack path** straight to crown-jewel customer data.
- Developers lack the security expertise to synthesize minimal, non-breaking remediation patches; security engineers lack the development bandwidth to submit PRs for every alert.

**AEGIS solves this by delivering an autonomous, in-account AI DevSecOps Engineer.**

AEGIS is **not** a centralized multi-tenant SaaS where customers ship credentials to a vendor. It is **not** an agent-builder kit where users must assemble tools. It is a **ready-made, customer-deployable AI DevSecOps Engineer** that deploys directly into the customer's AWS account. It discovers existing infrastructure, correlates multi-layer telemetry (Cloud + Code + Container + Identity + Runtime), models directional attack graphs, evaluates deterministic safety gates, and synthesizes verifiable engineering pull requests.

```
+-----------------------------------------------------------------------------------+
|                        CUSTOMER AWS ACCOUNT BOUNDARY                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | EXISTING PRODUCTION INFRASTRUCTURE & WORKLOADS (NEVER MODIFIED)             |  |
|  | VPCs · Subnets · EC2 · S3 · RDS · IAM Roles · EKS · ECR · Lambda · Workflows   |  |
|  +-----------------------------------------------------------------------------+  |
|              ▲                           ▲                           ▲            |
|              │                           │                           │            |
|       (Strict Read-Only)          (Metadata Only)             (No Mutation)       |
|              │                           │                           │            |
|  +-----------------------------------------------------------------------------+  |
|  | AEGIS IN-ACCOUNT AUTONOMOUS DEVSECOPS RUNTIME (SERVERLESS / ISOLATED)       |  |
|  |                                                                             |  |
|  |  +------------------------+  +------------------------+  +---------------+  |  |
|  |  | MULTI-LAYER COLLECTORS |  | KNOWLEDGE GRAPH ENGINE |  | CONTEXT GATE  |  |  |
|  |  | (Cloud, Code, Image)   |  | (NetworkX MultiDiGraph)|  | (Score >=0.85)|  |  |
|  |  +------------------------+  +------------------------+  +---------------+  |  |
|  |              │                           │                       │          |  |
|  |              ▼                           ▼                       ▼          |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | AGENTCORE MANAGED ORCHESTRATOR & DETERMINISTIC POLICY ENGINE          |  |  |
|  |  | (Arbitrates: BLOCK | INSUFFICIENT_CONTEXT | READY_FOR_HUMAN_REVIEW)    |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |              │                                                   │          |  |
|  |              ▼                                                   ▼          |  |
|  |  +------------------------------+             +--------------------------+  |  |
|  |  | BEDROCK MANAGED REASONING    |             | RULE 14 REMEDIATION PR   |  |  |
|  |  | (Claude 3.5 Sonnet / Haiku)  |             | (Unified .patch & Runs)  |  |  |
|  |  +------------------------------+             +--------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|                                         │                                         |
|                                         ▼ (Secure HTTPS OAC)                      |
|  +-----------------------------------------------------------------------------+  |
|  | CUSTOMER'S PRIVATE AEGIS ENGINEERING CONTROL PLANE (REACT 18 + THREE.JS 3D)  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Customer Interaction Model & Workflows

A customer engineer, architect, or CISO interacts with AEGIS through natural language queries grounded strictly in authorized AWS tool execution:

1. **"Understand my AWS environment."**
   - AEGIS executes read-only collectors across networking, compute, storage, identity, and databases.
   - Builds an inventory of all active resources and directional relationships.
   - Computes telemetry completeness score; reports any blind spots (missing permissions).
   - Generates an interactive 3D spatial topology with VPC DMZ and private tier planes.

2. **"Trace critical attack paths from the internet to sensitive databases."**
   - Runs breadth-first search (BFS) graph traversal from all Internet Gateways and public ENIs.
   - Traces lateral movement through compute instances, IAM role assumptions, and security group traversals.
   - Calculates blast radius and highlights the exact hop chain.

3. **"Review this pull request / Terraform change before deployment."**
   - Parses the proposed Terraform plan JSON or CloudFormation template AST.
   - Simulates resource modifications against the live in-memory knowledge graph.
   - Issues a definitive gatekeeper verdict: `BLOCK` (exit code 1) or `READY_FOR_HUMAN_REVIEW` (exit code 0).

4. **"Fix this approved perimeter issue."**
   - Under Mode 1 (Default): Synthesizes a unified `.patch` file with exact CLI rollback commands and verification tests.
   - Under Mode 2 (Human-Approved): Creates a ready-to-merge GitHub pull request with branch isolation.
   - Under Mode 3 (Controlled Autonomy): Executes pre-authorized, reversible, idempotent operations following dry-run policy checks.

---

## 3. Strict Scope Lock

### IN SCOPE (Phase 0 & Major Evolution):
1. AWS Cloud Security & Topology Discovery
2. Infrastructure Knowledge Graph (MultiDiGraph modeling)
3. IAM Least Privilege & Cross-Account Role Inspection
4. Multi-Hop Lateral Attack Path Analysis
5. Vulnerability Management & Prioritization
6. Application Security (SAST, SCA, Secrets, SBOM)
7. Container Security (ECR, Image CVEs, OS packages)
8. Kubernetes Security (Amazon EKS, RBAC, Pod Security)
9. Runtime Threat Detection (GuardDuty & Security Hub correlation)
10. CI/CD Pipeline Gatekeeper (GitHub Actions, GitLab CI)
11. Infrastructure as Code Security (Terraform, CloudFormation, AWS CDK)
12. Forensic Incident Investigation & Blast Radius
13. Progressive Autonomous Remediation (Modes 1, 2, 3)
14. Customer-Owned In-Account Deployment & Preflight CLI
15. Enterprise Control Plane Dashboard (11 workspaces retained & unified)

### EXPLICITLY OUT OF SCOPE:
- Microsoft Azure, Google Cloud Platform (GCP), or Oracle Cloud Infrastructure (OCI).
- On-premises infrastructure or hybrid virtualization (VMware, OpenStack).
- Arbitrary cloud provisioning (AEGIS is an engineer that inspects and secures existing infrastructure, not an open-ended infrastructure builder).
- Unrestricted autonomous infrastructure mutation without deterministic policy authorization.
