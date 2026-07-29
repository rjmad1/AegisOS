# Platform Overview

> **Purpose**: High-level architecture of AegisOS — C4 model, design principles, subsystem decomposition, and source codebase layout.  
> **Audience**: Architects, developers, stakeholders  
> **Status**: ACTIVE · CANONICAL  
> **Owner**: Raja Jeevan Kumar Maduri  

---

**Navigation**: [Home](../Home.md) · **Architecture** > Platform Overview  
**Related**: [Security Architecture](Security-Architecture.md) · [Threat Model](Threat-Model.md) · [ADR Index](ADR-Index.md) · [Deployment](../Operations/Deployment.md)  

---

## Context (C4 Level 1 & Level 2)

AegisOS is a local-first, privacy-preserving AI Workstation platform. It routes AI inference through local models (Ollama) via a secure routing proxy (LiteLLM / ModelProxy), managed through a Next.js 16 administration console, distributed worker nodes, and an autonomic platform integration kernel.

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

---

## Key Architectural Principles

| Principle | Implementation |
|-----------|---------------|
| **Local-First** | All inference resolved on localhost; zero data leaks to third-party endpoints without explicit user intent. |
| **Privacy by Design** | No external telemetry; audit streams, metrics, and logs remain on host machine or mesh VPN. |
| **Zero Trust** | Every API request authenticated and authorized via JWT + RBAC/ABAC and PVP cryptographic verification. |
| **Autonomic MAPE-K** | Self-healing, self-optimizing feedback loops via `OAP Engine` and `AIRuntimeKernel`. |
| **Modular Subsystems** | 58 decoupled platform modules, 34 infrastructure services, and 5 standalone monorepo packages. |

---

## Source Code Layout & Subsystem Map

```
d:\1_Projects\OpenClawOllamaLiteLLM_Transparency\
├── src/
│   ├── platform/           # 58 Core Platform Subsystems
│   │   ├── pik/            # Platform Integration Kernel (9 analyzers)
│   │   ├── workforce/      # Digital Worker & Multi-Agent Framework
│   │   ├── collective-intelligence/ # Deliberation, Critique & Consensus Services
│   │   ├── qualification/  # PMI Maturity Engine & UCD Contracts
│   │   ├── benchmarking/   # ACB Capability Benchmarking Suite
│   │   ├── notifications/  # Multi-Channel Alert & SMS Provider
│   │   ├── realtime/       # WebSocket, SSE, Polling Transport Sync
│   │   ├── oap/ & pvp/ & pial/ # Autonomic, Verification & Abstraction Protocol Engines
│   │   ├── artifacts/      # File Delivery & Renderer Registry
│   │   ├── participants/   # Descriptors, Composition & Validation Engines
│   │   ├── federation/     # Mesh Control Protocol & Peer Registry
│   │   └── conversa/       # Conversa Living Graph Engine Integration
│   └── infrastructure/     # 34 Core Infrastructure Subsystems
│       ├── codegraph/      # AST & Symbol Graph Exploration
│       ├── compression/    # Headroom & Ponytail Token Compressors
│       ├── optimization/   # SkillOpt Service
│       ├── adapters/       # SAP Enterprise Adapter & Enterprise Connectors
│       └── factories/      # HTTP Client & Provider Factories
├── packages/               # 5 Decoupled Monorepo Packages
│   ├── browser-engine/     # Headless Browser Interaction Engine
│   ├── evidence-pipeline/  # Compliance & Audit Evidence Collector
│   ├── shared-contracts/   # Zod & TypeScript Shared Schemas
│   ├── state-manager/      # DOM Normalizer & Graph Store
│   └── validation-engine/  # High-Performance Data Validator
└── apps/                   # Standalone Distributed Executables
    ├── orchestrator/       # Task Scheduler & Resource Allocator
    └── worker-node/        # Edge Agent Execution Engine
```

---

## Subsystem Documentation Deep Dives

- **[Platform Integration Kernel (PIK)](../Subsystems/PIK-Platform-Integration-Kernel.md)** — Intelligence analyzers
- **[Workforce Subsystem](../Subsystems/Workforce-Subsystem.md)** — Digital worker & multi-agent execution
- **[Collective Intelligence (CIL)](../Subsystems/Collective-Intelligence.md)** — Deliberation, critique, consensus
- **[Qualification & Benchmarking](../Subsystems/Qualification-and-Benchmarking.md)** — PMI engine & ACB suite
- **[Notifications & Realtime](../Subsystems/Notifications-and-Realtime.md)** — Live telemetry & WebSocket sync
- **[OAP, PVP & PIAL Core Engines](../Subsystems/OAP-PVP-PIAL.md)** — Autonomic loop & verification
- **[Infrastructure Overview](../Infrastructure/Infrastructure-Overview.md)** — CodeGraph, compression, adapters
- **[Monorepo Packages](../Packages/Monorepo-Packages.md)** — Standalone package directory
- **[Orchestrator & Worker Applications](../Applications/Orchestrator-and-WorkerNode.md)** — Distributed execution binaries

---

**Previous**: [Configuration](../Getting-Started/Configuration.md)  
**Next**: [Security Architecture](Security-Architecture.md)  
**Parent**: [Home](../Home.md)  
