# AEGIS — AWS Cost Management & Credit Protection Plan

## 1. Budget Baseline & Strict Limits
- **Total Available Credits:** ~$200 USD
- **Hackathon Hard Budget Target:** **<= $20.00 USD**
- **Default Operational Mode:** Synthetic Local Fixtures ($0.00 cost)

---

## 2. Service Cost Profile & Policies

| AWS Service | Cost Factor | Policy & Safeguard | Estimated Hackathon Cost |
| :--- | :--- | :--- | :--- |
| **Amazon Bedrock (Claude 3.5 Haiku)** | $0.25 / 1M input tokens, $1.25 / 1M output tokens | Local prompt optimization, short system instructions, test with mocks first | ~$0.50 - $2.00 |
| **Amazon Bedrock (Claude 3.5 Sonnet)** | $3.00 / 1M input tokens, $15.00 / 1M output tokens | Used only for final verification runs; primary testing on Haiku | ~$1.00 - $3.00 |
| **Bedrock AgentCore Harness** | Free harness tier; underlying inference billed per token | Strictly allowlisted tools; no continuous loops | Included above |
| **Bedrock Guardrails** | $0.75 per 1,000 text units evaluated | Applied only to user inputs and untrusted metadata | ~$0.20 - $0.50 |
| **AWS Lambda (Read-Only Tool)** | Free Tier (1M requests/mo, 3.2M sec compute) | Sub-100ms lightweight discovery handlers | $0.00 |
| **Amazon DynamoDB** | On-Demand (25 RCU/WCU free) | Zero idle cost; Pay-per-request | $0.00 |
| **Amazon S3** | Free Tier (5 GB standard storage) | Storing small JSON report artifacts (<50 KB each) | $0.00 |
| **Amazon EC2 / RDS / NAT Gateways** | Hourly charges ($15 - $40/month per instance) | **STRICTLY PROHIBITED TO PROVISION.** Model via synthetic fixtures. | **$0.00** |
| **AWS Config & CloudTrail Data Events** | Paid per configuration item / event recorded | **DO NOT ENABLE.** Use existing read-only history only. | **$0.00** |

**Total Estimated Project Cost:** **$2.00 - $5.50 USD** (Well within $20 budget, preserving >$190 credits).

---

## 3. Mandatory Cost Safeguards
1. **Never Provision Always-On Compute:** No real EC2 instances, EKS clusters, NAT gateways, or RDS instances shall be created in the AWS account. Risky topologies are simulated via verified JSON fixtures.
2. **Local Test-Driven Verification:** All 14 adversarial tests, graph algorithms, and security rules run locally using pytest fixtures before invoking Bedrock.
3. **Approval Threshold:** Any single operation projected to exceed $1.00 requires explicit founder approval.
