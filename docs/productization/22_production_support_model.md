# Production Support Model & Incident Playbook — AegisOS

| Field | Value |
|---|---|
| **Document ID** | PSM-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Operations Runbook |
| **Status** | Approved |
| **Owner** | Operations Support Manager |

---

## 1. Support Tiers & Escalation Paths

AegisOS is supported by a three-tiered technical operations team:

```
[Tier 1: Helpdesk / Operators] 
       | (Cannot resolve in 15 mins)
       v
[Tier 2: SysOps / SRE Engineers] 
       | (Bug / Schema / Core Failure)
       v
[Tier 3: Platform Architecture / Core Engineering]
```

* **Tier 1 (Helpdesk / Operators)**: Handles pairing challenges, credential resets, and dashboard viewing issues. Maps to support ticket queues via the Feedback Ticketing system.
* **Tier 2 (SysOps / SRE)**: Diagnoses workstation port collisions, restarts container environments, executes database backups/restores, and resolves storage budget alerts.
* **Tier 3 (Core Engineering)**: Fixes codebase bugs, optimizes SQL schemas, adjusts model context boundaries, and resolves supply chain CVE violations.

---

## 2. Service Level Indicators (SLIs) & Objectives (SLOs)

Operations are governed by the following Service Level agreements:

| Indicator (SLI) | Target (SLO) | Measurement Method |
|---|---|---|
| **API Availability** | &ge; 99.9% Uptime | HTTP 200 responses on `/api/health` over 30-day windows. |
| **Inference TTFT Latency** | &le; 500 ms | Time-to-First-Token logged by the LiteLLM proxy router. |
| **Event Bus Delivery Rate** | &ge; 99.99% | Event pub/sub failures recorded in logs. |
| **Database Recovery Time** | &le; 15 Minutes | Execution duration of `RestoreProduction.ps1`. |
| **Security Lockout MTTR** | &le; 1 Minute | Duration to block brute-forcing IPs. |

---

## 3. Emergency Incident Playbooks

### Playbook 3.1: PostgreSQL Database Connection Failure (P1 critical)
* **Symptom**: Console dashboard displays `500 Server Error` on boot; API routes return database connection errors.
* **Diagnostics**: Check if the container is running and listen port is active:
  ```bash
  docker compose ps postgres
  netstat -ano | findstr 15432
  ```
* **Remediation**:
  1. If container is stopped, restart it: `docker compose up -d postgres`.
  2. If port collision occurred (port 15432 bound to host process), edit `.env` file, change `HOST_PORT_POSTGRES` to another port, and run `docker compose up -d`.
  3. Validate database status via: `npx prisma db pull`.

### Playbook 3.2: Model Server VRAM Exhaustion (P2 high)
* **Symptom**: Local LLM calls fail with timeout errors or swap memory paging slows the host system.
* **Diagnostics**: Check VRAM usage via NVIDIA system management:
  ```bash
  nvidia-smi
  ```
* **Remediation**:
  1. Trigger model cache purge by restarting the Ollama container:
     ```bash
     docker compose restart ollama
     ```
  2. If DeepSeek-R1 (32B) remains loaded alongside WSA parallel runs, execute `AutonomousOptimizer` logic to force swap model weights to CPU RAM.
