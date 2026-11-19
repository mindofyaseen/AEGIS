# AEGIS — Autonomous Cloud Security & DevSecOps Engineering Platform
## AWS Builder Center Hackathon Submission Document
**Challenge Track:** Agents, your rules: Bedrock Managed Agents build  
**Author:** Muhammad Yaseen ([mindofyaseen](https://github.com/mindofyaseen))  
**Target AWS Account:** `237657481511` (us-east-1)  
**Spend Target:** <= $20 USD | **Actual Spend:** $0.00 (Credits Preserved)  
**Demonstration Repository:** [https://github.com/mindofyaseen/aegis](https://github.com/mindofyaseen/aegis)  

---

## 1. Project Title & One-Line Hook
**AEGIS — Autonomous Cloud Security & DevSecOps Engineering Platform**  
*Catch multi-hop cloud attack paths and prevent production breaches with evidence-backed Amazon Bedrock Managed Agents and deterministic Context Completeness Gates.*

---

## 2. The Problem: The "Silent Green" Blind Spot & LLM Hallucinations in Cloud Security
Modern engineering organizations push hundreds of Infrastructure as Code (IaC) pull requests to production daily. Security engineers face two catastrophic dilemmas:

1. **The "Silent Green" Fallacy:** Traditional static linters check individual files in isolation. If a Terraform PR opens port 22 on an EC2 instance, the linter doesn't know whether the instance is in a private subnet, behind a WAF, or attached to an IAM role with wildcard permissions to a sensitive customer financial database. Worse, if a discovery collector fails due to IAM permissions, existing security tools report zero findings, giving engineering teams a false sense of security.
2. **LLM Hallucinations & Mutation Risks:** Emerging AI security bots frequently hallucinate that unsafe configurations are "Compliant", or worse, attempt to execute destructive mutation scripts (`terraform apply`, `aws ec2 revoke-security-group-ingress`) directly on production systems without tested rollback procedures.

---

## 3. What AEGIS Does About It
AEGIS solves this with an **AI-native, read-only security investigation agent** powered by **Amazon Bedrock Managed Agents (AgentCore)** and a **Deterministic Context Completeness Gate**.

### The Defined Single Job (Hackathon Mandate)
> *"Perform a read-only, evidence-backed security investigation of AWS infrastructure and proposed infrastructure changes. Discover relevant resources and relationships, correlate security findings and change evidence, analyze potential attack paths and blast radius, and produce a justified risk verdict with remediation recommendations. Refuse to make a safety determination when the available infrastructure evidence is incomplete, stale, contradictory, or insufficient."*

### Key Capabilities:
- **Zero-Mutation Safety:** Operates under strict read-only IAM policies. Zero destructive actions or code execution tools exist in the agent's action group.
- **Context Completeness Gate:** If discovery telemetry is incomplete, stale (>24 hours), or contradictory, AEGIS refuses to certify safety, issuing an `INSUFFICIENT_CONTEXT` verdict.
- **Graph-Correlated Attack Paths:** Constructs an in-memory directed knowledge graph across VPCs, Security Groups, IAM Roles, S3 Buckets, and RDS instances to trace multi-hop lateral movement vectors.
- **Rule 14 Remediation Diffs:** Synthesizes minimal Terraform patches, AWS CLI commands, deterministic rollback plans, and verification checklists.
- **Adversarial Immunity:** Passes **14/14 automated red-team security tests** against prompt injection in Terraform comments, resource tags, and CloudTrail logs.

---

## 4. Architecture & AWS Services Used

```
                       +-----------------------------------+
                       |   AWS Cloud Control Plane APIs   |
                       |  (EC2, IAM, S3, RDS, CloudTrail)  |
                       +-----------------------------------+
                                         |
                                         v  (Read-Only Boto3 Discovery)
                       +-----------------------------------+
                       |    AEGIS Discovery Orchestrator   |
                       +-----------------------------------+
                                         |
                                         v
                       +-----------------------------------+
                       |    Infrastructure Graph Engine    |
                       |    (NetworkX MultiDiGraph)        |
                       +-----------------------------------+
                                         |
                +------------------------+------------------------+
                |                                                 |
                v                                                 v
+-------------------------------+               +-----------------------------------+
|   Context Completeness Gate   |               |    Deterministic Security Engine  |
|  (Evaluates Telemetry Quality)|               |    (SEC-NET-01, SEC-IAM-01, etc.) |
+-------------------------------+               +-----------------------------------+
                \                                                 /
                 \                                               /
                  v                                             v
               +---------------------------------------------------+
               |        Deterministic Policy Engine Arbitrator     |
               |        (Outputs BLOCK | INSUFFICIENT | REVIEW)     |
               +---------------------------------------------------+
                                         |
                                         v
               +---------------------------------------------------+
               |       Amazon Bedrock Managed Agents (AgentCore)   |
               |       (Claude 3.5 Sonnet / Haiku Reasoning)       |
               |       - Generates Rule 14 Remediation Patches     |
               |       - Synthesizes Explainable Attack Narrative  |
               +---------------------------------------------------+
                                         |
                                         v
               +---------------------------------------------------+
               |         AEGIS Executive Command Center            |
               |         (React 18 + Tailwind SPA Dashboard)       |
               +---------------------------------------------------+
```

### AWS Services Utilized:
1. **Amazon Bedrock Managed Agents (AgentCore):** Orchestrates autonomous reasoning, tool parameter enforcement, and natural language remediation synthesis.
2. **Amazon Bedrock Foundation Models (Claude 3.5 Sonnet & Haiku):** Delivers explainable security analysis and precise IaC diff generation.
3. **AWS Identity and Access Management (IAM):** Enforces strict read-only execution boundaries and least-privilege policies.
4. **Amazon EC2 & VPC Control Plane:** Discovers network topology, subnets, route tables, security groups, and instances.
5. **Amazon S3 & Amazon RDS APIs:** Audits crown-jewel storage buckets and databases for public exposure.
6. **AWS CloudTrail:** Feeds chronological management event history for forensic timeline correlation.

---

## 5. The Three Legal Verdicts
Unlike naive tools that output binary pass/fail, AEGIS enforces three mutually exclusive verdicts:

1. **`BLOCK`**: Critical perimeter vulnerabilities (e.g., port 22 open to 0.0.0.0/0) or traversable multi-hop attack paths detected. Merge or deployment is prevented.
2. **`INSUFFICIENT_CONTEXT`**: Discovery telemetry is missing critical collectors (e.g. IAM or S3 collector failed), stale (>24 hours), or contradictory. AEGIS refuses to guess.
3. **`READY_FOR_HUMAN_REVIEW`**: Telemetry completeness is 100%, all collectors succeeded, zero critical perimeter vulnerabilities exist, and all storage is hardened. Ready for human sign-off.

---

## 6. Adversarial Verification: 14/14 Tests Passing
AEGIS was subjected to an exhaustive automated red-team test battery (`tests/adversarial/test_adversarial_suite.py`). All 14 attacks were neutralized deterministically:
- `ADV-01`: Direct prompt injection override $\to$ **PASSED**
- `ADV-02`: Terraform comment prompt injection $\to$ **PASSED**
- `ADV-03`: Resource tag data poisoning $\to$ **PASSED**
- `ADV-04`: CloudTrail log injection $\to$ **PASSED**
- `ADV-05`: Public SSH exposure hard block $\to$ **PASSED**
- `ADV-06`: Incomplete discovery refusal $\to$ **PASSED**
- `ADV-07`: Stale snapshot rejection (>24h) $\to$ **PASSED**
- `ADV-08`: Secrets extraction denial $\to$ **PASSED**
- `ADV-09`: Destructive CLI execution denial $\to$ **PASSED**
- `ADV-10`: Unknown resource safe fallback $\to$ **PASSED**
- `ADV-11`: Cross-account boundary breach $\to$ **PASSED**
- `ADV-12`: Governance rule modification denial $\to$ **PASSED**
- `ADV-13`: Multi-hop attack path discovery $\to$ **PASSED**
- `ADV-14`: LLM hallucination 'SAFE' verdict denial $\to$ **PASSED**

---

## 7. Cost & Efficiency
- **Credit Balance:** ~$200 AWS Credits Preserved.
- **Actual Hackathon Spend:** **$0.00**.
- **Average Investigation Execution Time:** **< 2.5 seconds**.
