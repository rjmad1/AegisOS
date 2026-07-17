# Improvement Backlog (Pilot Driven) — AegisOS

| Field | Value |
|---|---|
| **Document ID** | IBP-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Internal / Backlog |
| **Status** | Finalized |
| **Owner** | Lead Product Owner & PMO Leads |

---

## 1. Prioritized Platform Improvements

The following improvements have been identified during the pilot deployment and PostgreSQL validation phase. They are prioritized by operational value:

### 1.1 [P0] pg_dump Container Integration
* **Description**: Currently, the backup script (`BackupProduction.ps1`) expects to find `pg_dump.exe` installed on the host machine. In environments lacking local PostgreSQL client tools, database backups will throw a warning or fail.
* **Proposed Solution**: Update `BackupProduction.ps1` to execute `docker exec aegisos-postgres pg_dump` when PostgreSQL is running inside Docker. This removes host client dependency.
* **Benefit**: Zero-dependency backup/restore reliability.

### 1.2 [P1] Database Connection Pooling
* **Description**: High-concurrency operations under multi-user workloads can exceed PostgreSQL's default connection limit.
* **Proposed Solution**: Integrate Prisma Accelerate or `pgbouncer` connection pooling.
* **Benefit**: Prevents connection exhaustion errors during concurrent agent executions.

### 1.3 [P1] Local Onboarding Sandbox Profile
* **Description**: Requiring Administrator privileges to run `Bootstrap.ps1` introduces friction for developers without local machine admin rights.
* **Proposed Solution**: Provide a `--user-scope` installation flag that installs directories and binds ports without SCM registration or firewall modifications.
* **Benefit**: Lower onboarding friction.

### 1.4 [P2] Telemetry Stream Rate Limiting
* **Description**: Real-time websocket telemetry broadcasts metric updates at a high rate (5Hz), which can cause high browser CPU usage.
* **Proposed Solution**: Implement dynamic debouncing of websocket messages based on browser activity/tab focus.
* **Benefit**: Lower workstation overhead.
