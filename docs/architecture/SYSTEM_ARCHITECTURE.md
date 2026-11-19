# AEGIS System Architecture

## 1. High-Level Architecture Overview

AEGIS implements a multi-layered, defense-in-depth architecture designed for zero-trust cloud security investigation. The platform guarantees that:
1. **The LLM is an investigator and explainer, not an authoritative policy engine or cloud executor.**
2. **Every conclusion is backed by concrete graph evidence.**
3. **If evidence is incomplete, stale, or contradictory, the system deterministically refuses to certify safety.**

```text
               USER INVESTIGATION REQUEST / TERRAFORM PLAN
                                    |
                                    v
                  +-----------------------------------+
                  |      AEGIS API & Input Validator  |
                  |     - Account & Region Bounds     |
                  |     - XML Prompt Encapsulation    |
                  +-----------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
    +------------------------------+  +------------------------------+
    |  Read-Only AWS Collectors    |  |  Deterministic Synthetic     |
    |  - Boto3 (Describe/Get/List) |  |  Topology Fixtures           |
    |  - Least-Privilege IAM Role  |  |  (Offline / Zero-Cost Mode)  |
    +------------------------------+  +------------------------------+
                    |                               |
                    +---------------+---------------+
                                    |
                                    v
                  +-----------------------------------+
                  |   Normalized Resource Inventory   |
                  |  - Universal Provider Contract    |
                  |  - Source Collector & Timestamps  |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |  Infrastructure Knowledge Graph   |
                  |  - NetworkX MultiDiGraph          |
                  |  - Verified Evidence Per Edge     |
                  |  - Network, IAM, Storage Edges    |
                  +-----------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
    +------------------------------+  +------------------------------+
    |  Deterministic Policy Engine |  |  Context Completeness Gate   |
    |  - Mathematical Rule Checks  |  |  - Collector Success Ratio   |
    |  - Attack Path Tracer        |  |  - Snapshot Freshness Check  |
    |  - Blast Radius Engine       |  |  - Dependency Gap Identifier |
    +------------------------------+  +------------------------------+
                    |                               |
                    +---------------+---------------+
                                    |
                                    v
                  +-----------------------------------+
                  |  Amazon Bedrock AgentCore Harness |
                  |  - Model: Claude 3.5 Haiku/Sonnet |
                  |  - Bedrock Guardrails Filter      |
                  |  - Strictly Allowlisted Tools     |
                  |  - 15 Enforced Governance Rules   |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |  Final Verdict & Evidence Report  |
                  |  - BLOCK | INSUFFICIENT_CONTEXT   |
                  |    or READY_FOR_HUMAN_REVIEW      |
                  |  - Attack Path Graph Visualizer   |
                  |  - Remediation Patch Generator    |
                  +-----------------------------------+
```

---

## 2. Core Subsystems

### A. AWS Discovery Engine (`services/aws_discovery`)
- Executes non-mutating AWS API calls (`ec2:Describe*`, `iam:Get*`, `iam:List*`, `s3:GetBucketPolicy`, etc.).
- Operates under strict timeout and error-handling wrappers.
- If an API returns `AccessDenied`, it records collector status as `FAILED` rather than halting silently.

### B. Infrastructure Knowledge Graph (`services/infrastructure_graph`)
- Built upon NetworkX, modeling directional relationships:
  - `VPC` -> `CONTAINS` -> `Subnet`
  - `Subnet` -> `ASSOCIATED_WITH` -> `RouteTable`
  - `RouteTable` -> `ROUTES_TO` -> `InternetGateway`
  - `Subnet` -> `CONTAINS` -> `NetworkInterface`
  - `NetworkInterface` -> `ATTACHED_TO` -> `EC2Instance`
  - `SecurityGroup` -> `APPLIES_TO` -> `NetworkInterface`
  - `EC2Instance` -> `ASSUMES` -> `IAMRole`
  - `IAMRole` -> `HAS_POLICY` -> `IAMPolicy`
  - `IAMPolicy` -> `GRANTS` -> `S3Bucket`
- Every edge carries an `evidence` object with collector name, timestamp, and confidence score.

### C. Context Completeness Gate (`services/policy_engine/context_completeness.py`)
- Calculates a completeness metric $C \in [0.0, 1.0]$.
- If essential collectors failed or dependency chains are unresolved, sets verdict to `INSUFFICIENT_CONTEXT`.

### D. Deterministic Security Rules (`services/security_engine`)
- Runs rule evaluations without LLM intervention.
- Evaluates CIDR blocks, port ranges, policy wildcard actions, and public accessibility flags.

### E. Bedrock AgentCore Managed Harness (`integrations/bedrock/harness.py`)
- Provides AI reasoning grounded strictly in the tool outputs.
- Guardrails intercept adversarial prompt injection attempts.
- Only registered tools can be invoked; shell and filesystem write tools are completely disabled.

### F. Web Security Dashboard (`apps/web`)
- Interactive React / Next.js interface with 3D cyber topology viewer, attack path inspector, and evidence explorer.
