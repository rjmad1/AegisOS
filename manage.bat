@echo off
:: Service Lifecycle Manager Wrapper.
:: MUST BE RUN AS ADMINISTRATOR.

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click and choose "Run as Administrator".
    pause
    exit /b 1
)

if "%~1"=="" (
    echo Usage: manage.bat [start ^| stop ^| restart ^| status] [service_name]
    echo Example: manage.bat status
    echo Example: manage.bat restart console
    echo Options for service_name: console, proxy, ollama, litellm, aegisos, omniroute, all
    exit /b 1
)

set ACTION=%~1
set SERVICE=%~2
if "%SERVICE%"=="" set SERVICE=all

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0automation\ManageService.ps1" -Action "%ACTION%" -Service "%SERVICE%"
exit /b %errorlevel%
