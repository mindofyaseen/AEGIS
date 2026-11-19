# AEGIS — Next Steps & Execution Roadmap

## Immediate Priority Tasks (Phase 0 & 1 - Today)

1. **Core Data Models (`backend/models.py`):**
   - Define provider-neutral contracts for Cloud Resources (VPC, Subnet, RouteTable, ENI, SecurityGroup, EC2, IAM, S3, RDS).
   - Define Relationship edges with evidence metadata (`source_collector`, `timestamp`, `confidence`).
   - Define Security Finding, Attack Path, Investigation Record, and the 3 Verdict types (`BLOCK`, `INSUFFICIENT_CONTEXT`, `READY_FOR_HUMAN_REVIEW`).

2. **Deterministic Synthetic AWS Fixture (`fixtures/aws_topologies/ecommerce_vpc.json`):**
   - E-commerce architecture with Internet Gateway, Public Subnet, Private Subnet, Web EC2 instance with public IP, Bastion SG with 0.0.0.0/0 SSH rule, attached IAM Role, and target S3 Bucket.

3. **Infrastructure Knowledge Graph (`services/infrastructure_graph/graph_engine.py`):**
   - NetworkX multi-directed graph modeling network routes, security groups, IAM policy grants, and data paths.
   - Graph validation methods verifying every edge has supporting evidence.

4. **Deterministic Context Completeness Engine (`services/policy_engine/context_completeness.py`):**
   - Scans discovery run status, collector success rates, snapshot freshness, and dependency gaps.
   - Automatically forces `INSUFFICIENT_CONTEXT` if crucial topology data is missing.

5. **Security Rules Engine (`services/security_engine/engine.py`):**
   - Implement initial deterministic checks:
     - `SEC-NET-01`: Public SSH/RDP Ingress (`0.0.0.0/0:22` or `3389`).
     - `SEC-IAM-01`: Excessive wildcard privileges (`*:*` or `s3:*` on sensitive buckets).
     - `SEC-S3-01`: Public bucket access without strict ACL / block public access.
     - `SEC-DB-01`: Publicly accessible database with weak SG bounds.

6. **Attack Path Engine (`services/attack_path/tracer.py`):**
   - Breadth-first / shortest path traversal from Internet Gateway node -> Network Interface -> EC2 -> IAM Role -> Sensitive S3 Bucket.
   - Annotates each hop with evidence confidence and assumptions.

7. **Adversarial Test Suite (`tests/adversarial/test_adversarial_suite.py`):**
   - 14 automated test cases validating direct prompt injection, comment injection, tag injection, cross-account requests, and incomplete discovery.
