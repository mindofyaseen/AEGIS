# MASTER IMPLEMENTATION ROADMAP (WORKSTREAMS A - L)
**Document ID:** `AEGIS-ARCH-021`  
**Domain:** Engineering Roadmap, Workstream Breakdown, Sprint Sequencing, Complexity Estimation  
**Author:** Principal Product Architect & Engineering Program Manager  
**Status:** Architecture Blueprint / Discovery Phase  

---

## 1. Executive Summary & Core Objective

Transitioning AEGIS from its current solid foundation (94 passing tests, in-memory graph, attack path tracer, IaC parser, Bedrock harness) into a complete, customer-deployable enterprise DevSecOps engineering solution requires structured program execution.

This document details the **Master Engineering Roadmap** organized into **12 discrete workstreams (A through L)** across a phased timeline. Each workstream defines concrete deliverables, dependency sequencing, and story-point / T-shirt sizing.

---

## 2. Workstream Breakdown (A through L)

```mermaid
gantt
    title AEGIS Enterprise Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Core & Packaging
    Workstream A: In-Account Packaging & Serverless Core :a1, 2026-12-01, 14d
    section Security Expansion
    Workstream B: AppSec Engine (SAST, SCA, Secrets)     :b1, 2026-12-08, 14d
    Workstream C: Container & ECR Security Engine        :c1, 2026-12-15, 14d
    Workstream D: Kubernetes & EKS Posture Engine        :d1, 2026-12-22, 14d
    Workstream E: Runtime GuardDuty & Threat Stream       :e1, 2026-12-29, 14d
    section Delivery & Ops
    Workstream F: CI/CD Gatekeeper (GitHub/GitLab)       :f1, 2027-01-05, 14d
    Workstream G: AI Incident Response & CloudTrail       :g1, 2027-01-12, 14d
    Workstream H: Autonomous Remediation (Modes 1,2,3)   :h1, 2027-01-19, 14d
    section Enterprise Governance
    Workstream I: Enterprise Identity, SAML & RBAC       :i1, 2027-01-26, 14d
    Workstream J: Frontend Unified UX & 3D Topology      :j1, 2027-02-02, 14d
    Workstream K: Disposable AWS Test Lab & E2E Harness  :k1, 2027-02-09, 10d
    Workstream L: Documentation, Whitepaper & Launch Kit :l1, 2027-02-16, 10d
```

### Detailed Workstream Specifications:

#### Workstream A: In-Account Packaging & Serverless Core
- **Deliverables**: Self-contained CloudFormation stack (`deploy/aws/aegis_customer_deployable_stack.yml`), Terraform module (`deploy/terraform/aegis-in-account`), Lambda packaging scripts with layer optimization, DynamoDB state tables.
- **Complexity**: Medium (8 Story Points / 1.5 Weeks).
- **Dependencies**: None.

#### Workstream B: Application Security Engine (AppSec)
- **Deliverables**: Ephemeral Semgrep CLI runner (`services/appsec/sast_runner.py`), Grype SCA scanner (`services/appsec/sca_runner.py`), Gitleaks secret scanner (`services/appsec/secrets_runner.py`), Syft SBOM generator, zero-persistence cleanup guarantee.
- **Complexity**: Large (13 Story Points / 2 Weeks).
- **Dependencies**: Workstream A.

#### Workstream C: Container & ECR Security Engine
- **Deliverables**: Amazon ECR repository discovery (`services/discovery/aws/ecr_harvester.py`), Trivy container image vulnerability scanner wrapper, Dockerfile AST misconfiguration inspector, image digest verification.
- **Complexity**: Medium (8 Story Points / 1.5 Weeks).
- **Dependencies**: Workstream A.

#### Workstream D: Kubernetes & EKS Posture Engine (KSPM)
- **Deliverables**: EKS cluster and nodegroup harvester (`services/discovery/aws/eks_harvester.py`), ephemeral Kubernetes API client with IRSA auth, Pod Security Standard evaluator, RBAC overprivilege analyzer, K8s-to-AWS lateral attack path rules.
- **Complexity**: Large (13 Story Points / 2 Weeks).
- **Dependencies**: Workstream A, Workstream C.

#### Workstream E: Runtime Security & Threat Stream Ingestion
- **Deliverables**: Amazon EventBridge rule definitions, SQS batch event consumer (`services/runtime/event_dispatcher.py`), GuardDuty finding mapper, Security Hub ASFF ingester, dynamic threat priority elevation algorithm.
- **Complexity**: Large (13 Story Points / 2 Weeks).
- **Dependencies**: Workstream A.

#### Workstream F: CI/CD Pipeline Gatekeeper
- **Deliverables**: Official GitHub Action (`.github/actions/aegis-gatekeeper/action.yml`), GitLab CI template (`deploy/cicd/.gitlab-ci.yml`), PR inline comment bot with rich diffs, exit-code policy engine (`PASS/WARN/BLOCK`).
- **Complexity**: Medium (8 Story Points / 1.5 Weeks).
- **Dependencies**: Workstream B, Workstream C.

#### Workstream G: AI Incident Response & CloudTrail Forensics
- **Deliverables**: CloudTrail Athena query engine and Boto3 `LookupEvents` optimizer (`services/forensics/cloudtrail_engine.py`), chronological event correlator, mathematical blast radius traversal, automated containment SOP generator.
- **Complexity**: Large (13 Story Points / 2 Weeks).
- **Dependencies**: Workstream E.

#### Workstream H: Autonomous Remediation Engine (Modes 1, 2, 3)
- **Deliverables**: Remediation state machine, DynamoDB atomic transaction manager, Mode 1 IaC generator, Mode 2 PR/ChangeSet creator with Slack webhook approval, Mode 3 safe auto-healer with blast radius circuit breaker, automated dry-run and rollback runbooks.
- **Complexity**: Epic (21 Story Points / 3 Weeks).
- **Dependencies**: Workstream A, Workstream G.

#### Workstream I: Enterprise Identity, SAML & RBAC
- **Deliverables**: Amazon Cognito User Pool integration with SAML 2.0 / OIDC federation, FastAPI JWT verification middleware, 4 RBAC personas (Viewer, Analyst, Approver, Admin), Multi-Account STS AssumeRole harvester.
- **Complexity**: Medium (8 Story Points / 1.5 Weeks).
- **Dependencies**: Workstream A.

#### Workstream J: Frontend Unified UX & 3D Topology
- **Deliverables**: Unified information architecture layout across 11 workspaces, high-density virtualized findings table, 3D WebGL (Three.js) infrastructure topology view, dark-first enterprise design system, sub-100ms client search.
- **Complexity**: Large (13 Story Points / 2 Weeks).
- **Dependencies**: Workstream A through H.

#### Workstream K: Disposable AWS Test Lab & E2E Validation Harness
- **Deliverables**: Terraform test lab module (`deploy/testlab/`), planted security vulnerabilities fixture (EC2, S3, RDS, IAM, ECR), automated budget alarm ($5 limit), automated teardown script, Category 1-12 validation test suite.
- **Complexity**: Medium (8 Story Points / 1.5 Weeks).
- **Dependencies**: Workstream A, Workstream H.

#### Workstream L: Documentation, Whitepaper & Launch Kit
- **Deliverables**: Enterprise deployment guide, CISO whitepaper, security architecture reference, customer quick-start walkthrough, API reference.
- **Complexity**: Small (5 Story Points / 1 Week).
- **Dependencies**: All preceding workstreams.
