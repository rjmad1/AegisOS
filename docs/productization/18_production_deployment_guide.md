# Production Deployment Guide — AegisOS

| Field | Value |
|---|---|
| **Document ID** | PDG-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Deployment Guide |
| **Status** | Approved |
| **Owner** | DevOps Infrastructure Lead |

---

## 1. Deployment Overview

AegisOS is built as a containerized stack supporting GPU-accelerated local machine learning workloads. The platform is designed for workstation-class host environments and leverages Docker Compose for local container orchestration, and Caddy/Nginx for secure network exposure.

---

## 2. Interactive Workstation Setup

Fresh workstation hosts can be deployed using the interactive root-level bootstrap script:

```powershell
# Open an elevated PowerShell session (Run as Administrator)
# Execute:
.\Bootstrap.ps1
```

The bootstrap routine automates system initialization:
1. **Administrative Access**: Checks for local privilege escalation (required to edit system variables and configure Windows services).
2. **Standard Directories**: Sets up directories under `D:\AI-Operations` (or system partition alternative).
3. **Environment Setup**: Configures system and user paths for configuration files.
4. **Validation Check**: Executes `automation/Validate.ps1` to assert network availability.

---

## 3. Container Orchestration (Docker Compose)

The production stack runs via Docker Compose. The configuration is split to support CPU-only and GPU-accelerated workflows:

```bash
# 1. Create environment config from template
cp .env.example .env
# Edit .env — configure strong credentials for POSTGRES, REDIS, and MINIO

# 2. Build and start services in detached mode
docker compose up -d --build
```

### GPU Support (NVIDIA CUDA Passthrough)
For workstations with NVIDIA RTX/A-series cards, GPU passthrough is enabled by merging compose files:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d --build
```

This maps the host GPU using the `nvidia` container runtime driver, allocating hardware memory directly to Ollama.

---

## 4. Port Conflict Resolution System

AegisOS implements a port remapping protocol ([PortManager.ps1](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/automation/PortManager.ps1)) to prevent collisions on host workstations:

* **Internal Container Ports**: Remain static (`5432` for Postgres, `6379` for Redis, `3000` for Next.js).
* **Host-Binding Ports**: Remap dynamically if standard bindings are occupied. 
* Remappings are configured in `.env` using overrides:
  - `HOST_PORT_POSTGRES` (default: `5432`, remapped to `15432` in production)
  - `HOST_PORT_REDIS` (default: `6379`, remapped to `16379` in production)
  - `HOST_PORT_CONSOLE` (default: `3000`, remapped to `3000` in production)

---

## 5. Deployment Rollback Procedures

If an upgrade deployment introduces regressions or configuration failures:

1. **Stop Stack**: Run `docker compose down`.
2. **Revert Tag**: Check out the previous stable Git revision.
3. **Restore Data**: If database schema changes occurred, run `RestoreProduction.ps1` to restore the pre-update PostgreSQL database dump.
4. **Start Stack**: Re-build the stack using the previous stable version: `docker compose up -d --build`.
