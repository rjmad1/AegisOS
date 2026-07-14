# Recommended Version 1.1 Backlog — AegisOS

| Field | Value |
|---|---|
| **Document ID** | RVB-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public |

---

## 1. Backlog Overview

This document presents the prioritized backlog of engineering tasks proposed for the AegisOS V1.1 minor release. These items address the security, performance, resilience, and operational gaps identified during the V1.0 Enterprise Validation program.

---

## 2. Prioritized Engineering Items

### [P0 - High Priority] Security Hardening & Dependency Resolution

#### 1. Configure Scoped Account Service Execution (SEC-001)
* **Goal**: Modify the SCM service definitions so that the Next.js console, LiteLLM, Ollama, and OmniRoute services run under a restricted local user profile (`AI_Service_User`) instead of `LocalSystem`.
* **Action**: Update `ManageService.ps1` to accept `-ServiceAccount` credentials. Apply appropriate ACLs to the `databases/` and `artifacts_storage/` directories.

#### 2. Resolve Outdated Monaco/DOMPurify Dependency (SEC-002)
* **Goal**: Address vulnerabilities in `dompurify` that permit Cross-Site Scripting (XSS).
* **Action**: Define explicit version overrides in the root `package.json` file to force NPM to resolve `dompurify` version `3.4.11` or newer.

---

### [P1 - Medium Priority] Performance & Reliability Enhancements

#### 3. Implement Automatic WAL Mode Activation
* **Goal**: Ensure the SQLite database operates in Write-Ahead Logging (WAL) mode to optimize concurrent reads and writes.
* **Action**: Add an initialization schema statement `PRAGMA journal_mode=WAL;` to the database migrator execution flow (`db-migrator.ts`).

#### 4. Add Automated Log & Event File Rotation (RISK-07)
* **Goal**: Prevent storage exhaustion from continuous EventBus append operations.
* **Action**: Introduce a log rotation check in the self-healer daemon (`self-healer.ts`) that rolls `event_audit.json` when the file size exceeds 10MB.

#### 5. Database Cleanup Scheduler Job (Vacuum)
* **Goal**: Reclaim unused database pages from deleted execution records and invalid sessions.
* **Action**: Register a weekly `SchedulerJob` in the system that executes `VACUUM;` on the active SQLite database connection.

---

### [P2 - Low Priority] Developer & Administrative Experience

#### 6. Real-Time Telemetry WebSocket Bridge (RISK-05)
* **Goal**: Replace the REST polling loop in the console with a persistent connection to stream event changes instantly.
* **Action**: Implement a Server-Sent Events (SSE) route under `/api/v1/events/stream` or standard WebSocket server bindings.

#### 7. Generic OIDC Single Sign-On (SSO) Support (RISK-08)
* **Goal**: Allow enterprises to hook the login workflow to corporate directories (Azure AD, Okta, PingFederate).
* **Action**: Extend `session.service.ts` to support external OIDC endpoint configuration parameters.
