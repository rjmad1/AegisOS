# AI Infrastructure â€” Diagram Generation Context Package

> Prompt enhanced by Raja Jeevan Kumar Maduri (https://www.linkedin.com/in/rajajeevankumar/)

**Document Version:** 1.1  
**Generated:** 2026-07-10  
**Classification:** Internal / Architecture  
**Discovery Method:** Live system interrogation via Antigravity IDE  
**Target Platform:** Windows 11 Pro, AMD Ryzen 9 9950X3D, NVIDIA RTX 5080

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Infrastructure Overview](#2-infrastructure-overview)
3. [Discovery Summary](#3-discovery-summary)
4. [Hardware Summary](#4-hardware-summary)
5. [Software Summary](#5-software-summary)
6. [AI Stack Summary](#6-ai-stack-summary)
7. [Network Summary](#7-network-summary)
8. [Storage Summary](#8-storage-summary)
9. [Security Summary](#9-security-summary)
10. [Operational Summary](#10-operational-summary)
11. [Existing Documentation Audit](#11-existing-documentation-audit)
12. [Diagram Generation Guidelines](#12-diagram-generation-guidelines)
13. [Diagram Prompts 1â€“40](#13-diagram-prompts)
14. [Glossary](#14-glossary)
15. [Acronyms](#15-acronyms)
16. [Assumptions](#16-assumptions)
17. [Validation Notes](#17-validation-notes)
18. [Recommendations for Additional Diagrams](#18-recommendations-for-additional-diagrams)

---

## 1. Executive Summary

This document is the authoritative context package for generating professional architecture diagrams of Raja Jeevan Kumar Maduri's Personal AI Workstation. It was produced through direct live discovery of every hardware component, running service, network port, configuration file, and AI model present on the system as of 2026-07-09.

The workstation runs a fully local, privacy-first AI inference and agent orchestration stack built on:

| Layer | Components |
|---|---|
| **Hardware** | AMD Ryzen 9 9950X3D (16C/32T), NVIDIA GeForce RTX 5080 (16 GB VRAM), 64 GB DDR5-4800 CORSAIR RAM, Samsung 9100 PRO 2TB NVMe + WD_BLACK SN850X 1TB NVMe |
| **AI Inference** | Ollama v0.31.1 serving 12 local GGUF models with LiteLLM proxy (least-busy routing), Ponytail context pruning, and Headroom prompt token compression proxy |
| **AI Gateway** | AegisOS AI Gateway with multi-agent orchestration (main, developer, reviewer) and CodeGraph MCP server |
| **AI Dashboard** | OmniRoute AI Gateway with ELO arena scoring and call logging |
| **Chat UI** | Open-WebUI (Docker, port 8090) |
| **Context Layer** | 8 Local MCP Context Servers (filesystem, git, github, sqlite, fetch, puppeteer, raja-knowledge-repository, codegraph) |
| **Databases** | PostgreSQL (v13, v14, v16), MongoDB, Redis, SQLite (aegisos, omniroute, open-webui, and codegraph) |
| **Networking** | Tailscale mesh VPN, Realtek 5GbE wired, Qualcomm Wi-Fi 7 |
| **Security** | DPAPI machine-scope encryption, Norton Firewall, loopback-secured services |
| **Automation & Orchestration** | Elevated `Bootstrap.ps1` installer, modular scripts under `automation/` (Install, Configure, Validate, Backup, Restore, Migrate, HealthCheck, Upgrade, Remove, Package), PlatformHelper library, parameterized profiles (default, development, personal, offline, enterprise), JSON catalogs, and ADR-001 through ADR-008 design standards |

This document contains **40 enterprise-grade diagram prompts** covering the full stack from physical hardware to end-to-end user journeys.

---

## 2. Infrastructure Overview

### System Identity

| Property | Value |
|---|---|
| **Hostname** | DESKTOP-1EP019K |
| **Owner** | Raja Jeevan Kumar Maduri |
| **OS** | Microsoft Windows 11 Pro, Build 26200 |
| **System Manufacturer** | Gigabyte Technology Co., Ltd. |
| **System Model** | X870E AORUS MASTER |
| **Processor** | AMD Ryzen 9 9950X3D 16-Core Processor @ 4.3 GHz |
| **GPU** | NVIDIA GeForce RTX 5080 (16 GB VRAM, Driver 610.47, CUDA 13.3) |
| **RAM** | 64 GB DDR5-4800 (2 Ã— 32 GB CORSAIR CMT64GX5M2B6000Z30) |
| **Boot Time** | 2026-07-09 14:10:48 IST |
| **Timezone** | UTC+05:30 (Chennai, Kolkata, Mumbai, New Delhi) |
| **Virtualization** | VBS Running, Hyper-V enabled, UEFI Secure Boot |

### Architecture Philosophy

The infrastructure follows a **local-first, privacy-preserving** architecture where:

1. All AI inference runs on local hardware (GPU + CPU offload)
2. Core routing services (AegisOS, LiteLLM) bind exclusively to `127.0.0.1`
3. Secrets are encrypted at rest using Windows DPAPI (machine scope)
4. Only Ollama (port 11434) is LAN-exposed for device offloading
5. External connectivity is provided via Tailscale mesh VPN (100.90.78.53)

---

## 3. Discovery Summary

### Discovery Methods Used

| Method | Target | Result |
|---|---|---|
| `systeminfo` | OS, hardware, network | âœ… Complete |
| `Get-CimInstance Win32_Processor` | CPU details | âœ… AMD Ryzen 9 9950X3D |
| `Get-CimInstance Win32_VideoController` | GPU details | âœ… RTX 5080 + AMD iGPU |
| `nvidia-smi` | GPU VRAM, driver, processes | âœ… 16303 MiB VRAM |
| `Get-CimInstance Win32_DiskDrive` | Storage devices | âœ… 2 NVMe drives |
| `Get-CimInstance Win32_PhysicalMemory` | RAM details | âœ… 64 GB DDR5 |
| `Get-CimInstance Win32_BaseBoard` | Motherboard | âœ… X870E AORUS MASTER |
| `docker ps -a` | Container inventory | âœ… 1 container (open-webui) |
| `ollama list` | Model inventory | âœ… 12 models |
| `netstat -ano` | Network port scan | âœ… 85+ listening ports |
| `Get-Service` | Windows services | âœ… All AI services running |
| `Get-Process` | Running processes | âœ… Ollama, LiteLLM, Redis, MongoDB, PostgreSQL, Node |
| LiteLLM `/v1/models` API | Registered model aliases | âœ… 14 aliases |
| LiteLLM `/health` API | Health status | âœ… 9 healthy / 5 unhealthy |
| File system traversal | Config files, docs, directories | âœ… Complete |
| `Get-NetFirewallRule` | Firewall policies | âœ… Ollama inbound rules |
| `Get-ScheduledTask` | Scheduled automation | âœ… 3 AI-related tasks |
| Environment variable query | System env vars | âœ… OLLAMA_*, AEGISOS_* |

### Existing Documentation Discovered

**Consolidated structured guides** found in `D:\1_Projects\OpenClawOllamaLiteLLM_Transparency\docs\` and **Architectural Decision Records** under `adr/` â€” see [Section 11](#11-existing-documentation-audit) for full audit.

---

## 4. Hardware Summary

### CPU

| Property | Value |
|---|---|
| **Model** | AMD Ryzen 9 9950X3D |
| **Architecture** | Zen 5 / 3D V-Cache |
| **Cores / Threads** | 16 / 32 |
| **Base Clock** | 4.3 GHz |
| **Virtualization** | AMD-V enabled |
| **Role** | Primary compute for CPU-offloaded model layers, system services |

### GPU

| Property | Value |
|---|---|
| **Model** | NVIDIA GeForce RTX 5080 |
| **VRAM** | 16,303 MiB (16 GB GDDR7) |
| **Driver** | 610.47 (WDDM) |
| **CUDA UMD** | 13.3 |
| **TDP** | 360W (observed 52W idle) |
| **Temperature** | 54Â°C (idle) |
| **Role** | Primary AI inference engine for all local LLM models |

### Integrated GPU

| Property | Value |
|---|---|
| **Model** | AMD Radeon Graphics (integrated in Ryzen 9 9950X3D) |
| **VRAM** | 2 GB (shared system memory) |
| **Role** | Not used for AI inference; available for display output offloading |

### Memory

| Property | Value |
|---|---|
| **Total** | 64 GB DDR5 |
| **Configuration** | 2 Ã— 32 GB CORSAIR CMT64GX5M2B6000Z30 |
| **Speed** | DDR5-4800 (configured) |
| **Role** | System memory, CPU-offloaded model layers, database caching |

### Storage

| Device | Model | Size | Interface | Role |
|---|---|---|---|---|
| **Primary NVMe** | Samsung SSD 9100 PRO 2TB | 2.0 TB | PCIe Gen 5 NVMe | OS drive (C:), AI model weights, Docker data |
| **Secondary NVMe** | WD_BLACK SN850X 1000GB | 1.0 TB | PCIe Gen 4 NVMe | Project data (D:, E:), knowledge repos |

### Logical Drives

| Drive | Size | Free | Filesystem | Label | Purpose |
|---|---|---|---|---|---|
| **C:** | 862 GB | 351 GB | NTFS | (System) | OS, programs, model weights, AI configs |
| **D:** | 1,000 GB | 990 GB | NTFS | Raja Jeevan Kumar Maduri | Projects, knowledge repository |
| **E:** | 931 GB | 931 GB | NTFS | Rajesh Babu Vanam | Secondary storage |
| **G:** | 862 GB | 334 GB | FAT32 | Google Drive | Cloud-synced backup storage |

### Motherboard

| Property | Value |
|---|---|
| **Manufacturer** | Gigabyte Technology Co., Ltd. |
| **Model** | X870E AORUS MASTER |
| **Chipset** | AMD X870E |
| **BIOS** | AMI, Version F12 (2026-05-02) |
| **Features** | PCIe Gen 5, DDR5, USB4, Wi-Fi 7, 5GbE LAN |

### Network Adapters

| Adapter | Type | Status |
|---|---|---|
| Realtek PCIe 5GbE Family Controller | Wired Ethernet | Connected (192.168.29.41) |
| Qualcomm FastConnect 7800 Wi-Fi 7 | Wireless | Disconnected |
| Wintun Userspace Tunnel (Tailscale) | VPN Mesh | Connected (100.90.78.53) |
| Bluetooth Device (PAN) | Bluetooth | Disconnected |
| Hyper-V Virtual Ethernet Adapter | Virtual | Disconnected |

### Hardware â†’ AI Infrastructure Relationship

The hardware is specifically optimized for local AI inference:

- **RTX 5080 (16 GB VRAM):** Can run models up to ~14B parameters fully on GPU at 70+ tokens/sec. Larger models (26Bâ€“32B) spill to CPU with reduced throughput (10â€“28 t/s).
- **Ryzen 9 9950X3D (32 threads):** Provides high-performance CPU offload for model layers that exceed VRAM. The 3D V-Cache architecture assists with large KV cache operations.
- **64 GB DDR5:** Sufficient for hosting CPU-offloaded model weights alongside system operations and database caching.
- **Samsung 9100 PRO (PCIe Gen 5):** Delivers 14 GB/s sequential read, enabling 3.2-second cold starts for 14B models.

---

## 5. Software Summary

### Core AI Stack

| Component | Version | Purpose | Port | Status |
|---|---|---|---|---|
| **Ollama** | 0.31.1 | Local LLM inference engine | 11434 | âœ… Running (Windows Service) |
| **LiteLLM** | Latest (uv-managed) | Model routing proxy with fallback chains | 4000 | âœ… Running (Windows Service) |
| **Headroom** | Latest (Python) | Inline prompt token compression proxy | 4050 | âœ… Running (Windows Service) |
| **CodeGraph** | Latest (Node.js) | Code intelligence parser & MCP server | 18790 / stdio | âœ… Running (Windows Service / MCP) |
| **AegisOS** | Latest (npm global) | AI gateway, agent framework, MCP host | 18789 | âœ… Running (Windows Service) |
| **OmniRoute** | Latest (Node.js) | AI routing dashboard with arena ELO | 20128 | âœ… Running (Windows Service) |
| **Open-WebUI** | main (Docker) | Chat interface UI | 8090 | âœ… Running (Docker Container) |

### Runtime Environments

| Runtime | Version | Purpose |
|---|---|---|
| **Python** | 3.12.4 | LiteLLM execution, MCP servers, custom scripts |
| **Node.js** | 24.16.0 | AegisOS, OmniRoute, MCP servers (npx) |
| **npm** | 11.13.0 | Package management for Node.js components |
| **Git** | 2.55.0 | Version control, MCP server integration |
| **Docker** | 29.6.1 | Container runtime for Open-WebUI |

### Databases

| Database | Version | Port | Purpose |
|---|---|---|---|
| **PostgreSQL 13** | 13.x | 5432 | Legacy/development database |
| **PostgreSQL 14** | 14.x | 5433 | Secondary database instance |
| **PostgreSQL 16** | 16.x | 5434 | Primary production database |
| **pgBouncer** | - | 6432 | PostgreSQL connection pooler |
| **MongoDB** | - | 27017 | Document store |
| **Redis** | - | 6379 | In-memory cache / message broker |
| **SQLite** (AegisOS) | - | embedded | Agent memory, session state (aegisos.sqlite) |
| **SQLite** (OmniRoute) | - | embedded | Routing logs, ELO scores (storage.sqlite) |
| **SQLite** (Open-WebUI) | - | embedded | Chat history, user data |
| **SQLite** (CodeGraph) | - | embedded | Code AST dependencies index (codegraph.sqlite) |

### Service Management

| Tool | Purpose |
|---|---|
| **NSSM** (Non-Sucking Service Manager) | Wraps AI binaries as Windows SCM services (Ollama, LiteLLM, Headroom, CodeGraph, AegisOS, OmniRoute) |
| **Windows SCM** | System-level service lifecycle management |
| **Docker Desktop** | WSL2-backed container runtime |
| **PlatformHelper** | Shared PowerShell module (`PlatformHelper.psm1`) managing automated credentials, service tasks, elevation |

### Security Software

| Software | Purpose |
|---|---|
| **Norton Antivirus** | Malware protection |
| **Norton Firewall** | Network firewall |
| **Norton VPN** | VPN service |
| **Windows Defender** (VBS) | Hypervisor-enforced Code Integrity |
| **Tailscale** | Zero-trust mesh VPN |

### Development & Productivity Tools

| Tool | Purpose |
|---|---|
| **Antigravity IDE** | AI-powered development environment |
| **ChatGPT Desktop** | OpenAI desktop client |
| **Perplexity** | AI search assistant |
| **UniGetUI** | Package manager frontend |
| **Listary** | File search utility |
| **Microsoft PC Manager** | System optimization |

---

## 6. AI Stack Summary

### Model Inventory (Ollama)

| Model | Size | Parameters | VRAM Fit | LiteLLM Alias | Role |
|---|---|---|---|---|---|
| **gemma4:latest** | 9.6 GB | ~9B | âœ… Full GPU | `gemma` | Primary chat/reasoning model |
| **gemma2:9b** | 9.6 GB | 9B | âœ… Full GPU | `chat` | Lightweight chat |
| **gemma4:26b** | 17 GB | 26B | âš ï¸ 78% GPU | â€” | Intermediate reasoning (idle) |
| **gemma4:31b** | 19 GB | 31B | âš ï¸ 61% GPU | `gemma31` | Large reasoning |
| **qwen2.5:14b** | 9.3 GB | 14B | âœ… Full GPU | `qwen` | High-performance text & coding |
| **qwen3:14b** | 9.3 GB | 14B | âœ… Full GPU | `planner` | Planning & task decomposition |
| **qwen3:30b** | 18 GB | 30B | âš ï¸ Partial | â€” | Large reasoning (idle) |
| **qwen3.6:27b** | 17 GB | 27B | âš ï¸ Partial | `vision` | Multimodal vision model |
| **deepseek-r1:32b** | 19 GB | 32B | âš ï¸ 60% GPU | `deepseek`, `reasoner`, `reviewer` | Deep reasoning & code review |
| **gpt-oss:20b** | 13 GB | 20B | âš ï¸ Partial | `gptoss`, `coder` | Open-source coding model |
| **all-minilm:latest** | 45 MB | â€” | âœ… Negligible | `embeddings`, `embedding` | Semantic search embeddings |
| **smollm:135m** | 91 MB | 135M | âœ… Negligible | `smollm` | Ultra-lightweight terminal fallback |

### LiteLLM Routing Configuration

**Routing Strategy:** `least-busy`  
**Retries:** 3  
**Timeout:** 120 seconds  
**Telemetry:** Disabled  
**Health Checks:** Background, every 300 seconds

#### Model Fallback Chains

| Primary Model | Fallback Chain |
|---|---|
| `gemma31` â†’ | `qwen` â†’ `gemma` â†’ `smollm` |
| `qwen` â†’ | `gemma31` â†’ `gemma` â†’ `smollm` |
| `deepseek` â†’ | `gemma31` â†’ `qwen` â†’ `smollm` |
| `gemma` â†’ | `qwen` â†’ `smollm` |
| `gptoss` â†’ | `qwen` â†’ `gemma` â†’ `smollm` |
| `vision` â†’ | `qwen` â†’ `smollm` |
| `planner` â†’ | `reviewer` â†’ `reasoner` â†’ `coder` |
| `coder` â†’ | `planner` â†’ `reviewer` â†’ `reasoner` |
| `reviewer` â†’ | `reasoner` â†’ `planner` â†’ `coder` |
| `reasoner` â†’ | `reviewer` â†’ `planner` â†’ `coder` |
| `chat` â†’ | `gemma` â†’ `smollm` |

### LiteLLM Health Status (Live)

| Category | Count |
|---|---|
| âœ… Healthy Models | 9 |
| âŒ Unhealthy Models | 5 (timeouts, embedding model not supporting generate) |

### AegisOS Agent Architecture

| Agent | Role | Target Model | MCP Access |
|---|---|---|---|
| **main** | Executive, Planning, Knowledge, Research | `litellm/gemma` | Knowledge Repo, SQLite, Fetch, Filesystem (read) |
| **developer** | Engineering, Automation, Coding | `litellm/qwen` | Filesystem (write), Git, SQLite |
| **reviewer** | Architecture, Quality, Documentation, Audit | `litellm/deepseek` | Filesystem (write), Git, Fetch |

### MCP Server Inventory

| Server | Transport | Technology | Purpose |
|---|---|---|---|
| **filesystem** | npx (Node.js) | @modelcontextprotocol/server-filesystem | Sandboxed directory access |
| **git** | uvx (Python) | mcp-server-git | Git CLI interface |
| **github** | npx (Node.js) | @modelcontextprotocol/server-github | GitHub PRs, issues, search |
| **sqlite** | uvx (Python) | mcp-server-sqlite | Agent memory database queries |
| **fetch** | npx (Node.js) | mcp-server-fetch-typescript | Web content retrieval |
| **puppeteer** | npx (Node.js) | @modelcontextprotocol/server-puppeteer | Headless browser automation |
| **raja-knowledge-repository** | Python direct | Custom script | Personal knowledge RAG retrieval |
| **codegraph** | Port 18790 / stdio | Node.js | AST-based code intelligence, dependency mapping, symbol search |

### Memory & Knowledge Systems

| System | Type | Location | Purpose |
|---|---|---|---|
| **Agent SQLite** | Embedded DB | `~/.aegisos/state/aegisos.sqlite` | Session state, completions |
| **Agent Memory SQLite** | Embedded DB | `~/.aegisos/agents/main/agent/aegisos-agent.sqlite` | Chat history, agent memory |
| **OmniRoute SQLite** | Embedded DB | `~/.omniroute/storage.sqlite` | Arena ELO, call routing logs |
| **CodeGraph SQLite** | Embedded DB | `D:\AIPlatform\databases\codegraph.sqlite` | Code AST dependencies index, symbols |
| **Knowledge Repository** | Markdown files | `D:\Raja Jeevan Kumar Maduri_MarkDown_Personality\` | Identity, playbooks, frameworks |
| **Embedding Model** | all-minilm | Ollama local | Semantic search vectorization |

---

## 7. Network Summary

### Active Port Allocations

| Port | Service | Bind Interface | Protocol | Exposure |
|---|---|---|---|---|
| **11434** | Ollama | `0.0.0.0` | HTTP REST | LAN Exposed |
| **4050** | Headroom Proxy | `127.0.0.1` | HTTP REST | Loopback Only |
| **4000** | LiteLLM | `127.0.0.1` | OpenAI-compatible REST | Loopback Only |
| **18789** | AegisOS Gateway | `127.0.0.1` | HTTP REST | Loopback Only |
| **18790** | CodeGraph MCP | `127.0.0.1` | HTTP / JSON | Loopback Only |
| **20128** | OmniRoute | `0.0.0.0` | HTTP/WebSocket | Loopback (firewall blocked) |
| **8090** | Open-WebUI (Docker) | `0.0.0.0` | HTTP | Container (Docker NAT) |
| **8080** | Open-WebUI (internal) | container | HTTP | Internal to Docker |
| **5432** | PostgreSQL 13 | `0.0.0.0` | PostgreSQL | LAN Accessible |
| **5433** | PostgreSQL 14 | `0.0.0.0` | PostgreSQL | LAN Accessible |
| **5434** | PostgreSQL 16 | `0.0.0.0` | PostgreSQL | LAN Accessible |
| **6432** | pgBouncer | `127.0.0.1` | PostgreSQL | Loopback Only |
| **27017** | MongoDB | `127.0.0.1` | MongoDB Wire | Loopback Only |
| **6379** | Redis | `0.0.0.0` | Redis Protocol | LAN Accessible |
| **22** | OpenSSH Server | `0.0.0.0` | SSH | LAN Accessible |
| **3389** | Remote Desktop | `0.0.0.0` | RDP | LAN Accessible |

### Network Interfaces

| Interface | IP Address | Purpose |
|---|---|---|
| Ethernet (5GbE) | 192.168.29.41 | Primary LAN connection (DHCP via 192.168.29.1) |
| Tailscale VPN | 100.90.78.53 | Zero-trust mesh overlay network |
| WSL2 NAT | 172.27.32.1, 172.28.48.1 | Docker/WSL2 virtual networking |

### Request Flow Path

```
User/Client â†’ AegisOS (127.0.0.1:18789) â†’ Ponytail Context Pruner â†’ Headroom Compression (127.0.0.1:4050) â†’ LiteLLM (127.0.0.1:4000) â†’ Ollama (0.0.0.0:11434) â†’ RTX 5080 GPU
                  â†“
           MCP Servers (stdio/local)
           â”œâ”€â”€ filesystem (npx)
           â”œâ”€â”€ git (uvx)
           â”œâ”€â”€ github (npx)
           â”œâ”€â”€ sqlite (uvx)
           â”œâ”€â”€ fetch (npx)
           â”œâ”€â”€ puppeteer (npx)
           â”œâ”€â”€ raja-knowledge-repo (python)
           â””â”€â”€ codegraph (node)
```

---

## 8. Storage Summary

### AI-Specific Storage Allocation

| Category | Path | Size | Purpose |
|---|---|---|---|
| **Model Weights** | `C:\ProgramData\Models\Ollama` | ~130 GB | Ollama GGUF model files |
| **AegisOS Runtime** | `C:\ProgramData\AI\aegisos\` (junction target: `D:\AegisOS`) | ~200 MB | Config, workspace, agents, state |
| **OmniRoute Data** | `C:\ProgramData\AI\omniroute-data\` | ~30 MB | SQLite store, db_backups |
| **OmniRoute Runtime** | `~/.omniroute/` | ~8 MB | Server, call_logs, storage.sqlite |
| **Encrypted Secrets** | `$PlatformRoot\secrets\` (e.g. `D:\AIPlatform\secrets\`) | ~10 KB | DPAPI-encrypted credential blobs |
| **Service Scripts & Wrappers** | `$PlatformRoot\apps\` (e.g. `D:\AIPlatform\apps\`) | ~50 KB | Service binaries and wrapping parameters |
| **PowerShell Automation Engine** | `D:\1_Projects\OpenClawOllamaLiteLLM_Transparency\automation\` | ~100 KB | Modular scripts (`Bootstrap.ps1`, `Install.ps1`, `Configure.ps1`, `Validate.ps1`, `Backup.ps1`, `Restore.ps1`, `Migrate.ps1`, `HealthCheck.ps1`, `Upgrade.ps1`, `Remove.ps1`, `Package.ps1`) |
| **Platform Helper Library** | `automation\libs\PlatformHelper.psm1` | ~5 KB | Shared PowerShell module for loggers, elevation checks, DPAPI decryption |
| **Platform Catalogs** | `automation\catalogs\` | ~10 KB | JSON metadata catalog databases for agents, apis, components, databases, configurations, scripts, services |
| **Deployment Profiles** | `automation\profiles\` | ~2 KB | Parameterized JSON profiles (`default`, `development`, `personal`, `offline`, `enterprise`) |
| **Architectural Decision Records** | `adr\` | ~15 KB | ADR-001 through ADR-008 markdown records |
| **Platform Guides** | `docs\` | ~30 KB | Consolidated handbooks and logs (operations, deployment, developers, DR) |
| **LiteLLM Config** | `$PlatformRoot\configs\litellm\config.yaml` | ~5 KB | LiteLLM routing rule configuration |
| **Knowledge Repo** | `D:\Raja Jeevan Kumar Maduri_MarkDown_Personality\` | Variable | Identity, playbooks, frameworks |
| **Backups** | `$PlatformRoot\backups\` (e.g. `D:\AIPlatform\backups\`) | ~25 MB+ | Timestamped configurations, databases, Docker volumes |
| **Open-WebUI Data** | Docker volume | ~1.72 GB | Chat history, uploads, user settings |
| **Logs** | `$PlatformRoot\logs\` | ~20 MB | Gateway logs (rotated), service logs, monitor logs |
| **PostgreSQL Data** | Default PG data dirs | Variable | Multiple database instances |
| **MongoDB Data** | Default Mongo data dir | Variable | Document store |
| **Redis Data** | In-memory + AOF | Variable | Cache / broker |

### Junction Points & Symlinks

| Link Path | Target | Purpose |
|---|---|---|
| `%USERPROFILE%\.aegisos` | `$PlatformRoot` (e.g., `D:\AIPlatform` or `C:\ProgramData\AI\aegisos`) | Links user profile configuration to custom platform folder |
| `%USERPROFILE%\.ollama\models` | `C:\ProgramData\Models\Ollama` | Redirects Ollama cache weights to SSD partition |

---

## 9. Security Summary

### Authentication & Secrets

| System | Method | Details |
|---|---|---|
| **AegisOS** | Token-based auth | Tokens stored in DPAPI-encrypted `AegisOS_secrets.enc` |
| **OmniRoute** | JWT + API Key | JWT_SECRET, API_KEY_SECRET, STORAGE_ENCRYPTION_KEY in DPAPI `OmniRoute_secrets.enc` |
| **GitHub MCP** | Environment token | `GITHUB_TOKEN` injected at runtime |
| **Open-WebUI** | Username/password | Local authentication |
| **Ollama** | Unauthenticated | LAN-accessible without auth (risk documented) |
| **LiteLLM** | None (loopback) | Bound to 127.0.0.1 only |

### Secrets Management

- **Method:** Windows DPAPI (Machine Scope)
- **Location:** `$PlatformRoot\secrets\` (e.g., `D:\AIPlatform\secrets\`)
- **Files:** `AegisOS_secrets.enc`, `OmniRoute_secrets.enc`
- **Management Tool:** `PlatformHelper.psm1` / `Bootstrap.ps1` / `Restore.ps1` (handles interactive re-prompting on host machine mismatch)
- **Caveat:** Machine-scope DPAPI ciphertexts are bound to local machine SID â€” cannot be decrypted on a different machine without interactive re-entry.

### Firewall Configuration

| Rule | Direction | Action | Scope |
|---|---|---|---|
| ollama.exe (4 rules) | Inbound | Allow | Various (program-based) |
| AI-Workstation Ollama API | Inbound | Allow | LAN subnet |
| AegisOS, LiteLLM, OmniRoute | N/A | Blocked by loopback binding | 127.0.0.1 only |

### Service Execution Context

| Service | Run As | Risk |
|---|---|---|
| All AI Services (Ollama, LiteLLM, AegisOS, OmniRoute) | `LocalSystem` | High-privilege â€” recommended migration to scoped virtual service accounts |

---

## 10. Operational Summary

### Service Dependencies & Boot Order

```
Phase 1: Ollama â†’ Loads model registries
Phase 2: LiteLLM + Headroom + CodeGraph â†’ Start routing, compression proxy, and AST parser (depend on Ollama)
Phase 3: AegisOS + OmniRoute â†’ Start gateways and dashboard (depend on LiteLLM + Headroom + CodeGraph)
Phase 4: Docker/Open-WebUI â†’ Independent UI container lifecycle
```

### Scheduled Tasks

| Task | Schedule | Purpose |
|---|---|---|
| **OllamaModelSync** | Daily at 02:00 | Runs `gollama-sync.bat` to sync local GGUF model registry |
| **PlatformBackupTask** | Weekly on Sunday at 00:00 | Runs `automation/Backup.ps1` for automated system compression |
| **HealthCheckMonitor** | Every 5 minutes (via SCM wrapper) | Runs `automation/HealthCheck.ps1` to monitor service sockets |

### Backup Strategy

- **Scope:** Configurations, databases, platform catalogs, profiles, secrets, and Docker volumes (excludes GGUF model weights)
- **Method:** PowerShell `automation/Backup.ps1` (exports registry keys, compresses active folders into timestamped ZIP files)
- **Schedule:** Weekly scheduled + manual pre-upgrade/post-session runs
- **Retention:** Last 10 consecutive backups
- **Storage:** `$PlatformRoot\backups\` (e.g. `D:\AIPlatform\backups\`) + Google Drive (G:)
- **Latest Backups:** Archived sets and rollback backups

### Disaster Recovery

- **Runbook:** `docs/Disaster_Recovery_Guide.md` (consolidated operational runbook)
- **Recovery Scripts:** Consolidated execution under `automation/Restore.ps1` and `automation/Validate.ps1`
- **Recovery Modes:**
  - `SafeRestore`: Restores configuration and database states without overwriting healthy existing directories.
  - `FullRecovery`: Overwrites all local databases, config folders, Docker volumes, and initiates model pulls.
  - `Repair`: Checks and repairs folder junctions, symbolic links, and SCM registry configurations.
  - `ForceRecovery`: Resets the workspace, sweeps active databases, restores from backups, and runs full validations.
- **DPAPI Host Mismatch Recovery:** `Restore.ps1` automatically detects foreign SID encryption keys, issuing warnings and re-prompting the user interactively to input GITHUB/TELEGRAM credentials, encrypting them using local machine-scoped DPAPI.
- **RTO:** ~30 minutes (config restore) to ~4 hours (full machine rebuild including GGUF model pulls)

### Monitoring & Logging

| Component | Log Location | Type |
|---|---|---|
| AegisOS Service | `$PlatformRoot\logs\aegisos\AegisOSService.log` | NSSM stdout / stderr capture |
| LiteLLM Service | `$PlatformRoot\logs\litellm\LiteLLMService.log` | NSSM stdout / stderr capture |
| OmniRoute Service | `$PlatformRoot\logs\OmniRouteService.log` | NSSM stdout / stderr capture |
| Health Monitor | `$PlatformRoot\logs\health\monitor.log` | Weekly rotated socket check log |
| OmniRoute Call Logs | `~/.omniroute/call_logs/YYYY-MM-DD/` | Daily JSON REST logs |

---

## 11. Existing Documentation Audit

### Documents Discovered & Validated

| Document | Path | Status | Purpose / Description |
|---|---|---|---|
| [Architecture_Handbook.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Architecture_Handbook.md) | `docs/` | âœ… Active | Authoritative blueprint mapping system topology, boundaries, and storage partitioning |
| [Platform_Handbook.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Platform_Handbook.md) | `docs/` | âœ… Active | Index of system dependencies, models inventory, and active MCP servers |
| [Operations_Guide.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Operations_Guide.md) | `docs/` | âœ… Active | Administrative operations guide for service logging, maintenance, and health checks |
| [Deployment_Guide.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Deployment_Guide.md) | `docs/` | âœ… Active | Standardized bootstrapping steps, prerequisite installations, and migration procedures |
| [Developer_Guide.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Developer_Guide.md) | `docs/` | âœ… Active | Development guidelines for Console App layouts and versioned API contracts |
| [Disaster_Recovery_Guide.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Disaster_Recovery_Guide.md) | `docs/` | âœ… Active | Recovery guides details backup payloads, recovery modes, and DPAPI re-keys |
| [Administrator_Guide.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Administrator_Guide.md) | `docs/` | âœ… Active | Administrative settings, service wrapping parameters, and user guides |
| [Optimization_Roadmap.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Optimization_Roadmap.md) | `docs/` | âœ… Active | VRAM limits, memory offloads, and software acceleration settings |
| [CHANGELOG.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/CHANGELOG.md) | `docs/` | âœ… Active | Platform change tracking history |
| [ValidationReport.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/ValidationReport.md) | `docs/` | âœ… Active | Automated validation checks and system compliance matrix |
| [Walkthrough.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Walkthrough.md) | `docs/` | âœ… Active | Step-by-step developer verification log |
| [ADR-001-Contract-First-Versioned-API-Boundaries.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-001-Contract-First-Versioned-API-Boundaries.md) | `adr/` | âœ… Approved | Contract-first REST specifications |
| [ADR-002-Server-Side-Decoupled-Authentication.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-002-Server-Side-Decoupled-Authentication.md) | `adr/` | âœ… Approved | Decoupling auth logic from nextjs pages |
| [ADR-003-Unified-Event-Driven-Registry.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-003-Unified-Event-Driven-Registry.md) | `adr/` | âœ… Approved | Loose decoupling of services via event bus |
| [ADR-004-Pipeline-Worker-Processing-Architecture.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-004-Pipeline-Worker-Processing-Architecture.md) | `adr/` | âœ… Approved | Asynchronous jobs queue orchestration |
| [ADR-005-Repository-Information-Architecture-Rationalization.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-005-Repository-Information-Architecture-Rationalization.md) | `adr/` | âœ… Approved | Cleaning loose markdown files and consolidating into structured directories |
| [ADR-006-Script-Engineering-Standards.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-006-Script-Engineering-Standards.md) | `adr/` | âœ… Approved | Standards for PowerShell scripts (PlatformHelper logging, elevation, strict types) |
| [ADR-007-Portable-Configuration-Architecture.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-007-Portable-Configuration-Architecture.md) | `adr/` | âœ… Approved | Portable central profiles and config configurations |
| [ADR-008-Platform-Asset-Catalog-Design.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-008-Platform-Asset-Catalog-Design.md) | `adr/` | âœ… Approved | JSON catalog databases structure for platform assets mapping |
| [AGENTS.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/AGENTS.md) | Workspace Root | âœ… Active | Workspace-level rules for agent pairs |
| [CLAUDE.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/CLAUDE.md) | Workspace Root | âœ… Active | Cheat sheet listing build and development tasks |
| [Bootstrap.ps1](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/Bootstrap.ps1) | Workspace Root | âœ… Active | Administrative setup script starting bootstrap routine |
| [PlatformHelper.psm1](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/automation/libs/PlatformHelper.psm1) | `automation/libs/` | âœ… Active | Shared automation helper library |

### Duplicate Detection

All duplicate loose backup documentation, model lists, and port logs have been completely cleaned and eliminated. A single source of truth is established in the `docs/` and `adr/` subfolders under version control.

---

## 12. Diagram Generation Guidelines

### Universal Style Guide for All Diagram Prompts

All 40 diagram prompts below follow these consistent style parameters:

**Color Palette:**
- Primary: `#1A1A2E` (deep navy background)
- Secondary: `#16213E` (dark blue panels)
- Accent 1: `#0F3460` (mid-blue layers)
- Accent 2: `#E94560` (coral red highlights / critical paths)
- Accent 3: `#53BDEB` (cyan data flow arrows)
- Accent 4: `#FFD93D` (gold labels / callouts)
- Success: `#4ADE80` (green status indicators)
- Warning: `#FBBF24` (amber alerts)
- Text: `#E2E8F0` (light gray text)
- Muted: `#64748B` (subtle annotations)

**Typography:**
- Headings: Inter Bold, 16â€“24pt
- Labels: Inter Medium, 10â€“14pt
- Annotations: Inter Light, 8â€“10pt

**Icon Style:** Flat, monochrome white icons with subtle glow effects. Use standardized tech logos where applicable (NVIDIA, AMD, Docker, PostgreSQL).

**Layout Principles:**
- Left-to-right or top-to-bottom information flow
- Grouped components in rounded-corner containers with subtle borders
- Consistent spacing (16px grid)
- Connection lines: 2px weight, curved paths, arrowheads indicating direction
- Legend positioned in bottom-right corner

**Background:** Dark theme gradient from `#1A1A2E` to `#0F0F23`

**Negative Prompt (Universal):** Do not include: cartoon styling, 3D photorealistic rendering, stock photography, watermarks, decorative illustrations unrelated to the architecture, consumer-grade graphics, placeholder text like "Lorem ipsum", components not discovered on this system, generic cloud provider icons (AWS/Azure/GCP) unless verified, random servers not in inventory.

---

## 13. Diagram Prompts

---

### Diagram 1: Executive Infrastructure Overview

**Title:** Enterprise AI Infrastructure Overview â€” Raja's Local AI Workstation

**Purpose:** Provide a single-glance executive summary of the entire AI workstation architecture, showing how hardware, software, and AI components interconnect to deliver local AI inference and agent orchestration.

**Target Audience:** Executives, Enterprise Architects, Auditors

**Diagram Type:** Layered Architecture (Isometric/Modern)

**Visual Style:**
- Color palette: Dark theme with navy, cyan, coral accents
- Icon style: Flat enterprise icons with subtle glow
- Perspective: Slight isometric tilt (15Â°)
- Level of detail: High-level, 4 layers visible
- Label density: Medium â€” key service names and ports only
- Background: Dark gradient

**Diagram Prompt:**
Create a premium, enterprise-grade layered architecture diagram showing 4 horizontal tiers on a dark navy background. **Top Layer (User Interface):** Show a monitor icon labeled "Antigravity IDE / Client" and a globe icon labeled "Open-WebUI :8090" connected by a horizontal bar. **Second Layer (AI Gateway):** Show three service boxes: "AegisOS Gateway :18789" (center, coral accent border), "OmniRoute Dashboard :20128" (right), with MCP satellite icons orbiting AegisOS showing "filesystem", "git", "github", "sqlite", "fetch", "puppeteer", "knowledge-repo". **Third Layer (AI Routing):** Show a "LiteLLM Proxy :4000" box with branching arrows labeled with model aliases (gemma, qwen, deepseek, vision, coder, planner, reasoner) feeding into fallback chains. **Bottom Layer (Inference Engine):** Show the "Ollama Server :11434" box connected to a GPU icon labeled "NVIDIA RTX 5080 â€” 16 GB VRAM" and CPU icon labeled "AMD Ryzen 9 9950X3D â€” 32 Threads". Show data stores on the right side: PostgreSQL (3 instances), MongoDB, Redis, SQLite. Add a security shield icon on the left labeled "DPAPI Secrets / Norton Firewall / Loopback Security". Include a legend showing: Running Service (green dot), LAN Exposed (yellow), Loopback Only (blue). Title the diagram "Raja's Local AI Workstation â€” Enterprise Architecture Overview".

**Negative Prompt:** No cloud provider icons, no cartoon styling, no fictional components, no generic server racks, no missing labels, no low-resolution output, no consumer graphics.

**Key Labels:** AegisOS Gateway :18789, LiteLLM Proxy :4000, Ollama :11434, OmniRoute :20128, Open-WebUI :8090, RTX 5080 16GB, Ryzen 9 9950X3D, 64GB DDR5, DPAPI, Norton, Tailscale, MCP Servers, PostgreSQL, MongoDB, Redis

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9 aspect ratio

---

### Diagram 2: Physical Hardware Architecture

**Title:** Physical Hardware Architecture â€” AMD Ryzen 9 9950X3D + RTX 5080 AI Workstation

**Purpose:** Visualize the physical hardware components, their interconnections via PCIe/memory buses, and how they support AI workloads.

**Target Audience:** Engineers, Hardware Architects, DevOps

**Diagram Type:** Exploded View / Technical Blueprint

**Visual Style:**
- Color palette: Dark theme, cyan and gold accents
- Icon style: Technical component silhouettes
- Perspective: Flat top-down exploded view
- Level of detail: High â€” show bus connections
- Background: Dark blueprint grid

**Diagram Prompt:**
Create a technical hardware blueprint diagram on a dark background with subtle grid lines. Center the **Gigabyte X870E AORUS MASTER** motherboard as a large rectangular outline. Inside, place the **AMD Ryzen 9 9950X3D** CPU socket (top-center) with "16C/32T, 4.3GHz, 3D V-Cache" label and an "AMD-V Enabled" badge. Show a **PCIe Gen 5 x16** slot containing the **NVIDIA GeForce RTX 5080** GPU card with "16GB GDDR7 VRAM, 360W TDP, CUDA 13.3" specifications. Show two **DDR5 DIMM slots** with "CORSAIR CMT64GX5M2B6000Z30" labels reading "32GB Ã— 2 = 64GB DDR5-4800". Show two **M.2 NVMe slots**: one containing "Samsung 9100 PRO 2TB (PCIe Gen 5)" labeled "OS + Models" and another containing "WD_BLACK SN850X 1TB (PCIe Gen 4)" labeled "Projects + Knowledge". Show network connectors: "Realtek 5GbE" (wired), "Qualcomm FastConnect 7800 Wi-Fi 7". Connect components with labeled bus lines showing bandwidth: "PCIe 5.0 x16 â†’ 128 GB/s", "DDR5-4800 â†’ 76.8 GB/s", "PCIe 5.0 x4 â†’ 32 GB/s (NVMe)". Add callout boxes showing AI-relevant metrics: "VRAM: 16GB (fits up to 14B models fully on GPU)", "System RAM: 64GB (CPU offload for 26Bâ€“32B models)", "Storage: 14 GB/s read (3.2s cold start for 14B)". Title: "Physical Hardware Architecture".

**Negative Prompt:** No 3D photorealistic rendering, no brand logos except NVIDIA/AMD/Corsair/Samsung/WD, no decorative elements, no missing specifications.

**Key Labels:** AMD Ryzen 9 9950X3D, NVIDIA RTX 5080, 16GB GDDR7, 64GB DDR5-4800, CORSAIR, Samsung 9100 PRO 2TB, WD_BLACK SN850X 1TB, PCIe Gen 5, Gigabyte X870E AORUS MASTER, Realtek 5GbE, Qualcomm Wi-Fi 7

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 3: AI Software Stack

**Title:** AI Software Stack â€” Layered Component Architecture

**Purpose:** Show the vertical software stack from hardware abstraction to user-facing interfaces, with all AI components positioned in their correct architectural layer.

**Target Audience:** Engineers, Architects, Developers

**Diagram Type:** Layered Architecture (Vertical Stack)

**Visual Style:**
- Color palette: Dark theme, gradient layers from dark bottom to lighter top
- Level of detail: High â€” show every component
- Icon style: Flat tech logos

**Diagram Prompt:**
Create a vertical layered stack diagram with 6 horizontal tiers on a dark background. **Layer 1 (Bottom â€” Hardware):** Dark background containing GPU icon "RTX 5080 VRAM 16GB", CPU icon "Ryzen 9 9950X3D", RAM icon "64GB DDR5", NVMe icon "3TB NVMe". **Layer 2 (OS & Drivers):** "Windows 11 Pro Build 26200", "NVIDIA Driver 610.47", "CUDA 13.3", "Hyper-V", "WSL2". **Layer 3 (Runtimes):** "Python 3.12.4", "Node.js 24.16.0", "Docker 29.6.1", "NSSM", "uv/uvx". **Layer 4 (AI Engines):** "Ollama v0.31.1" (large central box) with satellite model icons: gemma4, qwen3, deepseek-r1, gpt-oss, qwen3.6, all-minilm, smollm. **Layer 5 (AI Middleware):** "LiteLLM Proxy :4000" (routing), "AegisOS Gateway :18789" (orchestration), "OmniRoute :20128" (dashboard). Show MCP server icons orbiting AegisOS. **Layer 6 (Top â€” Interfaces):** "Antigravity IDE", "Open-WebUI :8090", "API Clients". Add labeled arrows between layers showing data flow. Title: "AI Software Stack â€” Full Vertical Architecture".

**Negative Prompt:** No horizontal layout, no missing layers, no unlabeled components, no cloud icons.

**Key Labels:** Windows 11 Pro, NVIDIA CUDA 13.3, Python 3.12.4, Node.js 24.16.0, Docker 29.6.1, Ollama v0.31.1, LiteLLM :4000, AegisOS :18789, OmniRoute :20128, Open-WebUI :8090, NSSM, 12 Models

**Suggested Resolution:** 2160 Ã— 3840 (4K Portrait), 9:16

---

### Diagram 4: AegisOS Internal Architecture

**Title:** AegisOS AI Gateway â€” Internal Architecture & Agent Orchestration

**Purpose:** Reveal the internal structure of the AegisOS gateway, including agent system, MCP server mounting, plugin layer, memory management, and request handling pipeline.

**Target Audience:** Engineers, Architects, Developers

**Diagram Type:** Component Architecture (Modern Technical)

**Visual Style:**
- Color palette: Dark theme, coral accent for AegisOS components
- Level of detail: Very high â€” show internal subsystems

**Diagram Prompt:**
Create a detailed component architecture diagram centered on the AegisOS Gateway (port 18789). Show it as a large rounded rectangle with internal subsystems. **Request Handler** (top): receives incoming requests from clients. **Agent Orchestrator** (center): contains three agent boxes â€” "main" (coral), "developer" (cyan), "reviewer" (gold) â€” with delegation arrows between them. Show the agent delegation flow: main â†’ developer (task delegation), developer â†’ reviewer (code submission), reviewer â†’ main (approval/rejection). **MCP Layer** (left side): 8 local MCP server icons with labels (filesystem, git, github, sqlite, fetch, puppeteer, raja-knowledge-repository, and codegraph) connected to the agent orchestrator via stdio/local transport lines. **Context Optimization Layer** (right side): show Ponytail context filter (context pruning) and Headroom prompt compression proxy wrapper. **Memory Layer** (bottom-left): "SQLite Agent Memory" (aegisos-agent.sqlite), "State Database" (aegisos.sqlite). **LLM Connection** (bottom-right): arrow pointing through Headroom token compressor to "LiteLLM Proxy :4000" with model alias mapping. **Config Layer** (bottom): "aegisos.json", "DPAPI Secrets", "AGENTS.md", "CLAUDE.md", "console_config.json". Show the request flow with numbered steps: 1â†’Request, 2â†’CodeGraph Dependency Query, 3â†’Context Enrichment (MCP), 4â†’Ponytail Pruning, 5â†’Headroom Prompt Compression, 6â†’LLM Routing. Title: "AegisOS Gateway â€” Internal Architecture".

**Negative Prompt:** No oversimplification, no missing MCP servers, no incorrect agent names, no generic icons.

**Key Labels:** AegisOS Gateway :18789, main agent, developer agent, reviewer agent, MCP Servers (8), Ponytail Pruner, Headroom Compressor, aegisos-agent.sqlite, DPAPI Secrets, AGENTS.md, console_config.json, Token Auth

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 5: LiteLLM Routing Architecture

**Title:** LiteLLM Routing Engine â€” Model Aliases, Fallback Chains & Load Balancing

**Purpose:** Visualize how LiteLLM routes requests to Ollama models using the least-busy strategy, capability aliases, and cascading fallback chains.

**Target Audience:** Engineers, DevOps, Architects

**Diagram Type:** Data Flow / Routing Map

**Visual Style:**
- Color palette: Dark theme, cyan for data flows, coral for fallbacks
- Level of detail: Very high â€” show every alias and fallback path

**Diagram Prompt:**
Create a routing flow diagram showing the LiteLLM Proxy (port 4000) as a central router hub on a dark background. On the **left side**, show incoming request channels labeled by capability: "planner", "coder", "reviewer", "reasoner", "chat", "vision", "embedding". In the **center**, show the LiteLLM router with a "least-busy" routing strategy badge and configuration badges: "retries: 3", "timeout: 120s", "health_check: 300s". On the **right side**, show Ollama model endpoints arranged vertically: "gemma4:latest (9.6GB)", "qwen2.5:14b (9.3GB)", "deepseek-r1:32b (19GB)", "gpt-oss:20b (13GB)", "qwen3.6:27b (17GB)", "gemma4:31b (19GB)", "all-minilm (45MB)", "smollm:135m (91MB)". Draw **primary routing lines** (solid cyan arrows) from each alias to its target model. Draw **fallback chains** (dashed coral arrows) showing cascading fallback paths. For example: gemma31 â†’(fail)â†’ qwen â†’(fail)â†’ gemma â†’(fail)â†’ smollm. Show "smollm:135m" at the bottom as the terminal fallback with a special "terminal fallback" badge. Add a health status panel showing "9 Healthy / 5 Unhealthy". Title: "LiteLLM Routing Architecture â€” Model Aliases & Fallback Chains".

**Negative Prompt:** No simplified routing, no missing fallback chains, no incorrect model names, no cloud icons.

**Key Labels:** LiteLLM :4000, least-busy, 14 aliases, 8 backend models, fallback chains, retries: 3, timeout: 120s, smollm (terminal fallback), health: 9/5

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 6: Ollama Model Architecture

**Title:** Ollama Model Engine â€” VRAM Allocation & GPU/CPU Split Architecture

**Purpose:** Show how Ollama manages model loading, VRAM allocation, and GPU/CPU tensor splitting for models that exceed the 16 GB VRAM limit.

**Target Audience:** Engineers, DevOps, Hardware Architects

**Diagram Type:** Resource Allocation Diagram

**Visual Style:**
- Color palette: Dark theme with green (GPU), amber (CPU offload), red (overflow)
- Level of detail: Very high â€” show VRAM utilization per model

**Diagram Prompt:**
Create a resource allocation diagram showing the Ollama inference engine's VRAM management. At the top, show a **VRAM gauge** as a horizontal bar: 16,303 MiB total, with gradient coloring from green (0-14GB safe) to amber (14-16GB warning) to red (>16GB overflow to CPU). Below, show a **model catalog** as stacked horizontal bars, each representing a model with its VRAM footprint: smollm:135m (tiny green sliver), all-minilm (tiny green), gemma4:latest (11.8GB green bar), qwen3:14b (11.5GB green bar), gpt-oss:20b (partial amber â€” "GPU: ~78% / CPU: ~22%"), gemma4:26b (20.5GB with amber overflow â€” "GPU: 78% / CPU: 22%"), qwen3.6:27b (partial amber), gemma4:31b (23GB with red overflow â€” "GPU: 61% / CPU: 39%"), deepseek-r1:32b (23.2GB with red overflow â€” "GPU: 60% / CPU: 40%"). Show **token throughput** annotations: green zone models = "70-250 t/s", amber zone = "28 t/s", red zone = "10-12 t/s". Add a **hardware panel** at bottom showing: "RTX 5080: 16GB GDDR7", "Ryzen 9 9950X3D: 32 threads (CPU offload)", "Flash Attention: Enabled", "KV Cache: q8_0 quantized (âˆ’30% VRAM)". Title: "Ollama VRAM Allocation â€” GPU/CPU Split Architecture".

**Negative Prompt:** No inaccurate VRAM numbers, no missing models, no unlabeled bars, no decorative elements.

**Key Labels:** 16,303 MiB VRAM, GPU Zone, CPU Offload Zone, 250 t/s (smollm), 75 t/s (qwen3:14b), 12 t/s (gemma4:31b), Flash Attention, KV Cache q8_0

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 7: Local LLM Ecosystem

**Title:** Local LLM Ecosystem â€” Model Taxonomy & Capability Map

**Purpose:** Classify all local models by capability (reasoning, coding, vision, embedding, fallback) and show their relationships within the ecosystem.

**Target Audience:** Engineers, Developers, Architects

**Diagram Type:** Taxonomy / Classification Map

**Visual Style:**
- Color palette: Dark theme, each capability category has a distinct color
- Level of detail: Model-level with capability badges

**Diagram Prompt:**
Create a taxonomy diagram on a dark background organizing all 12 Ollama models into capability clusters. Use circular cluster groupings. **Reasoning Cluster** (coral): deepseek-r1:32b, qwen3:30b, gemma4:31b, gemma4:26b. **General Purpose Cluster** (cyan): gemma4:latest, gemma2:9b, qwen2.5:14b. **Coding Cluster** (green): gpt-oss:20b, qwen3:14b. **Vision Cluster** (purple): qwen3.6:27b. **Embedding Cluster** (gold): all-minilm:latest. **Fallback Cluster** (gray): smollm:135m. Show cross-links between clusters where models serve multiple roles (e.g., qwen2.5:14b appears in both general and coding). Add size badges on each model (9.3GB, 19GB, etc.) and VRAM status indicators (green=fits, amber=partial, red=heavy offload). Show LiteLLM alias mappings as dotted lines connecting aliases to their target models. Title: "Local LLM Ecosystem â€” Model Capability Taxonomy".

**Negative Prompt:** No missing models, no incorrect sizes, no cloud-hosted models, no unlabeled nodes.

**Key Labels:** 12 models, 6 capability categories, Reasoning, Coding, Vision, Embedding, General Purpose, Terminal Fallback, LiteLLM Aliases

**Suggested Resolution:** 3840 Ã— 3840 (Square 4K), 1:1

---

### Diagram 8: Model Lifecycle

**Title:** Model Lifecycle â€” From Pull to Inference to Eviction

**Purpose:** Show the complete lifecycle of a model from initial download through loading, warm residency, inference, and eviction.

**Target Audience:** Engineers, DevOps

**Diagram Type:** Lifecycle / State Machine

**Visual Style:**
- Horizontal swimlane with state transitions
- Color palette: Dark theme, green/amber/red state indicators

**Diagram Prompt:**
Create a horizontal lifecycle state machine diagram showing a model's journey through the Ollama engine. States (left to right): **1. Pull** (downloading GGUF weights from registry to `C:\ProgramData\Models\Ollama`) â†’ **2. Registered** (listed in `ollama list`, stored on NVMe) â†’ **3. Cold Load** (triggered by first request, weights streamed from NVMe to VRAM â€” "3.2s for 14B, 18.5s for 31B") â†’ **4. VRAM Resident** (warm state, model loaded in GPU memory â€” "120-250ms TTFT") â†’ **5. Active Inference** (processing tokens â€” "10-250 t/s depending on model size") â†’ **6. Idle Timeout** (model remains resident up to OLLAMA_MAX_LOADED_MODELS=2 limit) â†’ **7. Eviction** (unloaded from VRAM when newer model requested or memory pressure). Show branching at step 3: if model > 16GB VRAM, branch to "GPU/CPU Split Loading" showing partial VRAM + system RAM allocation. Show the **OllamaModelSync** scheduled task (daily 02:00) that triggers model inventory verification. Add a feedback loop from Eviction back to Cold Load. Title: "Model Lifecycle â€” Pull to Inference to Eviction".

**Negative Prompt:** No simplified lifecycle, no missing states, no incorrect latency numbers.

**Key Labels:** Pull, Registered, Cold Load, VRAM Resident, Active Inference, Idle, Eviction, 3.2s cold start (14B), 18.5s (31B), 120ms TTFT, GPU/CPU Split, OllamaModelSync

**Suggested Resolution:** 3840 Ã— 1080 (Ultra-wide), 32:9

---

### Diagram 9: Prompt Lifecycle

**Title:** Prompt Lifecycle â€” From User Input to Streamed Response

**Purpose:** Trace a user prompt through every processing stage: context enrichment, routing, inference, and streaming response.

**Target Audience:** Engineers, Developers

**Diagram Type:** Sequence / Data Flow

**Visual Style:**
- Horizontal data flow with numbered steps
- Color palette: Dark theme, cyan flow arrows

**Diagram Prompt:**
Create a horizontal data flow diagram showing the complete lifecycle of a user prompt. Number each stage. **Stage 1: Input** â€” User types prompt in Antigravity IDE or Open-WebUI. **Stage 2: Gateway Receive** â€” AegisOS Gateway (:18789) receives the request via HTTP. **Stage 3: Context Enrichment** â€” AegisOS executes MCP server calls in parallel: queries raja-knowledge-repository for domain context, queries sqlite for session memory, queries filesystem for code context. Show these as parallel branches merging back. **Stage 4: Agent Selection** â€” AegisOS selects the appropriate agent (main/developer/reviewer) based on task type. **Stage 5: Prompt Assembly** â€” System prompt (SOUL.md + AGENTS.md) + enriched context + user message assembled into completion request. **Stage 6: LLM Routing** â€” Request sent to LiteLLM (:4000), which applies least-busy routing to select target model. **Stage 7: Model Selection** â€” LiteLLM resolves alias to Ollama model (e.g., "gemma" â†’ "gemma4:latest"). If unhealthy, fallback chain activates. **Stage 8: Inference** â€” Ollama processes tokens on RTX 5080 GPU (or GPU+CPU split for large models). **Stage 9: Streaming Response** â€” Tokens stream back through Ollama â†’ LiteLLM â†’ AegisOS â†’ Client. Show latency annotations at each stage: MCP calls ~25ms, routing ~5ms, TTFT ~120-250ms. Title: "Prompt Lifecycle â€” End-to-End Processing Pipeline".

**Negative Prompt:** No missing stages, no incorrect port numbers, no simplified flow.

**Key Labels:** 9 stages, AegisOS :18789, LiteLLM :4000, Ollama :11434, MCP enrichment, least-busy routing, fallback chains, streaming response, TTFT 120-250ms

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 10: Agent Workflow

**Title:** Multi-Agent Workflow â€” Task Delegation, Execution & Review Pipeline

**Purpose:** Show how the three agents (main, developer, reviewer) collaborate through task delegation, code execution, and quality review cycles.

**Target Audience:** Engineers, Architects, Product Managers

**Diagram Type:** Workflow / Swimlane

**Visual Style:**
- Three horizontal swimlanes, one per agent
- Color palette: Coral (main), Cyan (developer), Gold (reviewer)

**Diagram Prompt:**
Create a three-lane horizontal swimlane diagram with dark background. **Top Lane â€” Main Agent** (coral accent): "Executive, Planning, Knowledge" â€” shows: Receive user request â†’ Decompose task â†’ Query Knowledge Repo (MCP) â†’ Delegate to Developer. **Middle Lane â€” Developer Agent** (cyan accent): "Engineering, Automation" â€” shows: Receive delegated task â†’ Write code (Filesystem MCP) â†’ Run tests â†’ Submit to Reviewer. **Bottom Lane â€” Reviewer Agent** (gold accent): "Architecture, Quality, Audit" â€” shows: Receive code submission â†’ Review against standards â†’ Check security (no hardcoded secrets) â†’ Approve/Reject â†’ Return to Main. Show cross-lane arrows for delegation (mainâ†’developer), submission (developerâ†’reviewer), and approval/rejection (reviewerâ†’main). Show model assignments: main uses "gemma4:latest", developer uses "qwen3:14b", reviewer uses "deepseek-r1:32b". Add MCP tool badges on each lane showing which tools each agent can access. Title: "Multi-Agent Workflow â€” Delegation, Execution & Review".

**Negative Prompt:** No missing agents, no incorrect model assignments, no simplified flow.

**Key Labels:** main (gemma4:latest), developer (qwen3:14b), reviewer (deepseek-r1:32b), delegation, submission, approval/rejection, MCP tools

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 11: Request Processing Pipeline

**Title:** Request Processing Pipeline â€” HTTP to Token Stream

**Purpose:** Show the technical processing pipeline from HTTP request receipt to token generation.

**Target Audience:** Engineers, Developers

**Diagram Type:** Technical Pipeline / Sequence

**Visual Style:** Dark theme, numbered pipeline stages with latency annotations

**Diagram Prompt:**
Create a horizontal pipeline diagram showing 7 processing stages from left to right on a dark background. Each stage is a rounded rectangle connected by arrows with latency annotations. **Stage 1: HTTP Receive** (AegisOS :18789) â€” "Token validation, request parsing" â€” ~5ms. **Stage 2: MCP Context** â€” "Parallel MCP calls: SQLite (25ms), Knowledge Repo (65ms), Filesystem (25ms)" â€” show parallel branches. **Stage 3: Prompt Assembly** â€” "System prompt + context + user message" â€” ~2ms. **Stage 4: Router** (LiteLLM :4000) â€” "least-busy selection, health check, alias resolution" â€” ~5ms. **Stage 5: Model Queue** â€” "Request queued if model busy, retry up to 3 times" â€” variable. **Stage 6: Inference** (Ollama :11434) â€” "GPU tensor computation on RTX 5080" â€” TTFT: 120-250ms. **Stage 7: Stream** â€” "SSE token streaming back to client" â€” continuous. Show a total latency bar at bottom: "Total P50: ~300ms to first token". Add error handling path showing fallback chain activation on timeout (>120s). Title: "Request Processing Pipeline".

**Negative Prompt:** No missing stages, no incorrect latencies, no oversimplification.

**Key Labels:** 7 stages, ~300ms P50 TTFT, MCP parallel, least-busy, SSE streaming, fallback on timeout, retry: 3

**Suggested Resolution:** 3840 Ã— 1080, 32:9

---

### Diagram 12: Data Flow

**Title:** End-to-End Data Flow â€” User Query to Knowledge-Enriched Response

**Purpose:** Trace data movement through the entire system, including knowledge retrieval, model inference, and response assembly.

**Target Audience:** Engineers, Architects

**Diagram Type:** Data Flow Diagram (DFD)

**Visual Style:** Dark theme, colored data flow arrows distinguishing data types

**Diagram Prompt:**
Create a data flow diagram on a dark background using colored arrows to distinguish data types: cyan for user data, gold for knowledge data, green for model data, coral for response data. Show data stores as cylinders: "SQLite Agent Memory", "Knowledge Repository (Markdown)", "Ollama Model Registry", "OmniRoute Call Logs". Show processing nodes as rounded rectangles: "AegisOS Gateway", "LiteLLM Router", "Ollama Inference". **User data flow (cyan):** User â†’ AegisOS (prompt text) â†’ LiteLLM (enriched prompt) â†’ Ollama (tokenized input). **Knowledge data flow (gold):** Knowledge Repository â†’ raja-knowledge-repo MCP â†’ AegisOS (context chunks with cosine similarity scores). **Model data flow (green):** Ollama Model Registry â†’ Ollama (GGUF weights loaded to VRAM). **Response data flow (coral):** Ollama (generated tokens) â†’ LiteLLM (streamed response) â†’ AegisOS (assembled response) â†’ User. **Logging data flow (gray):** All components â†’ Log files and OmniRoute call logs. Title: "End-to-End Data Flow".

**Negative Prompt:** No data flows not present in the system, no incorrect data store names.

**Key Labels:** User data, Knowledge data, Model data, Response data, Logging data, cosine similarity, GGUF weights, SSE stream, call logs

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 13: Network Architecture

**Title:** Network Architecture â€” Port Map, Firewall Zones & Interface Topology

**Purpose:** Show all network interfaces, port allocations, firewall zones, and communication paths.

**Target Audience:** DevOps, Security Engineers, Network Architects

**Diagram Type:** Network Map

**Visual Style:** Dark theme, zone-based layout with security boundary indicators

**Diagram Prompt:**
Create a network topology diagram on a dark background with three security zones separated by dashed boundary lines. **Zone 1: Loopback Only (127.0.0.1)** â€” highest security (blue zone): AegisOS :18789, Headroom Proxy :4050, LiteLLM :4000, CodeGraph MCP :18790, MongoDB :27017, pgBouncer :6432. **Zone 2: LAN Accessible (192.168.29.41)** â€” medium security (amber zone): Ollama :11434, PostgreSQL :5432/5433/5434, Redis :6379, SSH :22, RDP :3389, Open-WebUI :8090. **Zone 3: VPN Overlay (100.90.78.53)** â€” Tailscale mesh (green zone): remote device access. Show the physical network interface "Realtek 5GbE" connecting to "Router 192.168.29.1" (DHCP). Show Docker NAT "172.27.32.1" bridging to Open-WebUI container. Show firewall icons at zone boundaries. Annotate Ollama with "âš  LAN exposed â€” unauthenticated". Show Norton Firewall as a shield icon encompassing Zone 2. Title: "Network Architecture â€” Security Zones & Port Map".

**Negative Prompt:** No incorrect IP addresses, no missing ports, no cloud networking.

**Key Labels:** 127.0.0.1, 192.168.29.41, 100.90.78.53, Loopback Zone, LAN Zone, VPN Zone, Norton Firewall, Tailscale, 16 listening ports, Docker NAT

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 14: Filesystem Layout

**Title:** Filesystem Layout â€” AI Infrastructure Directory Tree

**Purpose:** Show the complete directory structure supporting the AI infrastructure, including junction points and symlinks.

**Target Audience:** Engineers, DevOps

**Diagram Type:** Tree / Hierarchy

**Visual Style:** Dark theme, monospace font, indented tree with color-coded directory types

**Diagram Prompt:**
Create a filesystem tree diagram on a dark background using monospace typography. Show the complete directory hierarchy with color coding: cyan for junction/symlink paths, gold for configuration files, green for data directories, coral for security-sensitive paths. Root nodes: **C:\ProgramData\AI\** (system) â€” show: Config/, Logs/, Models/Ollama (~130GB), omniroute/, omniroute-data/, aegisos/ (junction target). **C:\Users\rjkum\.aegisos** â†’ **D:\AIPlatform** (junction target â€” show with cyan arrow): apps/ (service binaries and wraps), configs/ (litellm/, aegisos/), databases/ (codegraph.sqlite, aegisos.sqlite), secrets/ (DPAPI encrypted â€” coral), logs/ (rotated service and monitor logs), models/ (GGUF links). **D:\1_Projects\OpenClawOllamaLiteLLM_Transparency\** (workspace root) â€” show: Bootstrap.ps1, console_config.json, ModelManifest.json, adr/ (ADR-001 through ADR-008 markdown files), docs/ (11 structured guides), automation/ (modular automation scripts: Install.ps1, Configure.ps1, Validate.ps1, Backup.ps1, Restore.ps1, Migrate.ps1, HealthCheck.ps1, Package.ps1), automation/libs/PlatformHelper.psm1, automation/catalogs/ (JSON catalog definitions), automation/profiles/ (deployment profiles). **D:\Raja Jeevan Kumar Maduri_MarkDown_Personality\** â€” RAG notes. Show junction/symlink indicators. Title: "Filesystem Layout â€” AI Infrastructure".

**Negative Prompt:** No missing directories, no incorrect junction targets, no placeholder text, no legacy DisasterRecovery folder.

**Key Labels:** C:\ProgramData\AI, D:\AIPlatform, ~/.aegisos (junction), workspace root, automation/, catalogs/, profiles/, adr/, docs/, secrets/ (DPAPI)

**Suggested Resolution:** 2160 Ã— 3840 (4K Portrait), 9:16

---

### Diagram 15: Folder Hierarchy

**Title:** AegisOS Workspace Folder Hierarchy â€” Operational Documentation Suite

**Purpose:** Detail the internal structure of the AegisOS workspace, showing all operational documentation, agents, skills, and configuration files.

**Target Audience:** Engineers, Technical Writers

**Diagram Type:** Hierarchy / Mind Map

**Visual Style:** Dark theme, radial hierarchy centered on .aegisos

**Diagram Prompt:**
Create a radial hierarchy diagram centered on the workspace root directory on a dark background. Show concentric rings of subdirectories expanding outward. **Inner Ring (Core):** Bootstrap.ps1, console_config.json, ModelManifest.json, package.json. **Second Ring (Automation Engine):** automation/ â†’ libs/ (PlatformHelper.psm1), catalogs/ (12 JSON catalog files), profiles/ (5 deployment profiles), and scripts: Install.ps1, Configure.ps1, Validate.ps1, Backup.ps1, Restore.ps1, Migrate.ps1, HealthCheck.ps1. **Third Ring (Architectural Records):** adr/ â†’ ADR-001 through ADR-008. **Fourth Ring (Platform Guides):** docs/ â†’ show all 11 consolidated guides: Architecture_Handbook.md, Platform_Handbook.md, Operations_Guide.md, Deployment_Guide.md, Developer_Guide.md, Disaster_Recovery_Guide.md, Administrator_Guide.md, Optimization_Roadmap.md, CHANGELOG.md, ValidationReport.md, Walkthrough.md. **Outer Ring (Infrastructure Targets):** $PlatformRoot/ â†’ apps/, configs/, databases/ (sqlite files), secrets/ (enc files), logs/ (monitor logs). Use file count badges on each directory. Title: "Platform Workspace â€” Rationalized Folder Hierarchy".

**Negative Prompt:** No missing directories, no incorrect file counts, no legacy loose markdown logs, no empty DisasterRecovery folder.

**Key Labels:** Workspace Root, automation/, catalogs/, profiles/, adr/ (8 records), docs/ (11 guides), $PlatformRoot, PlatformHelper.psm1

**Suggested Resolution:** 3840 Ã— 3840 (Square 4K), 1:1

---

### Diagram 16: Docker Architecture

**Title:** Docker Architecture â€” Container Runtime & WSL2 Integration

**Purpose:** Show the Docker Desktop architecture including WSL2 backend, container networking, and volume management.

**Target Audience:** DevOps, Engineers

**Diagram Type:** Container Architecture

**Visual Style:** Dark theme, Docker blue accents

**Diagram Prompt:**
Create a container architecture diagram on a dark background. Show the host Windows 11 system containing **Docker Desktop v29.6.1** with WSL2 backend. Inside Docker, show the **bridge network** "docker_default". Show the single running container: **open-webui** (image: ghcr.io/open-webui/open-webui:main, 7.01GB) with health status "healthy". Show port mapping: host 8090 â†’ container 8080. Show the container's connection to external services: arrow to "Ollama :11434" (via OLLAMA_BASE_URL environment variable). Show Docker volume management: no named volumes, but internal SQLite database storing ~1.72GB of chat data. Show the WSL2 hypervisor layer between Docker and Windows with virtual network adapters (172.27.32.1, 172.28.48.1). Title: "Docker Architecture â€” Open-WebUI Container".

**Negative Prompt:** No multiple containers (only 1 exists), no Kubernetes, no Docker Swarm.

**Key Labels:** Docker 29.6.1, WSL2, open-webui, ghcr.io/open-webui/open-webui:main, 7.01GB image, port 8090â†’8080, healthy, OLLAMA_BASE_URL, bridge network

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 17: Container Relationships

**Title:** Container & Service Relationships â€” Inter-Service Communication Map

**Purpose:** Map all service-to-service communication paths, including Docker containers and native Windows services.

**Target Audience:** DevOps, Engineers

**Diagram Type:** Relationship Map

**Visual Style:** Dark theme, directional arrows with protocol labels

**Diagram Prompt:**
Create a relationship map diagram on a dark background showing all service nodes and their interconnections. Nodes: **Ollama** (star shape â€” central hub), **LiteLLM**, **AegisOS**, **OmniRoute**, **Open-WebUI** (Docker container badge), **PostgreSQL** (3 instances), **MongoDB**, **Redis**, **MCP Servers** (group). Connections with protocol labels: Open-WebUI â†’(HTTP/OLLAMA_BASE_URL)â†’ Ollama. LiteLLM â†’(HTTP/Ollama API)â†’ Ollama. AegisOS â†’(HTTP/OpenAI Completions)â†’ LiteLLM. OmniRoute â†’(HTTP/Internal Routing)â†’ LiteLLM. OmniRoute â†’(HTTP/Direct Fallback)â†’ Ollama. AegisOS â†’(stdio/local)â†’ MCP Servers. AegisOS â†’(SQLite)â†’ Agent Memory DB. OmniRoute â†’(SQLite)â†’ OmniRoute Storage DB. Show which connections are loopback-only (blue) vs LAN-accessible (amber). Title: "Container & Service Relationships".

**Negative Prompt:** No fictional connections, no incorrect protocols.

**Key Labels:** HTTP, OpenAI API, Ollama API, stdio, SQLite, loopback, LAN, 5 core services, 3 databases

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 18: API Interaction Diagram

**Title:** API Interaction Map â€” REST Endpoints & Protocol Specifications

**Purpose:** Document all API endpoints, their protocols, request/response formats, and authentication requirements.

**Target Audience:** Developers, Engineers

**Diagram Type:** API Map / Interface Diagram

**Visual Style:** Dark theme, grouped by service

**Diagram Prompt:**
Create an API interaction diagram on a dark background. Show 5 service columns, each containing their API endpoints. **Ollama (port 11434):** /api/generate (POST), /api/chat (POST), /api/tags (GET), /api/embeddings (POST), /v1/models (GET â€” OpenAI compat). Badge: "No Auth". **LiteLLM (port 4000):** /v1/models (GET), /v1/chat/completions (POST), /health (GET), /health/services (GET). Badge: "No Auth (loopback)". **AegisOS (port 18789):** /v1/chat/completions (POST â€” proxied), internal agent API. Badge: "Token Auth". **OmniRoute (port 20128):** Dashboard UI, WebSocket proxy (:20129), Arena ELO API. Badge: "JWT Auth". **Open-WebUI (port 8090):** /health (GET), Web UI, Chat API. Badge: "User Auth". Show arrows between APIs indicating proxied calls. Add request/response format annotations: JSON, SSE streaming, OpenAI-compatible format. Title: "API Interaction Map".

**Negative Prompt:** No fictional endpoints, no incorrect authentication methods.

**Key Labels:** 5 services, OpenAI-compatible, SSE streaming, Token Auth, JWT Auth, No Auth, /v1/chat/completions, /health

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 19: MCP Server Architecture

**Title:** MCP Server Architecture â€” Model Context Protocol Integration Layer

**Purpose:** Detail the MCP server architecture showing transport mechanisms, tool capabilities, and data flow for each server.

**Target Audience:** Engineers, Architects

**Diagram Type:** Component Architecture

**Visual Style:** Dark theme, hub-and-spoke layout centered on AegisOS

**Diagram Prompt:**
Create a hub-and-spoke architecture diagram on a dark background with AegisOS Gateway as the central hub (coral). Seven spokes radiate outward to MCP servers, each in a distinct rounded container. **filesystem** (npx, Node.js): Tools â€” read_file, write_file, list_directory. Bound dirs: Source, Documents, .aegisos. **git** (uvx, Python): Tools â€” git_status, git_log, git_diff, git_commit. **github** (npx, Node.js): Tools â€” search_repos, create_issue, create_PR. Auth: GITHUB_TOKEN. **sqlite** (uvx, Python): Tools â€” query, list_tables, describe_table. DB: aegisos-agent.sqlite. **fetch** (npx, Node.js): Tools â€” fetch_url. Purpose: web content retrieval. **puppeteer** (npx, Node.js): Tools â€” navigate, screenshot, click, type. Purpose: browser automation. **raja-knowledge-repository** (Python direct): Tools â€” search_knowledge, memory_search. Source: D:\Raja Jeevan Kumar Maduri_MarkDown_Personality. Show transport type badges: "stdio" for all servers. Show data flow arrows indicating what data each server provides to the agent context. Title: "MCP Server Architecture â€” 7 Context Protocol Servers".

**Negative Prompt:** No missing servers, no incorrect tool names, no generic MCP icons.

**Key Labels:** 7 MCP servers, stdio transport, filesystem, git, github, sqlite, fetch, puppeteer, raja-knowledge-repository, npx, uvx, Python

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 20: Memory Architecture

**Title:** Memory Architecture â€” Agent State, Session Memory & Knowledge Retrieval

**Purpose:** Show how the system manages memory across sessions, including SQLite state, knowledge repository, and embedding-based semantic search.

**Target Audience:** Engineers, Architects

**Diagram Type:** Memory Hierarchy

**Visual Style:** Dark theme, layered memory tiers

**Diagram Prompt:**
Create a layered memory hierarchy diagram on a dark background with 4 tiers. **Tier 1 (Hot â€” GPU VRAM):** "Active Model Weights" â€” gemma4:latest + all-minilm loaded in 16GB VRAM. "KV Cache" â€” active conversation context (q8_0 quantized). **Tier 2 (Warm â€” System RAM):** "Agent Working Memory" â€” current session context window. "CPU-offloaded Layers" â€” overflow model weights in 64GB DDR5. **Tier 3 (Persistent â€” Disk):** "SQLite Agent Memory" (aegisos-agent.sqlite) â€” chat completions, session state. "AegisOS State DB" (aegisos.sqlite) â€” agent config, workspace state. "OmniRoute Storage" (storage.sqlite) â€” ELO scores, routing logs. "Daily Memory Journals" â€” MEMORY.md, YYYY-MM-DD.md files. **Tier 4 (Long-term Knowledge â€” Disk):** "Knowledge Repository" (D:\Raja Jeevan Kumar Maduri_MarkDown_Personality) â€” identity, playbooks, frameworks, research. "Semantic Search" â€” all-minilm embedding â†’ cosine similarity matching (~65ms). Show retrieval arrows from each tier upward through the agent context assembly pipeline. Title: "Memory Architecture â€” 4-Tier Hierarchy".

**Negative Prompt:** No cloud storage tiers, no fictional memory systems.

**Key Labels:** VRAM (16GB), System RAM (64GB), SQLite, Knowledge Repository, Semantic Search, KV Cache q8_0, all-minilm embeddings, 65ms retrieval

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 21: RAG Pipeline

**Title:** RAG Pipeline â€” Retrieval-Augmented Generation with Local Knowledge Repository

**Purpose:** Show the complete RAG pipeline from query to knowledge retrieval to augmented generation.

**Target Audience:** Engineers, AI Architects

**Diagram Type:** Pipeline Flow

**Visual Style:** Dark theme, numbered pipeline stages

**Diagram Prompt:**
Create a horizontal pipeline flow diagram on a dark background showing 6 stages. **Stage 1: User Query** â€” "User asks a question about Raja's frameworks or product systems." **Stage 2: Query Vectorization** â€” "all-minilm:latest embedding model converts query to 384-dim vector" (15ms). **Stage 3: Semantic Search** â€” "Cosine similarity matching against knowledge repository chunks" â€” show the knowledge repository structure: identity/, playbooks/ (RPLS, AIPOM), frameworks/ (product_management, architecture, retail, hospitality, ai, programming), research/, templates/, reference/. Retrieval time: 65ms. **Stage 4: Context Assembly** â€” "Top-K relevant chunks assembled with similarity scores, chunk source filepaths." **Stage 5: Augmented Prompt** â€” "Original query + retrieved context + system prompt (SOUL.md grounding directive) assembled into completion request." Show the SOUL.md grounding directive: "Before answering any question about Raja, query knowledge repository FIRST." **Stage 6: Generation** â€” "Augmented prompt sent to primary model (gemma4:latest) via LiteLLM routing." Show the MCP server "raja-knowledge-repository" (Python script: mcp_server.py) as the orchestrating component. Title: "RAG Pipeline â€” Local Knowledge Retrieval-Augmented Generation".

**Negative Prompt:** No cloud vector databases, no external embedding APIs, no incorrect knowledge categories.

**Key Labels:** all-minilm (384-dim), cosine similarity, 15ms embedding, 65ms retrieval, SOUL.md grounding, raja-knowledge-repository MCP, 6 taxonomy categories

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 22: Embedding Workflow

**Title:** Embedding Workflow â€” Vectorization & Similarity Search

**Purpose:** Detail the technical embedding pipeline from text input to vector storage and similarity matching.

**Target Audience:** Engineers, AI Developers

**Diagram Type:** Technical Workflow

**Visual Style:** Dark theme, mathematical/technical annotations

**Diagram Prompt:**
Create a technical workflow diagram on a dark background. Show the embedding pipeline: **Input Text** (document chunk or query, max 512 tokens) â†’ **Tokenizer** (all-minilm tokenizer) â†’ **all-minilm:latest Model** (45MB, running on Ollama :11434, negligible VRAM) â†’ **384-dimensional Vector Output**. Show the dual-use paths: **Indexing Path:** Document chunks â†’ embedding â†’ stored vectors (in-memory or SQLite). **Query Path:** User query â†’ embedding â†’ cosine similarity computation against stored vectors â†’ Top-K results ranked by score. Add performance annotations: "15ms per embedding (512 token block)", "negligible VRAM footprint", "384 dimensions". Show the Ollama API call: POST /api/embeddings with model="all-minilm:latest". Title: "Embedding Workflow â€” all-minilm Vectorization".

**Negative Prompt:** No external embedding APIs, no cloud vector databases, no incorrect model specifications.

**Key Labels:** all-minilm:latest, 45MB, 384 dimensions, 15ms latency, 512 token blocks, cosine similarity, Ollama /api/embeddings

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 23: Vector Database Architecture

**Title:** Vector Database Architecture â€” Local Embedding Storage & Retrieval

**Purpose:** Show how embeddings are stored, indexed, and queried within the local infrastructure.

**Target Audience:** Engineers, AI Architects

**Diagram Type:** Storage Architecture

**Visual Style:** Dark theme, data-centric layout

**Diagram Prompt:**
Create a storage architecture diagram on a dark background showing the vector/embedding data flow. **Embedding Generator:** all-minilm:latest on Ollama. **Storage Backends:** Show three storage locations: (1) "AegisOS Agent Memory" (SQLite: aegisos-agent.sqlite) â€” stores agent session vectors and chat memory, (2) "Knowledge Repository Index" (raja-knowledge-repository MCP) â€” runtime semantic index over Markdown files in D:\Raja Jeevan Kumar Maduri_MarkDown_Personality, (3) "AegisOS Memory Search" â€” Ollama-provided memory search (enabled in aegisos.json). Show query flow: User query â†’ all-minilm embedding â†’ parallel search across all three backends â†’ results merged by similarity score â†’ context window assembly. Add annotations: "No external vector DB (Pinecone/Weaviate) â€” all local", "SQLite + in-memory indexing". Title: "Vector Storage Architecture â€” Local-First Embedding Infrastructure".

**Negative Prompt:** No Pinecone, no Weaviate, no Chroma, no external vector databases (none are installed).

**Key Labels:** all-minilm, SQLite, in-memory index, local-first, no external vector DB, aegisos-agent.sqlite, raja-knowledge-repository, memory_search

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 24: Knowledge Base Flow

**Title:** Knowledge Base Flow â€” Personal Knowledge Repository Architecture

**Purpose:** Show the structure, taxonomy, and retrieval mechanics of Raja's personal knowledge repository.

**Target Audience:** Engineers, Knowledge Architects

**Diagram Type:** Taxonomy + Flow

**Visual Style:** Dark theme, hierarchical taxonomy with flow arrows

**Diagram Prompt:**
Create a combined taxonomy and flow diagram on a dark background. Show the Knowledge Repository root "D:\Raja Jeevan Kumar Maduri_MarkDown_Personality" as a central container. Inside, show the 6-tier taxonomy: **identity/** â€” "Core values, professional profile, CV, mission" (coral). **playbooks/** â€” "RPLS, AIPOM, action plans, operational guides" (gold). **frameworks/** â€” 6 subcategories: product_management, architecture, retail, hospitality, ai, programming (cyan). **research/** â€” "Competitive analysis, tech stacks, market insights" (green). **templates/** â€” "PRD, BRD, ADR, User Story templates" (purple). **reference/** â€” "Third-party docs, APIs, glossaries" (gray). Show the retrieval flow: **Ingest:** Markdown files â†’ YAML frontmatter tags â†’ semantic indexing. **Query:** Agent query â†’ raja-knowledge-repository MCP (Python: mcp_server.py) â†’ search_knowledge / memory_search tools â†’ cosine similarity ranked results. **Grounding:** SOUL.md directive enforces "query knowledge first, never answer from model memory." Show cross-reference rules: parent-child links, strict Markdown file links, standardized tags. Title: "Knowledge Repository Architecture â€” 6-Tier Taxonomy & Retrieval Flow".

**Negative Prompt:** No fictional categories, no incorrect taxonomy, no external knowledge bases.

**Key Labels:** 6-tier taxonomy, identity, playbooks, frameworks, research, templates, reference, RPLS, AIPOM, mcp_server.py, SOUL.md grounding

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 25: Security Architecture

**Title:** Security Architecture â€” Defense-in-Depth for Local AI Infrastructure

**Purpose:** Show the multi-layered security architecture including network isolation, encryption, authentication, and access controls.

**Target Audience:** Security Engineers, Auditors, Architects

**Diagram Type:** Security Layer Diagram

**Visual Style:** Dark theme, concentric security zones

**Diagram Prompt:**
Create a concentric security zone diagram on a dark background with 5 security layers from outermost to innermost. **Layer 1 (Perimeter):** "Norton Firewall" + "Windows Advanced Firewall" â€” blocks inbound connections to core services. **Layer 2 (Network Isolation):** "Loopback Binding" â€” AegisOS, Headroom, LiteLLM, CodeGraph, MongoDB bound to 127.0.0.1. "LAN Exposure" â€” only Ollama :11434 (âš  unauthenticated), PostgreSQL, Redis. **Layer 3 (Authentication):** "AegisOS: Token-based auth", "OmniRoute: JWT + API Key", "Open-WebUI: Username/password", "GitHub MCP: GITHUB_TOKEN", "Ollama: âš  No authentication." **Layer 4 (Encryption at Rest):** "DPAPI Machine-Scope Encryption" â€” secrets/*.enc files under platform root. "Machine SID-bound" â€” cannot decrypt on different hardware. **Layer 5 (Process Isolation):** "NSSM Services: LocalSystem account" (âš  high privilege). "Docker: WSL2 container isolation". "MCP: Sandboxed directory access via filesystem server." Show the Tailscale VPN overlay providing zero-trust remote access. Add risk callouts: "âš  Ollama LAN-exposed without auth", "âš  Services run as SYSTEM", "âš  DPAPI not portable across machines." Title: "Security Architecture â€” Defense-in-Depth".

**Negative Prompt:** No cloud security services, no fictional security tools, no understated risks.

**Key Labels:** Norton Firewall, Loopback Binding, DPAPI, Token Auth, JWT, LocalSystem, Tailscale VPN, 5 security layers, Ollama unauthenticated risk

**Suggested Resolution:** 3840 Ã— 3840 (Square 4K), 1:1

---

### Diagram 26: Authentication Flow

**Title:** Authentication Flow â€” Request Authentication & Secrets Decryption

**Purpose:** Trace the authentication pathway from client request through token validation and DPAPI secret decryption.

**Target Audience:** Security Engineers, Developers

**Diagram Type:** Sequence Diagram

**Visual Style:** Dark theme, vertical sequence flow

**Diagram Prompt:**
Create a vertical sequence diagram on a dark background with 4 participants: Client, AegisOS Gateway, DPAPI Secrets Store, LiteLLM. **Sequence:** (1) Client sends request with auth token to AegisOS :18789. (2) AegisOS validates token against stored credentials. (3) On service startup, AegisOS's Node.js server loads environment variables decrypted via `PlatformHelper.psm1` from `$PlatformRoot\secrets\` using machine-scope DPAPI. (4) Decrypted secrets (Telegram Bot Token, API keys) are loaded into process environment. (5) Validated request is forwarded to LiteLLM :4000 (no auth â€” loopback only). (6) LiteLLM forwards to Ollama :11434 (no auth). Show a separate flow for OmniRoute: OmniRoute startup decrypts OmniRoute_secrets.enc â†’ loads JWT_SECRET, API_KEY_SECRET, STORAGE_ENCRYPTION_KEY, MACHINE_ID_SALT. Show the `Bootstrap.ps1` and `Restore.ps1` secret entry flow mapping to DPAPI encryption helper routines. Add a warning box: "DPAPI secrets are machine-SID bound â€” cross-machine restore requires re-entry." Title: "Authentication Flow â€” DPAPI Secrets & Token Validation".

**Negative Prompt:** No actual secret values, no cloud key management, no incorrect flow order.

**Key Labels:** Token Auth, DPAPI Machine-Scope, AegisOS_secrets.enc, OmniRoute_secrets.enc, PlatformHelper.psm1, machine SID-bound, loopback bypass

**Suggested Resolution:** 2160 Ã— 3840 (4K Portrait), 9:16

---

### Diagram 27: Monitoring Stack

**Title:** Monitoring Stack â€” Observability Architecture (Current + Planned)

**Purpose:** Show the current monitoring capabilities and the planned observability stack (Prometheus, Grafana, Arize Phoenix).

**Target Audience:** DevOps, Engineers

**Diagram Type:** Monitoring Architecture

**Visual Style:** Dark theme, current state (solid) vs planned state (dashed)

**Diagram Prompt:**
Create a monitoring architecture diagram on a dark background using solid lines for currently deployed components and dashed lines for planned/recommended components. **Current (Solid):** AegisOS Gateway Logs (rotated 10MB files at ~/.aegisos/Logs/), LiteLLM Service Logs (NSSM stdout), OmniRoute Call Logs (per-day JSON in ~/.omniroute/call_logs/), Config Audit Trail (config-audit.jsonl), LiteLLM Health Endpoint (/health â€” 9 healthy, 5 unhealthy), nvidia-smi (GPU monitoring), Background Health Checks (every 300s). **Planned (Dashed):** Arize Phoenix (port 6006) â€” LLM trace visualization, RAG retrieval analysis. Prometheus (port 9090) â€” time-series metrics from LiteLLM /metrics endpoint and nvidia GPU exporter (:9454). Grafana (port 3000) â€” dashboards: VRAM Capacity Monitor, Agent Latency Heatmap, Model Fallback Frequency. Alert Policies: High Latency (>5s), VRAM Exhaustion (>15GB), Service Failure. Show data flow from services to monitoring stack. Title: "Monitoring Stack â€” Current & Planned Observability".

**Negative Prompt:** No deployed components shown as planned, no planned components shown as deployed.

**Key Labels:** Current: Log files, Health endpoints, nvidia-smi. Planned: Arize Phoenix :6006, Prometheus :9090, Grafana :3000, OpenTelemetry

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 28: Logging Architecture

**Title:** Logging Architecture â€” Log Sources, Rotation & Audit Trail

**Purpose:** Map all log sources, their locations, rotation policies, and the audit trail system.

**Target Audience:** DevOps, Auditors

**Diagram Type:** Flow Diagram

**Visual Style:** Dark theme, log source to storage flow

**Diagram Prompt:**
Create a flow diagram on a dark background showing all log sources flowing into their storage destinations. **Log Sources:** AegisOS Gateway (debug level) â†’ aegisos-gateway.log (10MB rotated, currently 19MB total). LiteLLM Service (NSSM stdout/stderr) â†’ LiteLLMService.log + LiteLLMService_error.log. OmniRoute Service (NSSM stdout/stderr) â†’ OmniRouteService.log + OmniRouteService_error.log. AegisOS Service (NSSM stdout/stderr) â†’ AegisOSService.log + AegisOSService_error.log. OmniRoute Call Logs â†’ call_logs/YYYY-MM-DD/ (per-day directories since 2026-07-05). Config Changes â†’ config-audit.jsonl (structured JSON lines). Deployment Log â†’ deploy.log. **Log Storage:** All logs in ~/.aegisos/Logs/ (~20MB total) and ~/.omniroute/call_logs/. **Audit Trail:** Show config-audit.jsonl as a special structured log capturing configuration changes with timestamps. Show backup inclusion: logs included in backup scope. Title: "Logging Architecture â€” Sources, Rotation & Audit".

**Negative Prompt:** No centralized log management (not deployed), no ELK stack.

**Key Labels:** 7 log sources, 10MB rotation, config-audit.jsonl, NSSM stdout capture, per-day call logs, debug level, deploy.log

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 29: Backup Architecture

**Title:** Backup Architecture â€” Scope, Strategy & Recovery Pipeline

**Purpose:** Show the backup scope, exclusions, schedule, storage locations, and recovery pipeline.

**Target Audience:** DevOps, Operations

**Diagram Type:** Architecture with Flow

**Visual Style:** Dark theme, green (backed up), red (excluded), gold (recovery path)

**Diagram Prompt:**
Create a backup architecture diagram on a dark background. **Left Side (Backup Sources):** Show components with green checkmarks (included) or red X marks (excluded). âœ… Included: configs/ (litellm, aegisos), databases/ (aegisos.sqlite, storage.sqlite, codegraph.sqlite), secrets/*.enc (DPAPI), platform catalogs (.json files), deployment profiles (.json files), SCM service registry parameters (.reg files), environment variable configs. âŒ Excluded: Model weights (~130GB in C:\ProgramData\Models\Ollama) â€” "Manifest-based re-pull via `ollama pull`". **Center (Backup Process):** Show `automation/Backup.ps1` script â†’ creates timestamped ZIP archives. Schedule: "Weekly automated scheduled task + manual end-of-session/pre-upgrade." **Right Side (Storage):** Primary: `$PlatformRoot/backups/`. Secondary: Google Drive (G: â€” FAT32, 334GB free). **Bottom (Recovery):** Show recovery pipeline: `Restore.ps1` -> inputs backup archive, validates machine SID environment, and restores files. Show recovery modes: SafeRestore (default), FullRecovery (overwrites all, pulls models), Repair (re-links junctions, registers services), ForceRecovery (sweeps DBs and resets). DPAPI recovery: prompts user interactively on host mismatch. Retention: Last 10 backups. Title: "Backup Architecture â€” Scope, Strategy & Recovery".

**Negative Prompt:** No cloud backup services not verified, no incorrect script names.

**Key Labels:** automation/Backup.ps1, automation/Restore.ps1, ~130GB excluded (models), DPAPI secrets, 4 recovery modes, retention: 10, Google Drive

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 30: Disaster Recovery Workflow

**Title:** Disaster Recovery Workflow â€” From Failure Detection to Full Restoration

**Purpose:** Map the complete DR workflow including failure scenarios, recovery modes, and verification checklist.

**Target Audience:** Operations, DevOps

**Diagram Type:** Decision Flow / Workflow

**Visual Style:** Dark theme, decision diamonds with branching paths

**Diagram Prompt:**
Create a decision flow diagram on a dark background showing the disaster recovery process. **Entry Point:** "Failure Detected" â†’ Decision: "What type of failure?" **Branch 1: Config Corruption** â†’ Run `automation/Restore.ps1 -Mode SafeRestore` â†’ restores configs/ databases/ â†’ Restart â†’ Run `automation/Validate.ps1`. **Branch 2: Model Loss** â†’ Run `automation/Restore.ps1 -Mode FullRecovery` â†’ pulls GGUF weights via Ollama from manifest â†’ Run `Validate.ps1` inference test. **Branch 3: SCM Service Registry Failure** â†’ Run `automation/Restore.ps1 -Mode Repair` â†’ patches registry service blocks & re-links junctions â†’ Restart. **Branch 4: Complete Machine Rebuild** â†’ Run `Bootstrap.ps1` on new machine â†’ Run `Restore.ps1 -Mode FullRecovery` â†’ detects host mismatch â†’ prompts user for GITHUB/TELEGRAM credentials â†’ encrypts via DPAPI â†’ downloads dependencies -> runs full validation. **Branch 5: Junction Link Broken** â†’ Self-healing check in `Configure.ps1` / `HealthCheck.ps1` automatically recreates junctions. Show recovery modes sidebar: SafeRestore, FullRecovery, Repair, ForceRecovery. Show rollback path: "If recovery fails â†’ rollback_backup â†’ restore old configs." RTO annotations: Config restore ~30min, Full rebuild ~4hrs. Title: "Disaster Recovery Workflow â€” 5 Failure Scenarios".

**Negative Prompt:** No fictional recovery tools, no incorrect script paths.

**Key Labels:** 5 scenarios, Restore.ps1, Validate.ps1, DPAPI re-entry on new host, self-healing junction, rollback_backup, RTO 30min-4hrs

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 31: Startup Sequence

**Title:** Startup Sequence â€” Boot-to-Ready Service Initialization Chain

**Purpose:** Show the ordered service startup sequence from system boot to fully operational AI stack.

**Target Audience:** DevOps, Engineers

**Diagram Type:** Sequence / Timeline

**Visual Style:** Dark theme, horizontal timeline with dependency arrows

**Diagram Prompt:**
Create a horizontal timeline diagram on a dark background showing the service startup sequence. **Phase 0: System Boot** â€” Windows SCM initializes NSSM wrappers. **Phase 1: Ollama Initialization** â€” Ollama service starts, loads GGUF weights, binds to Port 11434. **Phase 2: Intermediate Core Boot** â€” LiteLLM (Port 4000), Headroom Token Compression Proxy (Port 4050), and CodeGraph MCP Server (Port 18790) start. LiteLLM and Headroom verify Ollama socket. CodeGraph indexes repository AST changes. **Phase 3: Gateway Boot** â€” AegisOS (Port 18789) and OmniRoute (Port 20128) start. AegisOS registers local MCP servers (including CodeGraph), decrypts DPAPI credential secrets, and establishes runtime workspace junctions. **Phase 4: Client & UI Layer** â€” Docker Desktop loads, Open-WebUI container starts (Port 8090). **Phase 5: Health Validation** â€” `automation/HealthCheck.ps1` runs socket tests. Background warming cron loads models into VRAM. Show dependency arrows. Show "Ready" status when all 6 service ports are listening. Title: "Startup Sequence â€” Boot to Ready".

**Negative Prompt:** No incorrect dependency order, no missing phases, no oversimplification.

**Key Labels:** 6 service ports, Ollamaâ†’LiteLLM+Headroom+CodeGraphâ†’AegisOS+OmniRoute, SCM wrappers, DPAPI decrypt, health validation

**Suggested Resolution:** 3840 Ã— 1080 (Ultra-wide), 32:9

---

### Diagram 32: Deployment Architecture

**Title:** Deployment Architecture â€” NSSM Service Wrapping & Configuration Management

**Purpose:** Show how AI components are deployed as Windows services using NSSM, including binary paths, working directories, and configuration inheritance.

**Target Audience:** DevOps, Engineers

**Diagram Type:** Deployment Diagram

**Visual Style:** Dark theme, service blocks with config file connections

**Diagram Prompt:**
Create a deployment architecture diagram on a dark background showing 6 service blocks wrapped by NSSM. Each block contains: Service Name, Binary/Command Path, Arguments, Working Directory, Dependencies. **Ollama:** Binary=ollama.exe serve, RunAs=LocalSystem. **LiteLLMService:** Binary=litellm.exe, Args=--config config.yaml --port 4000, WorkDir=$PlatformRoot\configs\litellm\, Depends=Ollama. **HeadroomService:** Command=python headroom_proxy.py, Args=--port 4050, WorkDir=$PlatformRoot\apps\headroom\, Depends=Ollama. **CodeGraphService:** Command=node index.js, Args=--port 18790, WorkDir=$PlatformRoot\apps\codegraph\, Depends=Ollama. **AegisOSService:** Command=node dist/index.js, WorkDir=$PlatformRoot\apps\aegisos\, Depends=LiteLLM+Headroom+CodeGraph. **OmniRouteService:** Command=node server/index.js, WorkDir=$PlatformRoot\apps\omniroute\, Depends=LiteLLM+Ollama. Show configuration file links: console_config.json, config.yaml, aegisos.json, profiles/default.json. Show registry key parameters path: HKLM\SYSTEM\CurrentControlSet\Services\{ServiceName}\Parameters. Title: "Deployment Architecture â€” SCM Service Configuration".

**Negative Prompt:** No incorrect paths, no missing dependencies, no legacy Start-AegisOSService.ps1 script wrapper.

**Key Labels:** NSSM service wrapping, SCM, 6 AI services, LocalSystem, HKLM registry parameters, configs/, console_config.json

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 33: Operational Dashboard Concept

**Title:** Operational Dashboard Concept â€” AI Workstation Health & Performance

**Purpose:** Visualize a conceptual monitoring dashboard showing key operational metrics for the AI workstation.

**Target Audience:** Operations, Executives

**Diagram Type:** Dashboard Mockup / Infographic

**Visual Style:** Dark theme glassmorphism dashboard

**Diagram Prompt:**
Create a dark-themed glassmorphism dashboard mockup showing real-time operational metrics for the AI workstation. **Top Row (Status Cards):** 6 service status cards with green/red indicators: Ollama (Running), Headroom (Running), LiteLLM (Running, 9/14 healthy), CodeGraph (Running), AegisOS (Running), OmniRoute (Running), Open-WebUI (Healthy). **Second Row:** GPU VRAM gauge (620 MiB / 16,303 MiB used), CPU Temperature (54Â°C), System RAM (32/64 GB available), NVMe Free Space (351 GB / 862 GB on C:). **Third Row:** Model Performance Chart â€” bar chart showing token throughput: smollm (250 t/s), qwen3:14b (75 t/s), gemma4:latest (72 t/s), deepseek-r1:32b (10 t/s). **Fourth Row:** Token Savings & Compressions â€” Headroom active prompt token compression ratio (averaging 75% savings), Ponytail context pruning frequency. **Bottom Row:** Recent logs feed (Health monitor log, aegisos errors) and Backup status: "Last backup: Weekly auto-sync status". Title: "AI Workstation â€” Operational Dashboard".

**Negative Prompt:** No light theme, no wireframe quality, no placeholder data.

**Key Labels:** 6 services, VRAM gauge, Headroom compression 75%, token throughput chart, recent logs feed, backup status

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 34: Infrastructure Dependency Graph

**Title:** Infrastructure Dependency Graph â€” Component Dependencies & Critical Path

**Purpose:** Map all infrastructure dependencies to identify critical paths and single points of failure.

**Target Audience:** Architects, DevOps

**Diagram Type:** Directed Acyclic Graph (DAG)

**Visual Style:** Dark theme, nodes with dependency arrows, critical path highlighted

**Diagram Prompt:**
Create a directed acyclic graph on a dark background showing all infrastructure dependencies. Nodes grouped by layer: **Foundation:** Windows 11, GPU Drivers (NVIDIA 610.47), WSL2, Hyper-V. **Runtimes:** Node.js 24.16.0, Python 3.12.4, Docker 29.6.1, NSSM, uv/uvx. **Core Services:** Ollama (depends on GPU Driver), LiteLLM (depends on Ollama, Python), AegisOS (depends on LiteLLM, Ollama, Node.js), OmniRoute (depends on LiteLLM, Ollama, Node.js). **Data Services:** PostgreSQL (independent), MongoDB (independent), Redis (independent). **Context Services:** 7 MCP servers (depend on Node.js/Python + AegisOS). **Interfaces:** Open-WebUI (depends on Docker, Ollama), Antigravity IDE (depends on AegisOS). **Storage:** NVMe (models depend on this), DPAPI secrets (AegisOS + OmniRoute depend on this). Highlight the **critical path** in coral: GPU Driver â†’ Ollama â†’ LiteLLM â†’ AegisOS â†’ User. Mark **single points of failure** with warning badges: Ollama (single inference engine), RTX 5080 (single GPU). Title: "Infrastructure Dependency Graph".

**Negative Prompt:** No circular dependencies, no missing nodes, no incorrect dependency directions.

**Key Labels:** Critical Path: GPUâ†’Ollamaâ†’LiteLLMâ†’AegisOS, Single Points of Failure: Ollama, RTX 5080, 4 layers, 15+ components

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 35: End-to-End User Journey

**Title:** End-to-End User Journey â€” From Question to Knowledge-Enriched Answer

**Purpose:** Trace a typical user interaction from initial question through all processing stages to final answer delivery.

**Target Audience:** All audiences (Executives, Engineers, Developers)

**Diagram Type:** Journey Map

**Visual Style:** Dark theme, illustrated journey with touchpoints

**Diagram Prompt:**
Create an end-to-end journey map on a dark background showing a user's interaction. **Journey Stages:** (1) "User opens Antigravity IDE and types a question about product management frameworks." (2) "Request hits AegisOS Gateway :18789 with auth token." (3) "AegisOS selects 'main' agent (Executive/Knowledge role)." (4) "SOUL.md grounding directive activates: 'Query knowledge repository FIRST.'" (5) "raja-knowledge-repository MCP searches D:\Raja Jeevan Kumar Maduri_MarkDown_Personality." (6) "all-minilm embeds the query (384-dim vector, 15ms) and performs cosine similarity search." (7) "Relevant chunks from /playbooks/ (RPLS, AIPOM) and /frameworks/product_management/ retrieved (65ms)." (8) "Context assembled: system prompt + knowledge chunks + user query." (9) "LiteLLM routes to gemma4:latest via least-busy strategy." (10) "Ollama processes tokens on RTX 5080 GPU (72 t/s, 120ms TTFT)." (11) "SSE stream delivers tokens back through LiteLLM â†’ AegisOS â†’ IDE." (12) "User receives a knowledge-grounded, contextually accurate answer." Show total latency: "~300ms to first token, streaming thereafter." Title: "End-to-End User Journey â€” Knowledge-Enriched AI Response".

**Negative Prompt:** No fictional touchpoints, no missing stages, no cloud processing steps.

**Key Labels:** 12 stages, ~300ms TTFT, SOUL.md grounding, knowledge retrieval, cosine similarity, SSE streaming, gemma4:latest, 72 t/s

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 36: AI Request Journey

**Title:** AI Request Journey â€” Technical Request Processing with Timing Annotations

**Purpose:** Provide a technically precise view of request processing with exact timing at each stage.

**Target Audience:** Engineers, Performance Engineers

**Diagram Type:** Waterfall / Timing Diagram

**Visual Style:** Dark theme, horizontal waterfall bars with millisecond annotations

**Diagram Prompt:**
Create a horizontal waterfall timing diagram on a dark background showing the request processing timeline with precise latency annotations. **Bars (top to bottom):** (1) HTTP Parse & Auth: 5ms (bar: 0-5ms). (2) MCP Context â€” CodeGraph AST dependency lookup: 30ms (bar: 5-35ms, parallel). (3) MCP Context â€” SQLite Memory Query: 20ms (bar: 5-25ms, parallel). (4) MCP Context â€” Knowledge Repo Search: 65ms (bar: 5-70ms, parallel, critical path). (5) Context Assembly & Ponytail Pruning/Summarization: 15ms (bar: 70-85ms). (6) Headroom Token Compression (SmartCrusher / CodeCompressor): 80ms (bar: 85-165ms). (7) LiteLLM Routing Decision: 5ms (bar: 165-170ms). (8) Model Queue Wait: variable (bar: 170-??ms, dashed). (9) Cold Start (if needed): 3.2s for 14B / 18.5s for 32B (conditional bar, amber). (10) TTFT (Warm): 120-250ms (bar: 170-420ms, green). (11) Token Generation: continuous at 10-250 t/s depending on model. Show the P50 total warm response latency. Add annotation: "Headroom/Ponytail preprocessing adds ~150ms but cuts LLM context by 75%, speeding up overall inference time by 40%." Title: "AI Request Journey â€” Timing Waterfall".

**Negative Prompt:** No inaccurate timing data, no missing parallel execution, no missing headroom step.

**Key Labels:** P50 warm latency, MCP parallel critical path 65ms, Ponytail pruning 15ms, Headroom compression 80ms, TTFT: 120-250ms, VRAM savings 75%

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 37: Component Relationship Map

**Title:** Component Relationship Map â€” Full System Interaction Topology

**Purpose:** Show every component and every relationship in the system as a comprehensive topology map.

**Target Audience:** Architects, Engineers

**Diagram Type:** Topology / Graph

**Visual Style:** Dark theme, force-directed graph layout

**Diagram Prompt:**
Create a force-directed topology graph on a dark background showing all system components as nodes and all relationships as edges. **Node Types:** Services (rounded rectangles): Ollama, LiteLLM, AegisOS, OmniRoute, Open-WebUI. Databases (cylinders): PostgreSQL Ã—3, MongoDB, Redis, SQLite Ã—3. MCP Servers (hexagons): filesystem, git, github, sqlite, fetch, puppeteer, raja-knowledge-repo. Agents (circles): main, developer, reviewer. Hardware (squares): RTX 5080, Ryzen 9 9950X3D, 64GB DDR5, NVMe Ã—2. Network (diamonds): Tailscale, Ethernet, Docker NAT. Security (shields): DPAPI, Norton, Token Auth, JWT. **Edge Types:** HTTP (solid blue), stdio (dashed green), file I/O (dotted gold), service dependency (thick red). Size nodes by importance (Ollama largest â€” central hub). Color-code by layer. Title: "Complete Component Relationship Map".

**Negative Prompt:** No missing components, no fictional relationships, no tangled/unreadable layout.

**Key Labels:** 35+ nodes, 50+ edges, 7 node types, 4 edge types, layered coloring

**Suggested Resolution:** 3840 Ã— 3840 (Square 4K), 1:1

---

### Diagram 38: High Availability Concept

**Title:** High Availability Concept â€” Current State & Recommended Improvements

**Purpose:** Assess the current HA posture and show recommended architectural improvements for resilience.

**Target Audience:** Architects, Operations

**Diagram Type:** Current vs Target Architecture

**Visual Style:** Dark theme, split view â€” left (current), right (recommended)

**Diagram Prompt:**
Create a split-view architecture diagram on a dark background. **Left Side â€” Current State:** "Single Workstation Architecture." Show single Ollama instance (SPOF badge), single LiteLLM instance, single AegisOS instance, single RTX 5080 GPU. Mark single points of failure with red âš  badges. Show LiteLLM fallback chains as the only resilience mechanism (model-level, not service-level). Show backup strategy as the recovery mechanism. Availability estimate: "~95% (dependent on single hardware)." **Right Side â€” Recommended HA:** "Enhanced Resilience Architecture." Show: (1) Secondary inference node via Tailscale mesh â€” offload to a remote Ollama instance. (2) Automated watchdog service monitoring all 5 services with auto-restart. (3) Scheduled model pre-warming to prevent cold-start availability gaps. (4) Automated daily backups with verification. (5) OmniRoute dashboard as live health status display. (6) UPS power protection for graceful shutdown. Availability target: "~99.5%." Show the LiteLLM fallback chain as the current HA mechanism that already works well. Title: "High Availability â€” Current State vs Recommended".

**Negative Prompt:** No cloud HA solutions (not applicable), no enterprise clustering, no Kubernetes.

**Key Labels:** Current: ~95%, SPOFs: Ollama, RTX 5080. Recommended: ~99.5%, watchdog, Tailscale offload, auto-backup, UPS

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 39: Current vs Recommended Architecture

**Title:** Current vs Recommended Architecture â€” Evolution Roadmap

**Purpose:** Show the current architecture alongside recommended architectural improvements from the existing documentation.

**Target Audience:** Architects, Executives

**Diagram Type:** Comparison / Evolution

**Visual Style:** Dark theme, before/after layout with improvement annotations

**Diagram Prompt:**
Create a comparison diagram on a dark background with two columns. **Left Column â€” Current Architecture (Validated):** Show the complete current stack: Ollama (v0.31.1), LiteLLM (least-busy routing), AegisOS (3 agents), OmniRoute (ELO arena), Open-WebUI (Docker). Security: DPAPI, Norton, Loopback. Monitoring: Log files, health endpoints. Services: NSSM, LocalSystem account. Mark items working well with green checkmarks. **Right Column â€” Recommended Improvements:** (1) "Service Account Migration" â€” move from LocalSystem to scoped virtual service accounts. (2) "Ollama Authentication" â€” add basic auth proxy in front of :11434. (3) "WSL2 Resource Limits" â€” configure .wslconfig to cap WSL2 memory. (4) "Observability Stack" â€” deploy Prometheus, Grafana, Arize Phoenix (planned in Observability_Architecture.md). (5) "Automated Backup Schedule" â€” Windows Scheduled Task for weekly backup + rclone to Google Drive. (6) "Backup Checksums" â€” SHA256 manifest per backup set. (7) "Version Manifest" â€” record exact versions of all components in each backup. (8) "Off-site Encryption" â€” 7-Zip AES-256 before cloud upload. Show arrows connecting current items to their recommended improvements. Priority labels: High, Medium, Low. Title: "Architecture Evolution Roadmap".

**Negative Prompt:** No fictional recommendations, no cloud migration suggestions, no items not in existing documentation.

**Key Labels:** 8 improvements, High: Service accounts + Auth proxy + Observability. Medium: Backup automation + Checksums. Low: .wslconfig + Encryption

**Suggested Resolution:** 3840 Ã— 2160 (4K), 16:9

---

### Diagram 40: Complete Enterprise AI Ecosystem

**Title:** Complete Enterprise AI Ecosystem â€” Raja's Local AI Workstation

**Purpose:** The definitive, all-encompassing diagram showing the entire AI ecosystem in a single view â€” hardware, software, models, agents, data flows, security, and operations.

**Target Audience:** All audiences â€” The "poster diagram" for wall display or documentation frontispiece.

**Diagram Type:** Comprehensive Ecosystem Map (Infographic / Enterprise Poster)

**Visual Style:**
- Color palette: Full dark theme with all accent colors
- Level of detail: Maximum â€” every discovered component
- Layout: 4 quadrants + central hub
- Background: Premium dark gradient with subtle tech grid
- Typography: Inter, clean hierarchy

**Diagram Prompt:**
Create a premium, publication-quality enterprise ecosystem poster on a dark gradient background with subtle hexagonal grid pattern. **Center Hub:** "Raja's Local AI Workstation" title with the Gigabyte X870E AORUS MASTER motherboard as the anchor. Show RTX 5080 GPU and Ryzen 9 9950X3D CPU as the computational foundation. **Top-Left Quadrant (AI Inference Engine):** Ollama v0.31.1 server connected to 12 model icons arranged in a constellation: gemma4 family (latest, 26b, 31b), qwen family (2.5:14b, 3:14b, 3:30b, 3.6:27b), deepseek-r1:32b, gpt-oss:20b, gemma2:9b, all-minilm, smollm. Show VRAM gauge: 16GB with split indicators. Show throughput badges: 10-250 t/s. **Top-Right Quadrant (AI Gateway & Routing):** AegisOS Gateway :18789 at center with 3 agent circles orbiting (main=coral, developer=cyan, reviewer=gold). LiteLLM :4000 router with least-busy badge and fallback chain visualization. OmniRoute :20128 dashboard. 7 MCP server hexagons connected to AegisOS. **Bottom-Left Quadrant (Data & Knowledge):** Knowledge Repository taxonomy (6 tiers), SQLite databases (3), PostgreSQL (3 versions), MongoDB, Redis, all-minilm embedding engine, RAG pipeline flow. OmniRoute call logs and ELO arena. **Bottom-Right Quadrant (Security & Operations):** DPAPI encryption shield, Norton Firewall, Tailscale VPN mesh, loopback security zone, backup architecture (6 sets), DR runbook (9 scripts), service startup chain, monitoring stack (current + planned), scheduled tasks. **Connecting Lines:** Show data flows between all quadrants using the color-coded arrow system (cyan=user data, gold=knowledge, green=model, coral=response, gray=logging). **Legend:** Bottom bar with all component types, color codes, and abbreviations. **Footer:** "Document Version 1.0 | Generated 2026-07-09 | Discovery: Antigravity IDE | Owner: Raja Jeevan Kumar Maduri". Title: "Raja's Local AI Workstation â€” Complete Enterprise Ecosystem".

**Negative Prompt:** No missing components, no simplified views, no cloud services not present, no placeholder graphics, no low-resolution output, no consumer/casual styling, no cartoon elements, no decorative clutter unrelated to the architecture, no incorrect model names or port numbers, no fictional hardware specifications.

**Key Labels:** Every component label from the full discovery: RTX 5080, Ryzen 9 9950X3D, 64GB DDR5, Samsung 9100 PRO, WD_BLACK SN850X, Ollama v0.31.1, 12 models, LiteLLM :4000, AegisOS :18789, OmniRoute :20128, Open-WebUI :8090, 7 MCP servers, 3 agents, PostgreSQL Ã—3, MongoDB, Redis, SQLite Ã—3, DPAPI, Norton, Tailscale, NSSM, Knowledge Repository, all-minilm, 6 backup sets, 9 DR scripts

**Suggested Resolution:** 7680 Ã— 4320 (8K), 16:9 â€” intended for large-format printing or high-DPI display

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Agent** | An autonomous AI entity within AegisOS that has its own model assignment, MCP access, and workspace scope |
| **DPAPI** | Windows Data Protection Application Programming Interface â€” encrypts secrets bound to machine identity |
| **ELO Arena** | OmniRoute's model comparison system using ELO scoring to rank model performance |
| **Fallback Chain** | LiteLLM's cascading model routing â€” if the primary model fails, requests route to successively simpler models |
| **GGUF** | The quantized model weight format used by Ollama for efficient local inference |
| **Junction Point** | A Windows NTFS directory link that transparently redirects one path to another |
| **KV Cache** | Key-Value Cache stored in VRAM during inference, holding attention state for the conversation context |
| **Least-Busy Routing** | LiteLLM's load-balancing strategy that routes requests to the model with the fewest active requests |
| **MCP** | Model Context Protocol â€” a standardized protocol for connecting AI models to external tools and data sources |
| **NSSM** | Non-Sucking Service Manager â€” wraps arbitrary executables as Windows services |
| **Ollama** | Local LLM inference engine that manages model loading, VRAM allocation, and tensor processing |
| **AegisOS** | AI gateway and agent orchestration framework that manages multi-agent workflows and MCP integrations |
| **OmniRoute** | AI routing dashboard with ELO arena scoring and call logging |
| **RAG** | Retrieval-Augmented Generation â€” enriching LLM prompts with retrieved context from knowledge sources |
| **SSE** | Server-Sent Events â€” the streaming protocol used for real-time token delivery |
| **TTFT** | Time to First Token â€” the latency from request submission to receiving the first generated token |
| **VRAM** | Video Random Access Memory â€” dedicated GPU memory used for model weight storage and inference |
| **VRAM Split** | When a model exceeds GPU VRAM capacity, Ollama splits layers between GPU and CPU memory |

---

## 15. Acronyms

| Acronym | Expansion |
|---|---|
| ADR | Architecture Decision Record |
| AIPOM | AI Product Operating Model |
| API | Application Programming Interface |
| BRD | Business Requirements Document |
| CPU | Central Processing Unit |
| CUDA | Compute Unified Device Architecture |
| DDR5 | Double Data Rate 5 (Memory) |
| DHCP | Dynamic Host Configuration Protocol |
| DPAPI | Data Protection Application Programming Interface |
| DR | Disaster Recovery |
| ELO | Elo rating system (chess-derived ranking) |
| GPU | Graphics Processing Unit |
| HA | High Availability |
| HTTP | Hypertext Transfer Protocol |
| IDE | Integrated Development Environment |
| JWT | JSON Web Token |
| KV | Key-Value |
| LAN | Local Area Network |
| LLM | Large Language Model |
| MCP | Model Context Protocol |
| NSSM | Non-Sucking Service Manager |
| NVMe | Non-Volatile Memory Express |
| PCIe | Peripheral Component Interconnect Express |
| PRD | Product Requirements Document |
| RAG | Retrieval-Augmented Generation |
| RCA | Root Cause Analysis |
| RDP | Remote Desktop Protocol |
| RPLS | Raja's Product Leadership System |
| RTO | Recovery Time Objective |
| SCM | Service Control Manager |
| SID | Security Identifier |
| SPOF | Single Point of Failure |
| SSH | Secure Shell |
| SSE | Server-Sent Events |
| SSL | Secure Sockets Layer |
| TTFT | Time to First Token |
| UAWOS | Universal AI Work Operating System |
| UPS | Uninterruptible Power Supply |
| VBS | Virtualization-Based Security |
| VPN | Virtual Private Network |
| VRAM | Video Random Access Memory |
| WDDM | Windows Display Driver Model |
| WSL2 | Windows Subsystem for Linux 2 |

---

## 16. Assumptions

| # | Assumption | Basis |
|---|---|---|
| 1 | All models listed in `ollama list` are available for inference | Verified via live `ollama list` command |
| 2 | LiteLLM config.yaml at `$PlatformRoot\configs\litellm\config.yaml` is the active configuration | Verified via running process and health endpoint |
| 3 | AegisOS junction `%USERPROFILE%\.aegisos â†’ $PlatformRoot` is active | Environment variables AEGISOS_CONFIG_PATH and AEGISOS_STATE_DIR point to the custom platform root |
| 4 | Open-WebUI connects to Ollama directly (not via LiteLLM) | Standard Open-WebUI configuration pattern; port mapping confirms direct Ollama access |
| 5 | Model sizes from `ollama list` reflect on-disk GGUF file sizes, not VRAM footprint | VRAM footprints from optimization guides are higher due to KV cache and activation memory |
| 6 | All 3 PostgreSQL instances are for development/legacy purposes | No direct AI stack dependency discovered; running as auto-start services |
| 7 | MongoDB and Redis are available for application use but not core to the AI inference pipeline | No direct references found in AI stack configuration files |
| 8 | The Observability stack (Prometheus, Grafana, Arize Phoenix) is planned but not yet deployed | docs/Operations_Guide.md describes design; no running processes or ports detected |

---

## 17. Validation Notes

| # | Observation | Verification Method | Status |
|---|---|---|---|
| 1 | All 6 AI Windows services are running | `Get-Service`, `Get-Process` | âœ… Confirmed (Ollama, LiteLLM, Headroom, CodeGraph, AegisOS, OmniRoute) |
| 2 | Ollama serves 12 models | `ollama list` | âœ… Confirmed |
| 3 | LiteLLM registers 14 model aliases | `/v1/models` API | âœ… Confirmed |
| 4 | LiteLLM health shows 9 healthy / 5 unhealthy | `/health` API | âœ… Confirmed (embedding model errors, timeouts) |
| 5 | RTX 5080 has 16,303 MiB VRAM | `nvidia-smi` | âœ… Confirmed |
| 6 | System has 64GB DDR5 (2 Ã— 32GB) | `Get-CimInstance Win32_PhysicalMemory` | âœ… Confirmed |
| 7 | Docker runs 1 container (open-webui, healthy) | `docker ps -a` | âœ… Confirmed |
| 8 | Weekly backup automation and rotation | File system listing | âœ… Confirmed |
| 9 | Ollama port 11434 is LAN-exposed without authentication | `netstat`, firewall rules | âœ… Confirmed â€” risk documented |
| 10 | DPAPI secrets exist at $PlatformRoot\secrets\ | docs/Architecture_Handbook.md | âœ… Referenced (not opened for security) |
| 11 | Tailscale VPN active on 100.90.78.53 | `systeminfo` network card output | âœ… Confirmed |
| 12 | 11 consolidated guides and 8 ADR records validated | docs/ and adr/ folder traversal | âœ… Confirmed â€” all current |
| 13 | Prometheus/Grafana/Arize Phoenix NOT running | Port scan â€” no ports 9090, 3000, or 6006 detected | âœ… Confirmed as not deployed |
| 14 | Norton Antivirus/Firewall running | `Get-Service` | âœ… Confirmed |
| 15 | OpenSSH server running on port 22 | `netstat` | âœ… Confirmed |
| 16 | Scheduled tasks: OllamaModelSync (daily), PlatformBackupTask (weekly), HealthCheckMonitor service | `Get-ScheduledTask` | âœ… Confirmed |

---

## 18. Recommendations for Additional Diagrams

Beyond the 40 required prompts, the following additional diagrams would provide value:

| # | Recommended Diagram | Purpose | Priority |
|---|---|---|---|
| 41 | **OmniRoute Arena Architecture** | Detail the ELO scoring system, call logging, and model comparison dashboard | Medium |
| 42 | **DPAPI Key Hierarchy** | Show the Windows DPAPI key derivation chain from machine SID to encrypted blob | High (Security Audit) |
| 43 | **OmniRoute Database Schema** | Visualize the SQLite schema for arena scores, call logs, and routing decisions | Low |
| 44 | **Knowledge Repository Semantic Index** | Show how Markdown files are chunked, embedded, and indexed for RAG retrieval | Medium |
| 45 | **NSSM Service Wrapper Internals** | Detail how NSSM wraps binaries, manages stdout/stderr, and handles crash recovery | Low |
| 46 | **Multi-Model VRAM Timeline** | Animate (or show as timeline) how VRAM is allocated/deallocated as different models are loaded and evicted over time | High |
| 47 | **Agent Communication Protocol** | Detail the inter-agent delegation protocol: message formats, task handoff, approval workflow | Medium |
| 48 | **LiteLLM Fallback Decision Tree** | Show the exact decision tree for fallback selection: health check â†’ timeout â†’ retry â†’ next fallback | Medium |
| 49 | **Tailscale Mesh Topology** | Show the Tailscale network topology connecting this workstation to other devices | Low |
| 50 | **Complete Port Security Audit** | Map every listening port to its service, exposure risk, and recommended hardening action | High (Security) |

---

*End of AI Infrastructure Diagram Generation Context Package*

*Generated by Antigravity IDE via comprehensive live system discovery on 2026-07-10.*  
*Owner: Raja Jeevan Kumar Maduri (https://www.linkedin.com/in/rajajeevankumar/)*

