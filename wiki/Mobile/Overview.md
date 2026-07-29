# Mobile Companion App — Overview

> **Purpose**: AegisOS Mobile Command Center for remote executive monitoring, real-time telemetry, and HITL approval gates.  
> **Status**: ACTIVE · CANONICAL  
> **Location**: `aegis_mobile/`  
> **Framework**: Flutter (Dart)  

---

**Navigation**: [Home](../Home.md) · **Mobile** > Overview  
**Related**: [Command & Control](../Subsystems/Command-and-Control.md) · [Mobile Architecture](Architecture.md) · [Mobile API](API-Reference.md)  

---

## 1. Overview

The **AegisOS Mobile Companion App** (`aegis_mobile/`) is a cross-platform Flutter application enabling remote operators, system administrators, and security officers to inspect workstation health, receive SMS/push notification alerts, and approve cryptographic Human-In-The-Loop (HITL) authorization gates from mobile devices.

---

## 2. Codebase Structure (`aegis_mobile/lib`)

```
aegis_mobile/
├── pubspec.yaml            # Flutter package dependencies & assets
├── analysis_options.yaml   # Dart linter & static analysis rules
└── lib/
    ├── main.dart           # Application entry point
    ├── bootstrap.dart      # Service initialization & mTLS setup
    ├── config/             # Environment configs & API endpoint bindings
    ├── infrastructure/     # WebSocket / REST client transport adapters
    └── features/           # Feature modules (Telemetry, HITL Approvals, Logs)
```

---

## 3. Core Capabilities

* **Real-time Telemetry Dashboard**: Displays CPU, GPU VRAM, active model inference, and container status via WebSocket streaming.
* **HITL Cryptographic Gates**: Provides push notifications when system actions require operator approval. Signing keys securely authorize or reject commands.
* **Tailscale Mesh VPN Binding**: Operates securely over the private Tailscale mesh network without exposing public internet endpoints.

---

## 4. Documentation Suite

| Document | Description |
|---|---|
| [Mission & Vision](../../docs/mobile/Mission.md) | Project mission statement |
| [PRD](../../docs/mobile/PRD.md) | Product requirements document |
| [Capabilities](../../docs/mobile/Capabilities.md) | Feature capabilities overview |
| [Roadmap](../../docs/mobile/Roadmap.md) | Mobile development roadmap |
| [Security](../../docs/mobile/Security.md) | Mobile security & mTLS architecture |
| [Synchronization](../../docs/mobile/Synchronization.md) | Offline-first sync engine |

---

**Next**: [Mobile Architecture](Architecture.md) · **Parent**: [Home](../Home.md)  
