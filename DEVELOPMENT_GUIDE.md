# AEGIS — Local Development Guide

## Prerequisites
- Python 3.12+ (Installed at `C:\Users\mindo\AppData\Local\Programs\Python\Python312\python.exe`)
- Node.js v20+ / v26+ (Installed at `C:\Program Files\nodejs\node.exe`)
- AWS CLI v2 with authenticated profile (Verified in `us-east-1`)
- Git

## Environment Setup

### 1. Python Virtual Environment
```powershell
cd "c:\Users\mindo\Documents\Builder Center\aegis"
& "C:\Users\mindo\AppData\Local\Programs\Python\Python312\python.exe" -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Running Local Unit Tests
```powershell
pytest tests/unit/ -v
```

### 3. Running Adversarial Stress Tests
```powershell
pytest tests/adversarial/ -v
```

### 4. Running the Local FastAPI Engine
```powershell
uvicorn backend.api.main:app --reload --port 8000
```

## Safety Guidelines for Solo Development
- Never commit AWS access keys, session tokens, or real client customer infrastructure dumps.
- Always run adversarial tests against synthetic fixtures first.
- Only run live read-only AWS discovery when explicitly requested.
- Maintain zero billable AWS resources during local development.
