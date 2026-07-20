@echo off
:: AegisOS Git Push Sync Script
:: Syncs the committed changes to the remote repository.

echo ===================================================
echo     AegisOS Git Push Sync Launcher
echo ===================================================
echo.

:: Detect current branch name
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i

if "%BRANCH%"=="" (
    echo [ERROR] Could not detect current Git branch name. Are you in a Git repository?
    pause
    exit /b 1
)

echo Current branch detected: %BRANCH%
echo Running: git push origin %BRANCH%
echo.

git push origin %BRANCH%

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Git push failed! Please check your credentials/network and try again.
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Changes successfully pushed to origin/%BRANCH%.
pause
exit /b 0
