# AegisOS Engineering Knowledge Base (EKB)
## 02_PRODUCT_BASELINE.md — Product Baseline Specification

---

### Product Vision & Positioning
AegisOS is the definitive **Universal Knowledge Work Operating System (UKWOS)** — a local-first, autonomic platform designed to decompose, execute, verify, and govern enterprise workflows by dynamically composing open-weight models, Model Context Protocol (MCP) tools, worker sandboxes, and cryptographic approvals without static code script bloat.

---

### Core Product Capabilities Inventory

1. **Intent Resolution & Graph Planning**: Decomposes natural language requests into deterministic execution graphs (`PlatformPlanningEngine.ts`).
2. **Stateful Saga Workflow Execution**: Executes multi-step DAGs with step-level database state checkpoints and automated rollback compensation (`WorkflowService.ts`).
3. **Host-Isolated Worker Sandboxing**: Isolates 3rd-party extension execution in CPU/RAM restricted Node `worker_threads` (`ExtensionRuntimeService.ts`).
4. **Zero-Trust Mobile C2 Approval**: Requires cryptographically verified biometric ECDSA signatures from a paired mobile device (`aegis_mobile/`) for high-risk operations.
5. **SAML 2.0 Enterprise Identity**: Integrates corporate single sign-on (Azure Entra ID / Okta) into local workstation RBAC (`SamlProvider.ts`).
6. **VRAM-Aware Cloud Spillover**: Intercepts large inference requests and dynamically offloads compute to Azure OpenAI (`CloudSpilloverRouter.ts`).
7. **Autonomic Self-Healing Digital Twin**: Monitors service state drift and automatically repairs crashed background daemons (`ConvergenceEngine.ts`).

---

### Product Maturity Scorecard

* **Current Overall Product Score**: **9.0 / 10 (GA 1.2 Enterprise Viable)**
* **Target Score**: **10.0 / 10 (Full Multi-Agent Cognitive Consensus Integration)**
* **Maturity Justification**: The core 7-layer architecture is stable and frozen under the Engineering Constitution. The delivery of SAML SSO (`SamlProvider.ts`) and VRAM Cloud Spillover (`CloudSpilloverRouter.ts`) resolved the remaining primary enterprise adoption blockers.

---

### Enterprise Domain Readiness Matrix

| Enterprise Domain | Readiness Level | Active Subsystems & Connectors | Next Milestone Capability |
| :--- | :---: | :--- | :--- |
| **Operations & SRE** | 🟢 **High (9.5/10)** | SRE Dashboard, Digital Twin, Self-Healing Watchdogs, CUDA telemetry. | Real-time `nvidia-smi` event bus spillover thresholds. |
| **Security & Identity** | 🟢 **High (9.5/10)** | SAML 2.0 SSO, Worker VM Sandboxing, ECDSA Mobile Signer, RBAC. | Automated SAML Group Claim to RBAC role parsing. |
| **Automation & Orchestration**| 🟢 **High (9.0/10)** | Stateful Saga Engine, MCP Stdio Host, Local Capability Manager. | Parallel multi-agent consensus debate steps. |
| **Software Engineering** | 🟢 **High (9.0/10)** | Git/file MCP tools, Change Impact Analyzer, Code graph exploration. | Automated, sandbox-validated code refactoring loops. |
| **Documentation & Compliance**| 🟡 **Medium (8.5/10)**| Conversa Semantic Publisher, Markdown EKB generators, OTel logs. | Immutable ledger signing for compliance reports. |
| **Data & Financial Analysis** | 🟡 **Medium (8.0/10)**| SQLite / Prisma persistence, Local Ollama model inference. | Native M365 (SharePoint/Excel) MCP Connector Pack. |
| **Product & Business Strategy**| 🟡 **Medium (8.0/10)**| Strategic Gap Analyzer, RICE/MoSCoW Prioritization frameworks. | Jira / Azure DevOps native MCP ticket synchronization. |
| **Enterprise Architecture** | 🟡 **Medium (8.0/10)**| ADR-001 through ADR-014 validators, Static Codebase Auditors. | Dynamic C4 architecture graph rendering over repos. |
| **Deep Research & Intelligence**| 🟡 **Medium (7.5/10)**| Dynamic web search MCP tools, Linkup web grounding. | Multi-agent deep research synthesis loops. |
| **Presentation & Media** | 🔴 **Low (5.0/10)** | Basic image generation tools. | (Out of Core Scope - Deferred to Ecosystem Plugins). |
