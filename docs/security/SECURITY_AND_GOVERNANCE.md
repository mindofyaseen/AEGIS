# AEGIS — Security, Autonomy Modes & Governance Specification

---

## 1. Operating Modes & Autonomy Tiers

AEGIS features three distinct capability tiers:

### Mode 1 — Read-Only Investigation (Mandatory Default)
- **Status:** Active in Current Release.
- **Capabilities:** Discovery, in-memory graph modeling, BFS attack path tracing, Context Completeness Gate evaluation, deterministic rule checking, Rule 14 unified `.patch` synthesis.
- **Prohibitions:** Any mutation, deletion, or deployment command is strictly denied at both the IAM and agent harness level.

### Mode 2 — Human-Approved Remediation (Future Roadmap)
- **Status:** Optional Future Capability.
- **Requirements:** Requires customer to explicitly opt in, attach a separate scoped remediation IAM role, configure dual-engineer approval workflows, and sign off on synthesized GitHub PRs before execution.

### Mode 3 — Controlled Autonomous Operations (Long-Term Vision)
- **Status:** Research / Long-Term Vision.
- **Requirements:** Continuous operational verification, automated rollbacks, and high-confidence policy gates for low-risk ephemeral changes.

---

## 2. The 15 Codified Governance Rules

Enforced across all AEGIS components (defined in detail in `AEGIS_AGENT_RULES.md`):

1. **RULE-01 (Target Cloud Boundary):** Enforces authorized AWS account and region bounds.
2. **RULE-02 (Strict Read-Only Operations):** No mutation commands permitted.
3. **RULE-03 (Zero Production Mutation):** Zero destructive tools exist in agent schema.
4. **RULE-04 (Deterministic Knowledge Graph):** Graph edges require verified API provenance.
5. **RULE-05 (Evidence-Backed Findings):** Every finding references concrete resource IDs and timestamps.
6. **RULE-06 (Context Completeness Gate):** Refuses verdicts on incomplete telemetry ($\text{score} < 0.85$).
7. **RULE-07 (Stale Snapshot Rejection):** Rejects discovery snapshots older than 24 hours.
8. **RULE-08 (Risk-Based Verdict Arbitration):** Output restricted to three legal verdicts (`BLOCK`, `INSUFFICIENT_CONTEXT`, `READY_FOR_HUMAN_REVIEW`).
9. **RULE-09 (Multi-Hop Attack Path Analysis):** Traces lateral movement from internet ingress to private data.
10. **RULE-10 (Adversarial Prompt Resistance):** Quarantines prompt injection attacks embedded in IaC tags, comments, or prompts.
11. **RULE-11 (Sensitive Information Protection):** Masks secrets, access keys, and credentials.
12. **RULE-12 (Least Privilege IAM Scoping):** Flags and blocks wildcard administrator permissions on compute nodes.
13. **RULE-13 (Perimeter Ingress Hardening):** Blocks 0.0.0.0/0 ingress on ports 22 and 3389.
14. **RULE-14 (Human Review Confirmation):** Synthesizes minimal diff patches with verified rollback plans.
15. **RULE-15 (Immutable Audit Trail):** Records all investigation outputs with cryptographic hashes.
