# AEGIS — Deployment Cost & AWS Free Tier Analysis
## Transparent Financial Modeling for In-Account Customer Deployment

---

## 1. Executive Cost Summary

AEGIS is built entirely on **serverless, pay-per-use AWS architecture**. It does **not** deploy always-on EC2 instances, EKS clusters, NAT Gateways, or provisioned graph databases.

| State | Estimated Monthly AWS Charges |
| :--- | :--- |
| **Idle State (No active investigations)** | **$0.00 – $0.50 / month** |
| **Active Use (100 daily investigations + Bedrock)** | **$1.50 – $4.00 / month** |

---

## 2. Resource-by-Resource Cost Breakdown

### 1. AWS Lambda (`AegisServerlessBackendLambda`)
- **Memory:** 256 MB.
- **Execution Duration:** ~250ms per investigation (NetworkX graph modeling is in-memory and executes in < 25ms).
- **Free Tier Eligibility:** 1,000,000 requests and 3,200,000 seconds of compute per month are **100% FREE**.
- **Cost:** **$0.00** for typical enterprise usage.

### 2. Amazon S3 (`AegisCustomerWebBucket`)
- **Storage:** Static web assets (~5 MB) + investigation snapshot history (< 50 MB).
- **Free Tier Eligibility:** 5 GB standard storage for 12 months.
- **Cost:** **$0.01 / month**.

### 3. Amazon CloudFront (`AegisConsoleCDN`)
- **Data Transfer:** 1 TB free per month under AWS Always-Free Tier.
- **Cost:** **$0.00**.

### 4. Amazon Bedrock (`InvokeModel`)
- **Model:** `anthropic.claude-haiku-4-5` (~$0.001 per investigation query).
- **Daily Usage:** 50 natural language queries $\approx$ $0.05/day.
- **Monthly Cost:** **~$1.50 / month**.

### 5. AWS IAM & CloudFormation
- **Cost:** **$0.00 (Always Free)**.

---

## 3. High-Cost Components Deliberately Avoided

| Component | Standard Commercial Tool Cost | AEGIS Approach | AEGIS Cost |
| :--- | :--- | :--- | :--- |
| Amazon Neptune / Neo4j Graph DB | $150 – $400 / month | NetworkX In-Memory MultiDiGraph in Lambda | **$0.00** |
| NAT Gateways | $32.40 / month each | Serverless direct API access | **$0.00** |
| Amazon EKS / ECS Clusters | $73.00 / month cluster fee | AWS Lambda execution | **$0.00** |
| Provisioned EC2 Instances | $20 – $80 / month | Serverless on-demand compute | **$0.00** |
