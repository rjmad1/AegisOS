# AegisOS: Autonomic AI Workstation Platform

AegisOS is an enterprise-grade, local-first, privacy-preserving Autonomic AI Operating System. It integrates local inference engines, a zero-trust API gateway, a multi-agent orchestration runtime, a real-time system Digital Twin, and an Engineering Intelligence Platform (EIP) verified through the Autonomic Platform Qualification Framework (PQF).

---

## 📖 Canonical Guides & Onboarding

To bootstrap, install, and run AegisOS, please refer to the primary getting started guide:

### 🚀 **[AegisOS Installation & Getting Started Guide](wiki/Install-Guide.md)**

*This single guide contains comprehensive step-by-step instructions on hardware requirements, software prerequisites (Git, Node.js, Python, CUDA, Docker, Ollama, LiteLLM), repository bootstrap, service startup sequences, and troubleshooting.*

---

## 🏗️ 7-Layer Autonomic Architecture

AegisOS is organized into a strict hierarchical 7-layered stack (defined in [ADR-009](adr/ADR-009-Autonomic-Operating-System-Architecture.md)) to guarantee decoupling, security enforcement, and self-healing:

*   **Layer 6: Executive Plane**: Manages client ingress (Next.js Console administration dashboard, Open-WebUI chat portal, IDE companion tools) and aligns user goals.
*   **Layer 5: Control Plane**: Enforces policy registries, security rules, and real-time prompt/response guardrails via the **Executive Control Plane (ECP)** and syncs state via the **Convergence Engine**.
*   **Layer 4: Orchestration Plane**: Manages execution state machines, workflows, job queues, scheduler tasks, and multi-agent coordination loops.
*   **Layer 3: Capability Plane**: Governs model registries, Model Context Protocol (MCP) tool execution, and Raja semantic Knowledge bases.
*   **Layer 2: Runtime Layer**: Hosts containerized and native process runtimes (OpenClaw, LiteLLM, Ollama daemons, Redis caching).
*   **Layer 1: Infrastructure Layer**: Directs physical workstation directories, system daemon processes, backups/restore routines, and Tailscale mesh VPN connections.
*   **Layer 0: Hardware Layer**: Coordinates host hardware, NVIDIA GPUs, VRAM allocations, and CUDA acceleration kernels.

---

## 📁 Repository Information Architecture

The codebase is structured around clean architectural domains:

*   **[wiki/](wiki/)**: Authoritative operational documentation and getting started guides.
*   **[adr/](adr/)**: Architectural Decision Records (ADR-001 through ADR-014) capturing contract boundaries, decoupled auth, the ECP, and immutable execution contexts.
*   **[docs/](docs/)**: Domain-specific handbooks, checklists, and compliance reports.
    *   **[Master Documentation Index](docs/README.md)**
    *   **[Architecture Handbook](docs/Architecture_Handbook.md)**
    *   **[Platform Handbook](docs/Platform_Handbook.md)**
*   **[automation/](automation/)**: PowerShell automation suite (installation, configuration, backups, restore, and package generation).
    *   Includes a shared helper library `libs/PlatformHelper.psm1`.
*   **[src/](src/)**: Next.js Console administration dashboard and background services.

---

## 💻 Running the Console Dashboard Locally

Once your environment is bootstrapped using `Bootstrap.ps1`, run the Next.js Console administration dashboard:

```bash
# Restore project dependencies
npm install

# Start the local development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To compile a production-ready optimized build:
```bash
npm run build
```
