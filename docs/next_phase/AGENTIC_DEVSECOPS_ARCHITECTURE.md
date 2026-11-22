# AEGIS — Agentic DevSecOps Architecture
## Amazon Bedrock AgentCore Orchestration, Tool Boundaries & Policy Isolation

**Document Version:** 3.0-PHASE-0  
**Classification:** AI Systems & Agentic Safety Specification  

---

## 1. The Core AI Agentic Boundary Mandate

AEGIS enforces the strict architectural separation of **Probabilistic Reasoning** from **Deterministic Authority**:

```
+-----------------------------------------------------------------------------------+
|                        THE DUAL-ENGINE ARCHITECTURE                               |
|                                                                                   |
|  +-------------------------------------+   +-----------------------------------+  |
|  | ENGINE A: PROBABILISTIC AI AGENT    |   | ENGINE B: DETERMINISTIC ENGINE    |  |
|  | (Amazon Bedrock / Claude 3.5 Sonnet)|   | (Deterministic Python State Mach.)|  |
|  +-------------------------------------+   +-----------------------------------+  |
|  | - Natural language understanding    |   | - Context Completeness evaluation |  |
|  | - Question decomposition & planning |   | - Graph BFS attack path traversal |  |
|  | - Analytical narrative synthesis    |   | - Hard security rule verification |  |
|  | - Code diff explanation             |   | - FINAL VERDICT ARBITRATION       |  |
|  | - PR markdown body formatting       |   | - CI/CD EXIT CODE GENERATION      |  |
|  +-------------------------------------+   +-----------------------------------+  |
|                    │                                         │                    |
|                    ▼                                         ▼                    |
|  +-----------------------------------------------------------------------------+  |
|  | IMMUTABLE CONVERGENCE: The AI Agent CANNOT override or alter the Verdict   |  |
|  | mathematically computed by the Deterministic Engine (RULE-08 & RULE-12).   |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Tool Execution Lifecycle & Allowlist Gateway

Every natural language query processed by the Bedrock Agent follows a verified execution cycle:

```
[ Customer Prompt: "Is my Bastion host secure?" ]
                     │
                     ▼
[ Layer 4: Pre-Processor Quarantine Filter ]
  * Intercepts prompt injection triggers ("ignore previous instructions", "mark safe")
  * Validates system instructions are sealed
                     │
                     ▼
[ Bedrock AgentCore Orchestrator (Claude 3.5 Sonnet) ]
  * Analyzes intent: Requires resource inventory, graph relationships, and rule checks
  * Emits Tool Call: `aegis_inspect_resource_configuration(resource_id="sg-bastion")`
                     │
                     ▼
[ Layer 2: Tool Allowlist Gateway ]
  * Checks: Is tool in ALLOWED_TOOLS? -> YES
  * Checks: Is tool in FORBIDDEN_TOOLS? -> NO (Any shell/exec tool raises hard error)
                     │
                     ▼
[ In-Account Python Execution ]
  * Boto3 / NetworkX queries configuration; returns sanitized JSON
                     │
                     ▼
[ Deterministic Policy Engine ]
  * Detects Port 22 open to 0.0.0.0/0 -> Issues Verdict: BLOCK
                     │
                     ▼
[ Bedrock Agent Response Synthesis ]
  * Formulates grounded response: "AEGIS issued verdict BLOCK. Port 22 is exposed to 0.0.0.0/0. Synthesized Rule 14 patch."
```

---

## 3. Tool Inventory Specification

```python
# Strict Whitelist per RULE-03 & RULE-04
ALLOWED_TOOLS = {
    "aegis_get_resource_inventory": "Enumerate discovered AWS assets in-scope.",
    "aegis_inspect_resource_configuration": "Deep inspection of security groups, route tables, IAM policies.",
    "aegis_trace_attack_path": "Execute BFS traversal from ingress nodes to private assets.",
    "aegis_check_context_completeness": "Query mathematical completeness gate score.",
    "aegis_evaluate_security_rules": "Run 15 deterministic rule evaluators.",
    "aegis_get_remediation_plan": "Retrieve synthesized .patch diff and rollback steps.",
    "aegis_scan_application_source": "Run AST SAST/SCA inspection on authorized repository (New).",
    "aegis_scan_container_image": "Query ECR image CVE inspection results (New).",
    "aegis_inspect_kubernetes_cluster": "Query EKS cluster configuration & RBAC posture (New)."
}

FORBIDDEN_TOOLS = {
    "shell_exec", "bash", "cmd", "powershell",
    "terraform_apply", "cloudformation_deploy",
    "write_file", "edit_file", "delete_resource",
    "code_interpreter", "dump_credentials"
}
```
