# Product Architecture Specification — AegisOS Component Boundaries

| Field | Value |
|---|---|
| **Document ID** | PAS-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Technical Specification |
| **Owner** | Principal Enterprise Architect |

---

## 1. Architectural Boundaries

AegisOS is segmented into five major logical components to support modularity, independent evolution, and loose coupling.

```mermaid
graph TD
    subgraph Client Application Layer
        Desktop[Desktop Console]
        Mobile[Mobile Companion]
        Web[Web Console]
    end

    subgraph Integration Layer
        SDKs[Platform SDKs: TS/JS/Py/CLI]
    end

    subgraph Core Platform Layer
        Core[Aegis Core Runtime]
        MCP[MCP Pluggable Layer]
    end

    subgraph Telemetry Outbound
        EIP[Engineering Intelligence Platform]
    end

    Client Application Layer -->|Stable REST/WS APIs| Core
    SDKs -->|API Access| Core
    Core <-->|Dynamic Plugins| MCP
    Core -->|Unidirectional Telemetry| EIP
```

---

## 2. Aegis Core

Aegis Core is the heart of the platform. It manages the runtime environment, executes user agents and workflow definitions, and coordinates system services.

### 2.1 Core Responsibilities
* **AI Runtime**: Manages connection strings, models availability, token budgets, and routing rules across Ollama and LiteLLM instances.
* **Workflow Engine**: Orchestrates execution state machines, schedules cron routines, and records step-level recovery checkpoints (Sagas).
* **Execution Kernel**: The central bootstrapping plane (`PlatformKernel.ts`) managing service lifetime, container orchestration state, and memory allocations.
* **Executive Control Plane**: Controls security policies, access tokens, and baseline port/service diagnostic checks.
* **Event Bus**: Broker for asynchronous message sharing across platform services and cluster nodes via secure signature checks.
* **Security & Observability**: Enforces mTLS, encryption-at-rest (DPAPI/AES-GCM), structured JSON logging, and OpenTelemetry exports.

---

## 3. Engineering Intelligence Platform (EIP)

The EIP provides strategic analysis, pattern correlation, and decision-support capabilities for teams operating AegisOS.

### 3.1 Responsibilities
* **Engineering Intelligence**: Evaluates platform compliance logs to compute team productivity and automation efficiencies.
* **Correlation Engine**: Matches system failures with active Git releases, configuration modifications, and runtime metrics.
* **Prediction Engine**: Forecasts VRAM usage, storage consumption, and potential hardware faults based on telemetry.
* **Recommendation Engine**: Proposes optimization actions (e.g., quantizing models to GGUF, adjusting autovacuum rates).
* **Knowledge Graph**: Aggregates relationship maps of historical learning, active workflows, and agent execution paths.
* **Executive Engineering Dashboard**: Aggregates high-level metrics (scorecard indicators, ROI reports) for leadership.

### 3.2 Coupling Constraints
> [!IMPORTANT]
> The EIP is purely an observer. It consumes event feeds and telemetry via unidirectional streams. Under no circumstances shall Aegis Core import or depend on packages, models, or APIs exposed by the EIP. If the EIP goes offline, Aegis Core must continue operating with zero degradation in runtime execution or security capabilities.

---

## 4. Companion Applications

Every companion client communicates with Aegis Core via stable, versioned interfaces (REST and WebSocket over TLS). Clients contain no direct database queries or raw socket connections.

* **Desktop Console**: Local administrative utility providing physical node status, hardware metrics, and service registry controls.
* **Mobile Companion**: Read-only tracking console providing alerts, workflow completion statuses, and approval prompts.
* **Web Console**: The main dashboard for editing prompts, defining workflows, managing extensions, and examining event streams.
* **Operations Dashboard**: Dedicated screen for infra operators mapping active ports, database sizing, and self-healing events.
* **Developer Console**: Developer tools containing logs inspectors, OpenAPI spec explorers, and model routing debuggers.
* **Executive Dashboard**: Unified visual view highlighting overall economic savings, compliance ratings, and average MTTR.

---

## 5. Platform SDKs

The SDK acts as the primary integration tool for developers building on AegisOS, ensuring code runs independently of backend runtime modifications.

* **JavaScript / TypeScript SDK**: Standard client interface for Next.js, Node.js, and web browsers.
* **Python SDK**: Native library for AI researchers, data scientists, and PyTorch/HuggingFace script integration.
* **REST & WebSockets API**: Language-agnostic endpoint standard specifying request/response payloads, authentication, and headers.
* **CLI Utility**: Command-line tool for bootstrapping settings, importing models, and executing workflows from terminal scripts.

---

## 6. MCP Ecosystem

The Model Context Protocol (MCP) is implemented as a pluggable capability layer.
* **Decoupled Architecture**: MCP hosts run in isolated sub-processes.
* **Protocol-First**: Communication is strictly via standard JSON-RPC over stdin/stdout or SSE (Server-Sent Events).
* **Custom Adapters**: New capabilities (e.g., custom database systems or private APIs) are exposed by deploying separate MCP servers, leaving the Aegis Core codebase completely untouched.
