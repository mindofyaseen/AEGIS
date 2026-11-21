# AEGIS — Infrastructure Discovery Model & Resource Coverage
## Automated Telemetry Ingestion for Existing AWS Environments

---

## 1. Supported Discovery Categories

AEGIS automatically enumerates existing AWS resources without requiring agents on individual servers:

| Resource Category | Discovered Services | Inspected Metadata |
| :--- | :--- | :--- |
| **Networking** | VPC, Subnet, Route Table, IGW, NAT Gateway, Security Group, ENI | CIDRs, default routes, 0.0.0.0/0 ingress, public IP attachments, egress rules |
| **Compute** | EC2, Lambda, ECS, AutoScaling | Instance type, subnet placement, associated ENIs, attached IAM instance profiles |
| **Identity & Access** | IAM Roles, Managed Policies, Inline Policies, Instance Profiles | Actions, Resources, Conditions, Wildcard (`*`) permissions, cross-service trust |
| **Storage** | Amazon S3 | Bucket policy public status, PublicAccessBlock, default encryption, ACLs |
| **Databases** | Amazon RDS | Engine, public accessibility flag, DB subnet groups, VPC associations |
| **Threats & Audit** | CloudTrail, Security Hub, GuardDuty | Suspicious mutating events, SSH brute-force detections, active perimeter alerts |

---

## 2. Missing Telemetry & The Context Completeness Gate

AEGIS enforces **RULE-06**:
- If any required collector fails (e.g. `AccessDenied` on `iam:ListRoles` or network timeout), AEGIS calculates a mathematical completeness score:
  $$\text{CompletenessScore} = \frac{\sum \text{SuccessfulCollectors}}{\sum \text{RequestedCollectors}}$$
- If the score falls below the threshold (default: **0.85**) or if a critical collector is missing, AEGIS **refuses** to certify safety and issues **`INSUFFICIENT_CONTEXT`**.
- It clearly displays the missing permissions or failed services so administrators can easily adjust the scoped IAM role.
