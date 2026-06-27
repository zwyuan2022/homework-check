@echo off
echo ========================================
echo Homework Check System - Starting...
echo ========================================

echo [1/3] Starting LiveKit Server...
start "LiveKit Server" cmd /c "%~dp0livekit-server.exe --config server/livekit.yaml"

echo [2/3] Waiting 3 seconds for LiveKit to be ready...
timeout /t 3 /nobreak >nul

echo [3/3] Starting backend service...
echo.
echo Access address: http://localhost:3000
echo (For other computers, use ipconfig to check this machine's IP)
echo ========================================
node server/index.js
pause
