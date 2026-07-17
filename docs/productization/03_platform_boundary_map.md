# Platform Boundary Map — AegisOS Networking & Data Flow Map

| Field | Value |
|---|---|
| **Document ID** | PBM-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Architecture Diagram |
| **Owner** | Principal Systems Architect |

---

## 1. System Boundary Map

The following map defines the separation of services, data repositories, and networking zones.

```mermaid
flowchart TB
    subgraph Client Ingress Zone [Port 3000 / 443]
        Clients[Web Console / Desktop / CLI]
    end

    subgraph Security Boundary [mTLS / OAuth 2.0]
        subgraph Aegis Core Boundary [Port 18789 / 18780]
            Kernel[Platform Kernel]
            Engine[Workflow Engine]
            Runtime[AI Runtime Gateway]
            Bus[Event Bus]
            DB[(Local SQLite / Prisma)]
        end

        subgraph Pluggable Extension Boundary [Port-less Spawn]
            MCP[MCP Host Engine]
            Plugins[Plugins / Skills / Agents]
        end

        subgraph Infrastructure Boundary [Port 11434 / 4000]
            LiteLLM[LiteLLM Proxy]
            Ollama[Ollama Server]
            GPU[RTX GPU Memory]
        end
    end

    subgraph Analytics Boundary [Async Outbound]
        EIP[Engineering Intelligence Platform]
    end

    %% Ingress Flow
    Clients -->|REST / WS| Runtime
    Clients -->|OIDC Auth| Kernel

    %% Core Flow
    Kernel <--> DB
    Engine -->|State Checkpoints| DB
    Runtime -->|Telemetry Log| Bus
    Runtime -->|Resolve Prompts| LiteLLM
    Engine -->|Spawn Task| MCP

    %% MCP/Extensions
    MCP <--> Plugins
    Kernel -->|Register| Plugins

    %% Telemetry Stream (Decoupled)
    Bus -->|Async UDP/HTTP JSON Telemetry| EIP

    %% Inference Flow
    LiteLLM --> Ollama
    Ollama --> GPU
```

---

## 2. Telemetry and Data Flow Decoupling

The Aegis Core Event Bus streams platform operations to EIP. The flow is strictly unidirectional, preventing back-pressure from impacting runtime execution:

```mermaid
sequenceDiagram
    participant Kernel as Aegis Core Kernel
    participant Bus as Core Event Bus
    participant Queue as Memory Buffer
    participant EIP as Engineering Intelligence Platform

    Kernel->>Bus: Emit event (execution_started)
    Bus->>Queue: Push to ring buffer (non-blocking)
    Note over Queue: If buffer full,<br/>drop oldest metrics (shed load)
    Queue-->>EIP: Asynchronous POST /api/v1/telemetry
    Note over EIP: Correlation & Graph Analysis<br/>(No direct link back)
```

---

## 3. Network Zoning & Port Allocation

To guarantee zero data exfiltration, the deployment is segmented into strict network perimeters:

| Zone | Bound Services | Access Policy | Default Port | Encryption |
|---|---|---|---|---|
| **Loopback Zone** | Ollama, LiteLLM | Restricted to `127.0.0.1` | `11434`, `4000` | Unencrypted Local |
| **Platform Zone** | Aegis Core Runtime, Event Bus | mTLS; restricted to cluster private network | `18789`, `18780` | TLS v1.3 with Client Certs |
| **Ingress Zone** | Web Console, REST APIs | OAuth 2.0 OIDC + JWT token validation | `3000`, `443` | HTTPS / WSS |
| **Extension Zone**| MCP Server Hosts | Isolated local OS process (stdin/stdout pipes) | N/A | Process IPC |
| **Analytics Zone**| EIP Ingestion APIs | Outbound streaming endpoint; no inbound routing | `9090` | HTTPS (JSON payload) |

---

## 4. Database Isolation

* **Core Database**: SQLite (single-node) or PostgreSQL (multi-node) holds active system registries (configurations, users, workflows, tasks, logs).
* **MCP Stores**: Private index stores managed locally by individual knowledge provider extensions.
* **EIP Graph Store**: Relational historical database combined with vector databases to run long-term prediction math and build engineering logs. Core never queries the EIP databases.
