# ENTERPRISE SECURITY, DATA PRIVACY & COMPLIANCE SPECIFICATION
**Document ID:** `AEGIS-ARCH-015-REV2` (Phase 0.5 Technical Correction)  
**Domain:** Encryption, PrivateLink Connectivity, Data Privacy Truth, PII Scrubbing, Audit Hygiene  
**Status:** Architecture Blueprint / Phase 0.5 Corrected  
**Changelog:** Replaced exaggerated zero-leakage claims with precise data flow facts; detailed AWS PrivateLink configurations; aligned S3 Object Lock with Governance Mode; defined client-side regex sanitization.

---

## 1. Executive Summary & Core Objective

Security platforms must adhere to the highest standard of data hygiene. This specification details the technical safeguards protecting customer data, including KMS encryption at rest, TLS 1.3 in transit over AWS PrivateLink, client-side PII scrubbing, and tamper-evident audit logging.

---

## 2. Real Data Flow & Private Network Connectivity

```mermaid
flowchart LR
    subgraph Customer VPC Perimeter
        Workload[AEGIS Backend Lambda] -->|KMS CMK Encrypted| DDB[(DynamoDB Tables)]
        Workload -->|KMS CMK Encrypted| S3Store[(S3 State Bucket)]
        Workload --> Sanitizer[Regex PII & Secret Scrubber]
    end

    subgraph AWS Network Backbone (PrivateLink)
        Sanitizer -->|Interface VPC Endpoint| PL[AWS PrivateLink]
        PL --> Bedrock[Amazon Bedrock Runtime Endpoint]
    end

    subgraph Public Internet
        Internet[Public Internet Gateway]
    end

    Workload -.->|BLOCKED: Zero Internet Ingress/Egress| Internet
```

### 2.1 PrivateLink VPC Endpoints
AEGIS communicates with AWS services without traversing the public internet by provisioning Interface and Gateway VPC Endpoints:
- `com.amazonaws.<region>.bedrock-runtime` (Bedrock AI inference)
- `com.amazonaws.<region>.s3` (S3 Gateway endpoint)
- `com.amazonaws.<region>.dynamodb` (DynamoDB Gateway endpoint)
- `com.amazonaws.<region>.events` (EventBridge ingestion)

---

## 3. Cryptographic Storage & Audit Integrity

1. **AWS KMS Customer Managed Key (CMK):**
   - A dedicated KMS CMK with annual rotation encrypts all DynamoDB tables, S3 buckets, and SQS queues.
   - The key policy grants cryptographic operations strictly to the `aegis-core-execution-role`.
2. **Audit Ledger in S3 Governance Mode:**
   - Forensic evidence and audit transactions are stored in an S3 bucket with Object Lock enabled in **Governance Mode**.
   - Default retention: **90 days**.
   - Guarantees tamper-evidence for normal operations while allowing authorized administrative cleanup (`s3:BypassGovernanceRetention`) in the event of accidental high-volume logging.
