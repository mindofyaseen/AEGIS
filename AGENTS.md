# AEGIS Engineering & Architectural Invariants

## 1. Platform Identity & Scope Lock
- **Product:** AEGIS — Customer-Deployable Autonomous AI DevSecOps Engineer for AWS.
- **Strict AWS Focus:** All collectors, policies, topology models, and remediation runbooks target AWS infrastructure only (`us-east-1`, etc.).
- **Strict Out-of-Scope:** Prohibit implementing Azure, GCP, hybrid cloud, or on-premises features. Never introduce multi-cloud selector dropdowns or fake future cloud provider UI elements.
- **Target Audience:** Existing customer AWS accounts. Do not build an arbitrary new infrastructure provisioning tool.

## 2. Forensic Honesty & Verification Standards
- **Anti-Hallucination Standard:** Never assume or state that a feature is functional without verifying the actual source code and automated tests.
- **Capability Maturity Tiers:** When reporting implementation status, always classify features into:
  1. `IMPLEMENTED_AND_VERIFIED`: Code exists and passes automated unit/integration tests.
  2. `IMPLEMENTED_BUT_NOT_LIVE_VERIFIED`: Code exists but lacks live AWS or mock fixture test validation.
  3. `MOCKED_OR_FIXTURE_BASED`: Uses static fixtures or mock payloads (e.g. Security Hub ASFF ingester).
  4. `PARTIALLY_IMPLEMENTED`: Core logic drafted but missing cross-account pagination or full API hooks.
  5. `NOT_IMPLEMENTED`: Architectural blueprint exists, but implementation code is yet to be written.
- **Zero Ingestion Fabrication:** Distinguish explicitly between static infrastructure AST parsing and live event streaming.

## 3. Customer-Deployable In-Account Architecture
- **In-Account Footprint:** Customer deploys AEGIS directly into their own AWS account via CloudFormation (`deploy/aws/aegis_customer_deployable_stack.yml`).
- **Zero SaaS Relay & Zero Data Leakage:** AI reasoning calls Amazon Bedrock directly using the customer's own AWS account IAM credentials. Prompts, code snippets, and infrastructure graphs must never leave the customer's AWS boundary.
- **Serverless-First Cost Discipline:** Core backend runs on AWS Lambda (Python 3.12), Amazon DynamoDB On-Demand, and Amazon S3. Customer idle infrastructure spend must remain under $0.50/month.
- **Graph In-Memory Principle:** Use in-memory NetworkX with S3 JSON state snapshots for graph topology and BFS attack path traversal; avoid provisioned graph databases (Neptune) to protect customer budget.

## 4. Remediation Safety & Governance Guardrails
- **3-Tier Remediation Progression:**
  - Mode 1: Advisory (IaC diff generation only; zero mutation).
  - Mode 2: Semi-Autonomous (Staged PR / Change Set; human sign-off required via UI/Slack).
  - Mode 3: Autonomous Self-Healing (Atomic auto-fixes for safe, low-blast-radius findings).
- **Production Exclusion Invariant:** Any resource tagged `Environment=Production` or classified as a critical database/peering asset is immutably locked out of Mode 3 auto-remediation and must fall back to Mode 2.
- **Atomic Transactions:** Always snapshot prior state before applying any AWS mutation, enabling automated rollback if post-remediation health checks fail.

## 5. UI/UX Anti-Slop & Enterprise Design System
- **Enterprise Dark Theme:** Slate Dark background (`#090d16`), deep slate panels (`#0f172a`), cyber indigo accent (`#6366f1`), crimson alert (`#ef4444`).
- **Anti-Slop Directive:** Avoid generic gradient cards, fake random statistics, and chatbot-centric layouts.
- **High-Density Data Tables:** Tables must support virtual scrolling, instant client-side search/filtering (<50ms), and deep-link drawers.
- **Dual Audience Communication:** Executive overviews and findings must provide plain-English business risk impact alongside full technical root-cause code diffs for security engineers.

## 6. Execution Environment & Shell Invariants
- **Operating System:** Windows host environment.
- **Shell Syntax (PowerShell):** Never use `&&` to chain terminal commands in PowerShell (causes syntax error). Chain commands sequentially using `;` or PowerShell conditional constructs (`if ($?) { ... }`).
