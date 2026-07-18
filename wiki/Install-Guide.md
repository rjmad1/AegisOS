# Installation & Getting Started Guide

Welcome to the **AegisOS** installation and onboarding guide. AegisOS is an enterprise-ready, local-first, privacy-preserving AI Workstation platform integrating Ollama inference models, a LiteLLM routing proxy, multi-agent frameworks, and a Next.js Console administration dashboard.

This document serves as the single source of truth for setting up and running AegisOS on your workstation.

---

## 1. Introduction

### What is AegisOS?
AegisOS is an autonomous AI Operator Experience (OX) workstation that links local LLM execution, vector databases, and multi-agent coordination frameworks together with an enterprise administrative console. It enables developers and enterprise operations teams to run agentic workflows locally with 100% privacy, data transparency, and offline availability.

### Intended Audience
- **Developers & AI Engineers**: Building custom plugins, extensions, or multi-agent workflows.
- **Release Engineers & Administrators**: Provisioning workstation fleets, managing security, and monitoring agent runtimes.
- **Enterprise Operations Teams**: Running offline-capable, high-security AI tools.

### Supported Platforms
- **Windows**: Windows 11 (22H2 or higher) / Windows Server 2022 (Preferred host).
- **Linux**: Ubuntu 22.04 LTS or 24.04 LTS (Native or via WSL2).
- **macOS**: Apple Silicon M1/M2/M3/M4 (macOS 14 Sonoma or higher - CLI and Docker modes only).

### Hardware Tiers
| Requirement | Minimum | Recommended | Production / Enterprise |
| :--- | :--- | :--- | :--- |
| **CPU** | Intel Core i5 / AMD Ryzen 5 | Intel Core i7 / AMD Ryzen 7 | Intel Xeon / AMD Threadripper (32+ Cores) |
| **GPU** | NVIDIA GTX 1080 / RTX 3060 | NVIDIA RTX 4070 / RTX 4080 | 2x NVIDIA RTX 4090 / RTX A6000 |
| **VRAM** | 8 GB VRAM | 16 GB VRAM | 24 GB to 48+ GB VRAM |
| **System RAM** | 16 GB DDR4 | 32 GB DDR5 | 128+ GB DDR5 ECC |
| **Storage** | 100 GB HDD | 500 GB NVMe PCIe Gen4 SSD | 2+ TB NVMe PCIe Gen5 SSD in RAID 1 |
| **Network** | 100 Mbps (Download) | 1 Gbps (Broadband) | 10 Gbps (LAN/Internal Mesh) |

---

## 2. Hardware Requirements & Performance Expectations

### CPU & System RAM
AegisOS uses local inference engines (Ollama, LiteLLM) and a local database (PostgreSQL/Prisma/SQLite). High-performance CPU cores are critical for scheduling agent tasks and executing non-GPU vector searches. Minimum system RAM is 16 GB, but 32 GB or higher is strongly recommended to support concurrent model executions.

### GPU & VRAM Allocation
GPU VRAM is the primary bottleneck for local model speed:
- **8 GB VRAM**: Can run small models like `smollm:135m` or `llama3:8b` (using high quantization like Q4).
- **16 GB VRAM**: Can support running one mid-size reasoning model (e.g., `qwen2.5-coder:7b`) and routing proxy concurrently.
- **24 GB+ VRAM / Multi-GPU**: Required to pre-warm and run large model pipelines (e.g., `gemma2:9b` or `qwen2.5:14b`) alongside local vector databases without offloading to slower CPU RAM.

### Virtualization & Containers
- **WSL2**: Windows Subsystem for Linux (WSL2) is required on Windows to run Docker containers with GPU passthrough.
- **Hyper-V / VT-x**: Must be enabled in BIOS/UEFI to allow WSL2 and Docker Desktop to function.

---

## 3. Software Prerequisites

AegisOS relies on standard runtime tools. Ensure these are installed and configured:

