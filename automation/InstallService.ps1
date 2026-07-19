# InstallService.ps1
# Script to install the AegisOS Autonomous Infrastructure Manager as a Windows Service.
# MUST BE RUN IN AN ELEVATED POWERSHELL SESSION.

$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
if (Test-Path $HelperModule) {
    Import-Module $HelperModule -Force
}

# 1. Enforce elevated privileges
if ($env:BYPASS_ELEVATION -ne "true") {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "[ERROR] This script must be run from an Elevated/Administrator PowerShell session!"
        Exit 1
    }
}

$serviceName = "AegisOS-Infrastructure-Manager"
$platformRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$daemonScript = Join-Path $platformRoot "src\infrastructure\daemon\infrastructure-daemon.ts"
$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
    Write-Error "[ERROR] Node.js executable (node.exe) not found in system PATH!"
    Exit 1
}

Write-Host "Registering AegisOS Windows Service..." -ForegroundColor Cyan
Write-Host "Platform Root: $platformRoot" -ForegroundColor White
Write-Host "Node Path: $nodePath" -ForegroundColor White
Write-Host "Daemon Script: $daemonScript" -ForegroundColor White

# Create a local bin wrapper or download NSSM
$nssmDir = Join-Path $PSScriptRoot "libs\nssm"
$nssmExe = Join-Path $nssmDir "nssm.exe"

if (-not (Test-Path $nssmExe)) {
    Write-Host "Downloading NSSM wrapper tool..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $nssmDir -Force | Out-Null
    $zipPath = Join-Path $nssmDir "nssm.zip"
    
    try {
        # Using a reliable mirror/direct download link for NSSM
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $zipPath -TimeoutSec 30
        
        # Extract files
        Expand-Archive -Path $zipPath -DestinationPath $nssmDir -Force
        
        # Locate the 64-bit nssm.exe
        $extractedExe = Get-ChildItem -Path $nssmDir -Filter "nssm.exe" -Recurse | Select-Object -First 1
        if ($extractedExe) {
            Copy-Item -Path $extractedExe.FullName -Destination $nssmExe -Force
        }
        
        # Cleanup
        Remove-Item $zipPath -Force
    } catch {
        Write-Warning "Could not download NSSM from nssm.cc. Creating a background scheduled task as fallback..."
        # Fallback Task Scheduler configuration
        $action = New-ScheduledTaskAction -Execute $nodePath -Argument "node_modules/tsx/dist/cli.js src/infrastructure/daemon/infrastructure-daemon.ts" -WorkingDirectory $platformRoot
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        
        Register-ScheduledTask -TaskName "AegisOS-Infrastructure-Manager" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
        Write-Host "[SUCCESS] AegisOS daemon registered as background System Task on boot." -ForegroundColor Green
        Exit 0
    }
}

# If NSSM exists, install Windows Service
if (Test-Path $nssmExe) {
    # Remove service if already exists
    & $nssmExe remove $serviceName confirm | Out-Null
    
    # Install service
    & $nssmExe install $serviceName $nodePath "node_modules/tsx/dist/cli.js src/infrastructure/daemon/infrastructure-daemon.ts" | Out-Null
    & $nssmExe set $serviceName AppDirectory $platformRoot | Out-Null
    & $nssmExe set $serviceName Description "AegisOS Autonomous Infrastructure SRE Daemon" | Out-Null
    & $nssmExe set $serviceName Start SERVICE_AUTO_START | Out-Null
    
    # Configure recovery options
    & $nssmExe set $serviceName AppExit Default Restart | Out-Null
    & $nssmExe set $serviceName AppThrottle 1500 | Out-Null
    
    # Start the service
    Start-Service $serviceName -ErrorAction SilentlyContinue
    
    Write-Host "[SUCCESS] AegisOS Infrastructure Manager Service installed and started." -ForegroundColor Green
}
