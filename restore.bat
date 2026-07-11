@echo off
:: Production Restore Wrapper.
:: MUST BE RUN AS ADMINISTRATOR.

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click and choose "Run as Administrator".
    pause
    exit /b 1
)

if "%~1"=="" (
    echo Usage: restore.bat [path_to_backup_zip]
    echo Example: restore.bat D:\AI-Operations\backups\ConsoleBackup_20260711_120000.zip
    exit /b 1
)

set BACKUP_PATH=%~1

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0automation\RestoreProduction.ps1" -BackupPath "%BACKUP_PATH%"
if %errorlevel% neq 0 (
    echo [ERROR] Restore execution failed!
    pause
    exit /b %errorlevel%
)

pause
exit /b 0
