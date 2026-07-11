@echo off
:: Production Deployment Launcher for AI Operations Console.
:: MUST BE RUN AS ADMINISTRATOR.

echo ===================================================
echo     AI Operations Console Deployer Wrapper
echo ===================================================
echo.

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click and choose "Run as Administrator".
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0automation\DeployProduction.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Deployment failed! See logs above.
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Deployment launcher execution complete.
pause
exit /b 0
