@echo off
echo ========================================
echo   📚 作业检查系统 - 启动中...
echo ========================================

echo [1/3] 启动 LiveKit Server...
start "LiveKit Server" cmd /c "%~dp0livekit-server.exe --config server/livekit.yaml"

echo [2/3] 等待3秒让 LiveKit 就绪...
timeout /t 3 /nobreak >nul

echo [3/3] 启动后端服务...
echo.
echo 访问地址: http://localhost:3000
echo （其他电脑请用 ipconfig 查看本机 IP）
echo ========================================
node server/index.js
pause
