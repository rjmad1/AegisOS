# AegisOS Technical Debt Register
**Workstation & Companion App Technical Debt, Deprecations & Deferred Capabilities**

This register catalogs known technical debt, architectural shortcuts, and deferred capabilities across both the workstation platform and the mobile application, outlining resolution timelines and ownership.

---

## 1. Prioritized Technical Debt Ledger

| Debt ID | Category | Priority | Description | Business Impact | Estimated Resolution | Target Release |
|---|---|---|---|---|---|---|
| **DBT-SEC-01** | Security | **Critical** | Workstation host services (Ollama, LiteLLM, AegisOS, Caddy) run under the local administrative system account (`LocalSystem`). | High risk of administrative host takeover if an AI gateway process is compromised. | High (12h) | v0.1.0 (Sprint 2) |
| **DBT-SEC-02** | Security | **High** | Inbound firewall rules for the Ollama API allow traffic from any LAN IP on port 11434 without authorization. | VRAM resource depletion or model weight extraction by unauthorized LAN nodes. | Low (2h) | v0.1.0 (Sprint 1) |
| **DBT-DATA-01** | Data Integrity | **Medium** | Workstation backup scripts target only SQLite databases. PostgreSQL, MongoDB, and MinIO object storage backups are omitted. | Risk of data loss for historical project metadata and agent execution logs during recovery. | Medium (6h) | v0.2.0 (Sprint 4) |
| **DBT-OBS-01** | Observability | **Medium** | Next.js API routes currently return `501 Not Implemented` mock objects instead of real system telemetry. | The console dashboard displays hardcoded values and cannot monitor live workstation performance. | Medium (8h) | v0.3.0 (Sprint 5) |
| **DBT-MOB-01** | Code Quality | **High** | Mobile state providers return mock data structures without persistent SQLite cache layers. | Companion application is unusable when disconnected from the active VPN. | High (16h) | v0.2.0 (Sprint 3) |
| **DBT-DEP-01** | Deprecations | **Low** | Standalone Node.js/Python runtime environments rely on globally installed system packages rather than container isolates. | Deployment failures on new developer machines due to package mismatch. | Medium (10h) | v0.9.0 (Sprint 11) |

---

## 2. Action Plan and Resolutions

### A. DBT-SEC-01: Scoped Service Accounts
* **Plan**: Create a restricted Windows/Linux local user `aegis_runtime` (or `AI_Service_User`) with read/write privileges limited exclusively to the platform work directories. Reconfigure NSSM/Systemd service configurations to run under this account. Update NTFS permissions on the platform directory accordingly.

### B. DBT-SEC-02: Firewall Hardening
* **Plan**: Bind the Ollama API port `11434` and LiteLLM port `4000` strictly to localhost (`127.0.0.1`) and the Tailscale mesh IP (`100.x.y.z`), blocking external LAN access.

### C. DBT-DATA-01: Database Dumps Automation
* **Plan**: Update backup automation scripts (`backup.bat` / Shell) to run `pg_dump` for Postgres, `mongodump` for MongoDB, and execute `mc mirror` for MinIO objects, routing backups to the secure `$PlatformRoot/backups/` directory.

### D. DBT-OBS-01: Live Telemetry Feeds
* **Plan**: Implement System Information queries in Next.js backend hooks. Route metrics to the `/ws/telemetry` socket using system calls for GPU/VRAM statistics.

---

## 3. Deferred Capabilities (v1.1+ Backlog)
The following features are deferred beyond Version 1.0 GA:
* **Edge Inference (v1.1)**: Running lightweight models (e.g., Llama-3-1B) directly on the mobile GPU via CoreML/NNAPI.
* **Multi-Workstation Cluster (v1.2)**: Orchestrating swarms across multiple separate physical workstations from a single console.
* **Edge MCP Plugins (v1.1)**: Exposing mobile-native location/contacts APIs as MCP tools for host workstation prompts.

---

> **Document History**: This register was consolidated from `TECHNICAL_DEBT.md` and `Technical_Debt_Assessment.md` on 2026-07-18. The Technical Debt Assessment content has been merged into this canonical document.
