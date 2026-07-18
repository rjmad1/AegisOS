# AegisOS Documentation Portal

> **AegisOS** — An enterprise-ready, local-first, privacy-preserving AI Workstation platform integrating Ollama inference, LiteLLM routing proxy, multi-agent frameworks, and a Next.js Console.

---

## Platform Architecture

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
| 🔧 **[Deployment Guide](Operations/Deployment.md)** | Docker, Kubernetes, Helm |
| 📖 **[Developer Guide](Developer-Guide/Developer-Setup.md)** | Extend, build, contribute |
| 🛡️ **[Security](Security/Security-Policy.md)** | Vulnerability reporting, security architecture |
| 📋 **[Changelog](Release/Changelog.md)** | Latest release notes |
| 🗺️ **[Product Roadmap](Roadmap/Product-Roadmap.md)** | What's next for AegisOS |

---

## Documentation Sections

### Getting Started
New to AegisOS? Start here.
- [Installation](Getting-Started/Installation.md) — Full prerequisites and setup
- [Quick Start](Getting-Started/Quick-Start.md) — 5-minute guide
- [Configuration](Getting-Started/Configuration.md) — Post-install tuning

### Architecture
How AegisOS is designed.
- [Platform Overview](Architecture/Platform-Overview.md) — C4 model and principles
- [Security Architecture](Architecture/Security-Architecture.md) — Defense in depth
- [Threat Model](Architecture/Threat-Model.md) — STRIDE analysis
- [ADR Index](Architecture/ADR-Index.md) — All architectural decision records

### Subsystems
Deep dives into core subsystems.
- [AI Runtime](Subsystems/AI-Runtime.md) — Capability orchestration
- [Execution Contract](Subsystems/Universal-Execution-Contract.md) — Universal execution model
- [Runtime Semantics](Subsystems/Runtime-Semantics.md) — Behavioral specification
- [Command & Control](Subsystems/Command-and-Control.md) — Secure C2 pathway

### Operations
Run, monitor, and maintain AegisOS.
- [Deployment](Operations/Deployment.md) — All deployment methods
- [Operations Guide](Operations/Operations-Guide.md) — Day-to-day operations
- [Monitoring & Observability](Operations/Monitoring-and-Observability.md) — Metrics, logs, traces
- [Troubleshooting](Operations/Troubleshooting.md) — Diagnostics runbook
- [Disaster Recovery](Operations/Disaster-Recovery.md) — Backup and restore
- [Secrets Management](Operations/Secrets-Management.md) — Credential handling
- [Ports Management](Operations/Ports-Management.md) — Port allocation

### Administration
Manage users, tenants, and platform configuration.
- [Administrator Guide](Administration/Administrator-Guide.md)
- [User Guide](Administration/User-Guide.md)
- [Platform Handbook](Administration/Platform-Handbook.md)

### Developer Guide
Build, extend, and contribute.
- [Developer Setup](Developer-Guide/Developer-Setup.md) — Local development environment
- [API Guidelines](Developer-Guide/API-Guidelines.md) — API design standards
- [Coding Standards](Developer-Guide/Coding-Standards.md) — Code quality rules
- [Contributing](Developer-Guide/Contributing.md) — How to contribute
- [Engineering Playbook](Developer-Guide/Engineering-Playbook.md) — Engineering manual
- [Extension Development](Developer-Guide/Extension-Development.md) — Build plugins

### Mobile Companion
The AegisOS Mobile Command Center (Working Draft).
- [Mobile Overview](Mobile/Overview.md) — Mission, vision, capabilities
- [Mobile Architecture](Mobile/Architecture.md) — Architecture documentation
- [Mobile API Reference](Mobile/API-Reference.md) — REST and WebSocket APIs

### Security
Security policies, architecture, and threat modeling.
- [Security Policy](Security/Security-Policy.md) — Vulnerability reporting
- [Security Architecture](Architecture/Security-Architecture.md) — Defense in depth
- [Threat Model](Architecture/Threat-Model.md) — STRIDE framework

### Configuration Reference
Environment, Docker, Kubernetes, and Helm configuration.
- [Environment Variables](Configuration/Environment-Variables.md) — All `.env` variables
- [Docker Compose](Configuration/Docker-Compose.md) — Container orchestration
- [Kubernetes](Configuration/Kubernetes.md) — K8s manifests
- [Helm Chart](Configuration/Helm-Chart.md) — Helm deployment

### Reference
Glossary, FAQ, dependencies, and specifications.
- [Glossary](Reference/Glossary.md) — Key terms and definitions
- [FAQ](Reference/FAQ.md) — Frequently asked questions
- [Dependency Map](Reference/Dependency-Map.md) — Component dependencies
- [Support Matrix](Reference/Support-Matrix.md) — Supported platforms

### Roadmap
Where AegisOS is heading.
- [Product Roadmap](Roadmap/Product-Roadmap.md) — Version milestones
- [GA Roadmap](Roadmap/GA-Roadmap.md) — Path to General Availability
- [Three-Year Vision](Roadmap/Three-Year-Vision.md) — Long-term strategy

### Release
Release history and upgrade guidance.
- [Changelog](Release/Changelog.md) — All releases
- [Release Notes](Release/Release-Notes.md) — Current release
- [Upgrade Notes](Release/Upgrade-Notes.md) — Migration between versions

### Governance
Engineering standards, compliance, and quality.
- [Engineering Constitution](Governance/Engineering-Constitution.md)
- [Platform Governance](Governance/Platform-Governance.md)
- [Technical Debt Register](Governance/Technical-Debt-Register.md)
- [Risk Register](Governance/Risk-Register.md)

### Enterprise
Enterprise assessment suites and program reports.
- [Enterprise Readiness](Enterprise/Enterprise-Readiness.md) — Maturity assessment index
- [Productization](Enterprise/Productization.md) — Platform productization index
- [Certification](Enterprise/Certification.md) — Release certification reports
- [Validation](Enterprise/Validation.md) — Phase 13 and pilot validation

### Programs
Implementation programs and execution plans.
- [Evolution Master Program](Programs/Evolution-Master-Program.md)
- [Master Implementation Plan](Programs/Master-Implementation-Plan.md)
- [Implementation Backlog](Programs/Implementation-Backlog.md)
- [Sprint Breakdown](Programs/Sprint-Breakdown.md)
- [GA Checklist](Programs/GA-Checklist.md)
- [Release Plan](Programs/Release-Plan.md)

### Archive
Superseded, experimental, and historical documents.
- [Legacy Archive](Archive/Legacy.md) — Superseded documents
- [Experimental Archive](Archive/Experimental.md) — Active working drafts
- [Historical Archive](Archive/Historical.md) — Past validation/certification reports

---

## Documentation Status

| Metric | Value |
|---|---|
| Total Documents | 230+ |
| Canonical Documents | ~60 wiki pages |
| Architecture Decision Records | 14 (ADR-001 through ADR-013 + ADR-MOB-006) |
| Last Updated | 2026-07-18 |
| Documentation Health Report | [View Report](Documentation-Health-Report.md) |

---

**Document Owner**: Raja Jeevan Kumar Maduri
**Status**: ACTIVE · CANONICAL
**Audience**: All stakeholders — developers, administrators, operators, executives

[Back to Repository](https://github.com/rjmad1/AegisOS)
