# AegisOS Architecture

> This document provides a C4-level architectural summary. For the full handbook with sequence diagrams and data flows, see [docs/Architecture_Handbook.md](docs/Architecture_Handbook.md).

---

## 1. Context (C4 Level 1)

AegisOS operates as a local-first, privacy-preserving Autonomic AI Workstation Operating System. Open WebUI (or IDE companion extensions) serves as the thin-client presentation layer. AegisOS intercepts ingress, enforces security/governance policies, retrieves local context via MCP, and dispatches optimized inference requests to local (Ollama) or cloud models.

```
                    [ Ingress Clients ]
                 (Console / Open WebUI / IDE)
                            │
                            ▼
              [ Layer 6: Executive Plane ]
                 (AegisOS API Gateway / Console)
                            │
                            ▼
               [ Layer 5: Control Plane ]
              (Executive Control Plane / ECP) ◄───► [ Convergence Engine ]
                            │                              (Digital Twin)
                            ▼
            [ Layer 4: Orchestration Plane ]
               (Workflows / Scheduling / Jobs)
                            │
                            ▼
              [ Layer 3: Capability Plane ]
              (Model / Tool / RAG Registries)
                            │
                            ▼
               [ Layer 2: Runtime Layer ]
                (LiteLLM Router / Ollama)
                            │
                            ▼
            [ Layer 1: Infrastructure Layer ]
               (OS Processes / VPN / Storage)
                            │
                            ▼
               [ Layer 0: Hardware Layer ]
                  (GPU VRAM / CUDA Cores)
```

---

## 2. Key Architectural Principles

| Principle | Description | Implementation |
|---|---|---|
| **Local-First** | Data sovereignty is guaranteed by running all inference and storage locally. | Ollama + PostgreSQL/SQLite bound to localhost loopback interfaces. |
| **Privacy by Design** | No telemetry or usage statistics are transmitted to external services. | Self-hosted observability (OTel Collector, Prometheus, Grafana, Loki). |
| **Zero Trust** | Cryptographically enforce least privilege access at every trust boundary. | ECP checks signature validation, JWT authorization, and RBAC policies. |
| **Autonomic Control** | The system automatically heals faults and aligns states without human intervention. | Convergence Engine synchronizing discovery states with canonical digital twin. |
| **Layer Isolation** | Higher architectural planes consume services from lower planes; reverse imports are prohibited. | strict ESLint import boundary rules and vitest compilation checks. |

---

## 3. System Decomposition

| System / Service | Default Port | Internal Role |
|---|---|---|
| **Console Portal** | `3000` | Next.js administration UI dashboard. |
| **AegisOS Gateway** | `18789` | Ingress REST/WebSocket endpoint and MCP Tool Host. |
| **LiteLLM Routing** | `4000` | Load balancer and model routing proxy. |
| **Ollama Inference** | `11434` | Local model serving weight manager. |
| **PostgreSQL / SQLite**| `5432` / local | Persistence layer for credentials, twin topology, and audit logs. |
| **Redis** | `6379` | Background job queues and caching. |
| **OTel Collector** | `4317` / `4318` | Central telemetry processing hub. |
| **Prometheus / Grafana**| `9090` / `3002` | Metrics indexing and diagnostic dashboards. |

---

## 4. Architecture Decision Records

All architectural designs are recorded in [adr/](adr/). Key decisions include:

*   [ADR-001: Contract-First API](adr/ADR-001-Contract-First-Versioned-API-Boundaries.md) — Enforces versioned `/api/v1/` routes.
*   [ADR-009: 7-Layered Stack](adr/ADR-009-Autonomic-Operating-System-Architecture.md) — Establishes strict hierarchical layering.
*   [ADR-010: Executive Control Plane](adr/ADR-016-Executive-Control-Plane.md) — Outlines Layer 5 stateless policy enforcers.
*   [ADR-013: Command & Control Subsystem](adr/ADR-013-Command-And-Control-Subsystem.md) — Defines signed mobile/remote approvals.
