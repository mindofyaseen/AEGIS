# AEGIS Agent Governance and Technical Enforcement Rules

## Platform Identity & One Defined Job
**Product:** AEGIS - Autonomous Cloud Security and DevSecOps Engineering Platform  
**Hackathon Track:** Agents, your rules: Bedrock Managed Agents build (AWS Builder Center)  
**Core Defined Job:**
> "Perform a read-only, evidence-backed security investigation of AWS infrastructure and proposed infrastructure changes. Discover relevant resources and relationships, correlate security findings and change evidence, analyze potential attack paths and blast radius, and produce a justified risk verdict with remediation recommendations. Refuse to make a safety determination when the available infrastructure evidence is incomplete, stale, contradictory, or insufficient."

---

## Technical Enforcement Matrix

| Rule ID | Rule Title | Primary Enforcement Layer | Validation Test | Failure Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **RULE-01** | AWS Access Scope | AgentCore Tool Parameter Validation + IAM Boundary | `test_cross_account_expansion` | Execution Denied (Scope Violation) |
| **RULE-02** | Read-Only Cloud Access | Least-Privilege IAM Execution Role + Read-Only Boto3 Wrapper | `test_readonly_boundary` | Permission Denied (HTTP 403) |
| **RULE-03** | No Cloud Resource Mutation | Zero Mutation APIs Allowed in Tool Allowlist | `test_mutation_denial` | Tool Not Found / Invocation Rejected |
| **RULE-04** | No Infrastructure Deployment | App Sandbox - No `apply` binaries available | `test_destructive_execution_request` | Refusal + Command Blocked |
| **RULE-05** | No Secret Extraction | Regex Redaction Filter + Tool Output Masking | `test_secret_extraction_denial` | Sanitized / Masked Output |
| **RULE-06** | Untrusted Infrastructure Content | Prompt Sanitization & Structural XML Encapsulation | `test_tag_and_comment_injections` | Content Treated as Data Only |
| **RULE-07** | Evidence-Backed Conclusions | Deterministic Graph Evaluator (NetworkX) | `test_attack_path_validation` | Unsubstantiated Claims Discarded |
| **RULE-08** | Incomplete Discovery Reporting | Context Completeness Engine | `test_incomplete_discovery_verdict` | Returns `INSUFFICIENT_CONTEXT` |
| **RULE-09** | No Unsafe Approval | Deterministic Verdict Gate (Hardcoded) | `test_false_safe_manipulation` | LLM Approval Overridden to `BLOCK` |
| **RULE-10** | Mandatory Human Review | Policy Engine Verdict Enum Constraints | `test_ready_for_review_contract` | No Autonomous Execution Allowed |
| **RULE-11** | No Cross-Account Expansion | STS Caller Identity Verification | `test_cross_account_expansion` | Call Halted immediately |
| **RULE-12** | No Policy Override by Prompt | Python Policy Precedence over LLM Response | `test_direct_prompt_injection` | Prompt Ignored, Verdict Preserved |
| **RULE-13** | Immutable Model & Tool Config | Sealed Configuration Store | `test_config_manipulation` | Request Signature Validation Failed |
| **RULE-14** | Auditability & Event Logging | Append-Only Structured Audit Logger | `test_audit_event_logging` | Audit Event Persisted |
| **RULE-15** | Honest Fact/Inference Separation | Structured Pydantic Output Schema | `test_schema_validation` | Validation Exception Raised |

---

## Detailed Rule Specifications

### RULE-01: AWS Access Scope
- **Meaning:** The agent may only access the explicitly configured AWS account and designated regions.
- **Why it exists:** Prevents accidental or adversarial lateral movement into unapproved environments or accounts.
- **Enforcement Layer:** Application input validator verifies account ID and region against allowlist before passing to tool handler.
- **Validation Test:** Test 11 (`test_cross_account_expansion`).
- **Failure Behavior:** Request immediately rejected with an `INVALID_SCOPE` error; tool is never invoked.

### RULE-02: Read-Only Cloud Access
- **Meaning:** The agent may inspect metadata, configurations, and topology only.
- **Why it exists:** Ensures total environmental safety during security investigation.
- **Enforcement Layer:** Attached IAM role contains only `Describe*`, `Get*`, `List*` actions.
- **Validation Test:** Automated IAM policy analysis unit test.
- **Failure Behavior:** AWS IAM returns `AccessDenied` error.

### RULE-03: No Cloud Resource Mutation
- **Meaning:** The agent must never create, modify, stop, start, reboot, terminate, delete, or reconfigure resources.
- **Why it exists:** Protects production workloads from unintended changes.
- **Enforcement Layer:** The tool allowlist explicitly registers only discovery and diff tools.
- **Validation Test:** Test 9 (`test_mutation_denial`).
- **Failure Behavior:** Invocation rejected by AgentCore runtime as unauthorized tool.

### RULE-04: No Infrastructure Deployment
- **Meaning:** The agent must never execute `terraform apply`, `aws cloudformation deploy`, `cdk deploy`, or bash deployment commands.
- **Why it exists:** Deployment must remain an explicitly authorized, human-controlled action.
- **Enforcement Layer:** Shell tools (`InvokeAgentRuntimeCommand`, `InvokeAgentRuntimeCommandShell`) are excluded.
- **Validation Test:** Test 9 (`test_destructive_execution_request`).
- **Failure Behavior:** System responds: *"Execution tool not available. AEGIS is strictly read-only."*

