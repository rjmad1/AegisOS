# Platform Overview

> **Purpose**: High-level architecture of AegisOS — C4 model, design principles, and system decomposition.
> **Audience**: Architects, developers, stakeholders
> **Status**: ACTIVE · CANONICAL
> **Owner**: Raja Jeevan Kumar Maduri
> **Source**: [ARCHITECTURE.md](../../ARCHITECTURE.md), [Architecture_Handbook.md](../../docs/Architecture_Handbook.md)

---

**Navigation**: [Home](../Home.md) · **Architecture** > Platform Overview
**Related**: [Security Architecture](Security-Architecture.md) · [Threat Model](Threat-Model.md) · [ADR Index](ADR-Index.md) · [Deployment](../Operations/Deployment.md)

---

## Context (C4 Level 1)

AegisOS is a local-first, privacy-preserving AI Workstation platform. It routes AI inference through local models (Ollama) via a proxy gateway (LiteLLM), managed through a Next.js administration console.

```
┌─────────────────────────────────────────────────────────┐
│                    AegisOS Platform                      │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐ │
│  │ Console  │──▶│ Gateway  │──▶│ Inference Engine     │ │
│  │ (Next.js)│   │ (LiteLLM)│   │ (Ollama + GPU)       │ │
│  └──────────┘   └──────────┘   └──────────────────────┘ │
│       │              │                                    │
│       ▼              ▼                                    │
│  ┌──────────┐   ┌──────────┐                             │
│  │ Database │   │ Context  │                             │
│  │ (Prisma) │   │ (MCP)    │                             │
│  └──────────┘   └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

## Key Architectural Principles

| Principle | Implementation |
|-----------|---------------|
| **Local-First** | All inference resolved on localhost; no data leaves the workstation |
| **Privacy by Design** | No telemetry to external services; all observability is self-hosted |
| **Zero Trust** | Every API request authenticated and authorized via JWT + RBAC |
| **Configuration over Code** | Environment-driven configuration with feature flags |
| **Hexagonal Architecture** | Infrastructure adapters (DB, secrets, storage) are swappable |

## System Decomposition

| System | Purpose | Port |
|--------|---------|------|
| Console | Next.js admin dashboard | 3000 |
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

## Deep Dives

- **[Architecture Handbook](../../docs/Architecture_Handbook.md)** — Full architectural details, sequence diagrams, data flows
- **[Security Architecture](Security-Architecture.md)** — Defense-in-depth layers
- **[ADR Index](ADR-Index.md)** — All architectural decisions

---

**Previous**: [Configuration](../Getting-Started/Configuration.md)
**Next**: [Security Architecture](Security-Architecture.md)
**Parent**: [Home](../Home.md)
