# Lessons Learned Register — AegisOS

| Field | Value |
|---|---|
| **Document ID** | LLR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Internal / Lessons Learned |
| **Status** | Finalized |
| **Owner** | Lead Database & Systems Architect |

---

## 1. Key Database Migration Lessons

During the migration of AegisOS tables from SQLite to PostgreSQL, several key lessons were captured:

### 1.1 Prisma Type Parsing Conflict
* **Issue**: The initial migration script converted all string values matching the ISO timestamp regex into Javascript `Date` objects. This caused Prisma Client to fail during insertions into tables where the target schema defined the field as a `String` (e.g. `timestamp` in `AuditEvent`).
* **Resolution**: Replaced the greedy regex conversion with a precise model-to-field schema map. Fields are now converted to `Date` objects only if they are defined as a `DateTime` type in the destination schema.
* **Lesson**: Automated migration scripts must match type definitions exactly. General regex conversions are brittle across different database dialects.

### 1.2 Database Lock Contention Delta
* **Observation**: SQLite’s file-locking mechanism resulted in serialization bottlenecks. Write latency was forced to queue, which would cause transaction stagnation under higher concurrent loads. 
* **Resolution**: Migrating to PostgreSQL resolved lock contention entirely (0 lock collisions) due to Row-Level Locking and MVCC. Write performance scaled by 10x (657 TPS vs 65 TPS).
* **Lesson**: Local AI agent platforms executing concurrent parallel workflows must use an MVCC-compliant database to avoid write bottlenecks.

---

## 2. Platform Infrastructure & Scripting Lessons

### 2.1 Host Elevation Checks
* **Issue**: Running backup/restore scripts requires elevated Administrator console sessions on Windows. Running tests or CI automation without elevation will cause the scripts to fail.
* **Resolution**: The `PlatformHelper.psm1` helper script contains a `BYPASS_ELEVATION` bypass flag. Setting `$env:BYPASS_ELEVATION="true"` allows automated testing to proceed.
* **Lesson**: Infrastructure automation scripts should support a safe, scoped sandbox testing profile to allow execution in unprivileged environments.
