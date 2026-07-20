# Operations Guide

| Metadata | Value |
|---|---|
| **Document ID** | OG-2026-001 |
| **Version** | 1.2.0 (Active) |
| **Last Synced** | 2026-07-20 05:40:00 |
| **Classification** | Public — Operations Runbook |
| **Authority** | Platform Operations Board |

This guide details the operational procedures, service administration, logs directories, and backup maintenance routines for AegisOS.

---

## 1. Service Management

The system manages runtime components as Windows Services using NSSM wrappers or Docker Compose. 

### SCM Service Controls (Elevated PowerShell)
Use standard service commands to start, stop, or query active dependencies:
- **Start All AegisOS Services**:
  ```powershell
  Start-Service -Name "Ollama", "Redis", "LiteLLMService", "AegisOSService", "OmniRouteService"
  ```
- **Stop All AegisOS Services**:
  ```powershell
  Stop-Service -Name "Ollama", "Redis", "LiteLLMService", "AegisOSService", "OmniRouteService" -Force
  ```
- **Query Network Bindings**:
  Check if the ports required by Layer 2 and Layer 5 services are listening:
  ```powershell
  Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 11434, 4000, 18789, 3000 }
  ```

---

## 2. Logs Architecture

Logs are consolidated under the platform root directory (`D:\AIPlatform\logs\` or configured base) and rotated daily via NSSM configurations:

| Subsystem / Service | Log Target Path | Rotation Rules |
|---|---|---|
| **Ollama Inference** | AppData Windows Event Log | Managed natively by Ollama daemon |
| **LiteLLM Routing** | `$PlatformRoot\logs\litellm\LiteLLMService.log` | Rotated by NSSM at 10MB limit |
| **AegisOS Gateway** | `$PlatformRoot\logs\aegisos\AegisOSService.log` | Rotated by NSSM at 10MB limit |
| **OmniRoute Dashboard**| `$PlatformRoot\logs\OmniRouteService.log` | Rotated by NSSM at 5MB limit |
| **Self-Healer Daemon** | `$PlatformRoot\logs\health\monitor.log` | Trimmed weekly by scheduled tasks |

To inspect recent system exceptions or traces:
```powershell
Get-Content -Path "D:\AIPlatform\logs\aegisos\AegisOSService.log" -Tail 100 -Wait
```

---

## 3. Database Administration & Backup Sizing

AegisOS stores state and metadata locally using relational persistence (SQLite for dev, PostgreSQL for production) defined via Prisma.
- **SQLite Database file**: Located at `$PlatformRoot\databases\dev.db`.
- **Database Sizing Check**: Run the health checker script to determine current disk allocations:
  ```powershell
  .\automation\HealthCheck.ps1 -PlatformRoot "D:\AIPlatform"
  ```

### Pre-Upgrade Backup Procedures
Always snapshot data before running Prisma migrations:
1. **Service Suspension**:
   Stop client traffic to release file locks:
   ```powershell
   Stop-Service -Name "AegisOSService" -Force
   ```
2. **Snapshot Persistence**:
   Copy the relational database file to the backup directory:
   ```powershell
   Copy-Item "D:\AIPlatform\databases\dev.db" "D:\AIPlatform\backups\dev_db_backup.db" -Force
   ```
3. **Trigger Migration**:
   ```bash
   npx prisma db push
   ```
4. **Service Resumption**:
   ```powershell
   Start-Service -Name "AegisOSService"
   ```

---

## 4. Scheduled Maintenance Tasks

Two core tasks are registered in the Windows Task Scheduler to guarantee resource availability:

### A. OllamaModelSync
- **Trigger**: Daily at 02:00
- **Command**: Executes `D:\AIPlatform\scripts\gollama-sync.bat`
- **Purpose**: Checks the remote model registry, updates GGUF quants, and generates a fresh JSON models manifest.

### B. PlatformBackupTask
- **Trigger**: Weekly on Sunday at 00:00
- **Command**: Run `automation/Backup.ps1`
- **Purpose**: Creates compressed archives (`.zip`) containing configuration YAMLs, SQLite databases, and user upload storage, saving them to the secondary backup partition.
