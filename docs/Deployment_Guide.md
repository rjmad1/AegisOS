# Deployment Guide

This guide details the deployment, configuration, and migration processes for the AI Workstation platform.

## 1. Prerequisites

Before installing the platform, ensure the following software is available on the host machine. The installation scripts will attempt to configure these via `winget` if missing:

- **Git** (v2.x+)
- **Node.js** (v24.x+)
- **Docker Desktop** (v29.x+) with WSL2 backend
- **Ollama** (v0.3.x+)

---

## 2. Interactive Bootstrap Setup

A third party can deploy the entire workstation suite on a clean machine by executing the interactive root-level bootstrap script:

```powershell
# Open an elevated PowerShell session (Run as Administrator)
# Clone the repository and run:
.\Bootstrap.ps1
```

### Bootstrap Workflow
1. **Privileges Check**: Ensures the session is running with administrative rights (required to register Windows services and modify machine environment variables).
2. **Profile Selection**: Asks the user which profile to load (`development`, `personal`, `enterprise`, `offline`).
3. **Platform Path Selection**: Prompt for the target `$PlatformRoot` directory (defaulting to `D:\AIPlatform` if drive D is present; otherwise, scans and suggests C or E alternatives).
4. **Credential Input**: Prompt for `GITHUB_TOKEN` and `TELEGRAM_BOT_TOKEN`. The tokens are encrypted at rest using machine-scope DPAPI.
5. **Execution**: Automatically invokes:
   - `automation/Install.ps1`: Downloads Astral `uv.exe` and sets up the standardized folder tree.
   - `automation/Configure.ps1`: Registers user and machine environment variables, configures NSSM service keys in the registry, and establishes user-profile junctions (`%USERPROFILE%\.openclaw` -> `$PlatformRoot`).
   - `automation/Validate.ps1`: Runs health checks, binds network sockets, and verifies local LLM generation.

---

## 3. Migration and Portability

If you need to move the platform installation from one partition or machine to another (e.g. migrating from `D:\AIPlatform` to `E:\AIPlatform` or a new machine):

```powershell
# Open an elevated PowerShell session
.\automation\Migrate.ps1 -SourcePath "D:\AIPlatform" -TargetPath "E:\AIPlatform"
```

### Migration Engine Process
1. **Service Suspension**: Automatically stops running services (`OpenClawService`, `LiteLLMService`, `OmniRouteService`, `Ollama`) to release file locks.
2. **File Migration**: Copies all folders and database blocks via robocopy with timestamps preserved.
3. **Path Rewriting**: Scans JSON/YAML configs in the new destination, replacing old paths with the new base path.
4. **Junction Redirection**: Deletes the old `%USERPROFILE%\.openclaw` directory junction and points it to the new path.
5. **SCM Registry Update**: Patches service working directories, executables, and stdout/stderr paths in the registry.
6. **Environment Update**: Rewrites the system/user variables for `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, and `OLLAMA_MODELS`.
7. **Service Resumption**: Restarts services and runs the validation check to verify migration success.
