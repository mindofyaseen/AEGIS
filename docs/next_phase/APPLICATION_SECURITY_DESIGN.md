# APPLICATION SECURITY & SCANNER ISOLATION ARCHITECTURE
**Document ID:** `AEGIS-ARCH-007-REV2` (Phase 0.5 Technical Correction)  
**Domain:** Application Security (SAST, SCA, Secrets, SBOM), Workload Sandboxing, Open-Source Licensing  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Replaced naive Lambda `/tmp` execution with hybrid Lambda / Ephemeral ECS Fargate sandboxing; addressed Lambda execution & memory limits; defined untrusted source code isolation; resolved Semgrep LGPL compliance boundaries.

---

## 1. Executive Summary & Core Objective

Integrating Application Security (SAST, SCA, Secret Scanning, and SBOM) into AEGIS provides software supply chain visibility. However, executing third-party security scanners across enterprise repositories introduces three major technical challenges:
1. **Compute & Memory Limits:** Large monorepositories, deep git commit histories, and container image extractions routinely exceed AWS Lambda execution limits (15 minutes, 10 GB ephemeral `/tmp` storage, 10 GB RAM).
2. **Untrusted Code Sandboxing & Residual State:** AWS Lambda execution environments are frequently reused across invocations ("warm starts"). Overwriting files in `/tmp` does not guarantee memory sanitization or process isolation when inspecting untrusted external codebases.
3. **Open-Source License Obligations:** Running LGPL-licensed tools (such as Semgrep Core) requires strict copyright boundary enforcement to protect proprietary platform intellectual property.

This specification details a **Hybrid Ephemeral Execution Architecture** balancing lightweight Lambda tasks with isolated, single-use Amazon ECS Fargate container tasks.

---

## 2. Hybrid Scanner Execution Model: Lambda vs Ephemeral Fargate

```mermaid
flowchart TD
    ScanReq[Scan Trigger: CI/CD PR or Repository Scan] --> Router{Workload Classifier}
    
    Router -->|Lightweight / Fast Scan| LambdaWorker[AWS Lambda Scanner Worker]
    Router -->|Heavy Repo / Container / Monorepo| FargateWorker[Amazon ECS Fargate Ephemeral Task]

    subgraph AWS Lambda Scope [Low Overhead / < 200 MB]
        LambdaWorker --> Gitleaks[Gitleaks: Secret Scans]
        LambdaWorker --> QuickSAST[Semgrep: Targeted PR Diff Scan]
    end

    subgraph Isolated ECS Fargate Task [Strict Isolation / Dedicated Root Volume]
        FargateWorker --> DeepSAST[Semgrep: Full Monorepo Scan]
        FargateWorker --> SyftGrype[Syft & Grype: Full SBOM & Deep Dependency Tree]
        FargateWorker --> Trivy[Trivy: Large Container Layer Tarball Extraction]
    end

    LambdaWorker --> S3Report[(S3 Scan Report Storage)]
    FargateWorker --> S3Report
    FargateWorker -.->|Task Self-Terminates (Zero Reuse)| Terminate[Destroy Container & Volume]
```

### 2.1 Workload Placement Matrix

| Scanner Engine | Typical Workload | Recommended Hosting | Rationale |
| :--- | :--- | :--- | :--- |
| **Gitleaks (MIT)** | Git diffs, staged commits, secret entropy | **AWS Lambda** | Fast (<10s), low memory (<128MB), no heavy external databases. |
| **Semgrep PR Diff (LGPL 2.1)** | Small-to-medium repository diffs ($< 500$ files) | **AWS Lambda** | Finishes in 30-90 seconds within standard Lambda limits. |
| **Semgrep Full Audit (LGPL 2.1)** | Enterprise monorepositories ($> 5,000$ files) | **Amazon ECS Fargate** | Requires 4-8 GB RAM, $> 15\text{ min}$ timeout, high CPU for AST parsing. |
| **Syft & Grype (Apache 2.0)** | Deep SBOM generation and dependency vulnerability matching | **Amazon ECS Fargate** | Vulnerability database sync requires 1-2 GB disk cache; Fargate avoids cold-start DB downloads. |
| **Trivy Image Scan (Apache 2.0)** | Multi-gigabyte container image layer extraction | **Amazon ECS Fargate** | Ephemeral 20 GB root volume; handles heavy uncompressed Docker layers. |

---

## 3. Untrusted Code Sandboxing & Zero Environment Residue

When analyzing customer or open-source repositories:
1. **Zero Environment Reuse (Fargate):** ECS Fargate tasks run with `stopTimeout` set to zero and task definition `essential: true`. The container instance and its ephemeral NVMe storage are destroyed immediately upon task completion by the AWS Fargate microVM hypervisor (Firecracker). No data persists across scans.
2. **No Arbitrary Code Execution:** Scanners parse code strictly as static text and ASTs. AEGIS **never executes customer build scripts** (e.g., `npm install`, `mvn compile`, `make`, `setup.py`) inside the scanner environment. This eliminates remote code execution (RCE) vectors from malicious dependencies.
3. **Restricted Egress Network Security:** Scanner Fargate tasks run in a private subnet with an egress security group that permits HTTPS traffic only to verified vulnerability databases and git repositories, blocking arbitrary outbound connections.

---

## 4. Open-Source Licensing & The Semgrep LGPL 2.1 Boundary

Semgrep CLI core is licensed under the **GNU Lesser General Public License v2.1 (LGPL 2.1)**.

### Architectural Compliance Guarantees:
1. **Strict Process Boundary (No Dynamic/Static Linking):** AEGIS **never** imports Semgrep as a Python library (`import semgrep` is prohibited). Semgrep runs as a standalone binary inside an isolated container.
2. **Standard Inter-Process Communication:** Data exchange occurs strictly across standard OS pipes (`stdout` / `stdin`) using serialized JSON output.
3. **Unmodified Upstream Binary:** AEGIS uses official pre-built Semgrep binary releases without modifications. If any modifications are ever made to Semgrep core, the source code of those modifications must be made available under LGPL 2.1 in accordance with Section 2 of the license.
4. **Community Rule Registry:** AEGIS utilizes open-source Semgrep Community Rules (Apache 2.0 / MIT), avoiding proprietary Semgrep Pro licensing entanglements.
