@echo off
:: Production Backup Wrapper.
:: MUST BE RUN AS ADMINISTRATOR.

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click and choose "Run as Administrator".
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0automation\BackupProduction.ps1"
if %errorlevel% neq 0 (
    echo [ERROR] Backup execution failed!
    pause
    exit /b %errorlevel%
)

pause
exit /b 0
