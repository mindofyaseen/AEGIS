# AEGIS — Application Security (AppSec) Architecture
## SAST, SCA, Secrets Detection, SBOM & Dependency Vulnerability Intelligence

**Document Version:** 3.0-PHASE-0  
**Status:** AppSec Architecture Specification  

---

## 1. AppSec Capability Scope

AEGIS expands beyond cloud infrastructure posture to secure the **applications running on that infrastructure**.

```
+-----------------------------------------------------------------------------------+
|                        AEGIS APPSEC ANALYSIS PIPELINE                             |
|                                                                                   |
|  [ Customer Authorized Repository / Build Artifact ]                              |
|                          │                                                        |
|        ┌─────────────────┼─────────────────┬─────────────────┐                    |
|        ▼                 ▼                 ▼                 ▼                    |
|  +-----------+     +-----------+     +-----------+     +-----------+              |
|  |   SAST    |     |    SCA    |     |  SECRETS  |     |   SBOM    |              |
|  | (Semgrep) |     |  (Grype)  |     | (Gitleaks)|     |  (Syft)   |              |
|  +-----------+     +-----------+     +-----------+     +-----------+              |
|        │                 │                 │                 │                    |
|        └─────────────────┼─────────────────┴─────────────────┘                    |
|                          ▼                                                        |
|  +-----------------------------------------------------------------------------+  |
|  | APPSEC NORMALIZATION & EVIDENCE SCHEMAS (Pydantic Strict Models)            |  |
|  | - CWE Mapping (CWE-89 SQLi, CWE-79 XSS, CWE-918 SSRF, CWE-798 Hardcoded)   |  |
|  | - CVSS v3.1 Base & Temporal Score Calculation                               |  |
|  | - Line-number accurate AST code snippet & remediation diff                  |  |
|  +-----------------------------------------------------------------------------+  |
|                          │                                                        |
|                          ▼                                                        |
|  +-----------------------------------------------------------------------------+  |
|  | KNOWLEDGE GRAPH FUSION: Attaching AppSec Findings to Deployed Compute Nodes |  |
|  | (e.g. EC2: i-bastion --[RUNS_CODE]--> Repo: payment-api [HAS_CVE-2024-XXXX])|  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Open-Source Engine Selection & Licensing

| Domain | Selected Open-Source Tool | License | Commercial Compatibility | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **SAST** | **Semgrep (CLI Engine)** | LGPL-2.1 / Commercial Dual | Compatible (Invoked via CLI subprocess; zero code linkage). | Fast AST pattern matching; support for Python, TS/JS, Go, Java, Terraform. |
| **SCA** | **Grype (Anchore)** | Apache-2.0 | **100% Permissive Commercial Use**. | Fast vulnerability scanner matching against OSV, NVD, and GitHub Advisory DB. |
| **SBOM** | **Syft (Anchore)** | Apache-2.0 | **100% Permissive Commercial Use**. | Generates SPDX and CycloneDX SBOMs from source and container artifacts. |
| **Secrets** | **Gitleaks** | MIT | **100% Permissive Commercial Use**. | High-precision regex engine with entropy validation for catching AWS keys, tokens, and certs. |
| **DAST** | **Nuclei (ProjectDiscovery)** | MIT | **100% Permissive Commercial Use**. | Fast, template-based dynamic API endpoint vulnerability scanner for staging environments. |

---

## 3. Zero-Persistence Ephemeral Execution Guarantee

Customer source code represents critical intellectual property. AEGIS guarantees:
1. **In-Memory / Tempfs Processing:** Repositories are cloned ephemerally to `/tmp` in the customer-owned container or Lambda memory.
2. **Immediate Destruction:** Source files are wiped immediately upon scan completion.
3. **Zero Transmission:** Source code files are **never** transmitted to Amazon Bedrock or external endpoints. Only the sanitized finding metadata (Rule ID, file path, line number, CWE title) is processed for PR comments.
