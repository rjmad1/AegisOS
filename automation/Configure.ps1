<#
.SYNOPSIS
    Configures SCM services, NSSM registries parameters, environment variables, and user folder junctions.
.PARAMETER PlatformRoot
    Target base directory for platform configurations.
.PARAMETER DryRun
    Simulate actions without modifying registries or filesystem junctions.
.PARAMETER VerboseLog
    Enable detail logging.
.EXAMPLE
    .\automation\Configure.ps1 -PlatformRoot "D:\AIPlatform"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseLog
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Configuration Engine     "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# Load authoritative port configurations
$registryPath = Join-Path $PSScriptRoot "..\configs\ports.json"
if (Test-Path $registryPath) {
    $portsJson = Get-Content $registryPath -Raw | ConvertFrom-Json
    $ollamaPort = if ($env:HOST_PORT_OLLAMA) { $env:HOST_PORT_OLLAMA } else { $portsJson.ollama.default_host_port }
    $litellmPort = if ($env:HOST_PORT_LITELLM) { $env:HOST_PORT_LITELLM } else { $portsJson.litellm.default_host_port }
    $consolePort = if ($env:HOST_PORT_CONSOLE) { $env:HOST_PORT_CONSOLE } else { $portsJson.console.default_host_port }
} else {
    $ollamaPort = 11434
    $litellmPort = 4000
    $consolePort = 3000
}

# Ensure target folders exist
$configDir = Join-Path $PlatformRoot "configs"
$scriptsDir = Join-Path $PlatformRoot "scripts"
$logsDir = Join-Path $PlatformRoot "logs"

# 2. Write Registry backup
$rollbackDir = Join-Path $PlatformRoot "backups\rollback_backup"
if (-not (Test-Path $rollbackDir) -and -not $DryRun) {
    New-Item -ItemType Directory -Path $rollbackDir -Force | Out-Null
}

