# AEGIS — Customer-Owned Deployment Architecture
## In-Account Serverless Packaging, Data Boundaries & Operational Runtime

**Document Version:** 3.0-PHASE-0  
**Classification:** Enterprise Engineering Architecture  

---

## 1. In-Account Deployment Topology

AEGIS is packaged as a self-contained, customer-owned serverless stack deployed directly into the customer's AWS account.

```
+-----------------------------------------------------------------------------------+
|                        CUSTOMER AWS ACCOUNT BOUNDARY                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | AWS MANAGEMENT CONSOLE / AWS CLI                                            |  |
|  | (Customer launches: deploy/aws/aegis_customer_deployable_stack.yml)           |  |
|  +-----------------------------------------------------------------------------+  |
|                                         │                                         |
|                                         ▼ (AWS CloudFormation)                    |
|  +-----------------------------------------------------------------------------+  |
|  | AEGIS RUNTIME STACK (Prefix: aegis-*)                                        |  |
|  |                                                                             |  |
|  |  1. AWS::IAM::Role (AegisScopedInspectorRole)                               |  |
|  |     - SecurityAudit Managed Policy + Scoped API Action Allowlist             |  |
|  |     - Zero Put*/Create*/Delete* permissions. No s3:GetObject on data buckets |  |
|  |                                                                             |  |
|  |  2. AWS::Lambda::Function (AegisServerlessBackendLambda)                     |  |
|  |     - Python 3.12 Runtime + Ephemeral FastAPI ASGI / Mangum Adapter         |  |
|  |     - NetworkX in-memory graph engine (< 25ms execution, < 128MB RAM)       |  |
|  |     - Bedrock AgentCore execution driver                                    |  |
|  |                                                                             |  |
|  |  3. AWS::Lambda::Url (AegisLambdaFunctionUrl)                               |  |
|  |     - Direct HTTPS REST endpoint with CORS and SigV4 support                |  |
|  |                                                                             |  |
|  |  4. AWS::S3::Bucket (AegisCustomerWebBucket)                                |  |
|  |     - Encrypted bucket hosting static compiled React 18 Web Console assets  |  |
|  |     - Expiring snapshot history folder (30-day lifecycle)                   |  |
|  |                                                                             |  |
|  |  5. AWS::CloudFront::Distribution (AegisConsoleCDN)                          |  |
|  |     - Global CDN delivery with Origin Access Control (OAC)                  |  |
|  +-----------------------------------------------------------------------------+  |
|                                         │                                         |
|                                         ▼ (Strictly Read-Only Describe*/Get*)     |
|  +-----------------------------------------------------------------------------+  |
|  | CUSTOMER EXISTING INFRASTRUCTURE (VPC, EC2, IAM, S3, RDS, EKS, CloudTrail)  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Customer Account Ownership & Data Sovereignty

### Why In-Account Deployment Wins:
1. **Zero Credential Sharing:** Customers never copy AWS Access Keys or Secret Keys into a third-party SaaS dashboard.
2. **Zero Ingress / Firewall Holes:** The customer's infrastructure is inspected locally from within the AWS control plane using native Boto3 service clients.
3. **Strict Compliance Alignment:** Meets SOC 2 Type II, HIPAA, and GDPR data sovereignty standards because customer network topologies and IAM policies never leave the customer's AWS boundary.
4. **Zero Spend at Idle:** Lambda and S3 incur charges only when investigations run. Idle cost is less than **$0.50 per month**.

---

## 3. Data Processing & Model Inference Boundaries

```
+-----------------------------------------------------------------------------------+
| COMPONENT              | PHYSICAL RUNTIME LOCATION     | DATA RESIDENCY           |
+------------------------+-------------------------------+--------------------------+
| Telemetry Collectors   | Customer AWS Lambda           | 100% In-Account Memory   |
| NetworkX Graph Engine  | Customer AWS Lambda           | 100% In-Account Memory   |
| Attack Path BFS Tracer | Customer AWS Lambda           | 100% In-Account Memory   |
| Context Gate Formula   | Customer AWS Lambda           | 100% In-Account Memory   |
| Policy Arbitrator      | Customer AWS Lambda           | 100% In-Account Memory   |
| Investigation Reports  | Customer S3 Bucket            | 100% In-Account S3       |
| Web Console UI         | Customer S3 + CloudFront      | 100% Customer CloudFront |
| Model Inference        | Amazon Bedrock (In-Region)    | In-Region AWS Boundary   |
+-----------------------------------------------------------------------------------+
```

### What is Sent to Amazon Bedrock:
- Natural language security questions (e.g. *"Why is this Bastion host exposed to the internet?"*).
- Structural finding summaries (e.g. *"Resource: sg-bastion, Port: 22, Ingress: 0.0.0.0/0"*).
- Abstract IaC diff blocks for natural language explanation and PR markdown formatting.

### What is STRICTLY NEVER Sent:
- S3 object contents or data records.
- Database credentials, connection strings, or table rows.
- IAM secret keys, session tokens, or private certificates.
- Operating system memory, EC2 user-data, or raw file systems.
