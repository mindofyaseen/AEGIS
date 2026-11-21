# AEGIS — Amazon Bedrock AgentCore Deployment & Managed Runtime
## Architecture, Tool Allowlisting & Model Invocation Model

---

## 1. Managed Agent Architecture

AEGIS integrates with **Amazon Bedrock Managed Agents (AgentCore)** to provide structured AI orchestration, tool execution, and natural language explanation without allowing raw model hallucination to dictate security outcomes.

```
+-----------------------------------------------------------------------------------+
|                        AEGIS AGENTCORE EXECUTION HARNESS                          |
|                                                                                   |
|  [ User Prompt / Security Query ]                                                 |
|                 │                                                                 |
|                 ▼                                                                 |
|  +-----------------------------------------------------------------------------+  |
|  | LAYER 4: PRE-PROCESSOR QUARANTINE FILTER                                    |  |
|  | * Scans for prompt injection attacks ("ignore rules", "mark safe")          |  |
|  | * Enforces immutable system prompt instructions                             |  |
|  +-----------------------------------------------------------------------------+  |
|                 │                                                                 |
|                 ▼                                                                 |
|  +-----------------------------------------------------------------------------+  |
|  | BEDROCK MANAGED AGENT (Claude 3.5 Sonnet / Haiku)                           |  |
|  | * Orchestrates investigation questions                                       |  |
|  | * Formulates structured tool invocation calls                                |  |
|  +-----------------------------------------------------------------------------+  |
|                 │                                                                 |
|                 ▼                                                                 |
|  +-----------------------------------------------------------------------------+  |
|  | LAYER 2: STRICT TOOL DISPATCH GATEWAY                                        |  |
|  | * Validates tool name against ALLOWED_TOOLS whitelist                       |  |
|  | * Hard block on FORBIDDEN_TOOLS (shell_exec, terraform_apply, write_file)   |  |
|  +-----------------------------------------------------------------------------+  |
|                 │                                                                 |
|                 ▼ (Allowlisted Tools Only)                                        |
|  +-----------------------------------------------------------------------------+  |
|  | DETERMINISTIC AEGIS ENGINES (Python Boto3 / NetworkX)                       |  |
|  | * aegis_get_resource_inventory                                              |  |
|  | * aegis_check_context_completeness                                          |  |
|  | * aegis_evaluate_security_rules                                             |  |
|  | * aegis_trace_attack_path                                                   |  |
|  | * aegis_get_remediation_plan                                                |  |
|  +-----------------------------------------------------------------------------+  |
|                 │                                                                 |
|                 ▼                                                                 |
|  +-----------------------------------------------------------------------------+  |
|  | DETERMINISTIC POLICY ARBITRATOR                                              |  |
|  | * Mathematically issues: BLOCK | INSUFFICIENT_CONTEXT | READY                |  |
|  | * Generates Rule 14 minimal .patch file & rollback runbook                  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Tool Permission Matrix

In strict enforcement of **RULE-03** and **RULE-04**:

### Explicitly Allowlisted Investigation Tools:
1. `aegis_get_resource_inventory`: Queries discovered AWS resources and configuration attributes.
2. `aegis_inspect_resource_configuration`: Deep-dives into specific security groups, route tables, or IAM policies.
3. `aegis_trace_attack_path`: Traces multi-hop BFS lateral movement routes from internet gateways.
4. `aegis_check_context_completeness`: Queries the mathematical completeness gate score and missing collectors.
5. `aegis_evaluate_security_rules`: Runs the 15 deterministic rule evaluators.
6. `aegis_get_remediation_plan`: Retrieves synthesized `.patch` diffs and rollback runbooks.

### Explicitly Forbidden Mutation Tools (Hard Deny):
- `terraform_apply`
- `cloudformation_deploy`
- `shell_exec` / `bash` / `cmd`
- `write_file` / `edit_file`
- `aws_cli_mutate`
- `code_interpreter`

Any invocation attempt of a forbidden tool immediately triggers a `SecurityEnforcementError` and records an immutable security audit event.
