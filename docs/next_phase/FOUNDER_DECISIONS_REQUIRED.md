# FOUNDER & EXECUTIVE ARCHITECTURAL DECISIONS REQUIRED
**Document ID:** `AEGIS-ARCH-029`  
**Domain:** Executive Governance, Architecture Decision Sign-Offs, Strategic Choices  
**Status:** Architecture Blueprint / Phase 0.5 Deliverable  

---

## 1. Executive Summary & Purpose

Phase 0.5 has eliminated all technical inaccuracies and established an internally consistent engineering blueprint. 

Before engineering implementation commences in Phase 1, the founder and executive engineering leadership must formally review and sign off on five strategic architectural decisions.

---

## 2. The 5 Strategic Founder Decisions

### Decision 1: Autonomous Remediation (Mode 3) Release Timeline
- **The Issue:** Should Mode 3 (Autonomous Self-Healing) be included in the initial customer deployment package, or deferred to Phase 2?
- **Option A (Recommended):** Defer Mode 3 to Phase 2. Launch initial customer packaging with **Mode 1 (Advisory)** as default and **Mode 2 (Human-Approved)** for high-confidence operational fixes. This maximizes enterprise CISO trust and minimizes operational liability.
- **Option B:** Ship Mode 3 in Phase 1, strictly locked down behind an explicit platform administrator opt-in flag and non-production account boundary.
- **Founder Decision Required:** `[ ] Approve Option A` / `[ ] Approve Option B`.

---

### Decision 2: In-Account Bedrock Foundation Model Selection
- **The Issue:** Which Amazon Bedrock foundation model should be pinned as the primary reasoning engine for investigations?
- **Option A (Recommended):** **Anthropic Claude 3.5 Sonnet v2** (`anthropic.claude-3-5-sonnet-20241022-v2:0`). Delivers state-of-the-art code generation, complex attack path reasoning, and precise JSON output ($0.003/1k input, $0.015/1k output).
- **Option B:** **Anthropic Claude 3.5 Haiku** (`anthropic.claude-3-5-haiku-20241022-v1:0`). 3x cheaper and faster, suitable for high-volume classification, but less capable of multi-step IaC remediation generation.
- **Option C:** **Hybrid Dispatch:** Haiku for fast triage and finding summarization; Sonnet for deep attack path investigations and remediation planning.
- **Founder Decision Required:** `[ ] Approve Option A` / `[ ] Approve Option B` / `[ ] Approve Option C`.

---

### Decision 3: S3 Object Lock Retention Default for Forensic Evidence
- **The Issue:** S3 Object Lock Compliance Mode cannot be deleted by any user (including account root), risking permanent storage costs for customers if misconfigured.
- **Option A (Recommended):** Deploy **S3 Object Lock in Governance Mode** with a default 90-day retention period. Provides strong tamper-evidence against accidental deletion while allowing authorized administrators (`s3:BypassGovernanceRetention`) to manage lifecycle. Offer Compliance Mode as an opt-in toggle for regulated banking/healthcare customers.
- **Option B:** Enforce Compliance Mode by default for 365 days.
- **Founder Decision Required:** `[ ] Approve Option A` / `[ ] Approve Option B`.

---

### Decision 4: Customer Identity Default: Cognito vs IAM Identity Center
- **The Issue:** What authentication provider should be provisioned out-of-the-box in the customer CloudFormation stack?
- **Option A (Recommended):** **Amazon Cognito User Pool by default**. Works out-of-the-box in any standalone AWS account with zero external organizational dependencies; easily federates with customer Okta, Azure AD, or Google Workspace via SAML/OIDC.
- **Option B:** **AWS IAM Identity Center (AWS SSO) only**. Excellent for enterprise AWS Organizations, but fails to deploy in standalone AWS accounts where AWS Organizations is not configured.
- **Founder Decision Required:** `[ ] Approve Option A` / `[ ] Approve Option B`.

---

### Decision 5: Disposable Test Lab Execution Authorization
- **The Issue:** Authorization to execute the disposable AWS testbed validation suite within the planned $10.00 experimental budget.
- **The Plan:** Deploy a single isolated VPC in `us-east-1` with 1x `t4g.nano` EC2, 1x unencrypted S3 bucket, 1x `db.t4g.micro` RDS, and 1x test IAM role for a 4-hour test session (total cost $< \$0.25$), followed by automated destruction via `testlab_destroy.py`.
- **Founder Decision Required:** `[ ] Authorize Test Lab Execution` / `[ ] Require Local Mocks Only`.
