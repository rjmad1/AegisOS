# Master Remediation Register

This document tracks all identified platform and architectural anomalies within the AegisOS ecosystem. Nothing may be refactored or modified outside this register.

---

## Finding ID: AEGIS-001 â€” Database URL / Schema Incompatibility
* **Severity**: Critical (P0)
* **Category**: Configuration / Persistence
* **Affected Components**: Prisma Client, console container, environment files
* **Evidence**:
  * [prisma/schema.prisma:L1-L8](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/prisma/schema.prisma#L1-L8) (`provider = "sqlite"`)
  * [docker-compose.yml:L182-L183](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docker-compose.yml#L182-L183) (`DATABASE_URL=postgresql://...`)
  * [.env.production:L33](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/.env.production#L33) (`DATABASE_URL="file:D:/AI-Operations/runtime/databases/production.db"`)
* **Root Cause**: The console container runs PostgreSQL in production compose, but the client package compiles exclusively for SQLite database endpoints.
* **Current State**: Relational queries fail instantly on PG deployments due to sqlite dialect engine mismatches.
* **Desired State**: Both dev, build, and compose run PostgreSQL as the core backend, using the `postgresql` provider inside `schema.prisma`.
* **Dependencies**: None
* **Implementation Tasks**:
  1. Modify [prisma/schema.prisma](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/prisma/schema.prisma) database provider to `postgresql`.
  2. Recompile client engine with `npx prisma generate`.
* **Validation Tests**: Run `npx prisma validate` and verify build success.
* **Regression Tests**: Execute `npm test` ensuring existing DB mock frameworks do not break.
* **Rollback Plan**: Revert provider to `sqlite` and re-run client generation.
* **Documentation Impact**: Update `ARCHITECTURE.md` and database setup guides.
* **Risk**: Low (isolated to persistence client compiling).
* **Owner**: Lead Database Architect
* **Status**: Open

---

## Finding ID: AEGIS-002 â€” Missing `ioredis` Dependency
* **Severity**: Critical (P0)
* **Category**: Dependencies / Runtime
* **Affected Components**: `package.json`, `src/infrastructure/providers/redis-platform.ts`
* **Evidence**:
  * [package.json:L14-L41](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/package.json#L14-L41) (no declaration of `ioredis`)
  * [src/infrastructure/providers/redis-platform.ts:L440](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/infrastructure/providers/redis-platform.ts#L440) (`require('ioredis')`)
* **Root Cause**: The `redis-platform` loader expects `ioredis` package imports when running in clusters with `REDIS_URL` active, but the package was never declared.
* **Current State**: Next.js logs warning and silently drops session/cache data back into individual in-memory instances inside the container.
* **Desired State**: `ioredis` is installed, allowing persistent socket links with the compose Redis container.
* **Dependencies**: None
* **Implementation Tasks**:
  1. Add `"ioredis": "^5.4.1"` to `package.json`.
  2. Run `npm install` to update the lock file.
* **Validation Tests**: Check that `require('ioredis')` succeeds in runtime bootstrap.
* **Regression Tests**: Verify session storage and cache test suites pass.
* **Rollback Plan**: Remove `ioredis` from `package.json`.
* **Documentation Impact**: Update `DEPENDENCY_MAP.md`.
* **Risk**: Low.
* **Owner**: Platform Infrastructure Lead
* **Status**: Open

---

## Finding ID: AEGIS-003 â€” Jaeger / OTEL Collector Host Port Collision
* **Severity**: Critical (P0)
* **Category**: Configuration / Infrastructure
* **Affected Components**: `docker-compose.yml`
* **Evidence**:
  * [docker-compose.yml:L120](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docker-compose.yml#L120) (`${HOST_PORT_OTEL_GRPC:-4317}:4317`)
  * [docker-compose.yml:L154](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docker-compose.yml#L154) (`${HOST_PORT_OTEL_GRPC:-4317}:4317`)
* **Root Cause**: Copy-paste mapping error where Jaeger's receiver overrides the host port allocated to the main OpenTelemetry Collector.
* **Trigger**: Booting the compose cluster on local systems.
* **Blast Radius**: Jaeger or Otel-collector fails to boot.
* **Current State**: Port socket conflict on host port `4317`.
* **Desired State**: Jaeger OTLP receiver is mapped to a dedicated host port, resolving the conflict.
* **Dependencies**: None
* **Implementation Tasks**:
  1. Modify [docker-compose.yml](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docker-compose.yml) port parameter for Jaeger OTLP to `${HOST_PORT_JAEGER_OTLP:-4319}:4317`.
* **Validation Tests**: Spin up the compose cluster and verify all containers are healthy.
* **Regression Tests**: None.
* **Rollback Plan**: Revert ports in `docker-compose.yml`.
* **Documentation Impact**: Update `PORTS_MANAGEMENT.md` and telemetry guides.
* **Risk**: Low.
* **Owner**: DevOps Specialist
* **Status**: Open

---

## Finding ID: AEGIS-004 â€” Hardcoded Service Account Credentials
* **Severity**: Critical (P0)
* **Category**: Security
* **Affected Components**: `automation/Configure.ps1`
* **Evidence**:
  * [automation/Configure.ps1:L125-L126](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/automation/Configure.ps1#L125-L126) (`$servicePass = "AegisPassword123!@#"`)
* **Root Cause**: Simplification of local service provisioning.
* **Current State**: Host workstation creates a local OS user `AI_Service_User` with a hardcoded static password, violating security hygiene policies.
* **Desired State**: Password is generated securely at runtime, or the script prompts the administrator.
* **Dependencies**: None
* **Implementation Tasks**:
  1. Replace hardcoded password in [automation/Configure.ps1](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/automation/Configure.ps1) with a dynamic generator or interactive prompt.
* **Validation Tests**: Execute `Configure.ps1` and verify no plaintext defaults exist.
* **Regression Tests**: Check Windows Service Manager execution status.
* **Rollback Plan**: Revert scripting to static definitions.
* **Documentation Impact**: Update `SECURITY.md` credentials guidelines.
* **Risk**: Medium (affects host OS user credentials).
* **Owner**: DevSecOps Engineer
* **Status**: Open

---

## Finding ID: AEGIS-005 â€” Unfinished PostgreSQL & MinIO Restore Routines
* **Severity**: Critical (P0)
* **Category**: Reliability / Disaster Recovery
* **Affected Components**: `automation/RestoreProduction.ps1`
* **Evidence**:
  * [automation/RestoreProduction.ps1:L73-L98](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/automation/RestoreProduction.ps1#L73-L98) (only SQLite and JSON file moves)
* **Root Cause**: Incomplete disaster recovery automation.
* **Current State**: Production backups cannot restore PostgreSQL tables or MinIO object archives.
* **Desired State**: Recovery scripts execute containerized Postgres restores and unpack volume tarballs.
* **Dependencies**: AEGIS-001
* **Implementation Tasks**:
  1. Add `pg_restore` commands or containerized SQL stream execution logic to `RestoreProduction.ps1`.
  2. Add volume extraction commands to restore the MinIO storage structure.
* **Validation Tests**: Execute a backup-restore loop and inspect data validity.
* **Regression Tests**: Ensure SQLite recoveries continue to function.
* **Rollback Plan**: Revert `RestoreProduction.ps1` changes.
* **Documentation Impact**: Update `Disaster_Recovery_Guide.md`.
* **Risk**: Medium.
* **Owner**: Site Reliability Engineer
* **Status**: Open

---

## Finding ID: AEGIS-006 â€” In-Memory Billing Metrics Volatility
* **Severity**: High (P1)
* **Category**: Product Engineering / Architecture
* **Affected Components**: `UsageMeteringEngine.ts`
* **Evidence**:
  * [src/enterprise/billing/UsageMeteringEngine.ts:L84](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/enterprise/billing/UsageMeteringEngine.ts#L84) (`private records: UsageRecord[] = [];`)
* **Root Cause**: Volatile storage design for billing records.
* **Current State**: Billing records are stored in-memory and are lost upon Next.js console restart.
* **Desired State**: Metering records are persisted in the database via Prisma.
* **Dependencies**: AEGIS-001
* **Implementation Tasks**:
  1. Modify `UsageMeteringEngine.ts` to write usage logs to the database using Prisma client schemas.
* **Validation Tests**: Verify usage records persist across server restarts.
* **Regression Tests**: Run billing calculation test suite.
* **Rollback Plan**: Revert back to the in-memory array representation.
* **Documentation Impact**: Update `TECHNICAL_DEBT.md`.
* **Risk**: Low.
* **Owner**: Core Software Engineer
* **Status**: Open

---

## Finding ID: AEGIS-007 â€” Unused Package `@react-pdf/renderer`
* **Severity**: Low (P3)
* **Category**: Dependency Governance
* **Affected Components**: `package.json`
* **Evidence**:
  * [package.json:L21](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/package.json#L21) (`"@react-pdf/renderer": "^4.5.1"`)
* **Root Cause**: Leftover dependency from early designs.
* **Current State**: Unused package bloating builds and security audits.
* **Desired State**: Dependency is pruned.
* **Dependencies**: None
* **Implementation Tasks**:
  1. Remove package definition from `package.json`.
  2. Run `npm install` to clean the lock file.
* **Validation Tests**: Verify the build compiles without errors.
* **Regression Tests**: None.
* **Rollback Plan**: Re-add package.
* **Documentation Impact**: None.
* **Risk**: Low.
* **Owner**: Lead Frontend Developer
* **Status**: Open

---

## Finding ID: AEGIS-008 â€” Stale Paths in Index Registry
* **Severity**: Low (P3)
* **Category**: Documentation Drift
* **Affected Components**: `docs/MasterIndexRegistry.json`
* **Evidence**:
  * `docs/MasterIndexRegistry.json` contains old references to `D:/1_Projects/OpenClawOllamaLiteLLM_Transparency/...`
* **Root Cause**: Registry index was not regenerated for the active workspace.
* **Current State**: Dead documentation links during searches.
* **Desired State**: Paths are fully updated to the current workspace root.
* **Dependencies**: None
* **Implementation Tasks**:
  1. Execute `automation/GenerateDocsIndex.ps1`.
* **Validation Tests**: Verify paths in the generated JSON point to the active directory.
* **Regression Tests**: None.
* **Rollback Plan**: Restore JSON from git.
* **Documentation Impact**: Refreshes index.
* **Risk**: Low.
* **Owner**: Technical Writer
* **Status**: Open

