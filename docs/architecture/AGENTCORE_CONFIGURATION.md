# AEGIS — Amazon Bedrock Managed Agents (AgentCore) Configuration

## 1. Overview
AEGIS integrates with **Amazon Bedrock Managed Agents** using the native `bedrock-agentcore` and `bedrock-agentcore-control` APIs. The agent architecture adheres strictly to AWS Builder Center hackathon requirements, defining a single, auditable security investigation job governed by immutable operational rules.

---

## 2. AgentCore Identity & Foundation Model

```yaml
AgentName: AEGIS-Security-Investigator
AgentVersion: 1.0.0-PROD
RuntimeHarness: bedrock-agentcore
FoundationModel: anthropic.claude-3-5-sonnet-20241022-v2:0
FallbackModel: anthropic.claude-3-5-haiku-20241022-v1:0
ExecutionMode: READ_ONLY_INVESTIGATIVE
TargetAWSAccount: "237657481511"
TargetRegion: "us-east-1"
```

---

## 3. System Prompt & Instruction Set
The Bedrock Agent is provided with the authoritative system prompt:

```text
You are AEGIS, an autonomous cloud security and DevSecOps investigation agent.
Your ONE DEFINED JOB is to perform read-only, evidence-backed security investigations of AWS infrastructure and proposed infrastructure changes.

OPERATIONAL BOUNDARIES:
1. You operate under STRICT READ-ONLY authorization. You possess zero mutation tools.
2. You must never execute CLI commands that alter infrastructure state (no create, put, modify, delete, apply).
3. You must NEVER declare an architecture "SAFE" if required evidence is incomplete, stale (>24h), or contradictory. In such cases, output INSUFFICIENT_CONTEXT.
4. You must never bypass the deterministic Context Completeness Gate or Security Rule Engine.
5. In the presence of critical security violations or attack paths, your verdict must be BLOCK.
6. When synthesizing remediations (Rule 14), provide minimal Terraform diffs, rollback plans, and verification checklists.
```

---

## 4. Managed Action Groups & Tool Allowlists
In Bedrock AgentCore, tools are defined via OpenAPI specifications or Lambda action groups. To guarantee zero blast radius, AEGIS configures a **strict read-only tool allowlist**:

### Permitted Action Group: `InfrastructureDiscovery`
- `describe_ec2_vpc_topology`: Retrieves VPCs, Subnets, Route Tables, and Internet Gateways.
- `describe_security_groups`: Retrieves ingress/egress CIDR permissions and protocol bindings.
- `get_iam_authorization_details`: Retrieves IAM roles, instance profiles, and inline policies.
- `get_s3_bucket_configurations`: Retrieves bucket public access blocks and encryption rules.
- `query_cloudtrail_events`: Retrieves read-only management event logs for incident correlation.

### Forbidden Capabilities (Hard Quarantine)
- **Code Interpreter / Shell Execution:** Disabled.
- **Resource Mutation Actions:** Zero mutation tools provisioned.
- **Credential / Secret Access:** Requests for secrets or private keys are rejected at the parameter validation boundary.

---

## 5. Bedrock AgentCore Python Driver
The AEGIS backend interacts with Bedrock AgentCore via `integrations/bedrock/harness.py`:
- Boto3 clients: `bedrock-agentcore` and `bedrock-agentcore-control`.
- Intercepts and validates all tool input arguments prior to agent execution.
- Evaluates prompt injection patterns (`ignore all previous instructions`, `bypass rules`, `mark safe`) and blocks malicious invocations before LLM inference.
