# AegisOS Dependency Map
**Architectural, Infrastructure, Feature & Cross-Team Dependency Diagrams**

This document maps out the system dependencies to guide scheduling and parallelization efforts, ensuring that critical-path items are identified and unblocked.

---

## 1. Feature Module Dependency Graph
This diagram captures how the 21 feature modules in the mobile app depend on one another. The core platform dependencies (`core/`, `domain/`, `platform/`) sit at the base, and features depend on abstract interfaces.

```mermaid
graph TD
    %% Features
    Auth["auth (Pairing & Biometrics)"]
    Dashboard["dashboard (Quick Glance)"]
    MissionControl["mission_control (Cockpit)"]
    Chat["chat (Assistant & Conversations)"]
    Approvals["approvals (HITL Queue)"]
    Models["models (Registry & VRAM)"]
    Knowledge["knowledge (Base & RAG)"]
    Monitoring["monitoring (Telemetry & Stats)"]
    Notifications["notifications (Push Relay)"]
    Settings["settings (App Config)"]
    Search["search (Command Palette)"]
    Workflows["workflows (Designer)"]
    
    %% Core Infrastructure Layer
    Enclave["platform/secure_enclave"]
    Drift["infrastructure/database (Drift)"]
    Sync["infrastructure/sync (Delta Engine)"]

    %% Dependencies
    Dashboard --> Auth
    Dashboard --> Approvals
    Dashboard --> Monitoring
    Dashboard --> Notifications
    
    MissionControl --> Monitoring
    MissionControl --> Settings
    
    Chat --> Auth
    Chat --> Sync
    Chat --> Models
    
    Approvals --> Auth
    Approvals --> Enclave
    Approvals --> Notifications
    Approvals --> Drift
    
    Models --> Sync
    
    Knowledge --> Sync
    Knowledge --> Search
    
    Workflows --> Approvals
    Workflows --> Models
    
    Sync --> Drift
    Sync --> Auth
    Drift --> Enclave
```

---

## 2. Technical Layer Dependency Graph
The Clean Architecture enforces strict unidirectional dependencies. Outer layers can depend on inner layers, but inner layers (Domain) have zero knowledge of outer layers.

```mermaid
graph BT
    subgraph PresentationLayer["Presentation Layer"]
        Widgets["Flutter Widgets (UI)"]
        Riverpod["Riverpod State Providers"]
    end

    subgraph ApplicationLayer["Application Layer"]
        UseCases["Use Cases"]
    end

    subgraph DomainLayer["Domain Layer"]
        Entities["Entities & Value Objects"]
        Contracts["Repository Interfaces"]
    end

    subgraph InfrastructureLayer["Infrastructure Layer"]
        DriftDB["Drift SQLCipher DB"]
        APIClient["Dio HTTP / WebSockets Client"]
    end

    subgraph PlatformLayer["Platform Layer"]
        EnclaveAPI["iOS Enclave / Android KeyStore"]
        BiometricAPI["Biometrics Native Bridge"]
    end

    %% Dependencies
    Widgets --> Riverpod
    Riverpod --> UseCases
    UseCases --> Entities
    UseCases --> Contracts
    
    %% Infrastructure Implements Contracts
    DriftDB -.->|Implements| Contracts
    APIClient -.->|Implements| Contracts
    
    %% Platform Bindings
    DriftDB --> EnclaveAPI
    APIClient --> EnclaveAPI
```

---

## 3. Infrastructure & Deployment Topology
This diagram highlights the networking paths and service dependencies between the mobile client and the local workstation host.

```mermaid
flowchart TD
    subgraph MobileDevice["Mobile Device"]
        App["AegisOS Mobile (Flutter)"]
        SQLCipher["SQLCipher DB (Encrypted)"]
        Enclave["Secure Enclave"]
        App --> SQLCipher
        App --> Enclave
    end

    subgraph EncryptedNetwork["Zero-Trust Mesh Network"]
        Tailscale["Tailscale VPN Tunnel"]
    end

    subgraph WorkstationHost["Workstation Host"]
        Caddy["Caddy Reverse Proxy (:443)"]
        Console["Next.js Console / Mobile API (:3000)"]
        Postgres[("PostgreSQL DB")]
        Redis[("Redis Cache")]
        AegisOS["AegisOS Gateway (:18789)"]
        LiteLLM["LiteLLM Routing Proxy (:4000)"]
        Ollama["Ollama LLM Engine (:11434)"]
        
        Caddy --> Console
        Console --> Postgres
        Console --> Redis
        Console --> AegisOS
        AegisOS --> LiteLLM
        LiteLLM --> Ollama
    end

    %% Network Connection
    App <-->|mTLS Handshake| Tailscale
    Tailscale <--> Caddy
```

---

## 4. Cross-Team Integration Handoffs
To enable parallel execution without blocking, the program defines three interface boundaries:
1. **API Contracts**: The Next.js API paths (`/api/v2/mobile/`) must be mocked in `develop` first. This allows the mobile team to code without waiting for backend logic completion.
2. **Push Payloads**: The JSON schema for E2EE push notifications must be finalized so that both backend notification workers and mobile receivers can be developed concurrently.
3. **Database Schema**: The Drift local model and the SQLite workstation schema must sync delta structures.
