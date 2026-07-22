# AegisOS Knowledge Base: 06_ECOSYSTEM_INVENTORY.md

## Repository Structural Inventory

### Top-Level Directories
* `src/`: Next.js administration console, API route handlers, core services, and platform control plane modules.
* `aegis_mobile/`: Flutter-based Mobile C2 cockpit application for iOS/Android remote management.
* `packages/`: Modular workspace libraries and dynamic provider extensions.
* `automation/`: PowerShell automation suite (`Bootstrap.ps1`, backup, restore, installer generation).
* `docs/`: Comprehensive master architecture documents, specifications, handbooks, and knowledge base.
* `adr/`: Architectural Decision Records (ADR-001 through ADR-014).
* `tests/`: Vitest unit, integration, chaos, e2e, and load test suites.

### Core Services & Daemons
* **Fastify / Next.js Console Gateway**: Port `18789` (REST/WS ingress) & Port `3000` (Next.js admin UI).
* **LiteLLM Router**: Port `4000` (Model proxy and routing load balancer).
* **Ollama Server**: Port `11434` (Local LLM inference manager).
* **PostgreSQL / SQLite**: Port `5432` / local loopback (Persistence & Digital Twin memory).
* **Redis**: Port `6379` (Background job queue & cache).
* **OTel Collector**: Ports `4317` / `4318` (OpenTelemetry trace & metrics hub).
* **AutonomicSelfHealingDaemon**: Internal background loop monitoring local loopbacks every 15s.
