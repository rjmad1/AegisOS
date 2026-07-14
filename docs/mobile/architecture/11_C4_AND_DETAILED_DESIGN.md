# §11 — C4 Model & Detailed Architectural Reference

> **Document**: AegisOS Mobile — C4 Model & Detailed Architectural Reference
> **Status**: DRAFT
> **Version**: 1.0.0
> **Last Updated**: 2026-07-13

---

## 11.1 C4 Architecture Model

### Level 1: System Context Diagram

The System Context diagram illustrates the system boundaries, users, and external integrations.

```mermaid
graph TB
    Operator["Operator (Mobile Client)<br/>[User]"]
    Admin["Admin (Web Console)<br/>[User]"]
    Developer["Developer (IDE/CLI)<br/>[User]"]
    
    subgraph AegisOSSystem["AegisOS Platform"]
        Gateway["AegisOS API Gateway / Console<br/>[System Boundary]"]
        AIGateway["AegisOS AI Gateway<br/>[System Boundary]"]
        Workstation["Workstation Services<br/>(Postgres, Redis, MCP Hosts)"]
        Inference["Ollama / GPU Inference Engine<br/>[System Boundary]"]
        
        Gateway <-->|"gRPC / Internal API"| AIGateway
        Gateway <--> Workstation
        AIGateway <--> Inference
    end
    
    IdP["Enterprise IdP<br/>(OIDC / SAML)<br/>[External System]"]
    APNS_FCM["FCM / APNs Relay<br/>(Encrypted Push)<br/>[External System]"]
    
    Operator <-->|"mTLS + WSS + SSE<br/>(Tailscale VPN / LAN)"| Gateway
    Operator <-->|"Biometrics / Secure Enclave"| APNS_FCM
    Admin <-->|"HTTPS"| Gateway
    Developer <-->|"HTTPS / SSH"| Gateway
    Gateway <-->|"OAuth2 / OIDC"| IdP
    Gateway -->|"E2EE Push Payload"| APNS_FCM
    APNS_FCM -->|"E2EE Push"| Operator
```

---

### Level 2: Container Diagram

The Container diagram decomposes the platform and highlights the specific technical boundaries of the mobile client, backend gateway, and inference components.

```mermaid
graph TB
    subgraph MobileDevice["Mobile Device Container (Client)"]
        FlutterUI["Flutter Presentation UI<br/>(Material 3 / Adaptive)"]
        RiverpodState["Riverpod State Manager<br/>(Unidirectional State)"]
        DriftDB["Drift / SQLCipher Database<br/>(AES-256-GCM Encrypted Cache)"]
        SecureStorage["Secure Enclave / Android KeyStore<br/>(ECDSA Keys & Certificates)"]
        SyncClient["Delta Sync Engine<br/>(Timestamp Anchor, Retries)"]
        
        FlutterUI --> RiverpodState
        RiverpodState --> DriftDB
        RiverpodState --> SyncClient
        SyncClient --> SecureStorage
    end

    subgraph NetworkZone["Network Boundary"]
        ReverseProxy["Nginx / Caddy<br/>(mTLS & TLS Termination)"]
    end

    subgraph GatewayContainer["Next.js Console & API Gateway"]
        NextApp["Next.js Web / API Service<br/>(v1 / v2 endpoints)"]
        SessionMgmt["Session & Key Registry<br/>(Device/Token Validations)"]
        SyncService["Delta Sync Orchestrator<br/>(Delta Calculation, conflict logs)"]
        TelemetryWS["WebSocket Hub / SSE Streamer<br/>(Telemetry & Live Logs)"]
        PushService["Push Notification Worker<br/>(E2EE APNs / FCM payloads)"]
    end

    subgraph StorageContainer["Infrastructure Datastores"]
        Postgres["PostgreSQL DB<br/>(Workspaces, Approvals, Users)"]
        Redis["Redis Cache<br/>(Job Queues, Live Stats)"]
    end

    subgraph InferenceContainer["AI Gateway & LLM Services"]
        AegisOS["AegisOS Gateway<br/>(MCP, Prompts, Safeties)"]
        LiteLLM["LiteLLM Proxy<br/>(Balancing, Fallbacks)"]
        Ollama["Ollama Engine<br/>(GGUF local inference)"]
    end

    FlutterUI <-->|"mTLS + TLS Handshake"| ReverseProxy
    SyncClient <-->|"HTTP REST / Delta Sync"| ReverseProxy
    RiverpodState <-->|"WSS (Telemetry) / SSE (Tokens)"| ReverseProxy

    ReverseProxy <-->|"HTTP / FastCGI"| NextApp
    NextApp --> SessionMgmt
    NextApp --> SyncService
    NextApp --> TelemetryWS
    NextApp --> PushService
    
    NextApp <--> Postgres
    NextApp <--> Redis
    NextApp <--> AegisOS
    
    AegisOS <--> LiteLLM
    LiteLLM <--> Ollama
```

