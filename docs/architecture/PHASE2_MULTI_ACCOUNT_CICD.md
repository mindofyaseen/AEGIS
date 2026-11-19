# AEGIS Phase 2 — Multi-Account Discovery, CI/CD Gatekeeper & Threat Correlation

## 1. Executive Summary
Phase 2 extends AEGIS from single-account perimeter investigation to **enterprise-scale continuous security operations**. It delivers four foundational enterprise capabilities:
1. **CI/CD Pull Request Gatekeeper CLI:** Native command-line tool (`aegis_cli.py`) and GitHub Action workflow blocking insecure Terraform plans before merge.
2. **AWS Organizations Multi-Account Harvester:** Cross-account STS `AssumeRole` discovery aggregating topologies across organizational member accounts while strictly enforcing Rule 01 boundary isolation.
3. **AWS Security Hub & Amazon GuardDuty Threat Correlator:** Ingestion of AWS Security Finding Format (ASFF) and GuardDuty runtime events to escalate severity when active exploits strike nodes on evidenced attack paths.
4. **Automated Remediation PR & GitOps Patch Generator:** Synthesis of ready-to-merge Git branches, unified diff `.patch` files, and rich GitHub PR review payloads.

---

## 2. CI/CD Gatekeeper CLI (`cli/aegis_cli.py`)

### Usage & Command Syntax
```powershell
# Basic plan evaluation
python -m cli.aegis_cli --terraform-plan tfplan.json --fail-on-block

# Generate Markdown PR review comment
python -m cli.aegis_cli --terraform-plan tfplan.json --format markdown --output pr_comment.md --fail-on-block

# Export JSON report for downstream automation
python -m cli.aegis_cli --terraform-plan tfplan.json --format json
```

### Deterministic Exit Codes
- **`0`**: `READY_FOR_HUMAN_REVIEW` (Plan passes all perimeter security checks).
- **`1`**: `BLOCK` (Critical perimeter violation or evidenced attack path detected; CI pipeline halted).
- **`2`**: `INSUFFICIENT_CONTEXT` (Discovery telemetry missing, stale, or incomplete; merge refused).

---

## 3. Multi-Account Harvester (`services/aws_discovery/multi_account.py`)

### Cross-Account STS AssumeRole Architecture
```
+-----------------------------------+
|     AEGIS Master Scan Runner      |
|     (Account 237657481511)        |
+-----------------------------------+
                  |
     +------------+------------+
     | (sts:AssumeRole)        | (sts:AssumeRole)
     v                         v
+------------------------+  +------------------------+
| Account: 237657481511  |  | Account: 999888777666  |
| Role: AegisAuditRole   |  | Role: AegisAuditRole   |
| (Production Core)      |  | (Staging Workloads)    |
+------------------------+  +------------------------+
```

### Rule 01 Cross-Account Boundary Checks
If a user or script targets an account not present in `authorized_account_ids`, the harvester immediately isolates and rejects the account without execution, recording it under `unauthorized_accounts_rejected`.

---

## 4. Threat Correlation Engine (`services/security_engine/security_hub_correlator.py`)

### Correlating Active Runtime Threat with Graph Topology
When Amazon GuardDuty detects an active brute-force or privilege escalation alert:
$$\text{Threat}(t) \in \text{GuardDutyEvents}$$
The correlator checks if $t.\text{affected\_resource\_id} \in V_{\text{AttackPath}}$:
1. If **True**: An active attacker is actively traversing an evidenced path! Generates `SEC-THREAT-01` with `CRITICAL` severity and immediate isolation recommendations.
2. If **False**: Generates `SEC-THREAT-02` with standard posture severity.

---

## 5. Automated GitOps PR Generator (`services/remediation_planner/pr_generator.py`)

For any actionable finding, AEGIS automatically generates:
- **Git Branch:** `aegis/security-patch-{resource-id}`
- **Commit Message:** Conventional commit formatted (`fix(security): ...`)
- **Unified Diff:** Standard unified diff format ready for `git apply`
- **Verification Checklist:** Pre/post verification steps to confirm zero regression.
