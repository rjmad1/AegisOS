# Deployment & Migration Guide

This guide details the deployment, configuration, and migration processes for the AegisOS AI Workstation platform.

> [!IMPORTANT]
> For standard installation, setup, and first-time onboarding instructions, please refer directly to the canonical **[AegisOS Installation & Getting Started Guide](../../../wiki/Install-Guide.md)**. Do not replicate standard installation steps in this document.

---

## Migration and Portability

If you need to move the platform installation from one partition or machine to another (e.g., migrating from `D:\AIPlatform` to `E:\AIPlatform` or onto a new machine), follow this migration procedure.

```powershell
# Open an elevated PowerShell session (Run as Administrator)
# Execute:
.\automation\Migrate.ps1 -SourcePath "D:\AIPlatform" -TargetPath "E:\AIPlatform"
```

### Migration Engine Process
1. **Service Suspension**: Automatically stops running services (`AegisOSService`, `LiteLLMService`, `OmniRouteService`, `Ollama`) to release file locks.
2. **File Migration**: Copies all folders and database blocks via robocopy with timestamps preserved.
3. **Path Rewriting**: Scans JSON/YAML configs in the new destination, replacing old paths with the new base path.
4. **Junction Redirection**: Deletes the old `%USERPROFILE%\.aegisos` directory junction and points it to the new path.
5. **SCM Registry Update**: Patches service working directories, executables, and stdout/stderr paths in the registry.
6. **Environment Update**: Rewrites the system/user variables for `AEGISOS_CONFIG_PATH`, `AEGISOS_STATE_DIR`, and `OLLAMA_MODELS`.
7. **Service Resumption**: Restarts services and runs the validation check to verify migration success.