---

### Level 3: Component Diagram (Mobile Client)

This diagram details the internal layers of the Flutter Application, illustrating the dependency flows.

```mermaid
graph TD
    subgraph PresentationLayer["Presentation Layer"]
        Widgets["Adaptive Screen Widgets<br/>(Dashboard, Chat, Approvals)"]
        Controllers["Notifier Controllers<br/>(Riverpod Providers)"]
        ThemeTokens["Material 3 Design System<br/>(Slate-Indigo tokens)"]
        
        Widgets --> Controllers
        Widgets --> ThemeTokens
    end

    subgraph ApplicationLayer["Application Layer"]
        UseCases["Feature Use Cases<br/>(Authenticate, Pull Sync, Approve Action)"]
        Controllers --> UseCases
    end

    subgraph DomainLayer["Domain Layer"]
        Entities["Domain Entities<br/>(User, Agent, Approval, Message)"]
        ValueObjects["Value Objects<br/>(Fingerprint, ActionTimestamp)"]
        RepoContracts["Repository Contracts<br/>(Abstract definitions)"]
        
        UseCases --> Entities
        UseCases --> RepoContracts
        Entities --> ValueObjects
    end

    subgraph InfrastructureLayer["Infrastructure Layer (Data)"]
        RESTClient["HTTP/REST Client<br/>(Dio + mTLS config)"]
        WSClient["WebSocket Client<br/>(Telemetry / Log listener)"]
        DriftConcrete["Drift Database Implementation<br/>(Concrete SQLCipher mappings)"]
        SecureStorageImpl["Secure Enclave Wrapper<br/>(Platform channels)"]
        
        RepoContracts --> RESTClient
        RepoContracts --> DriftConcrete
        RepoContracts --> SecureStorageImpl
    end
```

---

### Level 4: Code & Package Guidelines

To enforce Clean Architecture constraints, the project applies the following structural import guidelines:

1.  **Strict Dependency Hierarchy**:
    *   `presentation` may import `application`, `domain`, and `core`.
    *   `application` may import `domain` and `core`.
    *   `infrastructure` may import `domain` and `core` (implements Domain contracts).
    *   `domain` may **ONLY** import `core` and other domain elements. It must have **zero** dependencies on UI, Riverpod, Drift, or network clients.
2.  **No Circular Feature Imports**: Features located in `lib/features/` must communicate either via shared entities in the `domain` root layer or through event bus subscriptions. Direct imports from another feature's `presentation` or `infrastructure` layers are strictly forbidden.
3.  **Encapsulation via Barrel Files**: Each layer or sub-module must export its public API using a single entry point (e.g., `features/auth/auth.dart`). Only barrel exports may be imported externally.

---

## 11.2 Deployment Topology

The mobile companion communicates over two distinct network topologies depending on host proximity:

```mermaid
graph TD
    subgraph LocalLAN["Zone 5: Local Network Proximity"]
        MobileLAN["Mobile Device"]
        HostLAN["AegisOS Workstation"]
        MobileLAN <-->|"mTLS over Local Wi-Fi<br/>(mDNS discovery)"| HostLAN
    end

    subgraph RemoteNetwork["Zone 0 & 1: Remote VPN Network"]
        MobileRemote["Mobile Device"]
        Tailscale["Tailscale Mesh VPN<br/>(Wireguard encrypted tunnel)"]
        HostRemote["AegisOS Workstation"]
        
        MobileRemote <-->|"mTLS over Tailscale NIC"| Tailscale
        Tailscale <--> HostRemote
    end
    
    subgraph CloudPush["APNs & FCM Infrastructure"]
        APNS["Apple Push Notification Service"]
        FCM["Firebase Cloud Messaging"]
        PushRelay["Workstation E2EE Push Relay"]
        
        PushRelay -->|"E2EE Payload"| APNS
        PushRelay -->|"E2EE Payload"| FCM
        APNS -->|"Push Alert"| MobileRemote
        FCM -->|"Push Alert"| MobileRemote
    end
```

