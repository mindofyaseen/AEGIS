# AEGIS — Current Development Status
## Enterprise Cloud Security Operations & DevSecOps Platform

**Project:** AEGIS (AI-Native Autonomous Cloud Security & DevSecOps Platform)  
**Hackathon Track:** Agents, your rules: Bedrock Managed Agents build (AWS Builder Center)  
**Author:** Muhammad Yaseen ([mindofyaseen](https://github.com/mindofyaseen))  
**Target AWS Account:** `237657481511` (us-east-1)  
**Current Spend:** **$0.00** (Preserved, $200 credits intact)  
**Last Updated:** November 20, 2026  
**Git Commit:** Clean `main` / `master` working tree ([GitHub Repository](https://github.com/mindofyaseen/AEGIS))  
**Live Production URL:** [https://d3qd3kvh1ajueo.cloudfront.net](https://d3qd3kvh1ajueo.cloudfront.net)  
**AWS S3 Origin:** `s3://aegis-security-platform-237657481511-us-east-1`  
**CloudFront Distribution ID:** `E79KRZGHH2T8F`  

---

## 1. What Is Working & Production-Ready

- **Complete Unslop & UI-UX Pro Max Design Overhaul:**
  - Fully refactored across all 11 core workspaces based on [heydamir/unslop](https://github.com/heydamir/unslop) and [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
  - Eliminated all AI design slop: zero neon glowing boxes, zero saturated gradients, zero pulsing dots on static text, zero emojis in headers/buttons.
  - Implemented the disciplined **Graphite Neutral Ramp** (`#0A0C10` base, `#0F1218` quiet chrome, `#141822` matte panels, `rgba(255,255,255,0.08)` 1px hairlines).
  - Clean sentence-case typography, tactile solid off-white buttons (`bg-zinc-100 hover:bg-white text-zinc-950`), and iOS/Linear-grade segmented switchers.
- **Dual Audience Experience (Executive vs. SecOps Mode):**
  - **Executive Business View:** Plain-English risk impact, regulatory exposure, and tabular monetary liability metrics (`$1,420,000+`).
  - **SecOps Technical View:** Deep network attributes, IAM policy statements, raw resource ARNs, and full forensic metadata.
- **Interactive 3D Spatial Infrastructure Explorer (`InfrastructureScene3D.tsx`):**
  - Three.js WebGL spatial scene with OrbitControls, directional lighting, and fog.
  - VPC ground platform with Public Subnet DMZ and Private Subnet bounding planes.
  - 3D meshes for EC2, S3/RDS, IAM roles, and network gateways with raycaster tooltips and layer filters.
  - Clean 2D Cytoscape schematic graph toggle.
- **11 Dedicated Enterprise Workspaces:**
  1. *Executive Overview / Security Command Center*
  2. *Infrastructure Explorer (3D WebGL & 2D Schematic with Split Inspector)*
  3. *Security Findings Workspace (Full-text search, severity filters, CIS/SOC 2 tags)*
  4. *Attack Path Intelligence (Multi-hop lateral movement & blast radius)*
  5. *Change Intelligence (Terraform & CloudFormation/CDK pre-deployment AST analysis)*
  6. *Incident Investigation (CloudTrail management event forensics)*
  7. *Remediation Workspace (Rule 14 diff patches, rollback plans, GitHub PR synthesis)*
  8. *Agent Command Center (Bedrock AgentCore console, tool traces, refusal audits)*
  9. *Agent Governance & Security (15 deterministic rules, 5 enforcement layers, Bedrock Guardrail spec)*
  10. *Adversarial Testing Laboratory (14 automated red-team test scenarios)*
  11. *Regulatory Compliance & Audit (CIS AWS Foundations v3.0, SOC 2, PCI-DSS scorecards)*
- **Automated Test Battery:** **90 / 90 tests passing cleanly in ~5.6s** (100% pass rate).
- **CI/CD Gatekeeper CLI (`cli/aegis_cli.py`):**
  - Standalone CLI evaluating Terraform plan AST, CloudFormation templates, and topology files.
  - Returns deterministic exit codes (`0` for PASS, `1` for BLOCK).
- **Zero-Mutation Enforcement:** Read-only IAM boundaries, $0.00 actual AWS spend, zero production mutation tools.
- **Convenient 1-Click Launchers (`scripts/`):**
  - `run_dev.ps1` / `run_dev.bat` for instantaneous local launch.
  - `run_tests.ps1` / `run_tests.bat` for one-click verification.
  - `run_cli.bat` for CLI gatekeeper demonstration.

---

## 2. Test Verification Matrix (90 / 90 Passed)

| Test Category | File Path | Total Tests | Passed | Execution Time |
| :--- | :--- | :--- | :--- | :--- |
| **Adversarial Red-Team Suite** | `tests/adversarial/test_adversarial_suite.py` | 14 | 14 | ~2.0s |
| **Unified E2E Pipeline & Performance** | `tests/e2e/test_phase1_phase2_unified_pipeline.py` | 3 | 3 | ~0.5s |
| **FastAPI Integration & SPA** | `tests/integration/test_api_endpoints.py` | 19 | 19 | ~0.8s |
| **CI/CD Gatekeeper CLI** | `tests/phase2/test_cli_gatekeeper.py` | 8 | 8 | ~0.5s |
| **AWS Organizations Multi-Account** | `tests/phase2/test_multi_account.py` | 3 | 3 | ~0.05s |
| **Security Hub & GuardDuty Correlator** | `tests/phase2/test_security_hub_correlator.py` | 2 | 2 | ~0.05s |
| **Remediation PR Generator** | `tests/phase2/test_pr_generator.py` | 1 | 1 | ~0.05s |
| **Attack Path Tracer Unit** | `tests/unit/test_attack_path_tracer.py` | 3 | 3 | ~0.05s |
| **Bedrock Harness Unit** | `tests/unit/test_bedrock_harness.py` | 5 | 5 | ~0.15s |
| **CloudFormation & CDK Analyzer** | `tests/unit/test_cloudformation_analyzer.py` | 5 | 5 | ~0.18s |
| **CIS v3.0 & SOC 2 Compliance Mapper** | `tests/unit/test_compliance_mapper.py` | 2 | 2 | ~0.15s |
| **Context Completeness Gate** | `tests/unit/test_context_completeness.py` | 5 | 5 | ~0.05s |
| **GitHub PR Bot Commenter** | `tests/unit/test_github_bot.py` | 2 | 2 | ~0.20s |
| **Bedrock Guardrails Generator** | `tests/unit/test_guardrails_generator.py` | 2 | 2 | ~0.05s |
| **Rule 14 Remediation Planner** | `tests/unit/test_remediation_planner.py` | 4 | 4 | ~0.05s |
| **AWS Organizations SCP Evaluator** | `tests/unit/test_scp_evaluator.py` | 3 | 3 | ~0.16s |
| **Terraform AST Change Analyzer** | `tests/unit/test_terraform_analyzer.py` | 4 | 4 | ~0.05s |
| **CloudTrail Timeline Engine** | `tests/unit/test_timeline_engine.py` | 3 | 3 | ~0.05s |
| **SecOps Webhook Notifier** | `tests/unit/test_webhook_notifier.py` | 2 | 2 | ~0.14s |
| **Total Test Suite** | | **90** | **90** | **~5.6s** |

---

## 3. How Any Evaluator / Judge Can Run the Platform

### Local Zero-Cost Execution (Synthetic Default)
1. Clone repo: `git clone https://github.com/mindofyaseen/AEGIS.git && cd AEGIS`
2. Install Python requirements: `pip install -r requirements.txt`
3. Launch: `python backend/api/main.py` (or double-click `scripts\run_dev.bat`)
4. Open browser: `http://localhost:8000` (FastAPI automatically serves the pre-built React SPA)
5. Run tests: `python -m pytest tests/` (or double-click `scripts\run_tests.bat`)

### Live CloudFront Web Interface
- Simply open: [https://d3qd3kvh1ajueo.cloudfront.net](https://d3qd3kvh1ajueo.cloudfront.net)
- Click **+ Connect AWS** in the top navigation bar to switch between 1-Click presets, input custom live AWS credentials, or upload custom IaC templates.
