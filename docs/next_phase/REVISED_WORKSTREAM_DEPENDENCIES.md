# REVISED WORKSTREAM DEPENDENCIES & CRITICAL PATH
**Document ID:** `AEGIS-ARCH-024`  
**Domain:** Engineering Dependencies, Critical Path Analysis, Parallel Workstreams  
**Status:** Architecture Blueprint / Phase 0.5 Deliverable  

---

## 1. Executive Summary & Structural Logic

A workstream dependency graph must reflect genuine technical prerequisites rather than arbitrary calendar sequencing. 

This specification maps the **true technical dependencies** across all 12 AEGIS workstreams, highlighting parallel execution paths, foundational gating requirements, and the critical path to product release.

---

## 2. Complete Technical Dependency Diagram

```mermaid
flowchart TD
    classDef foundation fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    classDef core fill:#10b981,stroke:#047857,color:#fff;
    classDef advanced fill:#f59e0b,stroke:#b45309,color:#fff;
    classDef remediation fill:#ef4444,stroke:#991b1b,color:#fff;
    classDef release fill:#8b5cf6,stroke:#6d28d9,color:#fff;

    %% Phase 1 Foundations
    A[Workstream A: In-Account Serverless Packaging]:::foundation
    I[Workstream I: Enterprise Identity & RBAC Baseline]:::foundation
    K[Workstream K: Disposable Test Lab & Testing Harness]:::foundation
    J[Workstream J: Unified UX Architecture & Baseline]:::foundation

    %% Phase 2 Core Engines
    B[Workstream B: Application Security Engine]:::core
    C[Workstream C: Container & ECR Security Engine]:::core
    E[Workstream E: Runtime Security & Event Streaming]:::core

    %% Phase 3 Advanced Systems
    D[Workstream D: Kubernetes & EKS Posture]:::advanced
    F[Workstream F: CI/CD Pipeline Gatekeeper]:::advanced
    G[Workstream G: AI Forensics & CloudTrail Engine]:::advanced

    %% Phase 4 Remediation & Release
    H[Workstream H: Autonomous Remediation Modes 1,2,3]:::remediation
    L[Workstream L: Enterprise Launch Kit & Docs]:::release

    %% Dependencies
    A --> I
    A --> K
    A --> J
    
    A --> B
    A --> C
    A --> E
    
    C --> D
    B --> F
    C --> F
    
    E --> G
    A --> G

    I --> H
    G --> H
    K --> H
    
    H --> L
    J --> L

    %% Parallel Tracks Annotation
    subgraph Parallel Foundations [Sprint 1 - 2]
        A
        I
        K
        J
    end

    subgraph Parallel Security Engines [Sprint 3 - 4]
        B
        C
        E
    end

    subgraph Advanced Delivery & Forensics [Sprint 5 - 6]
        D
        F
        G
    end

    subgraph Remediation & Launch [Sprint 7 - 8]
        H
        L
    end
```

---

## 3. Critical Path & Gating Analysis

### 3.1 The Critical Path
The longest sequence of dependent engineering tasks required to achieve a production-ready enterprise release is:
$$\text{Critical Path: } \mathbf{A} \rightarrow \mathbf{I} \rightarrow \mathbf{E} \rightarrow \mathbf{G} \rightarrow \mathbf{H} \rightarrow \mathbf{L} \quad (\approx 10\text{ Weeks})$$

- **Workstream A (Packaging):** Must establish the in-account IAM execution boundary, DynamoDB tables, and S3 state bucket.
- **Workstream I (Identity & RBAC):** Must establish the `Remediation Approver` and `Security Analyst` roles before any remediation engine can be safely built.
- **Workstream E (Runtime Streaming):** Must establish EventBridge queueing to provide live alert telemetry.
- **Workstream G (AI Forensics):** Correlates CloudTrail events with graph state to compute blast radius.
- **Workstream H (Remediation):** Requires identity sign-off, blast radius computation, and test lab validation.
- **Workstream L (Launch):** Packages the verified system for enterprise customer deployment.

### 3.2 Parallelizable Engineering Tracks
1. **Workstream B (AppSec) & C (Containers):** Can proceed completely in parallel during Sprint 3 once Workstream A provides the S3 finding storage schemas.
2. **Workstream J (Unified UX):** Starts in Sprint 2 and evolves incrementally across all sprints, integrating each workspace as its backend APIs are delivered.
3. **Workstream F (CI/CD Gatekeeper):** Can be engineered in parallel with Workstream D (Kubernetes) during Sprint 5.