---

## 11.3 Sequence Diagrams

### Zero-Trust QR Pairing Flow

This sequence diagrams the initialization of trust between the mobile companion and the local workstation.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Mobile as Mobile App (Secure Enclave)
    participant Camera as Device Camera
    participant Gateway as Backend Gateway
    participant DB as PostgreSQL DB
    
    User->>Mobile: Launch App & Tap "Pair Host"
    Mobile->>Camera: Activate Camera
    User->>Camera: Scan QR from Web Console
    Camera-->>Mobile: Decoded URI (wss://host:port/api/v2/auth/pair?token=PAIR_TKN)
    
    Note over Mobile: Generate ECDSA Keypair in Secure Enclave
    Mobile->>Mobile: Generate Client Keys (device_sec_key / device_pub_key)
    
    Mobile->>Gateway: POST /api/v2/mobile/auth/pair (device_pub_key, pairing_token, device_id, device_name)
    Gateway->>DB: Validate pairing_token & verify rate limits
    DB-->>Gateway: Pairing token valid, mapping to User
    
    Note over Gateway: Generate client certificate signed by Host Authority
    Gateway->>Gateway: Create Client Cert (CN = device_id, validity = 365d)
    Gateway->>DB: Save Device details (pub_key, serial, status = Paired)
    
    Gateway-->>Mobile: Response (Client Certificate + Host CA cert)
    Mobile->>Mobile: Store Client Certificate securely in Android KeyStore/iOS Keychain
    Mobile-->>User: Pairing Successful. Tap Biometrics to Unlock.
```

---

### Biometric Session Recovery & mTLS Authentication

Every session establishment uses cryptographic validation to obtain a stateless JWT, ensuring hardware-backed trust.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Mobile as Mobile App
    participant Enclave as Secure Enclave
    participant Gateway as Backend Gateway
    participant Redis as Redis Session Cache
    
    User->>Mobile: Open App
    Mobile->>Enclave: Request Key for session signing
    Enclave->>User: Prompt Biometric Unlock (FaceID / Fingerprint)
    User->>Enclave: Biometric Match
    Enclave-->>Mobile: Unlock & release JWT private signing key
    
    Note over Mobile: Initiate mTLS handshake using Client Certificate
    Mobile->>Gateway: TLS Handshake ClientHello (Include Client Cert)
    Note over Gateway: Extract CN (device_id) from Certificate
    Gateway-->>Mobile: TLS Handshake complete (mTLS established)
    
    Mobile->>Gateway: POST /api/v2/mobile/auth/session (device_id + signed challenge)
    Note over Gateway: Verify challenge signature using registered device public key
    Gateway->>Redis: Generate Session Context
    Gateway-->>Mobile: Return Session Token (JWT, 1h expiry) + Refresh Token (7d)
    Mobile->>Mobile: Cache JWT in memory, refresh token in Secure Storage
```

---

### Offline Delta Sync Pull & Push Queue

```mermaid
sequenceDiagram
    autonumber
    participant Engine as Sync Engine
    participant SQLite as Local SQLCipher DB
    participant Gateway as Backend Gateway
    
    Engine->>SQLite: Retrieve last_sync_anchor (timestamp)
    SQLite-->>Engine: timestamp = 1718290382
    
    Engine->>Gateway: GET /api/v2/mobile/sync (anchor = 1718290382)
    Note over Gateway: Retrieve updates in User database scope after anchor
    Gateway-->>Engine: Returns Delta Payload (new conversations, updated approvals, new tasks)
    
    Note over Engine: Check for local conflicts
    Engine->>SQLite: Apply delta changes using Transaction Batch
    SQLite-->>Engine: Commit successful, write new anchor timestamp
    
    Note over Engine: Process offline pending actions queue
    Engine->>SQLite: Retrieve pending_actions (status = Queued)
    SQLite-->>Engine: Returns actions (e.g. approve approval_id=X, signed_signature=Y)
    
    loop For each action
        Engine->>Gateway: POST /api/v2/mobile/sync/push (action_payload)
        Gateway-->>Engine: Action applied (success)
        Engine->>SQLite: Update action status in DB (status = Synced)
    end
```

---

## 11.4 Trust Boundaries & Data Flow Diagrams

The following diagram traces the trust boundaries (demarcated by dashed lines) and the data validation requirements across the systems.

```mermaid
graph TD
    subgraph DeviceTrust["Secure Device Boundary"]
        Drift["Drift Local DB<br/>(SQLCipher Encryption)"]
        Enclave["Hardware KeyStore<br/>(Signatures)"]
        ClientApp["Mobile Client App<br/>(Riverpod, dio client)"]
        
        ClientApp <-->|"Read/Write (AES-256)"| Drift
        ClientApp -->|"Sign challenge"| Enclave
    end
    
    subgraph TransitZone["mTLS / TLS Boundary"]
        Tunnel["Tailscale Mesh / HTTPS Transport"]
    end
    
    subgraph GatewayTrust["Gateway Trust Boundary"]
        Proxy["Caddy TLS Reverse Proxy"]
        Handlers["Next.js Route Handlers"]
        DB[(PostgreSQL)]
        
        Proxy <--> Handlers
        Handlers <--> DB
    end

    subgraph InferenceTrust["Inference Zone (Isolated)"]
        AegisOS["AegisOS Gateway"]
        Ollama["Ollama Daemon"]
        
        AegisOS <--> Ollama
    end
    
    ClientApp <-->|"1. Encrypted payload"| Tunnel
    Tunnel <-->|"2. mTLS validated stream"| Proxy
    Handlers <-->|"3. Enriched Context"| AegisOS
    
    style DeviceTrust stroke-dasharray: 5 5,stroke:#4CAF50,fill:#F4FBF4
    style GatewayTrust stroke-dasharray: 5 5,stroke:#2196F3,fill:#F4FAFF
    style InferenceTrust stroke-dasharray: 5 5,stroke:#F44336,fill:#FFFAF9
```

---

## 11.5 Threat Model (STRIDE)

We evaluate security vectors using the STRIDE threat model targeting the Mobile and Gateway surfaces:

| Threat Category | Target | Vector | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Spoofing Identity** | Gateway API | Attacker attempts to call `/api/v2/mobile/sync` masquerading as a paired device. | **mTLS Client Validation**: Caddy terminates client certificates and extracts CN. The API gateway verifies that the CN maps to a registered active device and that the token matches. |
| **Tampering with Data** | Local Database | Attacker gains access to local mobile filesystem and extracts offline chat caches. | **SQLCipher Encryption**: The SQLite database is encrypted with AES-256-GCM. The key is derived on launch using a salt and secret stored in the Secure Enclave, released only via biometric confirmation. |
| **Repudiation** | HITL Approvals | User claims they did not approve a command that caused data loss or compromise. | **Cryptographic Signatures**: The approval action payload is signed on-device using the device's private key stored in the Secure Enclave. The gateway validates the signature before executing. |
| **Information Disclosure** | Push Notifications | Push notification payload contains sensitive conversational AI context leaked via FCM/APNs. | **End-to-End Encryption**: Push notification payload data is encrypted with the client's public key on the host. The notification text only reads "New Agent Action Required", content is decrypted locally on the device. |
| **Denial of Service** | Telemetry Stream | Attacker floods the gateway with high-frequency REST or WebSocket messages. | **Token-Bucket Rate Limiting**: Limit of 300 authenticated requests per minute per device, and strict limits on concurrent WebSocket connections (max 5 per device). |
| **Elevation of Privilege** | Route Handlers | An operator device attempts to execute Administrator commands. | **Role-Based Access Control (RBAC)**: All route handlers map the session token to the user role and assert permissions in the database before proceeding. |
