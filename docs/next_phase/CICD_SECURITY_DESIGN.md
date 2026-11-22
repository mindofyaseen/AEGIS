# CI/CD PIPELINE SECURITY & GATEKEEPER SPECIFICATION
**Document ID:** `AEGIS-ARCH-011`  
**Domain:** DevSecOps Shift-Left, CI/CD Gatekeeper, GitHub Actions, GitLab CI  
**Author:** Principal DevSecOps Engineer  
**Status:** Architecture Blueprint / Discovery Phase  

---

## 1. Executive Summary & Core Objective

Securing cloud infrastructure after deployment is reactive and expensive. The primary mission of an Autonomous DevSecOps Engineer is to shift security left into the software delivery pipeline, intercepting security regressions, vulnerable dependencies, leaked credentials, and risky Infrastructure-as-Code (IaC) changes *before* they are applied to production environments.

AEGIS delivers a native **CI/CD Security Gatekeeper** package that integrates directly into GitHub Actions and GitLab CI. Operating in pull request / merge request workflows, AEGIS scans IaC changes (Terraform plan JSON, CloudFormation diffs), evaluates static application vulnerabilities (SAST/SCA), checks for committed secrets, and compares proposed infrastructure against the live cloud graph to determine if a PR introduces new attack paths.

---

## 2. GitHub Action Architecture (`action.yml`)

AEGIS provides an official GitHub Action that runs as a lightweight composite or containerized action.

### 2.1 Action Specification
```yaml
# .github/actions/aegis-gatekeeper/action.yml
name: 'AEGIS DevSecOps Gatekeeper'
description: 'Autonomous cloud security and IaC gatekeeper for pull requests'
inputs:
  aegis_endpoint:
    description: 'Endpoint of the customer-deployed AEGIS API'
    required: false
    default: 'https://aegis.internal.company.com'
  api_key:
    description: 'AEGIS Machine-to-Machine API token'
    required: true
  terraform_plan_json:
    description: 'Path to Terraform plan JSON output'
    required: false
  fail_on_severity:
    description: 'Minimum severity to fail the CI build (LOW, MEDIUM, HIGH, CRITICAL)'
    required: false
    default: 'HIGH'
  mode:
    description: 'Execution mode (audit, gatekeeper)'
    required: false
    default: 'gatekeeper'
runs:
  using: 'docker'
  image: 'Dockerfile'
```

### 2.2 Secure Authentication via GitHub OIDC (No Static AWS Keys)
Rather than requiring customers to store long-lived AWS Access Keys in GitHub Secrets, AEGIS authenticates via AWS OIDC federation:
```yaml
# Example customer workflow: .github/workflows/devsecops.yml
name: Infrastructure Security Gate
on:
  pull_request:
    branches: [ main, production ]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  aegis-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/aegis-github-actions-role
          aws-region: us-east-1

      - name: Generate Terraform Plan JSON
        run: |
          terraform init
          terraform plan -out=tfplan.binary
          terraform show -json tfplan.binary > tfplan.json

      - name: Run AEGIS Gatekeeper
        uses: mindofyaseen/AEGIS/action@v2
        with:
          terraform_plan_json: tfplan.json
          fail_on_severity: HIGH
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 3. Pull Request Decision & Inline Comment Bot

### 3.1 Verdict Decision Matrix
| Condition | Exit Code | CI Status | PR Action |
| :--- | :--- | :--- | :--- |
| Zero findings or Low severity only | `0` | **PASS (Green)** | Automated comment: "No security regressions detected." |
| Medium severity findings | `0` | **WARN (Yellow)** | Inline comment warning developers of best practice deviations. |
| High severity (e.g. unencrypted S3, IMDSv1) | `1` | **FAIL / BLOCK (Red)** | Blocks PR merge if Branch Protection rule requires AEGIS pass. |
| Critical / New Attack Path to Crown Jewel | `2` | **CRITICAL BLOCK** | Immediate blocker, notifies Security Ops channel, attaches remediation diff. |

### 3.2 Automated Pull Request Comment Format
When AEGIS detects a regression, it posts a structured GitHub PR review comment:

> ### 🛡️ AEGIS Security Gatekeeper Verdict: **FAILED**
> **Summary:** 1 Critical, 1 High security regression detected in proposed Terraform changes.
> 
> #### 🚨 Critical Findings:
> 1. **New Public Ingress Rule (Port 22 Open to `0.0.0.0/0`)**
>    - **File:** `terraform/modules/bastion/sg.tf#L14-L22`
>    - **Impact:** Directly connects Bastion EC2 to public attack surface; creates new attack path to private RDS database.
>    - **Blast Radius:** Critical (Exposes VPC Internal CIDR `10.0.0.0/16`).
>    - **Suggested Fix:**
>    ```diff
>    - cidr_blocks = ["0.0.0.0/0"]
>    + cidr_blocks = ["198.51.100.0/24"] # Corporate VPN CIDR
>    ```
> 
> ---
> *Evaluated against Corporate Cloud Security Policy v2.4 (Context Completeness: 100%)*

---

## 4. Pipeline Performance SLA

CI pipelines must be fast to maintain developer velocity. AEGIS enforces a strict **45-second SLA** for PR checks:
- **Local AST / Plan Parsing**: 2 - 5 seconds.
- **Rule Engine Matching (Deterministic)**: 3 - 8 seconds.
- **Delta Graph Traversal (Attack Path Simulation)**: 5 - 12 seconds.
- **AI Recommendation Generation (Bedrock Claude 3.5 Sonnet)**: 10 - 20 seconds.
- **Total End-to-End Execution**: $< 45\text{ seconds}$.
