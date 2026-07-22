# AegisOS Engineering Knowledge Base (EKB)
## 07_DECISIONS.md — Architectural Decision Records (ADRs)

This document registers all architectural decisions made across the life of the platform.

---

### Architectural Decision Register

All architectural designs are recorded as markdown specifications in the [adr/](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/) folder. Below is the authoritative registry of these decisions:

#### [ADR-001: Contract-First API Boundaries](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-001-Contract-First-Versioned-API-Boundaries.md)
* **Status:** 🟢 Active
* **Context:** Decouples clients from the internal service layer by enforcing versioned API endpoints (`/api/v1`) with Zod schemas.

#### [ADR-002: Server-Side Decoupled Authentication](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-002-Server-Side-Decoupled-Authentication.md)
* **Status:** 🟢 Active
* **Context:** Establishes independent database-backed session token managers, removing standard NextAuth dependencies for local execution.

#### [ADR-003: Unified Event-Driven Registry](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-003-Unified-Event-Driven-Registry.md)
* **Status:** 🟢 Active
* **Context:** Registers all components as nodes in the virtualized workstation topology, updating states reactively via the central event bus.

#### [ADR-004: Pipeline Worker Processing Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-004-Pipeline-Worker-Processing-Architecture.md)
* **Status:** 🟢 Active
* **Context:** Outlines background job execution schedules using Redis-backed queues and isolated workers.

#### [ADR-005: Repository IA Rationalization](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-005-Repository-Information-Architecture-Rationalization.md)
* **Status:** 🟢 Active
* **Context:** Defines strict folder layout patterns separating console, platform kernel, infrastructure services, and mobile workspace.

#### [ADR-006: Script Engineering Standards](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-006-Script-Engineering-Standards.md)
* **Status:** 🟢 Active
* **Context:** Restricts bootstrap and deploy shell scripts to structured formats with dry-runs, input parameters, and logs.

#### [ADR-007: Portable Configuration Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-007-Portable-Configuration-Architecture.md)
* **Status:** 🟢 Active
* **Context:** Mandates declaration of deployment configurations inside JSON/YAML files separate from runtime code.

#### [ADR-008: Platform Asset Catalog Design](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-008-Platform-Asset-Catalog-Design.md)
* **Status:** 🟢 Active
* **Context:** Standardizes extension manifests, describing capabilities, entry points, dependencies, and permissions.

#### [ADR-009 (Stack): Autonomic Operating System Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-009-Autonomic-Operating-System-Architecture.md)
* **Status:** 🟢 Active
* **Context:** Establishes the 7-layer stack, preventing higher planes from leaking into or depending on lower layers.

#### [ADR-009 (Kernel): Platform Kernel and State Machine](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-009-Platform-Kernel-and-State-Machine.md)
* **Status:** 🟢 Active
* **Context:** Outlines FSM lifecycle transitions (`starting`, `running`, `healing`, `stopped`, `failed`) for component nodes.

#### [ADR-010 (Gov): Adaptive Resource Governance Fabric](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-010-Adaptive-Resource-Governance-Fabric.md)
* **Status:** 🟢 Active
* **Context:** Limits CPU, memory, and model tokens allocated per workspace, user session, and execution node.

#### [ADR-010 (ECP): Executive Control Plane](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-010-Executive-Control-Plane.md)
* **Status:** 🟢 Active
* **Context:** Implements stateless policy enforcers to intercept, sanitize, and validate prompt-response chains.

#### [ADR-011 (Policy): Declarative Policy Governance Fabric](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-011-Declarative-Policy-Governance-Fabric.md)
* **Status:** 🟢 Active
* **Context:** Standardizes system RBAC rules and scopes mapping users to actions.

#### [ADR-011 (Event): Event-Driven System Decoupling](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-011-Event-Driven-System-Decoupling.md)
* **Status:** 🟢 Active
* **Context:** Declares a centralized Event Bus separating kernel operations from SRE auditing and dashboard updates.

#### [ADR-012 (Eval): Observability and Continuous Evaluation](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-012-Cognitive-Observability-And-Continuous-Evaluation.md)
* **Status:** 🟢 Active
* **Context:** Measures model output accuracy and grounding to auto-calculate quality scorecards.

#### [ADR-012 (Context): Immutable Execution Context Fabric](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-012-Immutable-Execution-Context-Fabric.md)
* **Status:** 🟢 Active
* **Context:** Propagates request metadata, correlation IDs, and trace contexts down the execution stack.

#### [ADR-013: Command & Control Subsystem](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-013-Command-And-Control-Subsystem.md)
* **Status:** 🟢 Active
* **Context:** Enforces biometrically-gated cryptographic approval signatures on the mobile client before executing destructive commands.

#### [ADR-014: Open WebUI Thin Client Integration](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-014-Open-WebUI-Thin-Client-Integration.md)
* **Status:** 🟢 Active
* **Context:** Integrates Open WebUI as the default stateless chat portal, communicating with local daemons.

#### [ADR-MOB-006: Mobile Domain Driven Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-MOB-006-domain-driven-data-architecture.md)
* **Status:** 🟢 Active
* **Context:** Structures the Flutter companion app into separate data, domain, and presentation packages.
