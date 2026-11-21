# AEGIS — Customer Data Boundaries & Privacy Guarantees

**Document Version:** 2.0  
**Security Classification:** Highly Confidential Customer Data Protection  

---

## 1. Customer Data Sovereignty

AEGIS is designed for enterprises with strict compliance, sovereignty, and data boundary requirements.

```
+-----------------------------------------------------------------------------------+
|                        CUSTOMER AWS ACCOUNT BOUNDARY                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | NEVER EXITS CUSTOMER ENVIRONMENT:                                           |  |
|  | - Discovered network topologies and IP CIDR blocks                          |  |
|  | - Raw IAM policy JSON documents and principal ARNs                          |  |
|  | - CloudTrail management events and Security Hub active alerts               |  |
|  | - In-memory NetworkX knowledge graph and attack paths                       |  |
|  | - Generated remediation diffs and rollback checklists                      |  |
|  | - Historical investigation logs and audit trails                            |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | NEVER TOUCHED OR ACCESSED:                                                  |  |
|  | - S3 object payloads, files, or customer records (s3:GetObject blocked)     |  |
|  | - Database table rows, RDS storage blocks, or database credentials          |  |
|  | - Secrets Manager secrets, private keys, or API tokens                      |  |
|  | - Operating system memory, EC2 user-data scripts, or EBS disk volumes       |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | TRANSMITTED TO IN-REGION AMAZON BEDROCK (SANITIZED INFERENCE ONLY):         |  |
|  | - Abstract structural prompts (e.g. "Explain Bastion port 22 exposure")    |  |
|  | - High-level finding summaries (sanitized, zero credentials)                |  |
|  | - Terraform AST diff blocks for natural language explanation                |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Secrets Minimization & PII Sanitization

Before any analytical context is processed by Amazon Bedrock:
1. **Regular Expression Scrubbing:** AWS Access Key IDs (`AKIA...`), Secret Keys, session tokens, and Bearer tokens are intercepted and masked (`AKIA[REDACTED]`).
2. **Tag & Comment Isolation:** Resource tags and IaC comments are quarantined as untrusted data strings. They are never parsed as system instructions.
3. **No Central Phone-Home:** The AEGIS serverless runtime does not transmit customer telemetry to any central server or third-party SaaS.
