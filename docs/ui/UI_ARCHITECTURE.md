# AEGIS Frontend Architecture & Design System Specification
## Enterprise Cloud Security Operations & Infrastructure Intelligence

**Product:** AEGIS — AI-Native Autonomous Cloud Security Platform  
**Target:** AWS Builder Center Hackathon & Production SecOps  
**Technology Stack:** React 18 · TypeScript 5.7 · Tailwind CSS 3.4 · Three.js (WebGL) · Lucide React · FastAPI  
**Author:** Principal UI/UX & Frontend Engineer  
**Date:** November 2026  

---

### 1. Executive Summary & Design System Identity
The AEGIS frontend has been completely redesigned from a flat demo dashboard into an **executive-grade Cloud Security Operations and Infrastructure Intelligence platform**. Built with an **Obsidian Dark** design system, the interface balances high-density security observability with intuitive 3D spatial exploration.

```text
Visual Palette Hierarchy:
├── Primary Canvas: #090D15 (Obsidian Black)
├── Secondary Canvas: #0E1520 (Deep Navy Foundation)
├── Panel Container: #121C29 (Subtle Elevation)
├── Elevated Surface: #172335 (Interactive Cards)
├── Technical Borders: #263549 & #354863
├── Typography:
│   ├── Primary Text: #EFF5FF (High Contrast)
│   ├── Secondary Text: #91A2B9 (Muted Slate)
│   ├── Monospace Identifiers: JetBrains Mono / Fira Code
└── Semantic Security Signals:
    ├── Critical Violation: #F06E77 (Crimson Neon)
    ├── Parameter Warning: #EBAE58 (Amber Alert)
    ├── Verified Compliant: #36C995 (Emerald Green)
    ├── Target Crown Jewel: #A98BFF (AI Violet)
    └── Technical Ingress: #53C8DE & #4E9EFF (Cyan / Blue)
```

---

### 2. Multi-Page Enterprise Information Architecture (11 Pages)

The application provides 11 dedicated, production-grade workspaces:

1. **Executive Overview / Security Command Center (`PageOverview.tsx`):**
   - Ternary legal verdict banner (`BLOCK`, `INSUFFICIENT_CONTEXT`, `READY_FOR_HUMAN_REVIEW`).
   - Context Completeness Gate progress meter.
   - High-density KPI metrics (Discovered Assets, Critical Violations, Attack Paths, Remediation Plans).
   - Live interactive 3D WebGL spatial canvas.
   - Priority Investigation Queue with instant drilldowns.
   - Autonomous agent execution timeline feed.

2. **Infrastructure Explorer (`PageExplorer.tsx`):**
   - 3D Spatial WebGL vs. 2D Schematic Graph view modes.
   - Split-layout inspector with 6 dedicated tabs:
     - *Overview:* AWS Resource types, VPC IDs, Subnet CIDRs, and asset status.
     - *Networking:* Public/Private IPv4, Security Group ingress/egress boundaries.
     - *Identity:* IAM instance profiles, attached roles, and wildcard permission audits.
     - *Security:* Direct rule violations impacting the selected asset.
     - *Relationships:* Inbound dependencies and outbound access links.
     - *Evidence:* Telemetry collector provenance, API call traces, and confidence scores.

3. **Security Findings Workspace (`PageFindings.tsx`):**
   - Full-text search and multi-level severity filtering (`CRITICAL`, `HIGH`, `MEDIUM`, `ALL`).
   - Regulatory standard mapping tags (CIS AWS Benchmark v3.0, SOC 2 Type II, PCI-DSS v4.0, NIST SP 800-53).
   - Technical root cause explanations and recommended Rule 14 fixes.

4. **Attack Path Intelligence (`PageAttackPaths.tsx`):**
   - Multi-hop lateral movement visualization (Hop 1 $\to$ Hop 2 $\to$ Hop 3 $\to$ Crown Jewel).
   - Blast radius assessment for compromised IAM administrator roles.
   - Hop-by-hop verification showing fully evidenced graph relationships.

