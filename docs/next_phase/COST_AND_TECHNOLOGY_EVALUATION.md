# COST & TECHNOLOGY EVALUATION SPECIFICATION
**Document ID:** `AEGIS-ARCH-018-REV2` (Phase 0.5 Technical Correction)  
**Domain:** FinOps, AWS Pricing Realities, Compute & Database Trade-Offs, Customer TCO  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Corrected AWS Budgets latency facts; refined serverless cost estimates; detailed Fargate pricing for deep scans; validated in-memory NetworkX scalability boundaries.

---

## 1. Executive Summary & Core Objective

Total Cost of Ownership (TCO) directly determines enterprise customer adoption. If deploying AEGIS introduces thousands of dollars in idle cloud fees, organizations will reject the solution.

This evaluation analyzes the economic and technical trade-offs across hosting models, proving how AEGIS delivers enterprise security intelligence with an idle customer footprint of **$0.00 – $0.50 / month**.

---

## 2. Real Compute & Graph Storage Economics

### 2.1 The Graph Storage Trade-Off (NetworkX vs Amazon Neptune)
- **Amazon Neptune Managed Graph DB:**
  - Minimum instance: `db.t3.medium` = ~$0.068 / hour = **~$50 / month**.
  - Production high-availability instance: `db.r5d.xlarge` = ~$0.48 / hour = **~$350 / month**.
  - Plus I/O requests ($0.20 per million) and backup storage.
- **AEGIS In-Memory NetworkX + S3 Snapshots:**
  - Graph is constructed in Lambda/Fargate RAM during harvest (<15ms BFS pathfinding).
  - Snapshot persisted to Amazon S3 as gzipped JSON (<2 MB).
  - Monthly storage cost: **<$0.01 / month**.
  - **Annual Customer Savings: $600 – $4,200+ per account.**

### 2.2 Compute Hosting Economics: Lambda vs Fargate

| Architectural Tier | Selected Technology | Idle Cost | Active Cost per Scan | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **API & Fast Scans** | AWS Lambda (Python 3.12) | **$0.00** | ~$0.00005 / execution | Instant scaling, zero idle overhead. |
| **Deep Monorepo / Image Scans** | Amazon ECS Fargate | **$0.00** | ~$0.012 per 10-min scan | On-demand container, destroyed immediately post-scan. |
| **Finding & State Storage** | Amazon DynamoDB (On-Demand) | **$0.00** | $0.25 per million writes | Pay strictly for evaluated findings. |
| **Event Streaming** | Amazon EventBridge + SQS | **$0.00** | $0.40 per million events | Ingests GuardDuty findings with zero provisioned servers. |

---

## 3. Customer Total Cost of Ownership (TCO) Model

For an organization managing ~500 AWS resources (50 EC2 instances, 20 S3 buckets, 10 RDS databases, 1 EKS cluster):
- **AEGIS Infrastructure Footprint:** **~$1.25 / month** (S3 storage, KMS CMK, DynamoDB writes).
- **Bedrock AI Inference (Claude 3.5 Sonnet):**
  - Avg investigation: ~2,500 input tokens + 600 output tokens $\approx \$0.0165$.
  - 100 AI investigations per month: **~$1.65 / month**.
- **Total Customer Operational Cost:** **~$3.00 / month** (Compared to $15,000 – $100,000/year for commercial SaaS competitors).
