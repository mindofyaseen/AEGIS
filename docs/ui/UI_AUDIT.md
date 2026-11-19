# AEGIS Frontend Architecture & UI/UX Audit
## Stage 0 Engineering Baseline Assessment

**Platform:** AEGIS — AI-Native Autonomous Cloud Security & DevSecOps Platform  
**Target:** AWS Builder Center Hackathon & Enterprise Cloud SecOps  
**Author:** Principal UI/UX & Frontend Engineer  
**Date:** November 2026  

---

### 1. Executive Assessment & Current State
The existing AEGIS frontend (`apps/web`) is built with React 18, TypeScript, Tailwind CSS, and Lucide React icons. It provides a functional demonstration of core security concepts:
- A top navigation bar with 4 tabs (`investigation`, `forensics`, `adversarial`, `rules`).
- A `VerdictHero` showing the ternary verdict (`BLOCK`, `INSUFFICIENT_CONTEXT`, `READY_FOR_HUMAN_REVIEW`) and context completeness score.
- A 2D SVG node/edge `TopologyMap` displaying fixed hardcoded nodes for the scenario.
- A basic `FindingsList` and `RemediationDrawer`.
- A `CloudTrailTimeline` forensics list.
- An `AdversarialMatrix` showing 14 tests.

### 2. Identified Deficiencies & Architectural Gaps
1. **Shallow Information Architecture:** The entire app runs as a single-page view with 4 basic tabs. It lacks dedicated, deep workspaces for Infrastructure Exploration, Change Intelligence (Terraform/CloudFormation diffs), Attack Path Intelligence, Agent Command Center, Governance Matrix, and Regulatory Compliance Scorecards (CIS/SOC 2).
2. **Missing 3D Spatial Exploration:** The current topology map is a static 2D SVG schematic with fixed coordinate offsets. It lacks real 3D spatial infrastructure exploration (VPC spatial bounding containers, Subnet zones, compute/storage nodes, orbit controls, camera fly-to, 3D attack path highlighting).
3. **Generic Aesthetic:** High reliance on saturated cyber neon colors without the refined, art-directed palette expected of modern enterprise cybersecurity suites (Palantir Foundry, Wiz, CrowdStrike Falcon).
4. **Under-Exposed Backend Capabilities:** The backend exposes 15+ rich endpoints (`/api/v1/compliance/report`, `/api/v1/analyze/cloudformation`, `/api/phase2/multi-account`, `/api/v1/bedrock/guardrails-spec`, `/api/phase2/generate-pr`), but the frontend barely exposes half of them.
5. **No Evidence Provenance Explorer:** Users cannot trace a finding back to raw collector telemetry, API call traces, or rule evaluation ASTs.

---

### 3. Backend API & Frontend Mapping Matrix

| Backend API Endpoint | HTTP Method | Data Contract | Current UI Exposure | Target Redesigned Page |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | GET | `mode, account, region, credit_balance` | Partial (Footer) | TopCommandBar & Overview |
| `/api/rules` | GET | `count, rules_document` | Modal only | Page 9: Agent Governance & Rules |
| `/api/scenarios` | GET | `scenarios: Scenario[]` | Dropdown in Hero | Global Scenario Switcher & All Pages |
| `/api/investigate/scenario/{id}` | POST | `InvestigationReport` | Verdict Hero & List | Global State, Pages 1-4, 7-8 |
| `/api/graph/elements` | GET | Cytoscape elements JSON | Not used (SVG fallback) | Page 2 & 4: 3D/2D Infrastructure Explorer |
| `/api/cloudtrail/timeline` | GET | `TimelineEvent[]` | Basic list | Page 6: Incident Investigation |
| `/api/adversarial/tests` | GET | `AdversarialTest[]` | Basic cards | Page 10: Adversarial Testing Lab |
| `/api/phase2/multi-account` | GET | Multi-account topology JSON | Unexposed | Page 1 & 2: Multi-Account Selector |
| `/api/phase2/correlate-threats`| POST | `RuntimeThreatEvent[]` | Unexposed | Page 3 & 4: Threat Correlator |
| `/api/phase2/generate-pr` | POST | `RemediationPullRequest` | Button in Drawer | Page 7: Remediation & Git PR Workspace |
| `/api/v1/analyze/cloudformation`| POST | `findings: SecurityFinding[]` | Unexposed | Page 5: Change Intelligence (IaC Guard) |
| `/api/v1/compliance/report` | GET | `FullComplianceReport` | Unexposed | Page 11: CIS v3.0 & SOC 2 Compliance |
| `/api/v1/integrations/github/comment` | POST | `comment_markdown` | Unexposed | Page 5 & 7: GitHub PR Bot Inspector |
| `/api/v1/integrations/webhook/payload` | POST | Slack & Discord JSON | Unexposed | Page 8: SecOps Webhook Dispatcher |
| `/api/v1/bedrock/guardrails-spec` | GET | Boto3 & CFN Guardrail JSON | Unexposed | Page 9: Bedrock Guardrails Viewer |

---

### 4. Target Design System Specifications
- **Base Canvas:** Deep Obsidian (`#090D15`), secondary canvas (`#0E1520`).
- **Panels & Containers:** Deep Navy (`#121C29`), elevated panel (`#172335`), technical border (`#263549`).
- **Typography:** Technical sans-serif UI typography with high-density tabular monospace for ARNs, IPs, hashes, and resource IDs.
- **Accents & Security Badging:**
  - Technical Blue (`#4E9EFF`) & Cyan (`#53C8DE`)
  - AI Intelligence Violet (`#A98BFF`)
  - Verified Compliant Green (`#36C995`)
  - Risk Warning Amber (`#EBAE58`)
  - Perimeter Breach Crimson (`#F06E77`)
- **Interactive 3D Engine:** Three.js with OrbitControls, directional lighting, spatial bounding volumes for VPC/Subnets, instanced resource geometry, animated attack path curves with pulse particles, camera tweening, and WebGL fallbacks.

---

### 5. Multi-Page Enterprise Information Architecture (11 Pages)
1. **Executive Overview / Security Command Center**
2. **Infrastructure Explorer** (Interactive 3D + 2D Cytoscape with Split Inspector)
3. **Security Findings Workspace** (Deep filters, evidence explorer, severity breakdown)
4. **Attack Path Intelligence** (Multi-hop lateral movement traversal, entry-to-asset blast radius)
5. **Change Intelligence** (Terraform AST & CloudFormation/CDK analyzer with diff viewer)
6. **Incident Investigation** (CloudTrail event forensics & timeline correlation)
7. **Remediation Workspace** (Rule 14 unified `.patch` diff, rollback plans, GitHub PR synthesis)
8. **Agent Command Center** (Bedrock AgentCore trace log, tool call timeline, evidence grounding)
9. **Agent Governance & Security** (15 deterministic rules, IAM boundaries, Bedrock Guardrail spec)
10. **Adversarial Testing Laboratory** (14 automated attack vectors, prompt injection breakdowns)
11. **Reports & Compliance Audit** (CIS AWS Foundations Benchmark v3.0, SOC 2 Type II, export)
