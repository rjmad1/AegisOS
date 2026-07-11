# Disaster Recovery Guide

This guide documents the procedures for backing up and restoring the local AI Workstation platform.

## 1. Backup Orchestration

The weekly backup script `automation/Backup.ps1` extracts all user databases, configs, Docker volumes, and manifests, saving them as a compressed archive under `$PlatformRoot\backups\`:

```powershell
# Run backup manually
.\automation\Backup.ps1 -PlatformRoot "D:\AIPlatform"
```

### Backup Inventory
Each backup archive contains:
- `Config/`: LiteLLM config.yaml, openclaw.json, version definitions.
- `Database/`: `openclaw-agent.sqlite` and a compressed backup of the Open-WebUI database volume (`open_webui_data.zip`).
- `secrets/`: Encrypted credentials (stored if machine-recovery is matching).
- `*.reg`: Services NSSM parameter keys exported from the registry.

---

## 2. Restoration and Reconstruction

In the event of hardware failure, database corruption, or system migration, a recovery process can be triggered:

```powershell
# Open an elevated PowerShell session
.\automation\Restore.ps1 -BackupPath "D:\AIPlatform\backups\Backup_20260708_190733" -PlatformRoot "D:\AIPlatform" -Mode "SafeRestore"
```

### Recovery Modes
1. **SafeRestore** (Default): Restores files and databases. Skips rewriting existing data if folders are present and healthy.
2. **FullRecovery**: Overwrites active configs, databases, and Docker volumes with backup snapshots. Re-pulls model weights.
3. **Repair**: Attempts to re-link junctions and re-register system services registry items without overwriting databases.
4. **ForceRecovery**: Resets the entire installation, cleans active DB folders, unpacks backups, and runs full validations.

### DPAPI Secrets Recovery on Host Mismatch
Because secrets are encrypted with the host machine's DPAPI keys, copying the backup `secrets/` to a *new* physical machine will prevent LiteLLM and OpenClaw from reading GITHUB or TELEGRAM tokens.
If a host mismatch is detected:
1. `Restore.ps1` reports a DPAPI verification warning.
2. The user is prompted interactively to enter their `GITHUB_TOKEN` and `TELEGRAM_BOT_TOKEN`.
3. The new inputs are encrypted on the *current* machine scope and saved to `$PlatformRoot\secrets\OpenClaw_secrets.enc` securely.
