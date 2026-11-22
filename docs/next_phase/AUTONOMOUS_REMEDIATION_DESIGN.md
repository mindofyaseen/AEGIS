# AUTONOMOUS REMEDIATION & GOVERNANCE ARCHITECTURE
**Document ID:** `AEGIS-ARCH-013-REV2` (Phase 0.5 Technical Correction)  
**Domain:** Cloud Remediation, Policy Guardrails, Rollback Reality, Mode 1/2/3 Redesign  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Completely removed false claims of "atomic rollback" for distributed cloud operations; redesigned 3 remediation modes; defined strict prerequisite validation, compensation actions, production explicit allowlists, and blast-radius circuit breakers.

---

## 1. Executive Summary & Core Objective

Closing the loop between vulnerability detection and remediation is the core promise of an Autonomous DevSecOps Engineer. However, naive automated mutations in cloud environments create catastrophic operational risks.

A critical engineering truth governs this design: **AWS cloud infrastructure operations are distributed, asynchronous, and non-atomic.** Attaching an explicit deny policy or revoking an IAM session immediately terminates legitimate in-flight transactions; rolling it back does not recover dropped requests. Moving an EC2 instance to a quarantine security group abruptly severs live database and user TCP connections.

This specification details a **Safety-First, Verified Remediation Engine** built around three strictly controlled operational modes.

---

## 2. Redesigned 3-Tier Remediation Architecture

```mermaid
flowchart TD
    Finding[Security Finding Identified] --> Gate{Mode Evaluator}
    
    Gate -->|Default (100% Safe)| M1[Mode 1: Advisory & Code Gen]
    Gate -->|Standard Enterprise Action| M2[Mode 2: Human-Approved Remediation]
    Gate -->|Future Opt-In Allowlist Only| M3[Mode 3: Controlled Autonomous]

    subgraph Mode 1 Operations [Zero Cloud Mutation]
        M1 --> Patch[Generate Terraform / CloudFormation Diff]
        M1 --> CLI[Generate AWS CLI Verification Command]
        M1 --> HumanManual[Engineer Applies via GitOps CI/CD]
    end

    subgraph Mode 2 Operations [Human-in-the-Loop Approval]
        M2 --> Preflight[Execute Precondition & Dependency Check]
        Preflight --> Radius[Calculate Active Blast Radius]
        Radius --> Staged[Create Staged Change Plan / PR]
        Staged --> Prompt[Post Approval Request to Web Console & Slack]
        Prompt -->|Cryptographic Approval by Approver Role| Exec2[Execute Mutation via Scoped IAM]
        Prompt -->|Rejected| AuditReject[Log Reason to Ledger]
        Exec2 --> HealthCheck[Post-Execution Health Verification]
        HealthCheck -->|Healthy| Commit[Record Completed Transaction]
        HealthCheck -->|Unhealthy| Compensate[Execute Compensation Action & Alert P1]
    end

    subgraph Mode 3 Operations [Narrow Low-Risk Safe Allowlist]
        M3 --> CheckAllowlist{Explicit Allowlist & Non-Prod?}
        CheckAllowlist -->|No / Prod Tagged| FallbackM2[Fallback to Mode 2 Human Review]
        CheckAllowlist -->|Yes| Exec3[Apply Atomic Single-Resource Fix]
        Exec3 --> HealthCheck
    end
```

---

## 3. The 3 Remediation Modes Defined

### Mode 1: Advisory (Default Out-of-the-Box)
- **Zero AWS Mutation:** AEGIS never calls mutating AWS APIs.
- **Deliverables:** Generates precise Terraform/CloudFormation diffs, explains root cause, provides risk justification, and provides step-by-step human verification instructions.
- **Target Resources:** All resources, especially core production databases, VPC peering, Route 53 zones, and master IAM policies.

### Mode 2: Human-Approved Remediation (Enterprise Standard)
- **Workflow:**
  1. AEGIS stages the proposed change and validates preconditions (e.g. verifying that a replacement security group rule exists before deleting an old rule).
  2. Inspects affected dependencies and computes exact blast radius (e.g., "This security group modification affects 2 EC2 instances: `i-012` and `i-045`").
  3. Produces a detailed Change Plan and requires cryptographic sign-off from a user holding the **Remediation Approver** RBAC role.
  4. Executes the change via a scoped execution worker.
  5. Runs post-change validation checks. If application endpoints fail health checks, triggers a pre-defined compensation action.

### Mode 3: Controlled Autonomous Remediation (Future Opt-In Only)
- **Strictly Allowlisted Actions:** Only permitted for narrowly scoped, low-risk, idempotent, and reversible actions:
  - Enabling S3 Default Bucket Encryption (SSE-KMS or SSE-S3).
  - Enabling S3 Bucket Versioning on non-production buckets.
  - Enabling automated RDS backup retention on non-production databases.
  - Attaching AWS-managed MFA requirement to new IAM users in sandbox accounts.
- **Exclusion Boundaries:**
  - **Tag Protection:** Resources tagged `Environment=Production` or `Tier=Critical` are **strictly prohibited** from Mode 3.
  - **Account Boundary:** Production AWS accounts can disable Mode 3 entirely via policy.
  - **Blast Radius Circuit Breaker:** If an action affects $> 1$ resource, Mode 3 is aborted and downgraded to Mode 2.

---

## 4. The Fallacy of "Atomic Rollback" & Compensation Action Runbooks

In distributed cloud architectures, true database-style atomic rollbacks do not exist. AEGIS implements **Compensation Action Runbooks**:

| Remediation Mutation | Inherent Risk & Side Effects | Compensation Action (If Health Check Fails) |
| :--- | :--- | :--- |
| **Revoke SG Ingress Rule (Port 22/80)** | Closes active SSH/HTTP connections; drops traffic. | Re-authorizes original CIDR ingress rule; notifies on-call engineer. |
| **Enable S3 Public Access Block** | May break public static assets or third-party webhooks. | Re-enables public read on specific bucket policy if health probe fails. |
| **Revoke IAM Access Key** | Immediately halts automated scripts/pipelines using the key. | **Irreversible:** Once an IAM key is deleted, it cannot be recovered. Mitigation: AEGIS **deactivates** the key (`Status=Inactive`) rather than deleting it, allowing instant reactivation. |
| **Isolate Compromised EC2 Instance** | Severs all active network sessions; triggers cluster failover. | Re-attaches original security groups and resumes routing if investigation reveals false positive. |
