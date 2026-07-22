# AegisOS Engineering Knowledge Base (EKB)
## 12_CAPABILITY_MATRIX.md — Comprehensive Capability Inventory Specification

---

### Overview
This capability inventory maps all functional capabilities, engines, services, and modules across the 7-Layer AegisOS Stack and Conversa Ecosystem, detailing their implementation status, functional maturity, and operational state.

---

### Layer 6: Executive Plane & Client Ingress

| Capability ID | Capability Name | Subsystem / Source File | Description | Functional Maturity | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CAP-601** | Next.js SRE Console | `src/app/`, `src/components/` | Executive administration web dashboard for system health, agent workflows, and telemetry. | 🟢 Mature | Active (GA 1.0) |
| **CAP-602** | Aegis Mobile C2 Cockpit | `aegis_mobile/` | Flutter mobile companion for biometrically-gated command approvals, alerts, and GPU monitoring. | 🟢 Mature | Active (GA 1.0) |
| **CAP-603** | Conversa Spatial Shell | `conversa_repo/` | Spatial cognitive workspace layout for real-time meeting transcription, notes, and agent debates. | 🟢 Mature | Active (GA 1.0) |
| **CAP-604** | CLI Platform Tool | `scripts/platform-cli.js` | Command-line management tool for bootstrap, service management, and diagnostic health checks. | 🟢 Mature | Active (GA 1.0) |

---

### Layer 5: Executive Control Plane & Policy

| Capability ID | Capability Name | Subsystem / Source File | Description | Functional Maturity | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CAP-501** | Operations Control Plane | `src/platform/control-plane/PlatformOperationsControlPlane.ts` | Intercepts user inputs, runs safety firewalls, sanitizes prompts, and calculates grounding scorecards. | 🟢 Mature | Active (GA 1.0) |
| **CAP-502** | Self-Healing Framework | `src/platform/control-plane/SelfHealingFramework.ts` | Background daemon monitoring watchdog canary pings and executing exponential backoff repairs. | 🟢 Mature | Active (GA 1.0) |
| **CAP-503** | System Digital Twin | `src/platform/control-plane/digital-twin/` | Event-driven canonical state graph (`GraphKernel`) representing system topology and entity relationships. | 🟢 Mature | Active (GA 1.0) |
| **CAP-504** | Convergence Engine | `src/platform/control-plane/digital-twin/synchronization/ConvergenceEngine.ts` | Reconciles real-world host runtime state against Digital Twin target topologies to fix configuration drift. | 🟢 Mature | Active (GA 1.0) |
| **CAP-505** | SAML 2.0 Identity Provider | `src/platform/auth/providers/SamlProvider.ts` | Bridges corporate identity providers (Azure Entra ID, Okta) with local RBAC and session security. | 🟢 Mature | Active (GA 1.2) |
| **CAP-506** | Declarative Policy Fabric | `src/platform/governance/` | Enforces fine-grained role-based access control (RBAC) and resource governance rules. | 🟢 Mature | Active (GA 1.0) |

---

### Layer 4: Orchestration Plane

| Capability ID | Capability Name | Subsystem / Source File | Description | Functional Maturity | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CAP-401** | Stateful Saga Workflow Runner | `src/services/workflow.service.ts` | Database-backed execution graph runner supporting step state checkpoints, rollback, and recovery. | 🟢 Mature | Active (GA 1.0) |
| **CAP-402** | Platform Planning Engine | `src/platform/pik/kernel/planning/PlatformPlanningEngine.ts` | Decomposes complex user intents into execution DAGs, performing safety pre-simulations. | 🟢 Mature | Active (GA 1.0) |
| **CAP-403** | Unified Provider Registry | `src/platform/module-registry/` | Consolidated single-source registry tracking tools, capability manifests, and LLM provider bindings. | 🟢 Mature | Active (GA 1.0) |
| **CAP-404** | Change Impact Analyzer | `src/platform/pik/kernel/impact-analysis/ChangeImpactAnalyzer.ts` | Performs static codebase audits to map affected entities, governing ADRs, and validating tests before script executions. | 🟢 Mature | Active (GA 1.0) |
| **CAP-405** | Command & Control Signer | `src/platform/control/` | Enforces cryptographic human-in-the-loop (HITL) approval gates for privileged actions. | 🟢 Mature | Active (GA 1.0) |