5. **Change Intelligence (`PageChangeIntel.tsx`):**
   - Pre-deployment AST static analysis for AWS CloudFormation, AWS CDK, and Terraform plans.
   - Built-in sample switcher demonstrating real-time AST parsing of open ingress and wildcard IAM roles.
   - Side-by-side editor and live AST violation reports.

6. **Incident Investigation (`PageInvestigation.tsx`):**
   - Real-time CloudTrail management event timeline.
   - Suspicious actor filtering (`is_suspicious` flags).
   - Correlation between CloudTrail events, source IPs, and mutated infrastructure assets.

7. **Remediation Workspace (`PageRemediation.tsx`):**
   - Rule 14 minimal unified diff `.patch` viewer with one-click clipboard copy.
   - AWS CLI dry-run repair commands.
   - Tested rollback plans preserving the zero-mutation boundary.
   - Human verification checklist.
   - Automated GitHub Pull Request synthesizer (generating branch names, conventional commits, and formatted PR review markdown).

8. **Agent Command Center (`PageAgentConsole.tsx`):**
   - Structured AI investigator execution console.
   - Real-time autonomous pipeline stage tracking (Discovery $\to$ Context Gate $\to$ Graph Mapping $\to$ Attack Path BFS $\to$ Verdict Arbitration $\to$ Remediation Synthesis).
   - Live console log stream with interactive directive input demonstrating automated prompt-injection refusal.

9. **Agent Governance & Security (`PageGovernance.tsx`):**
   - 15 Deterministic Governance Rules interactive matrix.
   - 5-Layer Defense Architecture breakdown (Scoped IAM, Action Groups, Context Gate, LLM Quarantine, Rule 14 Confirmation).
   - AWS Bedrock Guardrails specification viewer (`boto3 create_guardrail` JSON payload).

10. **Adversarial Testing Laboratory (`PageAdversarialLab.tsx`):**
    - 14 automated adversarial attack test vectors (Direct injection, comment injection, tag poisoning, log tampering, secrets extraction, mutation attempts, false-safe manipulation).
    - Detailed attack vectors, expected reactions, and verified defense mechanisms.
    - 100% boundary gate pass confirmation (14 / 14 passed).

11. **Regulatory Compliance & Audit (`PageComplianceAudit.tsx`):**
    - Real-time compliance scorecards for CIS AWS Foundations Benchmark v3.0, SOC 2 Type II, PCI-DSS v4.0, and NIST SP 800-53.
    - Total controls, passed controls, failed controls, and non-compliant control breakdowns.
    - Downloadable JSON audit report generation.

---

### 3. Interactive 3D Spatial Canvas Architecture (`InfrastructureScene3D.tsx`)
- **Rendering Engine:** Three.js WebGL with `OrbitControls`.
- **Spatial Topology Containers:**
  - VPC bounding grid surface (`#121C29`) with perspective fog.
  - Subnet zones (Public DMZ plane with amber/crimson perimeter; Private Subnet plane).
  - Compute nodes (Hexagonal EC2 prisms with real-time rotation and status emissive shaders).
  - Storage & Database canisters (Cylinders for S3 and RDS).
  - Diamond Octahedrons for Network Gateways.
  - Animated 3D Quadratic Bezier Curves tracing network paths with pulsing neon crimson particles for active attack paths.
- **Interactivity:**
  - Raycaster hover tooltips with asset metadata.
  - Click-to-inspect opening the deep resource drawer.
  - Camera orbit, pan, zoom, and layer filtering (Compute, Network, Storage, IAM).
  - Automated WebGL capability detection with clean fallback.

---

### 4. Technical Constraints & Verification
- **Build Status:** Vite v6.4.6 compiled with **0 errors** (1606 modules transformed in 7.33s).
- **Backend Test Status:** **89 / 89 Python tests passing in 6.28s**.
- **Spend:** **$0.00** spent of $200 credits.
- **Cloud Boundary:** Strict read-only AWS (`237657481511` / `us-east-1`).
