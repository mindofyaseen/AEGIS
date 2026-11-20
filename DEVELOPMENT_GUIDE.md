# AEGIS — Local Development & Evaluator Guide

## Prerequisites
- **Python 3.12+**
- **Node.js 20+** & npm (for building the web UI)
- **AWS CLI v2** (optional; the synthetic discovery engine runs completely offline with zero AWS charges)
- **Git**

---

## Quickstart (Zero Configuration)

### 1. Automated Launch (Windows)
Double-click:
- `scripts\run_dev.bat` to launch the local API server and web console on `http://localhost:8000`.
- `scripts\run_tests.bat` to run the complete 90-test automated verification suite.
- `scripts\run_cli.bat` to execute the CI/CD Gatekeeper CLI on a sample vulnerable infrastructure plan.

### 2. Manual Terminal Setup

#### A. Python Environment
```bash
# Clone the repository
git clone https://github.com/mindofyaseen/AEGIS.git
cd AEGIS

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### B. Frontend Build (Optional — pre-built bundle is already included)
```bash
cd apps/web
npm install
npm run build
cd ../..
```

#### C. Run the Complete Test Battery
```bash
python -m pytest tests/ -v
```

#### D. Start the Unified Server
```bash
python backend/api/main.py
# Server starts on http://localhost:8000
```
Visit `http://localhost:8000` in your browser. The FastAPI server automatically serves the compiled React web console and all API endpoints.

---

## Running CI/CD Gatekeeper CLI

Evaluate Infrastructure as Code (IaC) or live AWS topology before deployment:
```bash
# Evaluate sample topology with gatekeeper exit code
python cli/aegis_cli.py --topology fixtures/aws_topologies/ecommerce_vpc.json --fail-on-block

# Evaluate a Terraform plan JSON
python cli/aegis_cli.py --terraform-plan fixtures/terraform_plans/vulnerable_bastion_plan.json --fail-on-block
```

---

## Safety & Governance Guidelines
- **Zero Billable AWS Spend:** AEGIS operates by default in synthetic mode with zero cloud charges.
- **Strict Read-Only Operations:** When pointed at a live AWS account, all discovery actions are strictly read-only (`Describe*`, `Get*`, `List*`). Zero mutation commands exist in the agent tool inventory.
- **Credential Protection:** Secrets and AWS keys are scrubbed and quarantined; never commit `.env` or credential files.
