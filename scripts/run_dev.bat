@echo off
REM AEGIS Development Server Launcher (Batch File)
REM Double-click to start AEGIS backend and web console.
cd /d "%~dp0\.."
echo ==========================================================
echo    Starting AEGIS Platform at http://localhost:8000
echo    Press Ctrl+C to terminate the server.
echo ==========================================================
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
pause
