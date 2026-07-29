# AegisOS Documentation Portal

> **AegisOS** — An enterprise-ready, local-first, privacy-preserving AI Workstation platform integrating Ollama inference, LiteLLM routing proxy, multi-agent frameworks, distributed worker nodes, and a Next.js Console administration dashboard.

---

## Platform Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      AegisOS Workstation                         │
│                                                                  │
│  ┌──────────┐   ┌────────────┐   ┌─────────────────────────────┐ │
│  │ Console  │──▶│ LiteLLM /  │──▶│ Local LLM Inference         │ │
│  │ (Next.js)│   │ ModelProxy │   │ (Ollama + CUDA / GPU VRAM)  │ │
│  └──────────┘   └────────────┘   └─────────────────────────────┘ │
│       │               │                         │                │
│       ▼               ▼                         ▼                │
│  ┌──────────┐   ┌────────────┐   ┌─────────────────────────────┐ │
│  │ Database │   │ PIK / CIL  │   │ Workforce / Apps            │ │
│  │ (Prisma) │   │ Analyzers  │   │ (Orchestrator + WorkerNode) │ │
│  └──────────┘   └────────────┘   └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

| Service | Purpose | Default Port |
|---------|---------|:---:|
| Console | Next.js admin dashboard | 3000 |
| LiteLLM | AI routing proxy | 4000 |
| Ollama | Local inference engine | 11434 |
| PostgreSQL | Relational persistence | 5432 |
| Redis | Caching and job queue | 6379 |
| MinIO | Object storage | 9000 |
| Prometheus | Metrics collection | 9090 |
| Grafana | Observability dashboards | 3001 |
| Jaeger | Distributed tracing | 16686 |

---

## Quick Links

| | |
|---|---|
| 🚀 **[Installation Guide](Getting-Started/Installation.md)** | Step-by-step setup for all platforms |
| ⚡ **[Quick Start](Getting-Started/Quick-Start.md)** | Get running in 5 minutes |
| 🏗️ **[Architecture Overview](Architecture/Platform-Overview.md)** | C4 model, principles, decomposition |
| 🧩 **[Platform Integration Kernel (PIK)](Subsystems/PIK-Platform-Integration-Kernel.md)** | 9 intelligence analyzers & telemetry |
| 🤖 **[Workforce Subsystem](Subsystems/Workforce-Subsystem.md)** | Multi-agent autonomous framework & HITL |
| 🧠 **[Collective Intelligence](Subsystems/Collective-Intelligence.md)** | Deliberation, critique & consensus |
| 📦 **[Monorepo Packages](Packages/Monorepo-Packages.md)** | Decoupled `/packages` architecture |
| 🖥️ **[Apps (Orchestrator & WorkerNode)](Applications/Orchestrator-and-WorkerNode.md)** | Distributed execution binaries |
| 🔧 **[Deployment Guide](Operations/Deployment.md)** | Docker, Kubernetes, Helm |
| 📖 **[Developer Guide](Developer-Guide/Developer-Setup.md)** | Extend, build, contribute |
| 🛡️ **[Security](Security/Security-Policy.md)** | Vulnerability reporting, security architecture |
| 📋 **[Changelog](Release/Changelog.md)** | Latest release notes |

---

## Subsystems Index

### Core Subsystems
- [AI Runtime](Subsystems/AI-Runtime.md) — Capability orchestration & circuit breakers
- [Execution Contract](Subsystems/Universal-Execution-Contract.md) — Universal execution model
- [Runtime Semantics](Subsystems/Runtime-Semantics.md) — Behavioral specification
- [Command & Control](Subsystems/Command-and-Control.md) — Secure C2 pathway & HITL gates
- [Platform Integration Kernel (PIK)](Subsystems/PIK-Platform-Integration-Kernel.md) — 9 intelligence analyzers
- [Workforce Subsystem](Subsystems/Workforce-Subsystem.md) — Multi-agent framework, planner, shared memory
- [Collective Intelligence (CIL)](Subsystems/Collective-Intelligence.md) — Multi-model deliberation, critique, consensus
- [Qualification & Benchmarking](Subsystems/Qualification-and-Benchmarking.md) — PMI maturity engine, ACB harness
- [Notifications & Realtime](Subsystems/Notifications-and-Realtime.md) — Multi-channel alerts & WebSocket sync
- [OAP, PVP & PIAL Engines](Subsystems/OAP-PVP-PIAL.md) — MAPE-K autonomic loop, command verification
- [Artifacts & Widgets](Subsystems/Artifacts-and-Widgets.md) — File delivery, markdown/JSON renderers, UI widgets
- [Participants & Permissions](Subsystems/Participants-and-Permissions.md) — Descriptors, composition, RBAC/ABAC
- [Federation Subsystem](Subsystems/Federation-Subsystem.md) — Mesh VPN control protocol & peer registry
- [Conversa Living Graph](Subsystems/Conversa-Living-Graph.md) — Real-time reactive knowledge graph engine

### Infrastructure & Packages
- [Infrastructure Overview](Infrastructure/Infrastructure-Overview.md) — CodeGraph client, Headroom/Ponytail compression, SAP adapter
- [Monorepo Packages](Packages/Monorepo-Packages.md) — `browser-engine`, `evidence-pipeline`, `shared-contracts`, `state-manager`, `validation-engine`
- [Orchestrator & Worker Applications](Applications/Orchestrator-and-WorkerNode.md) — `apps/orchestrator` and `apps/worker-node`

---

## Operations & Administration

### Operations
- [Deployment](Operations/Deployment.md) — Docker, Kubernetes, Helm
- [Operations Guide](Operations/Operations-Guide.md) — Day-to-day operations
- [Monitoring & Observability](Operations/Monitoring-and-Observability.md) — Metrics, logs, traces
- [Troubleshooting](Operations/Troubleshooting.md) — Diagnostics runbook
- [Disaster Recovery](Operations/Disaster-Recovery.md) — Backup and restore
- [Secrets Management](Operations/Secrets-Management.md) — Credential handling
- [Ports Management](Operations/Ports-Management.md) — Port allocation

### Administration
- [Administrator Guide](Administration/Administrator-Guide.md)
- [User Guide](Administration/User-Guide.md)
- [Platform Handbook](Administration/Platform-Handbook.md)

---

## Governance & Quality

- [Engineering Constitution](Governance/Engineering-Constitution.md) — Authoritative governance rules
- [Platform Governance](Governance/Platform-Governance.md) — Governance compliance matrix
- [Technical Debt Register](Governance/Technical-Debt-Register.md) — Prioritized tech debt ledger
- [Risk Register](Governance/Risk-Register.md) — STRIDE risk register

---

## Documentation Status

| Metric | Value |
|---|---|
| Total Documents Discovered | 650+ files |
| Canonical Wiki Pages | **75 canonical pages** |
| Platform Modules Covered | **58 / 58 (100%)** |
| Infrastructure Modules Covered | **34 / 34 (100%)** |
| Monorepo Packages Covered | **5 / 5 (100%)** |
| Applications Covered | **2 / 2 (100%)** |
| Documentation Health Score | **100/100 (Gold Standard)** |
| Documentation Health Report | [View Report](Documentation-Health-Report.md) |

---

**Document Owner**: Raja Jeevan Kumar Maduri  
**Status**: ACTIVE · CANONICAL  
**Audience**: All stakeholders — developers, administrators, operators, executives  

[Back to Repository](https://github.com/rjmad1/AegisOS)