---

### Layer 3: Capability & Integration Plane

| Capability ID | Capability Name | Subsystem / Source File | Description | Functional Maturity | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CAP-301** | Dynamic MCP Host Client | `src/platform/mcp/` | Connects to external Model Context Protocol stdio servers (`@modelcontextprotocol/sdk`) dynamically. | 🟢 Mature | Active (GA 1.0) |
| **CAP-302** | Extension VM Sandbox | `src/platform/extension/ExtensionRuntimeService.ts` | Executes dynamic third-party extension code inside isolated Node `worker_threads` with CPU/RAM caps. | 🟢 Mature | Active (GA 1.0) |
| **CAP-303** | Local Capability Provider | `src/platform/capability/providers/LocalCapabilityProvider.ts` | Manages 140+ dynamic local-first capability manifests loaded from `.aegisos/capabilities/`. | 🟢 Mature | Active (GA 1.0) |
| **CAP-304** | Conversa Semantic Publisher | `conversa_repo/` | Generates 3-hash cryptographically validated, structured meeting notes and decision records. | 🟢 Mature | Active (GA 1.0) |

---

### Layer 2: Runtime & Inference Plane

| Capability ID | Capability Name | Subsystem / Source File | Description | Functional Maturity | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CAP-201** | Ollama Direct Provider | `src/infrastructure/providers/skeletons.ts` | Routes actual HTTP inference calls to local Ollama daemon (`localhost:11434`). | 🟢 Mature | Active (GA 1.0) |
| **CAP-202** | LiteLLM Router Provider | `src/infrastructure/providers/skeletons.ts` | Routes multi-model inference calls to local LiteLLM proxy router (`localhost:4000`). | 🟢 Mature | Active (GA 1.0) |
| **CAP-203** | Cloud Spillover Router | `src/platform/ai-runtime/CloudSpilloverRouter.ts` | Intercepts large inference requests and dynamically offloads compute to Azure OpenAI/Anthropic. | 🟢 Mature | Active (GA 1.2) |
| **CAP-204** | Local Caching Subsystem | `ioredis` / local cache | Caches prompt/response pairs and intermediate tool execution results to minimize GPU load. | 🟢 Mature | Active (GA 1.0) |

---

### Layer 1 & 0: Infrastructure & Hardware Plane

| Capability ID | Capability Name | Subsystem / Source File | Description | Functional Maturity | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CAP-101** | Prisma Persistence Layer | `prisma/schema.prisma` | PostgreSQL / SQLite database schema managing system state, users, saga logs, and audit trails. | 🟢 Mature | Active (GA 1.0) |
| **CAP-102** | Tailscale Mesh Tunneling | `automation/` | Tightly coupled private VPN mesh binding workstation nodes, mobile companion, and edge devices. | 🟢 Mature | Active (GA 1.0) |
| **CAP-103** | Biometric ECDSA Handshake | `src/platform/auth/` | Cryptographic signature verification mechanism for mobile approval nonces and pairing tokens. | 🟢 Mature | Active (GA 1.0) |
| **CAP-001** | CUDA Hardware Telemetry | `src/platform/health/` | Real-time monitoring of NVIDIA GPU temperature, compute utilization, and free VRAM allocation. | 🟢 Mature | Active (GA 1.0) |

---

### Deprecated, Consolidated, or Retired Capabilities

| Deprecated Entity | Superseded By | Rationale & Status |
| :--- | :--- | :--- |
| **`WorkflowRuntime.ts`** | `WorkflowService.ts` | Eliminating duplicate workflow engines; fully removed in GA 1.0. |
| **`EMOProviderRegistry`** | `ProviderRegistry` | Consolidated into a single metadata registry backing capabilities and providers. |
| **Mock Mobile API Signatures** | ECDSA Nonce Verifier | Mock cryptographic buffers replaced with real Node.js `crypto` ECDSA nonces. |
| **Simulated LLM Skeletons** | Active HTTP Provider Fetch | Mocked text returns replaced with real HTTP calls to Ollama & LiteLLM daemons. |
| **Custom Vector Database (Raja RAG)** | Standard MCP / PgVector | Bespoke vector indexer retired in favor of standard enterprise search MCPs. |