function Backup-RegistryKey($keyPath, $filename) {
    if (Test-Path $keyPath -and -not $DryRun) {
        $outFile = Join-Path $rollbackDir $filename
        Log-PlatformInfo "Backing up registry key $keyPath to $outFile..."
        $regPath = $keyPath.Replace("HKLM:\", "HKLM\")
        reg export "$regPath" "$outFile" /y | Out-Null
    }
}

Backup-RegistryKey "HKLM:\System\CurrentControlSet\Services\LiteLLMService\Parameters" "LiteLLMService_Parameters.reg"
Backup-RegistryKey "HKLM:\System\CurrentControlSet\Services\AegisOSService\Parameters" "AegisOSService_Parameters.reg"
Backup-RegistryKey "HKLM:\System\CurrentControlSet\Services\OmniRouteService\Parameters" "OmniRouteService_Parameters.reg"

# 3. Parameterize Environment Variables
Log-PlatformAction "Setting platform environment variables..."
if ($DryRun) {
    Log-PlatformAction "[DRY-RUN] Would register system environment variables:"
    Log-PlatformAction "  - AEGISOS_CONFIG_PATH = $(Join-Path $configDir 'aegisos\aegisos.json')"
    Log-PlatformAction "  - AEGISOS_STATE_DIR = $PlatformRoot"
    Log-PlatformAction "  - OLLAMA_MODELS = $(Join-Path $PlatformRoot 'models')"
    Log-PlatformAction "  - OLLAMA_HOST = 127.0.0.1"
} else {
    [System.Environment]::SetEnvironmentVariable("AEGISOS_CONFIG_PATH", (Join-Path $configDir "aegisos\aegisos.json"), "Machine")
    [System.Environment]::SetEnvironmentVariable("AEGISOS_STATE_DIR", $PlatformRoot, "Machine")
    [System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", (Join-Path $PlatformRoot "models"), "Machine")
    [System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "127.0.0.1", "Machine")
    
    [System.Environment]::SetEnvironmentVariable("AEGISOS_CONFIG_PATH", (Join-Path $configDir "aegisos\aegisos.json"), "User")
    [System.Environment]::SetEnvironmentVariable("AEGISOS_STATE_DIR", $PlatformRoot, "User")
    [System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "127.0.0.1", "User")
    
    Log-PlatformSuccess "System and User environment variables updated."
}

# 3.5. Configure Windows Firewall Inbound Rules
Log-PlatformAction "Configuring local network firewall rules..."
if ($DryRun) {
    Log-PlatformAction "[DRY-RUN] Would create block rules for ports 11434, 4000, and 3000 to isolate LAN access"
} else {
    try {
        $ruleNames = @("Block_Ollama_LAN", "Block_LiteLLM_LAN", "Block_Console_LAN")
        $ports = @($ollamaPort, $litellmPort, $consolePort)
        
        for ($i = 0; $i -lt $ruleNames.Length; $i++) {
            $name = $ruleNames[$i]
            $port = $ports[$i]
            $existing = Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
            if ($existing) {
                Log-PlatformInfo "Firewall rule '$name' already exists."
            } else {
                New-NetFirewallRule -Name $name -DisplayName $name -Description "Blocks unauthorized external LAN access to port $port" -Direction Inbound -LocalPort $port -Protocol TCP -Action Block -RemoteAddress Any -ErrorAction Stop | Out-Null
                Log-PlatformSuccess "Created firewall block rule: $name (Port $port)"
            }
        }
    } catch {
        Log-PlatformWarn "Failed to configure firewall rules: $_"
    }
}

# 4. Patch Services Registry Parameters (NSSM configuration)
Log-PlatformAction "Configuring SCM and NSSM parameters in Registry..."

# 4.0 Configure Scoped Service User
Log-PlatformAction "Configuring scoped service user..."
$serviceUser = "AI_Service_User"
$servicePass = "AegisPassword123!@#"
$existingUser = Get-LocalUser -Name $serviceUser -ErrorAction SilentlyContinue
if (-not $existingUser) {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would create local user '$serviceUser'"
    } else {
        $secPass = ConvertTo-SecureString $servicePass -AsPlainText -Force
        New-LocalUser -Name $serviceUser -Password $secPass -Description "Scoped runtime account for AegisOS Platform Services" -PasswordNeverExpires $true | Out-Null
        Log-PlatformSuccess "Scoped service user '$serviceUser' created."
    }
}

# Grant directory permissions
try {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would grant directory permissions to '$serviceUser' on $PlatformRoot"
    } else {
        $acl = Get-Acl $PlatformRoot
        $permission = "$env:COMPUTERNAME\$serviceUser", "FullControl", "ContainerInherit, ObjectInherit", "None", "Allow"
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
        $acl.SetAccessRule($accessRule)
        Set-Acl $PlatformRoot $acl
        Log-PlatformSuccess "Directory permissions granted to '$serviceUser' on $PlatformRoot."
    }
} catch {
    Log-PlatformWarn "Failed to set directory permissions: $_"
}

function Patch-NSSMProperty($service, $name, $value) {
    $keyPath = "HKLM:\System\CurrentControlSet\Services\$service\Parameters"
    if (Test-Path $keyPath) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] For service $service, set $name = $value"
        } else {
            Set-ItemProperty -Path $keyPath -Name $name -Value $value -Force
            Log-PlatformInfo "Updated $service Parameter '$name' to: $value"
        }
    }
}

# AegisOS
Patch-NSSMProperty "AegisOSService" "AppDirectory" $PlatformRoot
Patch-NSSMProperty "AegisOSService" "AppStdout" (Join-Path $logsDir "aegisos\AegisOSService.log")
Patch-NSSMProperty "AegisOSService" "AppStderr" (Join-Path $logsDir "aegisos\AegisOSService_error.log")

