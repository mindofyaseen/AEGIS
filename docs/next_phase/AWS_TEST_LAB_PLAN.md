# ISOLATED DISPOSABLE AWS TEST LAB SPECIFICATION
**Document ID:** `AEGIS-ARCH-017-REV2` (Phase 0.5 Technical Correction)  
**Domain:** AWS Testing Infrastructure, Disposable Sandbox, Budgetary Governance, Teardown Verification  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Replaced naive budget alarm claims with multi-layer cost controls; defined resource-by-resource hourly costs and teardown crons; established local testing alternatives (LocalStack, kind, moto).

---

## 1. Executive Summary & Core Objective

Validating AEGIS against live AWS APIs is essential to prove real-world accuracy. However, testing must be rigorously bounded to prevent unexpected billing.

A critical cloud engineering reality governs this design: **An AWS Budget alarm is merely an asynchronous notification, NOT a hard spending stop.** AWS Budgets can take 8 to 24 hours to evaluate and deliver alerts, during which runaway resources can accumulate charges.

This specification establishes **Multi-Layer Cost Governance** designed to execute validation suites within a strict planned budget ($\approx \$10.00$).

---

## 2. Resource-by-Resource Cost & Lifecycle Inventory

| Resource | AWS Service | Purpose & Vulnerability Placed | Hourly Cost | Expected Duration | Expected Total Cost | Cleanup Procedure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vulnerable EC2** | Amazon EC2 (`t4g.nano`) | IMDSv1 active; public SG 22/80 open to `0.0.0.0/0` | $0.0042 / hr | 4 hours | **$0.017** | `ec2.terminate_instances()` |
| **Vulnerable S3** | Amazon S3 | Public read ACL enabled; SSE-KMS disabled | <$0.0001 / hr | 4 hours | **<$0.001** | Empty bucket + `s3.delete_bucket()` |
| **Vulnerable RDS (Optional)** | Amazon RDS (`db.t4g.micro`) | Storage unencrypted; `PubliclyAccessible=true` | $0.0170 / hr | 2 hours | **$0.034** | `rds.delete_db_instance(SkipFinalSnapshot=True)` |
| **Overprivileged IAM** | AWS IAM | Attached `AdministratorAccess` + `*` trust policy | $0.0000 / hr | 4 hours | **$0.000** | Detach policy + `iam.delete_role()` |
| **Vulnerable ECR** | Amazon ECR | Repository holding Alpine 3.14 CVE fixture | <$0.0001 / hr | 4 hours | **<$0.001** | `ecr.delete_repository(force=True)` |
| **Total Test Session** | — | **Complete E2E Validation Run** | — | — | **<$0.10 per run** | Clean teardown script |

---

## 3. Multi-Layer Cost Control Architecture

```mermaid
flowchart TD
    Deploy[Deploy Test Lab via Terraform / CloudFormation] --> Tag[Tag AEGIS-Scope=TestLab & ExpiryTime]
    
    subgraph Multi-Layer Circuit Breakers
        Tag --> Layer1[Layer 1: Auto-Shutdown Lambda via EventBridge Cron - 4 hr TTL]
        Tag --> Layer2[Layer 2: CloudWatch Billing Metric Alarm - Threshold $5.00]
        Tag --> Layer3[Layer 3: AWS Budget Actual Alert - Threshold $8.00]
    end

    Layer1 -->|TTL Expired (4 hours)| Destroy[Execute testlab_destroy.py]
    Layer2 -->|Triggered| Destroy
    Destroy --> Audit[Verify 0 Active TestLab Resources via Boto3]
```

### 3.1 Layer 1: Time-To-Live (TTL) Auto-Shutdown Lambda
- Every provisioned test resource receives a tag: `AEGIS-TTL-Hours=4`.
- A lightweight Lambda function (`testlab_destroy.py`) scheduled via EventBridge cron runs every 60 minutes.
- If current time exceeds creation time + TTL, the function forcefully destroys the test lab stack, eliminating dependency on human cleanup.

### 3.2 Layer 2 & 3: CloudWatch & AWS Budgets Notifications
- CloudWatch Billing Alarm configured at **$5.00** sends an immediate SNS alert to the on-call engineer.
- AWS Budget notification configured at **$8.00** provides secondary executive visibility.

---

## 4. Local Testing Alternatives (Zero-Cost Pre-Flight)

Before deploying any live AWS resources, all modules must pass pre-flight validation locally:
1. **Mocked AWS APIs:** LocalStack and Moto simulate EC2, S3, IAM, and ECR calls with zero AWS spend.
2. **Kubernetes Validation:** Local `kind` (Kubernetes in Docker) or `k3d` clusters validate EKS posture rules without paying AWS EKS control plane fees ($0.10/hr).
3. **Synthetic Payloads:** Static JSON fixtures test CloudTrail parsing and GuardDuty threat correlation offline.
