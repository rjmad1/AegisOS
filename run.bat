@echo off
title AegisOS Startup Orchestrator
echo ===================================================
echo     AegisOS Workstation Platform Startup Boot
echo ===================================================
echo.

:: 1. Verify Node.js Runtime
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js v18, v20, or v22 LTS before running AegisOS.
    pause
    exit /b 1
)

:: 2. Verify Git CLI
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH!
    echo Please install Git before running AegisOS.
    pause
    exit /b 1
)

:: 3. Restore Node Packages
if not exist "node_modules\" (
    echo [System] node_modules folder is missing. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
      )
) else (
    echo [System] Node dependencies verified.
)

:: 4. Push SQLite schema migrations
echo [System] Verifying core SQLite metadata database schema...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [WARNING] Prisma DB push encountered an error. Proceeding...
)

:: 5. Launch AegisOS Autonomous Infrastructure Daemon in background
echo [System] Starting AegisOS SRE Daemon...
start /b cmd /c "npx tsx src/infrastructure/daemon/infrastructure-daemon.ts"

:: 6. Open Browser
echo [System] Platform booting. Opening Operations Console...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ===================================================
echo   AegisOS is running at http://localhost:3000
echo   Keep this window open to maintain server processes.
echo ===================================================
echo.