| Dependency | Purpose | Version | Download Link / Install Method | Verification Command |
| :--- | :--- | :--- | :--- | :--- |
| **Git** | Repository cloning & version control | `v2.x+` | [git-scm.com](https://git-scm.com/) | `git --version` |
| **Node.js** | Next.js Console runtime | `v18/v20/v22` | [nodejs.org](https://nodejs.org/) | `node --version` |
| **Python** | Script execution & local agent runtimes | `v3.10+` | [python.org](https://www.python.org/) | `python --version` |
| **Astral uv** | Rapid Python dependency installer | `Latest` | `pip install uv` or standard installer | `uv --version` |
| **Docker Desktop**| PostgreSQL database & telemetry runtime | `v29.x+` | [docker.com](https://www.docker.com/) | `docker --version` |
| **Ollama** | Local LLM execution daemon | `v0.3.x+` | [ollama.com](https://ollama.com/) | `ollama --version` |
| **LiteLLM** | Unified LLM routing proxy | `Latest` | Install via `pip` or Docker container | `litellm --version` |
| **CUDA Toolkit** | NVIDIA GPU acceleration | `v12.x` | [developer.nvidia.com](https://developer.nvidia.com/cuda-downloads) | `nvcc --version` |
| **NVIDIA Drivers**| Host GPU integration | `Latest` | [nvidia.com/drivers](https://www.nvidia.com/Download/index.aspx) | `nvidia-smi` |

### Common Prerequisite Issues:
- **CUDA/Driver Mismatch**: If `nvidia-smi` works but `nvcc --version` is missing or fails, Ollama will fall back to CPU execution.
- **WSL2 Backend Missing**: Ensure WSL2 is selected in Docker Desktop settings, otherwise the database and Redis containers will fail to start.

---

## 4. Repository Setup

### Cloning the Repository
Clone the repository using Git:
```powershell
git clone https://github.com/rjmad1/AegisOS.git
cd AegisOS
```

### Folder Structure
Once cloned, the workspace displays the following directory layout:
```
AegisOS/
├── .github/          # GitHub templates & workflows
├── adr/              # Architectural Decision Records (ADR-001 - ADR-012)
├── automation/       # PowerShell orchestration (Install, Configure, Validate, Migrate)
│   ├── libs/         # PlatformHelper shared module
│   ├── profiles/     # Environment profiles (development, enterprise, offline)
│   └── catalogs/     # Package and dependency manifests
├── docs/             # Handbooks, manuals, checklists, and guides
├── release/          # Version metadata, Release Notes, and SBOMs
├── src/              # Next.js Console frontend & API routes
│   ├── app/          # Next.js Page & API Routing
│   └── platform/     # Core kernel, port managers, and agent engine
├── wiki/             # GitHub Wiki documents (such as this guide)
├── package.json      # Node.js dependencies
└── tsconfig.json     # TypeScript configuration
```

### Environment Configuration Files
Copy the template configuration to activate variables:
```powershell
Copy-Item .env.example .env
```
Ensure you edit `.env` to customize your environment ports, database links, and file storage pathways.

---

## 5. Installation Process

AegisOS features a fully automated PowerShell bootstrap sequence to verify system settings, install missing runtimes, build database junctions, and warm the model weights.

### Step 1: Execute Elevated Bootstrap Installer
Open an elevated PowerShell session (**Run as Administrator**) and run:
```powershell
.\Bootstrap.ps1
```

### The Bootstrap Wizard Sequence:
1. **Privilege Check**: Verifies Administrator privileges.
2. **Profile Selection**:
   - `development`: Installs light local stubs, local models, default drive `C:`.
   - `personal`: Standard agent gateway settings, local models, default drive `D:`.
   - `enterprise`: Full network bindings, high-capability models, default drive `D:`.
   - `offline`: Air-gapped setup, skips remote package checks and LLM model pulling.
3. **Platform Path Selection**: Resolves dynamic `$PlatformRoot` (e.g. `D:\AIPlatform` or `C:\AIPlatform`).
4. **API Token Entry**: Prompts for `GITHUB_TOKEN` and `TELEGRAM_BOT_TOKEN`. (Encrypts at rest using Windows DPAPI machine-scope protection).
5. **Dependency Provisioning**:
   - Automatically downloads and runs `uv.exe` for Python scripting.
   - Restores NPM packages and initializes Prisma schema.
6. **Directory Junctions**: Creates reparse point junctions pointing `%USERPROFILE%\.aegisos` to the selected `$PlatformRoot`.
7. **Service Setup**: Registers background Windows services using NSSM.
8. **Local Model Sync**: Triggers Ollama to pull target models:
   - `smollm:135m` (Lite fallback weight)
   - `gemma2:9b` (Primary agent reasoning)
   - `qwen2.5:14b` (High-performance code operations)
9. **Diagnostics**: Automatically runs `automation/Validate.ps1` to test database connectivity, model endpoints, and port availability.

---

## 6. Service Startup & Ports Management

### Service Dependency Graph
AegisOS services rely on one another. The recommended startup sequence is:
```
[Docker DB/Redis] ──> [Ollama Daemon] ──> [LiteLLM Proxy] ──> [AegisOS Console API]
```

### Port Matrix
By default, AegisOS claims the following local network sockets:
- **Ollama**: `11434`
- **LiteLLM Routing**: `4000` (or proxy target ports)
- **AegisOS Console Development**: `3000`
- **AegisOS Backend API Port**: `18789`
- **PostgreSQL Database**: `5432`
- **Redis Cache**: `6379`

### Starting the Console Interface
To run the admin console dashboard interface locally:
```bash
# Verify NPM packages are restored
npm install

# Launch Next.js Console dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the console interface.

---

## 7. First-Time Onboarding Workflow

1. **Access Console**: Open your browser to [http://localhost:3000](http://localhost:3000). You will be greeted by the AegisOS Setup Wizard.
2. **Step 1: Check Environment**: The UI will verify connection to local ports.
3. **Step 2: Enter Secrets**: Paste your GitHub/Telegram tokens if you didn't run the PowerShell bootstrap (or choose to manage them in-browser).
4. **Step 3: Pull Models**: Select the model tags to pre-warm. Ensure Ollama is running.
5. **Step 4: Execute Setup**: Click "Execute Configuration Build" to write the SQLite database blocks and configurations.
6. **Step 5: Access Console Dashboard**: Complete the wizard. You will enter the main dashboard.
7. **Launch First Mission**: Go to "Missions", click "Launch Mission", select an agent workspace, enter a text prompt, and verify that the agent executes and logs tokens.

---

## 8. Verification Checklist

Ensure the workstation is healthy by checking the following checklist:
- [ ] **Docker Engine**: Run `docker ps` to verify the PostgreSQL and Redis containers are running.
- [ ] **Ollama Service**: Execute `curl http://localhost:11434` - should return `Ollama is running`.
- [ ] **LiteLLM Service**: Check `curl http://localhost:4000/v1/models` - should return JSON containing available routed model objects.
- [ ] **Prisma Migrations**: Run `npx prisma status` to ensure database schema is fully updated.
- [ ] **GPU Acceleration**: Open a terminal, execute `nvidia-smi`, and check if `ollama_llama_server` appears in the GPU Process List during agent execution.
- [ ] **System Diagnostics Route**: Visit `http://localhost:3000/api/v1/ox/doctor` in your browser. Ensure the returned JSON lists all checks as `"status": "healthy"`.

---

## 9. Troubleshooting

### 1. Port In Use (EADDRINUSE)
- **Problem**: Next.js (port 3000) or Ollama (port 11434) fails to bind to sockets.
- **Solution**: Terminate conflicting processes in PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 11434).OwningProcess -Force
  ```

### 2. CUDA/GPU Acceleration Falls Back to CPU
- **Problem**: Inference is extremely slow, and GPU utilization is 0%.
- **Solution**: Verify driver versions and GPU access. Run:
  ```bash
  nvidia-smi
  ```
  Ensure your NVIDIA Driver is compatible with CUDA 12.x. Restart the Ollama Windows service to reset CUDA device initialization.

### 3. Decryption Failures (DPAPI)
- **Problem**: API Keys fail to decrypt after migrating the folder tree to another machine.
- **Solution**: DPAPI keys are machine-specific. Re-run `.\Bootstrap.ps1` on the target machine to re-encrypt and store your credentials.

---

## 10. Updating AegisOS

### Update Repository
```powershell
git pull origin main
```

### Update Node Dependencies & Databases
```powershell
npm install
npx prisma db push
```

### Update Local LLM Models
To download newer model weights, pull them directly via Ollama:
```powershell
ollama pull qwen2.5:14b
```

---

## 11. Uninstallation

To completely clean and remove AegisOS from your machine, follow these steps:

1. **Stop & Unregister Services**: Run the PowerShell script to teardown registry entries and stop daemons:
   ```powershell
   .\automation\Remove.ps1
   ```
2. **Remove Models**: Delete Ollama models cache directory:
   - On Windows: Remove `C:\Users\<User>\.ollama`
   - On Linux: Remove `/usr/share/ollama/.ollama`
3. **Clean Junction Reparse Points**: Delete directory junctions:
   ```powershell
   Remove-Item "$env:USERPROFILE\.aegisos" -Force
   ```
4. **Delete Platform Root Folder**: Remove the `$PlatformRoot` (e.g. `D:\AIPlatform` or `C:\AIPlatform`) directory.

---

## 12. Frequently Asked Questions (FAQ)

#### Q: Can I run AegisOS completely offline?
Yes. Select the `offline` deployment profile during the bootstrap phase. Ensure you have already downloaded the required models and placed them in the model registry directory.

#### Q: Why is LiteLLM required?
LiteLLM serves as a unified routing proxy. It allows the Next.js app to interact with various local models (Ollama, local vLLM instances) through a standard OpenAI-compatible API format, providing failovers and load balancing.

#### Q: How do I audit security configurations?
AegisOS is built on Zero Trust principles. Consult [adr/ADR-002-Server-Side-Decoupled-Authentication.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-002-Server-Side-Decoupled-Authentication.md) and [docs/productization/09_security_governance_framework.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/09_security_governance_framework.md) for detail on DPAPI storage, token rotations, and LDAP setups.
