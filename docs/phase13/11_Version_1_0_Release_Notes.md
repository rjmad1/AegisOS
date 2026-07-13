# Version 1.0 General Availability Release Notes — OpenClaw

**Release Date**: July 13, 2026  
**Target Audience**: Systems Administrators, DevOps Teams, Platform Engineers, Enterprise Security Officers  
**Classification**: Public  

---

## 1. Release Overview

We are pleased to announce the General Availability (GA) of the OpenClaw AI Workstation V1.0. This release establishes a secure, local-first, privacy-preserving AI Gateway control plane and workstation administration console. The platform is optimized for organizations requiring strict data sovereignty, loopback-only processing, and localized multi-agent workflows.

---

## 2. Core Capabilities

* **Modular Platform Kernel**: Core service orchestration using dependency injection, health telemetry monitoring, and a modular registry.
* **Unified AI Runtime Gateway**: Secure local routing proxy integrating Ollama and LiteLLM inference engines. Supports dynamic routing policies, endpoint load balancing, and capability checks.
* **Resilient Workflow Engine**: Multi-stage, scheduled, or event-driven multi-agent orchestration. Features cron scheduling, conditional branch evaluations, human approval gates, and checkpoint/resume capabilities.
* **Enterprise Security Control Plane**: Secure session tokens (HttpOnly cookie JWTs), brute-force IP login lockout protection, CSRF token validation, rate-limiting, and security headers.
* **Scranton Safety Firewall**: Dynamic prompt injection detection, PII scrubbing (emails, IPs, credit cards), and output validation.
* **Disaster Recovery Automation**: System backup and restoration tools (`Backup.ps1`/`Restore.ps1`) featuring automated DPAPI secret recovery prompts during migration.
* **Self-Healing Diagnostics**: Background checks that scan active service ports, repair missing directories, and monitor database sizing.

---

## 3. System Requirements & Prerequisites

* **Operating System**: Windows Server 2022 / Windows 10 or 11 (Pro/Enterprise).
* **Execution Environment**:
  * Node.js v20.x or newer (Next.js v16).
  * PowerShell 7.2+ (LTS).
* **Hardware Profile (Recommended)**:
  * Intel Core i7/i9 or AMD Ryzen 7/9 (8+ Cores).
  * 32GB RAM (64GB recommended).
  * NVIDIA GPU with CUDA support (e.g., RTX 3080/4080/4090 with 16GB+ VRAM).
* **Local Services**:
  * Ollama running on loopback interface (port 11434).
  * LiteLLM routing proxy (port 4000).

---

## 4. Quick-Start Deployment Commands

### Installation & Bootstrap
Initialize directories, register services, install NPM dependencies, and run database migrations:
```powershell
# Open an elevated PowerShell session in the repository root
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\Bootstrap.ps1
```

### Running Services
Start all registered SCM/NSSM background services (Next.js, LiteLLM, Ollama):
```powershell
.\automation\ManageService.ps1 -Action Start -Service All
```

### Running Health Validations
Execute the system validation suite to check ports, database paths, and GPU health:
```powershell
.\automation\Validate.ps1 -PlatformRoot "D:\AI-Operations"
```

### Automated Backup Execution
Archive active database records and configurations:
```powershell
.\automation\Backup.ps1 -PlatformRoot "D:\AI-Operations"
```
