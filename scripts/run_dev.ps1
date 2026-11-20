# AEGIS Development Server Launcher (PowerShell)
# Starts the AEGIS FastAPI server serving both API endpoints and the compiled React SPA.

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Starting AEGIS Platform at http://localhost:8000" -ForegroundColor Green
Write-Host "   Press Ctrl+C to terminate the server." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
