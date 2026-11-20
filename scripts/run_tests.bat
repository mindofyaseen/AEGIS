@echo off
REM AEGIS Test Suite Runner (Batch File)
cd /d "%~dp0\.."
echo ==========================================================
echo    Executing AEGIS Complete Test Battery (90 Tests)
echo ==========================================================
python -m pytest tests/ -v
pause
