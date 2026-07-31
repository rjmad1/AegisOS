# AegisOS Master Reference

This document serves as the **central authority** for understanding the planning, implementation, strategic positioning, and future evolution of the AegisOS local-first operating system.

---

## 1. AegisOS Overview

AegisOS is an enterprise-grade, local-first, privacy-preserving **Universal Knowledge Work Operating System (UKWOS)**. Built upon a frozen 7-layer architecture stack, it manages model deployments, schedules agent workflows, sandboxes tool execution, and intercepts commands through policy enforcers.

It pairs with the **[Aegis Mobile Companion](file:///C:/Users/rajaj/Projects/AegisOS/aegis_mobile/README.md)**, a biometrically-gated mobile dashboard paired over Tailscale, allowing operators to monitor workstation metrics and cryptographically authorize command approvals via ECDSA signature nonces.

---

## 2. Hierarchical Architecture Plane Map

AegisOS aligns with a strict 7-layer architecture stack frozen under the [Engineering Constitution](file:///C:/Users/rajaj/Projects/AegisOS/docs/ENGINEERING_CONSTITUTION.md):

| Layer | AegisOS Station Component | Target Status |
| :--- | :--- | :--- |
| **Layer 6: Executive / Console** | Next.js SRE Console & [aegis_mobile](file:///C:/Users/rajaj/Projects/AegisOS/aegis_mobile/) shell hooks | 🟢 Implemented (GA 1.2 active) |
| **Layer 5: Control / Policy** | [PlatformOperationsControlPlane](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/PlatformOperationsControlPlane.ts), [SelfHealingFramework](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/SelfHealingFramework.ts), and [ConvergenceEngine](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/digital-twin/synchronization/ConvergenceEngine.ts) | 🟢 Implemented (GA 1.2 active) |
| **Layer 4: Orchestration** | [WorkflowService](file:///C:/Users/rajaj/Projects/AegisOS/src/services/workflow.service.ts), Saga checkpoint queues, Command & Control (C2) signatures | 🟢 Implemented (GA 1.2 active) |
| **Layer 3: Capability** | Model Context Protocol (MCP) Host, [ExtensionRuntimeService](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/extension/ExtensionRuntimeService.ts), [LocalCapabilityProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/capability/providers/LocalCapabilityProvider.ts) | 🟢 Implemented (Sandboxing active) |
| **Layer 2: Runtime** | [OllamaProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/skeletons.ts), [LiteLLMProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/skeletons.ts), and [CloudSpilloverRouter](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/cloud-spillover-router.ts) | 🟢 Implemented (Direct fetch active) |
| **Layer 1: Infrastructure** | PostgreSQL/SQLite schemas via Prisma client, Tailscale mesh tunnels, [SamlProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/auth/providers/SamlProvider.ts) | 🟢 Implemented (Production active) |
| **Layer 0: Hardware** | CUDA compute engine, GPU VRAM monitoring telemetry | 🟢 Implemented (Host tools active) |

---

## 3. Subsystem Implementation Log (Verified Artifacts)

### 3.1 AegisOS Core Kernel & Control Plane
* **[PlatformOperationsControlPlane](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/PlatformOperationsControlPlane.ts)**: Intercepts ingress user inputs, enforces safety filters, and calculates prompt-grounding scorecards.
* **[SelfHealingFramework](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/SelfHealingFramework.ts)**: Subscribes to event bus state updates, tracks watchdog canary pings, and executes exponential backoff repair routines.
* **[PlatformServiceManager](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/control-plane/PlatformServiceManager.ts)**: Controls system daemon life-cycles (starts, stops, restarts, repairs) using nssm/systemd adapters.
* **[PlatformPlanningEngine](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/pik/kernel/planning/PlatformPlanningEngine.ts)**: Decomposes human intents into execution graphs, runs safety simulations, and logs proposals.
* **[ChangeImpactAnalyzer](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/pik/kernel/impact-analysis/ChangeImpactAnalyzer.ts)**: Performs static codebase audits to map affected entities, governing ADRs, and validating tests before script executions.
* **[WorkflowService](file:///C:/Users/rajaj/Projects/AegisOS/src/services/workflow.service.ts)**: The primary database-backed stateful workflow runner supporting saga compensation rollbacks and cron triggers.
* **[SamlProvider](file:///C:/Users/rajaj/Projects/AegisOS/src/platform/auth/providers/SamlProvider.ts)**: Bridges enterprise corporate identity providers (Azure Entra ID, Okta) into local station RBAC roles.
* **[CloudSpilloverRouter](file:///C:/Users/rajaj/Projects/AegisOS/src/infrastructure/providers/cloud-spillover-router.ts)**: Dynamically routes heavy inference tasks to Azure OpenAI when local GPU VRAM capacity is exhausted.

### 3.2 Aegis Mobile Companion
* **Pairing Handshake Client**: Initiates token challenges and ECDSA key generation.
* **Secure Enclave Signer**: Integrates hardware keys to cryptographically sign administrative commands and approvals.
* **FCM Push Decryptor**: Resolves and decrypts incoming SRE alerts and approval requests.

---

## 4. Version 1.0 - 1.2 General Availability (GA) Delivered Features

### 4.1 Worker Sandbox Isolation (Security Blocker Resolved)
* **Delivered State**: Dynamic loads migrated to Node `worker_threads` using isolated VM contexts, implementing CPU/memory limits and directory barriers.

### 4.2 Active Inference Providers (Implementation Blocker Resolved)
* **Delivered State**: Replaced simulated text with actual HTTP client calls routing to Ollama (`localhost:11434`) and LiteLLM Router (`localhost:4000`).

### 4.3 Real Tool Execution & MCP Clients (Capability Blocker Resolved)
* **Delivered State**: Integrated `@modelcontextprotocol/sdk` to load external MCP server plugins and configured dynamic execution via stdio.

### 4.4 Cryptographic Mobile Pairing & Approvals (Mobile Blocker Resolved)
* **Delivered State**: Connected ECDSA verification logic to the backend security middleware, validating challenge nonces and signature keys.

### 4.5 SAML 2.0 Enterprise Identity (Identity Blocker Resolved - GA 1.2)
* **Delivered State**: Integrated `SamlProvider.ts` for federated single sign-on (SSO) with Azure Entra ID and Okta.

### 4.6 VRAM-Aware Cloud Spillover (Scale Blocker Resolved - GA 1.2)
* **Delivered State**: Integrated `CloudSpilloverRouter.ts` to dynamically route inference requests to Azure OpenAI when local hardware resources are saturated.

---

## 5. Governing Architectural Decision Records (ADRs)

The ecosystem is guided by primary ADR specifications located under the [adr/](file:///C:/Users/rajaj/Projects/AegisOS/adr/) directory:

1. **[ADR-001: Contract-First API Boundaries](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-001-Contract-First-Versioned-API-Boundaries.md)**
2. **[ADR-002: Server-Side Decoupled Authentication](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-002-Server-Side-Decoupled-Authentication.md)**
3. **[ADR-003: Unified Event-Driven Registry](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-003-Unified-Event-Driven-Registry.md)**
4. **[ADR-004: Pipeline Worker Processing Architecture](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-004-Pipeline-Worker-Processing-Architecture.md)**
5. **[ADR-005: Information Architecture Rationalization](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-005-Repository-Information-Architecture-Rationalization.md)**
6. **[ADR-006: Script Engineering Standards](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-006-Script-Engineering-Standards.md)**
7. **[ADR-007: Portable Configuration Architecture](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-007-Portable-Configuration-Architecture.md)**
8. **[ADR-008: Platform Asset Catalog Design](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-008-Platform-Asset-Catalog-Design.md)**
9. **[ADR-009 (Stack): Autonomic Operating System Architecture](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-009-Autonomic-Operating-System-Architecture.md)**
10. **[ADR-009 (Kernel): Platform Kernel and State Machine](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-015-Platform-Kernel-and-State-Machine.md)**
11. **[ADR-010 (Gov): Adaptive Resource Governance Fabric](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-010-Adaptive-Resource-Governance-Fabric.md)**
12. **[ADR-010 (ECP): Executive Control Plane](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-016-Executive-Control-Plane.md)**
13. **[ADR-011 (Policy): Declarative Policy Governance Fabric](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-011-Declarative-Policy-Governance-Fabric.md)**
14. **[ADR-011 (Event): Event-Driven System Decoupling](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-017-Event-Driven-System-Decoupling.md)**
15. **[ADR-012 (Eval): Cognitive Observability And Continuous Evaluation](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-012-Cognitive-Observability-And-Continuous-Evaluation.md)**
16. **[ADR-012 (Context): Immutable Execution Context Fabric](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-018-Immutable-Execution-Context-Fabric.md)**
17. **[ADR-013: Command & Control Subsystem](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-013-Command-And-Control-Subsystem.md)**
18. **[ADR-014: Open WebUI Integration](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-014-Open-WebUI-Thin-Client-Integration.md)**
19. **[ADR-MOB-006: Mobile Domain Driven Architecture](file:///C:/Users/rajaj/Projects/AegisOS/adr/ADR-MOB-006-domain-driven-data-architecture.md)**