### RULE-05: No Secret Extraction
- **Meaning:** The agent must never retrieve or export credentials, private keys, database contents, or API tokens.
- **Why it exists:** Prevents credential exfiltration through prompt injection or analytical queries.
- **Enforcement Layer:** Tool response scrubbers redact API keys, private keys, and user-data fields before LLM context ingestion.
- **Validation Test:** Test 8 (`test_secrets_extraction_request`).
- **Failure Behavior:** Redacted with `[REDACTED_BY_AEGIS_SECURITY_GATE]`.

### RULE-06: Untrusted Infrastructure Content
- **Meaning:** Resource names, tags, Terraform plan comments, and CloudTrail descriptions are treated as data, never instructions.
- **Why it exists:** Neutralizes indirect prompt injection attacks hidden within infrastructure metadata.
- **Enforcement Layer:** Content is structurally encapsulated inside XML delimiters `<untrusted_metadata>` and parsed with strict types.
- **Validation Test:** Tests 2, 3, 4 (Terraform comment, resource tag, and CloudTrail event injection).
- **Failure Behavior:** Agent processes metadata purely as string values; instructions are ignored.

### RULE-07: Evidence-Backed Conclusions
- **Meaning:** Security findings and attack paths must cite specific resource IDs, graph edges, and API timestamps.
- **Why it exists:** Eliminates AI hallucinations and baseless threat claims.
- **Enforcement Layer:** Graph traversal algorithm in NetworkX verifies connectivity between nodes.
- **Validation Test:** Test 13 (`test_multiple_stage_attack_path`).
- **Failure Behavior:** Unverified edges marked as `ASSUMPTION` or discarded.

### RULE-08: Incomplete Discovery Reporting
- **Meaning:** Missing permissions, stale snapshots, or unresolvable dependencies must be explicitly flagged.
- **Why it exists:** Unknown does not mean safe. Partial discovery must never be reported as safe.
- **Enforcement Layer:** Deterministic Context Completeness Engine calculates completeness score (0.0 to 1.0).
- **Validation Test:** Test 6 (`test_incomplete_discovery`).
- **Failure Behavior:** Investigation verdict automatically forced to `INSUFFICIENT_CONTEXT`.

### RULE-09: No Unsafe Approval
- **Meaning:** The agent must never emit an unqualified "SAFE" verdict for unverified infrastructure.
- **Why it exists:** Guarantees engineering rigor and prevents false sense of security.
- **Enforcement Layer:** Backend verdict enum permits only `BLOCK`, `INSUFFICIENT_CONTEXT`, or `READY_FOR_HUMAN_REVIEW`.
- **Validation Test:** Test 14 (`test_false_safe_manipulation`).
- **Failure Behavior:** System overrides any positive claim to `READY_FOR_HUMAN_REVIEW` or `BLOCK`.

### RULE-10: Mandatory Human Review
- **Meaning:** AEGIS provides diagnostic intelligence and recommended patches, but requires human sign-off.
- **Why it exists:** Human-in-the-loop governance for critical infrastructure operations.
- **Enforcement Layer:** Remediation outputs are serialized as downloadable patches or proposals only.
- **Validation Test:** Integration test verifying remediation artifact format.
- **Failure Behavior:** Automated apply endpoints return HTTP 405 Method Not Allowed.

### RULE-11: No Cross-Account Expansion
- **Meaning:** Agent cannot switch accounts or assume unapproved roles.
- **Why it exists:** Prevents privilege escalation and tenant isolation breaches.
- **Enforcement Layer:** STS caller identity token checked against active session configuration.
- **Validation Test:** Test 11 (`test_cross_account_expansion`).
- **Failure Behavior:** Session termination and alert logged.

### RULE-12: No Policy Override by Prompt
- **Meaning:** User prompt instructions cannot override deterministic security rules.
- **Why it exists:** Prevents prompt injection from overriding corporate security policies.
- **Enforcement Layer:** Backend Python policy engine runs *after* LLM output and enforces hard blocks.
- **Validation Test:** Test 1 (`test_direct_prompt_injection`).
- **Failure Behavior:** Deterministic `BLOCK` verdict maintained regardless of LLM text.

### RULE-13: Immutable Model & Tool Config
- **Meaning:** Untrusted callers cannot alter model ID, system prompt, or tool definitions at runtime.
- **Why it exists:** Prevents model manipulation attacks.
- **Enforcement Layer:** Sealed configuration singleton in backend.
- **Validation Test:** Test 12 (`test_config_manipulation`).
- **Failure Behavior:** Request rejected with HTTP 400 Bad Request.

### RULE-14: Auditability & Event Logging
- **Meaning:** All tool invocations, policy evaluations, and refusals are recorded in structured audit logs.
- **Why it exists:** Enables compliance, post-incident forensic analysis, and governance accountability.
- **Enforcement Layer:** Structured JSON logger writing to append-only audit store.
- **Validation Test:** Audit log verification test.
- **Failure Behavior:** If audit log write fails, investigation halts (fail-closed).

### RULE-15: Honest Reporting
- **Meaning:** Findings must clearly categorize facts, analytical inferences, recommendations, and unknowns.
- **Why it exists:** Empowers human engineers with transparent, explainable context.
- **Enforcement Layer:** Pydantic schema validation on all analytical response models.
- **Validation Test:** Response schema compliance test.
- **Failure Behavior:** Schema validation error triggers fallback parser.
