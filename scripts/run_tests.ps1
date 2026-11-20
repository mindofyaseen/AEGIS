# AEGIS Automated Test Suite Runner (PowerShell)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Executing AEGIS Complete Test Battery (90 Tests)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

python -m pytest tests/ -v
