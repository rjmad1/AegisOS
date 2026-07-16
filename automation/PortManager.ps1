# PortManager.ps1
# Scans host for active listeners, resolves conflicts, and generates/updates .env and .env.local dynamically.

param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

function Write-LogMessage([string]$level, [string]$msg) {
    Write-Host "[$level] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
}

Write-LogMessage "INFO" "==================================================="
Write-LogMessage "INFO" "       Dynamic Port Resolver & Manager            "
Write-LogMessage "INFO" "==================================================="

# 1. Resolve paths
$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$registryPath = Join-Path $rootDir "configs\ports.json"
$envPath = Join-Path $rootDir ".env"
$envLocalPath = Join-Path $rootDir ".env.local"
$envProductionPath = Join-Path $rootDir ".env.production"

if (-not (Test-Path $registryPath)) {
    Write-LogMessage "ERROR" "Port registry file not found at: $registryPath"
    Exit 1
}

# 2. Parse Registry JSON
$registryContent = Get-Content $registryPath -Raw | ConvertFrom-Json
$services = $registryContent.psobject.properties | ForEach-Object { $_.Value }

$remappedPorts = @{}
$conflictFound = $false

# Helper to find next available port
function Get-NextAvailablePort([int]$startPort) {
    $port = $startPort
    while ($true) {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if (-not $conn) {
            return $port
        }
        $port++
    }
}

# 3. Scan each service's default host port
foreach ($service in $services) {
    $serviceName = $service.name
    $defaultPort = $service.default_host_port
    $resolvedPort = $defaultPort

    # Check active listeners on default host port
    $conn = Get-NetTCPConnection -LocalPort $defaultPort -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $conflictFound = $true
        # Identify owning process details
        $procId = $conn[0].OwningProcess
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }
        
        Write-LogMessage "WARN" "Conflict detected on port $defaultPort for service '$serviceName' (owned by process '$procName', PID: $procId)."

        # Apply remapping offset policies
        if ($defaultPort -eq 4000) {
            $resolvedPort = 14000 # LiteLLM remap
        } elseif ($defaultPort -eq 5432) {
            $resolvedPort = 15432 # PostgreSQL remap
        } elseif ($defaultPort -eq 6379) {
            $resolvedPort = 16379 # Redis remap
        } elseif ($defaultPort -eq 11434) {
            $resolvedPort = 21434 # Ollama remap
        } elseif ($service.dynamic) {
            # Find next free port starting from defaultPort + 1000
            $resolvedPort = Get-NextAvailablePort ($defaultPort + 1000)
        }
        
        Write-LogMessage "INFO" "Remapped host port for '$serviceName': $defaultPort -> $resolvedPort"
    } else {
        # Port is free
        Write-LogMessage "INFO" "Port $defaultPort for '$serviceName' is free."
    }

    $remappedPorts[$serviceName] = $resolvedPort
}

# 4. Update or generate .env / .env.local file
function Update-EnvFile([string]$path, [hashtable]$ports) {
    if (-not (Test-Path $path)) {
        Write-LogMessage "INFO" "File $path does not exist. Skipping."
        return
    }
    
    Write-LogMessage "INFO" "Updating environment configuration: $path"
    $lines = Get-Content $path
    $newLines = @()
    $updatedKeys = @{}

    # Update remapped HOST_PORT variables and dependent URLs
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#") -and $trimmed.Contains("=")) {
            $parts = $trimmed.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()

            # 1. Update direct host port variables
            if ($key.StartsWith("HOST_PORT_")) {
                $sName = $key.Substring(10).ToLower()
                if ($ports.ContainsKey($sName)) {
                    $newLines += "$key=$($ports[$sName])"
                    $updatedKeys[$key] = $true
                    continue
                }
            }

            # 2. Update dependent base URLs
            if ($key -eq "OLLAMA_BASE_URL" -or $key -eq "NEXT_PUBLIC_OLLAMA_URL") {
                $newLines += "$key=http://127.0.0.1:$($ports['ollama'])"
                $updatedKeys[$key] = $true
                continue
            }
            if ($key -eq "LITELLM_BASE_URL" -or $key -eq "NEXT_PUBLIC_LITELLM_URL") {
                $newLines += "$key=http://127.0.0.1:$($ports['litellm'])"
                $updatedKeys[$key] = $true
                continue
            }
            if ($key -eq "AEGISOS_BASE_URL" -or $key -eq "NEXT_PUBLIC_AEGISOS_URL" -or $key -eq "AEGISOS_URL") {
                $newLines += "$key=http://127.0.0.1:$($ports['aegisos'])"
                $updatedKeys[$key] = $true
                continue
            }
            if ($key -eq "NEXT_PUBLIC_APP_URL" -or $key -eq "CONSOLE_PUBLIC_URL") {
                # Keep protocol and host but replace port if Console was remapped
                $consolePort = $ports['console']
                if ($val -like "*localhost:*") {
                    $newLines += "$key=http://localhost:$consolePort"
                    $updatedKeys[$key] = $true
                    continue
                } elseif ($val -like "*127.0.0.1:*") {
                    $newLines += "$key=http://127.0.0.1:$consolePort"
                    $updatedKeys[$key] = $true
                    continue
                }
            }
        }
        $newLines += $line
    }

    # Add missing keys to the end of the file
    foreach ($serviceName in $ports.Keys) {
        $keyName = "HOST_PORT_" + $serviceName.ToUpper()
        if (-not $updatedKeys.ContainsKey($keyName)) {
            $newLines += "$keyName=$($ports[$serviceName])"
        }
    }

    # Add missing NEXT_PUBLIC_ keys for Next.js frontend resolution
    $nextPublicKeys = @{
        "NEXT_PUBLIC_OLLAMA_URL" = "http://127.0.0.1:$($ports['ollama'])"
        "NEXT_PUBLIC_LITELLM_URL" = "http://127.0.0.1:$($ports['litellm'])"
        "NEXT_PUBLIC_AEGISOS_URL" = "http://127.0.0.1:$($ports['aegisos'])"
    }
    foreach ($k in $nextPublicKeys.Keys) {
        if (-not $updatedKeys.ContainsKey($k)) {
            $newLines += "$k=$($nextPublicKeys[$k])"
        }
    }

    if (-not $DryRun) {
        $newLines | Out-File $path -Force -Encoding utf8
        Write-LogMessage "SUCCESS" "Successfully updated environment file: $path"
    } else {
        Write-LogMessage "INFO" "[DRY-RUN] Would write changes to $path"
    }
}

# Update all env files
Update-EnvFile $envPath $remappedPorts
Update-EnvFile $envLocalPath $remappedPorts
Update-EnvFile $envProductionPath $remappedPorts

# Output Conflict & Remapping Status for diagnostics
$statusObj = [ordered]@{
    ConflictDetected = $conflictFound
    Ports = $remappedPorts
}
return $statusObj
