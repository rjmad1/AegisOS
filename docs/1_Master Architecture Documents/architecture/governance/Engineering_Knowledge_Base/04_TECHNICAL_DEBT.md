# AegisOS Engineering Knowledge Base (EKB)
## 04_TECHNICAL_DEBT.md — Technical Debt Register Specification

---

### Overview
This register tracks structural, security, implementation, and architectural technical debt items across the AegisOS codebase, documenting their severity, status, and resolution history.

---

### Resolved Technical Debt History (GA 1.0 - GA 1.2)

| Debt ID | Category | Description | Severity | Resolution Summary | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **TD-01** | Architecture | Duplicate `WorkflowRuntime.ts` engine parallel to `workflow.service.ts`. | High | Deprecated and purged in GA 1.0; unified on `WorkflowService`. | 🟢 **RESOLVED** |
| **TD-02** | Security | Un-sandboxed dynamic extension loading using host `eval('require')`. | Critical | Migrated to Node `worker_threads` VM sandbox in GA 1.0 (`ExtensionRuntimeService.ts`). | 🟢 **RESOLVED** |
| **TD-03** | Implementation | Mocked text returns in Ollama & LiteLLM provider skeletons. | High | Replaced with active HTTP client fetching targeting daemon ports in GA 1.0 (`skeletons.ts`). | 🟢 **RESOLVED** |
| **TD-04** | Implementation | Simulated tool execution returns without actual file IO / search operations. | High | Integrated `@modelcontextprotocol/sdk` dynamic stdio host client in GA 1.0. | 🟢 **RESOLVED** |
| **TD-05** | Architecture | Duplicate `EMOProviderRegistry` parallel to central `ProviderRegistry`. | Medium | Consolidated into unified `ProviderRegistry` backing metadata schemas. | 🟢 **RESOLVED** |
| **TD-SEC-01**| Security | Custom JWT auth tokens lacking enterprise directory integration. | High | Implemented SAML 2.0 / OIDC enterprise identity in GA 1.2 (`SamlProvider.ts`). | 🟢 **RESOLVED** |

---

### Active Technical Debt Ledger

#### [TD-06] Static Spillover Thresholds in Cloud Spillover Router
* **ID:** TD-06
* **Description:** `CloudSpilloverRouter.ts` relies on static model size estimation and token counts rather than live hardware telemetry from `nvidia-smi`.
* **Category:** Implementation / Performance
* **Severity:** Medium | **Priority:** High
* **Status:** 🟡 **Active (Under Engineering Focus - Sprint 1)**
* **Opened:** 2026-07-21 | **Owner:** Infrastructure Engineering
* **Evidence:** [CloudSpilloverRouter.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/infrastructure/providers/cloud-spillover-router.ts)
* **Mitigation Plan:** Wire Layer 0 CUDA telemetry event bus directly into the router for precision free VRAM failover evaluation.

#### [TD-07] Manual SAML Assertion Group Claim Role Assignment
* **ID:** TD-07
* **Description:** `SamlProvider.ts` validates SAML assertions but requires manual administration to map federated Entra ID security groups to AegisOS local RBAC roles.
* **Category:** Identity & Access Governance
* **Severity:** Low | **Priority:** Medium
* **Status:** 🟡 **Active (Under Engineering Focus - Sprint 1)**
* **Opened:** 2026-07-21 | **Owner:** Core Security Engineering
* **Evidence:** [SamlProvider.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/auth/providers/SamlProvider.ts)
* **Mitigation Plan:** Implement automated Group Claim XML assertion parser to map Entra ID security groups directly to Prisma `Role` records.

#### [TD-08] Custom Vector Database (Raja RAG) Remnants
* **ID:** TD-08
* **Description:** Legacy custom vector indexing code exists in parallel to standard PgVector / SQLite vector search endpoints.
* **Category:** Maintenance / Debt Bloat
* **Severity:** Medium | **Priority:** Medium
* **Status:** 🟡 **Active (Simplification Target - Sprint 1)**
* **Opened:** 2026-07-22 | **Owner:** Productization Architecture
* **Mitigation Plan:** Retire and purge custom vector database code; standardize exclusively on PgVector and MCP search tools.
