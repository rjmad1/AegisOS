# Operations Guide

This guide details the operational procedures, logging mechanisms, monitoring, and scheduled maintenance tasks for the AI Workstation platform.

## 1. Service Management

The system manages runtime components as Windows Services using NSSM wrappers.

### Checking Service Status
To quickly check service configurations, query their SCM registration:
```powershell
Get-Service -Name "Ollama", "LiteLLMService", "OpenClawService", "OmniRouteService"
```

### Scripted Health Check Monitoring
The lightweight monitoring script `automation/HealthCheck.ps1` runs in the background or can be mapped as a Windows service to verify service uptime and restart halted components automatically.
To run it manually:
```powershell
.\automation\HealthCheck.ps1 -PlatformRoot "D:\AIPlatform"
```

---

## 2. Logs Architecture

Logs are consolidated under `$PlatformRoot\logs\` and rotated to prevent disk space exhaustion:

| Service | Log File Target | Rotation Method |
|---|---|---|
| **Ollama** | Checked via Windows Event Log / AppData | Managed natively by Ollama |
| **LiteLLM** | `$PlatformRoot\logs\litellm\LiteLLMService.log` | Rotated by NSSM parameters |
| **OpenClaw** | `$PlatformRoot\logs\openclaw\OpenClawService.log` | Rotated by NSSM parameters |
| **OmniRoute** | `$PlatformRoot\logs\OmniRouteService.log` | Rotated by NSSM parameters |
| **Health Check** | `$PlatformRoot\logs\health\monitor.log` | Cleared weekly by scheduled tasks |

To inspect system diagnostics and errors:
```powershell
Get-Content -Path "D:\AIPlatform\logs\openclaw\OpenClawService_error.log" -Tail 50
```

---

## 3. Scheduled Maintenance Tasks

Two primary maintenance tasks are registered in the Windows Task Scheduler:

### A. OllamaModelSync
* **Schedule**: Daily at 02:00
* **Action**: Executes `D:\AIPlatform\scripts\gollama-sync.bat`
* **Purpose**: Updates local GGUF model files and saves a fresh manifest list of available weights.

### B. PlatformBackupTask (Optional)
* **Schedule**: Weekly on Sunday at 00:00
* **Action**: Executes `automation/Backup.ps1`
* **Purpose**: Compresses configurations, databases, and Docker volumes, and exports them to the secondary drive or cloud backup target.
