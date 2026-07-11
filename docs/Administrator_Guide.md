# Administrator Guide

This guide documents host configuration, security parameters, mesh network setup, and DPAPI credentials storage.

## 1. System Requirements

The AI Workstation is configured to run on high-performance Windows 11 host hardware:
- **Processor**: Multi-core CPU (e.g. AMD Ryzen 9 9950X3D)
- **Memory**: Minimum 32 GB DDR5 RAM (64 GB recommended for concurrently running multiple models)
- **GPU Accelerator**: NVIDIA RTX GPU (e.g., RTX 5080) with 16 GB GDDR7 VRAM. CUDA toolkit v12+ or v13+ must be installed.
- **Storage**: Minimum 2 TB PCIe Gen 4/5 NVMe SSD space to support local LLM weights (GGUF repositories).

---

## 2. Secure Configuration & DPAPI

API credentials (such as GITHUB_TOKEN and TELEGRAM_BOT_TOKEN) must not be written in clear text configuration files.

### Windows Data Protection API (DPAPI)
Credentials are encrypted at rest using machine-scope DPAPI:
- **Scope**: `LocalMachine`
- **Location**: `$PlatformRoot\secrets\OpenClaw_secrets.enc`
- **Behavior**: Only processes running on the *same physical machine* can decrypt the tokens.

If you migrate the platform or recover from a backup to a *different* machine, the decryption will fail. The `Restore.ps1` script will prompt you to enter the tokens again, encrypt them with the *new* machine key, and rewrite the encrypted payload.

---

## 3. Windows Service Registration

Workstation services are wrapped by NSSM and registered under standard Windows Service Control Manager (SCM):
- **Ollama**: Registered under `LocalSystem` account.
- **LiteLLMService**: Runs startup batch wrappers.
- **OpenClawService** & **OmniRouteService**: Run node wrappers pointing to platform scripts.

Registry paths under `HKLM\SYSTEM\CurrentControlSet\Services\<ServiceName>\Parameters` are updated by the Configure scripts relative to `$PlatformRoot`.

---

## 4. Tailscale Mesh Network

To allow remote diagnostics and pipeline queries without exposing ports to the public internet:
1. Deployed Tailscale client on the host machine.
2. Bind the console app routes to Tailscale IP (e.g., `100.90.78.53`).
3. Add Tailscale access control rules restricting port `3000` (Next Console) and port `8090` (Open-WebUI) to validated developers.
