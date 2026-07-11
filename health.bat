@echo off
:: Health Check Launcher Wrapper.
:: MUST BE RUN AS ADMINISTRATOR.

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click and choose "Run as Administrator".
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0automation\HealthCheckProduction.ps1"
exit /b %errorlevel%
