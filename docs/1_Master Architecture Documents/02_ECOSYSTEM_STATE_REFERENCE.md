# AegisOS & Conversa Ecosystem State Reference

This document provides a high-level overview of the interconnected state of the AegisOS and Conversa ecosystem.

---

## 1. Ecosystem Overview

The ecosystem is designed to deliver a secure, local-first, autonomic workspace utilizing three integrated platforms:

```mermaid
graph LR
    subgraph Workstation Node
        AegisOS[AegisOS Autonomic Daemon] <--> Conversa[Conversa Cognitive Workspace]
    end
    subgraph Mobile Interface
        Mobile[Aegis Mobile Companion] <-->|mTLS / ECDSA Signatures| AegisOS
    end

    subgraph Hybrid Cloud Boundary
        AegisOS -->|VRAM Saturation Spillover| Azure[Azure OpenAI Service]
        AegisOS -->|SAML 2.0 / OIDC| Entra[Azure Entra ID SSO]
    end
    
    Conversa -->|Route Inference & Tool runs| AegisOS
```

* **[AegisOS](file:///C:/Users/rajaj/Projects/AegisOS/docs/Platform_Handbook.md)**: The autonomic, 7-layered workstation operating system.
* **[Conversa](file:///C:/Users/rajaj/Projects/AegisOS/conversa_repo/README.md)**: The enterprise cognitive meeting and living workspace platform running on top of AegisOS.
* **[Aegis Mobile Companion](file:///C:/Users/rajaj/Projects/AegisOS/aegis_mobile/README.md)**: A biometrically-gated mobile dashboard paired over Tailscale, allowing operators to monitor workstation metrics and cryptographically authorize command approvals.

---

## 2. Integrated Architecture Plane Map

Both platforms align with a strict 7-layer architecture stack frozen under the [Engineering Constitution](file:///C:/Users/rajaj/Projects/AegisOS/docs/ENGINEERING_CONSTITUTION.md). Here is the cross-cutting state:

| Layer | AegisOS Station Component | Conversa Workspace Component | Target Status |
| :--- | :--- | :--- | :--- |
| **Layer 6: Executive / Console** | Next.js SRE Console & [aegis_mobile](file:///C:/Users/rajaj/Projects/AegisOS/aegis_mobile/) shell hooks | Spatial Next.js Shell, Command Surface, Mobile Workspace layout | 🟢 Implemented (GA 1.2 active) |
| **Layer 5: Control / Policy** | [PlatformOperationsControlPlane](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/PlatformOperationsControlPlane.ts), [SelfHealingFramework](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/SelfHealingFramework.ts), and [SamlProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/auth/providers/SamlProvider.ts) | Capability-Aware Routers, speaker claim validators, consensus generators | 🟢 Implemented (GA 1.2 active) |
| **Layer 4: Orchestration** | [WorkflowService](file:///C:/Users/rajaj/Projects/AegisOS/src/services/workflow.service.ts), Saga checkpoint queues, Command & Control (C2) signatures | Managed Meeting Agency Crew, Event blackboards, Hono/Convex API handlers | 🟢 Implemented (GA 1.2 active) |
| **Layer 3: Capability** | Model Context Protocol (MCP) Host, [ExtensionRuntimeService](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/extension/ExtensionRuntimeService.ts), [LocalCapabilityProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/capability/providers/LocalCapabilityProvider.ts) | Linkup Web Grounding, Semantic Publisher, Format-specific serializers | 🟢 Implemented (Sandboxing active) |
| **Layer 2: Runtime** | [OllamaProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/skeletons.ts), [LiteLLMProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/skeletons.ts), and [CloudSpilloverRouter](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/cloud-spillover-router.ts) | Local LLM inference swappers, audio-to-text diarization pipelines | 🟢 Implemented (Direct fetch active) |
| **Layer 1: Infrastructure** | PostgreSQL/SQLite schemas via Prisma client, Tailscale mesh tunnels | Drift encrypted DB, SQLCipher, Convex local instances | 🟢 Implemented (Production active) |
| **Layer 0: Hardware** | CUDA compute engine, GPU VRAM monitoring telemetry | CUDA hardware, physical device key storages | 🟢 Implemented (Host tools active) |
