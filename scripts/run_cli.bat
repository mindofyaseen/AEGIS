@echo off
REM AEGIS CI/CD Gatekeeper CLI Demonstration (Batch File)
cd /d "%~dp0\.."
echo ==========================================================
echo    Running AEGIS CI/CD Gatekeeper on Sample Topology
echo ==========================================================
python cli\aegis_cli.py --topology fixtures\aws_topologies\ecommerce_vpc.json --fail-on-block
pause
