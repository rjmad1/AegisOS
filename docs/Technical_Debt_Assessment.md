# Technical Debt Assessment

This document registers and prioritizes technical debt items discovered within the workstation platform configuration and automation scripts.

## 1. Prioritized Technical Debt Ledger

| Category | Priority | Description | Impact | Estimated Effort |
|---|---|---|---|---|
| **Security** | **Critical** | SCM/NSSM services run under local Administrative system account `LocalSystem`. | A compromised Node/Python gateway has full administrative access. | Medium (4h) |
| **Security** | **High** | Inbound firewall rules for Ollama API allow traffic from any LAN IP on port 11434 without auth. | Resource exhaustion/unauthorized access to model weights. | Low (2h) |
| **Data Integrity** | **Medium** | Backup scripts target only SQLite databases. PostgreSQL and MongoDB instances are skipped. | Loss of historical project metadata during recovery. | Low (3h) |
| **Observability** | **Medium** | Next.js API routes return `501 Not Implemented` mocks instead of live system/service telemetry. | The console dashboard is purely visual and cannot interact with services. | Medium (8h) |
| **Runtime** | **Low** | Standalone runtimes (Python/Node.js) rely on system-wide globally installed binaries. | Version conflicts and missing dependencies on new machines. | Medium (6h) |

---

## 2. Action Plan and Resolutions

### A. Run Services as Scoped Accounts
To resolve the critical security debt, a dedicated restricted user account `AI_Service_User` should be created. The SCM logon parameter for the services (`Ollama`, `LiteLLMService`, `AegisOSService`, `OmniRouteService`) must be set to this account, and NTFS permissions on the platform directory restricted accordingly.

### B. Harden Firewall Rules
Update firewall rules to bind the Ollama port `11434` exclusively to the loopback interface (`127.0.0.1`) and the Tailscale overlay IP (`100.90.78.53`).

### C. Automate PG/Mongo Database Dumps
Add PostgreSQL (`pg_dump`) and MongoDB (`mongodump`) automation pipelines into the weekly backup scripts, saving backups to `$PlatformRoot\backups\db_backups\`.
