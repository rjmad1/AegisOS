# Known Limitations — AegisOS V1.0

| Field | Value |
|---|---|
| **Document ID** | KLR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public |

---

## 1. Scope of Limitations

This document lists the known boundaries, thresholds, and constraints of AegisOS V1.0. These limitations are structural properties of the local-first workstation architecture.

---

## 2. Technical and Architectural Limits

### 2.1 Database Concurrency (SQLite Locks)
* **Limit**: The default relational database engine is SQLite (`production.db`). While highly efficient for local-first workloads, it enforces a single-writer constraint using database file locks.
* **Operational Boundary**: Under high write load (e.g. more than 15 concurrent workflow executions writing step updates or state variables simultaneously), writes will experience latency degradation or trigger `SQLITE_BUSY` errors.
* **Resolution**: Systems requiring multi-user write concurrency must set the `DATABASE_URL` environment variable to a PostgreSQL database server.

### 2.2 Secrets Portability (Windows DPAPI Host Lock)
* **Limit**: Security credentials and API keys stored in `AegisOS_secrets.enc` are encrypted using Windows Data Protection API (DPAPI). DPAPI bindings utilize the machine's local security identifier (SID) and cryptoproviders.
* **Operational Boundary**: Restoring a backup archive on a different physical server will cause secret decryption to fail.
* **Resolution**: The recovery orchestrator (`Restore.ps1`) detects this and prompts the user to enter replacement secrets interactively.

### 2.3 Event Telemetry Sync (No Active Websocket Push)
* **Limit**: The frontend UI EventBus is isolated from the server-side hardened EventBus.
* **Operational Boundary**: Live event updates, logs, and execution steps in the admin console are fetched via REST polling. Telemetry latency averages 1-3 seconds.
* **Resolution**: Planned for V1.1 is the implementation of a WebSocket server bridge to push events instantly.

### 2.4 Workspace Watcher Sizing Limits
* **Limit**: The filesystem watcher indexes files inside configured workspace directories.
* **Operational Boundary**: Workspace directories containing more than **50,000 files** or deeply nested system folders (e.g., node_modules, .git) will cause elevated CPU consumption during initialization and can exhaust filesystem handle counts.
* **Resolution**: Configure standard exclude patterns (e.g., ignoring `.git` and `node_modules` folders) in environment variables or within the configuration dashboard.

### 2.5 Downstream Model Loading Overhead (GPU VRAM Bound)
* **Limit**: First-token latency for local inference calls depends entirely on the model size and hardware compute resources.
* **Operational Boundary**: If a model is not already resident in GPU VRAM (e.g., Ollama has unloaded the model due to idle timeout), the initial workflow execution node will block for **10-40 seconds** while Ollama transfers model weights from NVMe storage to GPU VRAM.
* **Resolution**: Keep model weights resident in Ollama memory by setting the `keep_alive` parameter to `-1` (always load) in Ollama configuration.
