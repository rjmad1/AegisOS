# AegisOS Architecture

> This document provides a C4-level summary. For the full architectural handbook with sequence diagrams and data flows, see [docs/Architecture_Handbook.md](docs/Architecture_Handbook.md).

## Context (C4 Level 1)

AegisOS is a multi-user, enterprise-grade AI Work Operating System. In this architecture, **Open WebUI** serves strictly as the presentation/operator experience layer (thin client), while **AegisOS** acts as the authoritative orchestration, policy, identity, memory, and execution layer, routing verified requests through **LiteLLM** to local (Ollama) and cloud inference providers.

```
                    Users
                      │
              Open WebUI (Presentation)
                      │
                      ▼
            AegisOS API Gateway
                      │
          ┌───────────┼────────────┐
          │           │            │
     Identity      Policy      Audit
          │           │            │
          └───────────┼────────────┘
                      │
             Agent Orchestrator
                      │
       ┌──────────────┼──────────────┐
       │              │              │
     Memory       Knowledge      Developer
    Service        Service         Agent
       │              │              │
       └──────────────┼──────────────┘
                      │
               LiteLLM Gateway
                      │
             Ollama / Cloud Models
```

## Key Architectural Principles

| Principle | Implementation |
|-----------|---------------|
| **Local-First** | All local inference resolved on localhost; no data leaves the workstation |
| **Privacy by Design** | No telemetry to external services; all observability is self-hosted |
| **Zero Trust** | Every API request authenticated and authorized via JWT + RBAC |
| **Configuration over Code** | Environment-driven configuration with feature flags |
| **Hexagonal Architecture** | Infrastructure adapters (DB, secrets, storage) are swappable |
| **Presentation Decoupling** | The UI is a stateless thin client; all business logic lives in AegisOS |

## System Decomposition

| System | Purpose | Port |
|--------|---------|------|
| Open WebUI | Operator Experience UI Portal (Thin Client) | 8090 |
| Console / Gateway | Next.js admin dashboard & AegisOS API Gateway | 3000 / 18789 |
| LiteLLM | AI routing proxy | 4000 |
| Ollama | Local inference engine | 11434 |
| PostgreSQL | Relational persistence | 5432 |
| Redis | Caching and job queue | 6379 |
| MinIO | Object storage | 9000 |
| Prometheus | Metrics collection | 9090 |
| Grafana | Observability dashboards | 3001 |
| Jaeger | Distributed tracing | 16686 |

## Source Code Organization

```
src/
├── app/           # Next.js routes (pages and API endpoints)
├── api/           # API client, DTOs, interceptors, repositories
├── components/    # React UI components
├── enterprise/    # Multi-tenant SaaS features
├── hooks/         # React hooks
├── infrastructure/# Core infrastructure (DB, security, events, jobs, etc.)
├── modules/       # Feature modules (AI runtime, workflows, knowledge, etc.)
├── platform/      # Platform services (auth, search, plugins, etc.)
├── repositories/  # Data access layer
├── services/      # Business logic services
├── store/         # Zustand state management
├── types/         # TypeScript type definitions
└── utils/         # Shared utilities
```

## Architecture Decision Records

All significant architectural decisions are documented in [adr/](adr/).

| ADR | Decision |
|-----|----------|
| [ADR-001](adr/ADR-001-Contract-First-Versioned-API-Boundaries.md) | Contract-First Versioned API Boundaries |
| [ADR-002](adr/ADR-002-Server-Side-Decoupled-Authentication.md) | Server-Side Decoupled Authentication |
| [ADR-003](adr/ADR-003-Unified-Event-Driven-Registry.md) | Unified Event-Driven Registry |
| [ADR-004](adr/ADR-004-Pipeline-Worker-Processing-Architecture.md) | Pipeline Worker Processing Architecture |
| [ADR-005](adr/ADR-005-Repository-Information-Architecture-Rationalization.md) | Repository Information Architecture |
| [ADR-006](adr/ADR-006-Script-Engineering-Standards.md) | Script Engineering Standards |
| [ADR-007](adr/ADR-007-Portable-Configuration-Architecture.md) | Portable Configuration Architecture |
| [ADR-008](adr/ADR-008-Platform-Asset-Catalog-Design.md) | Platform Asset Catalog Design |
