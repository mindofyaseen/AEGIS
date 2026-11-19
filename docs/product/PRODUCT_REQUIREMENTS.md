# AEGIS — Product Requirements Document (PRD)

## 1. Document Overview
This document specifies the technical and functional requirements for AEGIS: Autonomous Cloud Security & DevSecOps Platform.

---

## 2. Functional Requirements

### FR-01: Read-Only Cloud Infrastructure Discovery
- **FR-01.1:** System shall ingest AWS infrastructure state across EC2 (VPCs, Subnets, Route Tables, Internet Gateways, NAT Gateways, Security Groups, Instances), IAM (Roles, Policies, Instance Profiles), S3 (Buckets, Public Access Blocks, Bucket Policies, Encryption), and RDS (DB Instances, DB Subnet Groups, Public Accessibility).
- **FR-01.2:** System shall use read-only AWS APIs exclusively (`Describe*`, `Get*`, `List*`).
- **FR-01.3:** System shall isolate collector failures so that a failure in one service does not crash the overall collection pipeline.

### FR-02: Infrastructure Knowledge Graph
- **FR-02.1:** System shall construct an in-memory MultiDiGraph representing all discovered assets as nodes and their topological relationships as directed edges (`CONTAINS`, `ROUTES_TO`, `ASSOCIATED_WITH`, `ASSUMES`, `GRANTS`).
- **FR-02.2:** System shall associate cryptographic evidence metadata with every node and edge.
- **FR-02.3:** System shall provide graph query capabilities to identify public ingress nodes and high-value target assets ("crown jewels").

### FR-03: Deterministic Context Completeness Gate
- **FR-03.1:** System shall calculate a mathematical completeness score based on collector success rates, essential collector availability, snapshot freshness, and dependency resolution.
- **FR-03.2:** If any essential collector fails or snapshot age exceeds 24 hours, the system shall mark the context ineligible for safety certification and force an `INSUFFICIENT_CONTEXT` verdict.

### FR-04: Deterministic Security Rule Engine
- **FR-04.1:** System shall evaluate deterministic perimeter and least-privilege rules:
  - `SEC-NET-01`: Detect ingress from 0.0.0.0/0 on sensitive administrative ports (22, 3389).
  - `SEC-IAM-01`: Detect wildcard permissions (`Action: *`, `Resource: *`).
  - `SEC-S3-01`: Detect missing or disabled S3 Public Access Blocks.
  - `SEC-DB-01`: Detect RDS instances with `PubliclyAccessible=True`.
- **FR-04.2:** Any critical finding shall trigger a `BLOCK` verdict.

### FR-05: Multi-Hop Attack Path Tracer
- **FR-05.1:** System shall execute breadth-first search (BFS) graph traversal to discover traversable paths from public ingress nodes to high-value assets.
- **FR-05.2:** System shall generate human-readable attack narratives explaining entry points, lateral movement hops, and exploitation impact.

### FR-06: Terraform Plan Change Analysis
- **FR-06.1:** System shall parse Terraform plan JSON without executing terraform apply.
- **FR-06.2:** System shall detect planned security drift (e.g. adding 0.0.0.0/0 ingress rules or deleting public access blocks) and block CI/CD pipeline progression.

### FR-07: Remediation Patch Synthesis (Rule 14)
- **FR-07.1:** System shall generate minimal Terraform patches and AWS CLI remediation commands.
- **FR-07.2:** System shall provide explicit rollback plans and pre/post verification test checklists.

### FR-08: CloudTrail Forensic Timeline Correlator
- **FR-08.1:** System shall parse CloudTrail event streams and identify suspicious administrative mutations.
- **FR-08.2:** System shall correlate mutations with responsible IAM identities, source IPs, and timestamps.

### FR-09: Executive Web Dashboard
- **FR-09.1:** Provide React 18 + Tailwind CSS single-page interface displaying the three legal verdicts (`BLOCK`, `INSUFFICIENT_CONTEXT`, `READY_FOR_HUMAN_REVIEW`).
- **FR-09.2:** Render interactive infrastructure topology map, findings drawer, remediation diff viewer, CloudTrail timeline, and adversarial test matrix.

---

## 3. Non-Functional Requirements

### NFR-01: Zero-Mutation & Safety
The platform shall possess zero capabilities to modify, create, or delete live AWS cloud resources. All mutation actions must be executed manually by human operators or through approved CI/CD pipelines outside the agent.

### NFR-02: Cost Optimization & Credit Preservation
- Hackathon spend target: <= $20 USD.
- Real-time spend: $0.00 (leveraging synthetic local topology and read-only boto3 API limits).

### NFR-03: Latency & Performance
- Full investigation run time: < 2.5 seconds on local topologies.
- API response latency: < 50ms for cached scenarios.
- Frontend initial bundle size: < 250 kB gzipped.

### NFR-04: Security & Zero-Trust
- All prompt injection attempts through IaC comments, resource tags, or logs must be neutralized deterministically.
- All 15 Governance Rules must be auditable and immutable.
