# OPEN-SOURCE SOFTWARE & THIRD-PARTY LICENSE AUDIT
**Document ID:** `AEGIS-ARCH-019`  
**Domain:** Intellectual Property, Open-Source Compliance, License Compatibility, Supply Chain Risk  
**Author:** Principal Software Architect & Legal Compliance Lead  
**Status:** Architecture Blueprint / Discovery Phase  

---

## 1. Executive Summary & Core Objective

Enterprise adoption requires complete legal and intellectual property (IP) cleanliness. When deploying software into customer environments or redistributing enterprise tooling, open-source software (OSS) licenses must be rigorously vetted to prevent **copyleft contamination** (such as GPL/AGPL copyleft clauses forcing the disclosure of proprietary source code).

This audit reviews the licensing framework of the AEGIS core repository, evaluates all planned third-party security scanners, verifies dependency hygiene, and establishes strict architectural isolation boundaries for CLI subprocess tools.

---

## 2. Core Repository License: Apache 2.0 / MIT Compatibility

AEGIS is licensed under the **Apache License, Version 2.0**.
- **Commercial Use**: Permitted without restriction.
- **Modification & Distribution**: Permitted without restriction.
- **Patent Rights**: Express grant of patent rights from contributors to users.
- **Trademark Rights**: Explicitly reserves trademark rights (AEGIS brand protection).
- **Warranty**: Disclaimed; software provided "AS IS".

---

## 3. Security Scanner License Evaluation Matrix

AEGIS integrates best-in-class security scanners. The table below evaluates each tool's license, commercial compatibility, and architectural isolation strategy:

| Tool | Capability | Upstream License | Commercial Use Permitted? | Copyleft Risk? | Integration Architectural Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NetworkX** | Graph Engine | BSD 3-Clause | Yes | None | Embedded Python Dependency |
| **Cytoscape.js** | 2D Graph Visualizer | MIT | Yes | None | Bundled Frontend NPM Package |
| **Three.js** | 3D WebGL Graph | MIT | Yes | None | Bundled Frontend NPM Package |
| **Gitleaks** | Secret Detection | MIT | Yes | None | Ephemeral CLI Subprocess / Docker Container |
| **Trivy** | Container / Vuln Scanner | Apache 2.0 | Yes | None | Ephemeral CLI Subprocess / Container Job |
| **Syft / Grype** | SBOM & SCA Scanner | Apache 2.0 | Yes | None | Ephemeral CLI Subprocess / Container Job |
| **Kubescape** | K8s Security Posture | Apache 2.0 | Yes | None | Ephemeral CLI Subprocess / Container Job |
| **kube-bench** | CIS K8s Benchmark | Apache 2.0 | Yes | None | Ephemeral Kubernetes Batch Job |
| **Semgrep** | Static AppSec (SAST) | LGPL 2.1 (CLI Core) | Yes (with isolation) | **Weak Copyleft** | **Isolated Subprocess Execution (See Section 4)** |

---

## 4. Copyleft Contamination Defense: The Semgrep LGPL 2.1 Boundary

The Semgrep command-line engine is licensed under the **GNU Lesser General Public License v2.1 (LGPL 2.1)**. 

### Legal Risk:
Directly statically linking or importing LGPL code into proprietary Python modules can potentially create derivative works under copyright law, risking copyleft claims.

### AEGIS Architectural Isolation (ADR-006):
1. **Subprocess Separation Boundary**: AEGIS **never** imports Semgrep as a Python library (`import semgrep` is prohibited).
2. **Independent Process Execution**: Semgrep is installed as an external binary executable. AEGIS invokes it strictly via standard operating system subprocess calls (`subprocess.run(["semgrep", "scan", ...])`).
3. **Piped JSON Communication**: Communication occurs exclusively across the OS process boundary using standard Unix pipes (`stdout` / `stdin`) and serialized JSON documents. Under established legal and FSF precedent, running an LGPL binary as an independent external subprocess communicating via standard data streams does not constitute a derivative work.
4. **Community Rule Registry**: AEGIS utilizes open-source Semgrep Community Rules (Apache 2.0 / MIT), avoiding proprietary Semgrep Pro rule licensing entanglements.

---

## 5. Python & NPM Dependency Tree Hygiene

All direct dependencies in `requirements.txt` and `package.json` are governed by permissive licenses:
- **FastAPI / Starlette / Uvicorn**: MIT / BSD
- **Pydantic**: MIT
- **Boto3 / Botocore**: Apache 2.0
- **React / React-DOM**: MIT
- **Lucide-React**: MIT
- **Tailwind CSS**: MIT
- **Pytest**: MIT

**Audit Conclusion:** Zero GPL, AGPL, or restrictive commercial components exist in the AEGIS codebase or core dependency tree. AEGIS is 100% compliant and enterprise-safe.
