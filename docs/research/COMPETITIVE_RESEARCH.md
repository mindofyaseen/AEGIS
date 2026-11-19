# AEGIS — Competitive Research & Market Differentiation

## 1. Industry Landscape
Cloud security posture management (CSPM) and AI code assistants have matured significantly, yet a critical architectural void remains between static posture alerting and autonomous DevSecOps engineering.

```
                      HIGH CONTEXT / TOPOLOGY AWARE
                                   |
                                   |     ★ AEGIS
                                   |     (Evidence-backed Graph +
                                   |      Bedrock AgentCore +
                                   |      Completeness Gate)
          Wiz / Orca Security       |
          (Proprietary CSPM graph,  |
           Read-only, High Cost)    |
                                   |
  ---------------------------------+---------------------------------
  LOW AUTONOMY                     |                    HIGH AUTONOMY
  (Alerts Only)                    |                    (Actionable / Fixes)
                                   |
          Trivy / Checkov          |     Generic AI Chatbots
          (Static linters,         |     (Copilot, ChatGPT,
           No environment graph)   |      Hallucinates State,
                                   |      Unsafe Apply)
                                   |
                      LOW CONTEXT / ISOLATED FILES
```

---

## 2. Feature Comparison Matrix

| Capability | Static Linters (Checkov/Trivy) | Enterprise CSPM (Wiz/Prisma) | Generic AI Agents | **AEGIS (Bedrock AgentCore)** |
| :--- | :--- | :--- | :--- | :--- |
| **Multi-Hop Attack Path Tracing** | No (File-isolated) | Yes (Proprietary cloud) | No (Unaware of graph) | **Yes (Deterministic NetworkX)** |
| **Context Completeness Gate** | No | No (Silent failure) | No | **Yes (Mathematical Gate)** |
| **Honest Refusal on Incomplete Telemetry** | No (Reports false zero) | No | No (Hallucinates "Safe") | **Yes (`INSUFFICIENT_CONTEXT`)** |
| **Zero-Mutation Safety Guarantee** | Yes (Read-only) | Yes (Read-only) | No (Arbitrary bash risks) | **Yes (Immutable boundary)** |
| **Minimal Rule 14 Remediation Diffs** | No | Basic recommendations | Unverified code blocks | **Yes (Diff + Rollback + Test)** |
| **Prompt Injection Immunity in IaC** | N/A | N/A | Vulnerable | **Yes (AST Parser & Quarantine)** |
| **Cost per Evaluated Account** | Low | High Enterprise SaaS | API Tokens | **Minimal ($0.00 in hackathon)** |

---

## 3. Core Differentiator: The Completeness Gate
Every existing security tool suffers from the "Silent Green" fallacy: if an IAM collector lacks permissions or times out, the scanner reports 0 violations, and CI/CD merges the dangerous change.

AEGIS solves this permanently: **If evidence is incomplete, the verdict is `INSUFFICIENT_CONTEXT`, blocking production merge.**
