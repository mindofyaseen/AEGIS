# DASHBOARD INFORMATION ARCHITECTURE & UNIFIED UX CONTROL PLANE
**Document ID:** `AEGIS-ARCH-016`  
**Domain:** Frontend Architecture, Design System, Information Hierarchy, Web Console Navigation  
**Author:** Principal UI/UX Architect & Frontend Lead  
**Status:** Architecture Blueprint / Discovery Phase  

---

## 1. Executive Summary & Core Objective

The AEGIS web console is the operational command center for DevOps engineers, cloud architects, and security leads. A common pitfall of enterprise security dashboards is fragmentation—forcing users to switch between disconnected views for posture, attack paths, container scans, CI/CD gates, and AI investigations.

AEGIS solves this by establishing a **Unified Enterprise Information Architecture**. The existing 11 dedicated workspaces are retained, refined, and organized into an intuitive 4-tier operational hierarchy. The interface adheres to strict enterprise design standards: dark-first ergonomic theme, high-density data tables, sub-100ms client-side search/filtering, unified 2D/3D topology visualization, and deep contextual cross-linking.

---

## 2. Global Information Architecture Hierarchy

The console organizes all capabilities into four intuitive functional zones:

```mermaid
graph TD
    Root[AEGIS Unified Web Console] --> Z1[Zone 1: Executive & Real-Time Pulse]
    Root --> Z2[Zone 2: Infrastructure & Attack Surface Intelligence]
    Root --> Z3[Zone 3: DevSecOps Delivery & Workload Security]
    Root --> Z4[Zone 4: Operations, AI Agent & Action Center]

    Z1 --> P1[1. Executive Overview / Posture Score]
    
    Z2 --> P2[2. Infrastructure Topology (2D & 3D Three.js)]
    Z2 --> P3[3. Security Findings & CIS Benchmarks]
    Z2 --> P4[4. Attack Paths & Blast Radius Graph]

    Z3 --> P5[5. Application Security (SAST / SCA / Secrets)]
    Z3 --> P6[6. Container & Kubernetes Security (ECR / EKS)]
    Z3 --> P7[7. CI/CD Gatekeeper & Pull Request Reviews]

    Z4 --> P8[8. Cloud Incident Response & CloudTrail Forensics]
    Z4 --> P9[9. Autonomous Remediation & Action Center]
    Z4 --> P10[10. DevSecOps AI Agent Investigation Workspace]
    Z4 --> P11[11. Enterprise Governance, Policies & Audit Logs]
```

---

## 3. Detailed Workspace Navigation & Layout Specifications

### 3.1 Zone 1: Executive & Real-Time Pulse
- **Workspace 1: Executive Overview (`/`)**:
  - Global Security Posture Score (0 - 100) with 30-day delta.
  - Active Threat Counter (P0 Critical, High, Medium, Low).
  - Context Completeness Gate indicator (Timestamp, freshness, scan coverage).
  - High-level compliance radial dials (CIS AWS Foundations, SOC 2, HIPAA).

### 3.2 Zone 2: Infrastructure & Attack Surface Intelligence
- **Workspace 2: Infrastructure Topology (`/topology`)**:
  - Dual-mode visualization: 2D hierarchical Cytoscape.js canvas and interactive 3D WebGL (Three.js) graph.
  - Resource filtering by VPC, Subnet, Service type, and Security Group.
  - Direct selection opens resource inspector panel displaying raw configuration, assigned IAM roles, and connected attack vectors.
- **Workspace 3: Security Findings (`/findings`)**:
  - High-density virtualized table supporting instant multi-column filtering.
  - Categorized by CIS benchmark, severity, and resource ARN.
  - Finding detail drawer with technical root cause, CVE references, and remediation guidance.
- **Workspace 4: Attack Paths & Blast Radius (`/attack-paths`)**:
  - Visual traversal path from internet ingress to crown jewel assets.
  - Step-by-step exploit chain explanation with probability score.
  - "Simulate Patch" button previewing path collapse upon closing a security group or revoking an IAM policy.

### 3.3 Zone 3: DevSecOps Delivery & Workload Security
- **Workspace 5: Application Security (`/appsec`)**:
  - SAST, SCA, and hardcoded secret findings from repository scans.
  - Software Bill of Materials (SBOM) component browser with dependency tree.
- **Workspace 6: Container & Kubernetes (`/containers`)**:
  - Amazon ECR image repository scanner with layer-by-layer CVE breakdown.
  - Amazon EKS cluster posture, Pod Security Standard violations, and dangerous RBAC role bindings.
- **Workspace 7: CI/CD Gatekeeper (`/cicd`)**:
  - Real-time stream of GitHub Actions / GitLab CI pipeline evaluations.
  - Terraform plan JSON and CloudFormation diff security verdicts (PASS/WARN/BLOCK).

### 3.4 Zone 4: Operations, AI Agent & Action Center
- **Workspace 8: Incident Response & Forensics (`/incident-response`)**:
  - CloudTrail chronological event visualizer with anomaly highlighting.
  - Compromised entity blast radius visualizer.
  - Emergency containment one-click trigger.
- **Workspace 9: Autonomous Remediation (`/remediation`)**:
  - Mode 1, Mode 2, and Mode 3 pending action queues.
  - Diff visualizer for IaC pull requests and AWS CLI mutations.
  - Transaction history with rollback execution triggers.
- **Workspace 10: DevSecOps AI Agent (`/agent`)**:
  - Conversational natural language interface backed by Amazon Bedrock Claude 3.5 Sonnet.
  - Streaming execution trace showing active tool calls, graph lookups, and deterministic verification gates.
- **Workspace 11: Enterprise Governance & Settings (`/settings`)**:
  - Multi-account AWS connection manager (STS AssumeRole configurations).
  - RBAC user management and SAML/Cognito SSO settings.
  - Immutable audit ledger browser and KMS key configurations.

---

## 4. Design System & Frontend Engineering Standards

1. **Enterprise Dark Theme Palette**:
   - Background Canvas: Slate Dark `#090d16`
   - Card / Surface: Deep Slate `#0f172a`
   - Borders: Subtle Slate `#1e293b`
   - Primary Accent: Cyber Indigo `#6366f1`
   - Critical Alert: Crimson `#ef4444`
   - Warning: Amber `#f59e0b`
   - Safe / Healthy: Emerald `#10b981`
2. **Performance Latency Budgets**:
   - Initial Page Load: $< 1.2\text{ seconds}$ (Gzipped bundles $< 350\text{ KB}$).
   - Topology Canvas Rendering (500 nodes): $< 300\text{ ms}$.
   - Table Filtering & Sorting (1,000 findings): $< 50\text{ ms}$ (Client-side WebWorker).
3. **Accessibility (WCAG 2.1 AA Compliance)**:
   - Minimum 4.5:1 contrast ratio for all textual elements.
   - Full keyboard navigation support (Tab order, arrow navigation in tables, `Cmd+K` global search shortcut).
