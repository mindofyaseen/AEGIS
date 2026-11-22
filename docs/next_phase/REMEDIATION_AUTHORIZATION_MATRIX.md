# REMEDIATION AUTHORIZATION & GOVERNANCE MATRIX
**Document ID:** `AEGIS-ARCH-027`  
**Domain:** Cloud Remediation Governance, Approval Workflows, Production Safety Controls  
**Status:** Architecture Blueprint / Phase 0.5 Deliverable  

---

## 1. Executive Summary & Governance Logic

Remediating cloud misconfigurations requires rigorous authorization boundaries. Under AEGIS, no autonomous action is ever taken against critical production workloads.

This matrix governs the **authorization thresholds, required approver roles, precondition validations, and rollback compensation runbooks** across all 3 remediation modes.

---

## 2. Complete Remediation Authorization Matrix

| Remediation Action | Operational Mode | Permitted Resource Scope | Required RBAC Role | Precondition Validations | Blast Radius Circuit Breaker | Rollback / Compensation Action |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Generate IaC Patch (Terraform/CFN)** | **Mode 1** (Advisory) | All Resources (Production & Non-Prod) | Security Analyst | None (Zero cloud mutation). | None (Static text diff). | N/A (Human applies via GitOps). |
| **Revoke Public SG Rule (Port 22/3389)** | **Mode 2** (Human-Approved) | All Resources | Remediation Approver | Verify replacement bastion / VPN rule exists. | Abort if affects $> 3$ active EC2 instances. | Re-authorize original CIDR rule if health check fails. |
| **Enable S3 Default Bucket Encryption** | **Mode 2** (Human-Approved) | All S3 Buckets | Remediation Approver | Verify KMS key exists and key policy permits access. | Abort if KMS key disabled. | Revert bucket encryption config to prior state. |
| **Enable S3 Public Access Block** | **Mode 2** (Human-Approved) | Staging / Non-Prod Buckets | Remediation Approver | Verify bucket is not hosting static website. | Abort if bucket contains public assets. | Disable Public Access Block if 403 errors spike. |
| **Deactivate Compromised IAM Key** | **Mode 2** (Human-Approved) | Non-Root IAM Users | Remediation Approver | Verify key has recorded activity in last 24h. | Abort if key belongs to core CI/CD automation. | Set `Status=Active` to instantly restore service. |
| **Attach MFA Deny Policy** | **Mode 3** (Autonomous Opt-In) | Sandbox / Dev Accounts Only | Platform Administrator (Policy Opt-In) | Resource must NOT have tag `Environment=Production`. | Abort if affects $> 1$ user. | Detach inline MFA policy if login fails. |
| **Enable S3 Versioning** | **Mode 3** (Autonomous Opt-In) | Non-Prod Buckets Only | Platform Administrator (Policy Opt-In) | Target must carry tag `Environment=Development`. | Abort if bucket size $> 100\text{ GB}$. | Suspend bucket versioning if billing increases. |
| **Enable Automated RDS Backup** | **Mode 3** (Autonomous Opt-In) | Dev Databases Only | Platform Administrator (Policy Opt-In) | DB instance status must be `Available`. | Abort if instance in maintenance window. | Revert backup retention period to 0. |

---

## 3. Strict Production Lockout Policy

```json
{
  "RuleName": "AEGISProductionRemediationLockout",
  "Enforcement": "IMMUTABLE_DETERMINISTIC",
  "Policy": {
    "DenyMode3If": [
      { "TagKey": "Environment", "TagValue": "Production" },
      { "TagKey": "Tier", "TagValue": "Critical" },
      { "TagKey": "AEGIS-Immutable", "TagValue": "True" },
      { "ResourceType": "AWS::RDS::DBCluster" },
      { "ResourceType": "AWS::EC2::VPCPeeringConnection" },
      { "ResourceType": "AWS::Route53::HostedZone" }
    ],
    "FallbackAction": "DOWNGRADE_TO_MODE_2_HUMAN_APPROVAL"
  }
}
```