# LiteLLM
Patch-NSSMProperty "LiteLLMService" "AppDirectory" (Join-Path $configDir "litellm")
Patch-NSSMProperty "LiteLLMService" "AppParameters" "--config $(Join-Path $configDir 'litellm\config.yaml') --port $litellmPort --host 127.0.0.1"
Patch-NSSMProperty "LiteLLMService" "AppStdout" (Join-Path $logsDir "litellm\LiteLLMService.log")
Patch-NSSMProperty "LiteLLMService" "AppStderr" (Join-Path $logsDir "litellm\LiteLLMService_error.log")

# OmniRoute
Patch-NSSMProperty "OmniRouteService" "AppStdout" (Join-Path $logsDir "OmniRouteService.log")
Patch-NSSMProperty "OmniRouteService" "AppStderr" (Join-Path $logsDir "OmniRouteService_error.log")

# Set ObjectName credentials for registered services
if (-not $DryRun) {
    foreach ($svc in @("AegisOSService", "LiteLLMService", "OmniRouteService", "Ollama")) {
        $existing = Get-Service -Name $svc -ErrorAction SilentlyContinue
        if ($existing) {
            & sc.exe config $svc obj= "$env:COMPUTERNAME\$serviceUser" password= $servicePass | Out-Null
            Log-PlatformSuccess "Credentials configured for service: $svc"
        }
    }
}

# 5. Establish directory junctions
$srcJunction = Join-Path $env:USERPROFILE ".aegisos"
Log-PlatformAction "Checking local user directory junction ($srcJunction)..."
if (Test-Path $srcJunction) {
    $item = Get-Item $srcJunction
    $isJunction = $item.Attributes -match "ReparsePoint"
    if ($isJunction) {
        if ($item.Target -eq $PlatformRoot) {
            Log-PlatformInfo "Junction is already correct: $srcJunction -> $PlatformRoot"
        } else {
            Log-PlatformWarn "Junction exists but points to old target: $($item.Target). Recreating..."
            if ($DryRun) {
                Log-PlatformAction "[DRY-RUN] Would remove junction and recreate pointing to $PlatformRoot"
            } else {
                cmd.exe /c rmdir "$srcJunction" | Out-Null
                cmd.exe /c mklink /j "$srcJunction" "$PlatformRoot" | Out-Null
                Log-PlatformSuccess "Junction link C:\Users\<user>\.aegisos -> $PlatformRoot recreated successfully."
            }
        }
    } else {
        Log-PlatformWarn "A physical folder exists at $srcJunction. Backing up and establishing junction..."
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would backup physical folder at $srcJunction and link it"
        } else {
            $backupPath = $srcJunction + "_physical_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss")
            Rename-Item $srcJunction $backupPath -Force
            cmd.exe /c mklink /j "$srcJunction" "$PlatformRoot" | Out-Null
            Log-PlatformSuccess "Folder renamed to $backupPath and linked to $PlatformRoot."
        }
    }
} else {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would create junction: $srcJunction -> $PlatformRoot"
    } else {
        cmd.exe /c mklink /j "$srcJunction" "$PlatformRoot" | Out-Null
        Log-PlatformSuccess "Created directory junction: $srcJunction -> $PlatformRoot"
    }
}

# 6. Configure/Create Scheduled Tasks
Log-PlatformAction "Setting up scheduled tasks..."
$syncBat = Join-Path $scriptsDir "gollama-sync.bat"
if ($DryRun) {
    Log-PlatformAction "[DRY-RUN] Would configure scheduled task OllamaModelSync to run $syncBat"
} else {
    $existingTask = Get-ScheduledTask -TaskName "OllamaModelSync" -ErrorAction SilentlyContinue
    if ($existingTask) {
        $action = New-ScheduledTaskAction -Execute $syncBat
        Set-ScheduledTask -TaskName "OllamaModelSync" -Action $action | Out-Null
        Log-PlatformSuccess "Scheduled task OllamaModelSync updated."
    }
}

Log-PlatformSuccess "Platform configuration completed successfully."
Exit 0
