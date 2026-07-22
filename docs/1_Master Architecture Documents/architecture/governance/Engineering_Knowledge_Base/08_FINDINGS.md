# AegisOS Engineering Knowledge Base (EKB)
## 08_FINDINGS.md — Review Findings

This document tracks all audited review findings, their description, status, evidence, and resolution.

---

### Active Findings Register

#### F-01: Parallel Workflow Engines
* **ID:** F-01
* **Source:** Final Architectural Certification Review (2026-07-21)
* **Description:** Parallel workflow execution modules (`WorkflowRuntime` and `WorkflowService`) exist in the codebase, causing state synchronization drift.
* **Status:** 🔴 **Open**
* **Evidence:** Duplicate loops found in [WorkflowRuntime.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/ai-runtime/WorkflowRuntime.ts) and [workflow.service.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/services/workflow.service.ts).
* **Resolution:** Open backlog item to deprecate `WorkflowRuntime.ts`.

#### F-02: Host Remote Code Execution via Extensions
* **ID:** F-02
* **Source:** Final Architectural Certification Review (2026-07-21)
* **Description:** Dynamic third-party plugins are loaded on the main process thread using standard require calls, allowing sandbox escapes.
* **Status:** 🔴 **Open**
* **Evidence:** Direct eval require in [ExtensionRuntimeService.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/extension/ExtensionRuntimeService.ts#L330).
* **Resolution:** Open backlog item to implement worker threads with VM sandboxes.

#### F-03: Mocked Provider Inference Endpoints
* **ID:** F-03
* **Source:** Final Architectural Certification Review (2026-07-21)
* **Description:** Ollama and LiteLLM providers return static, simulated text responses.
* **Status:** 🔴 **Open**
* **Evidence:** Provider skeletons in [skeletons.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/infrastructure/providers/skeletons.ts).
* **Resolution:** Open backlog item to establish real client HTTP connections to local ports.

#### F-04: Simulated Tool Execution sandboxing
* **ID:** F-04
* **Source:** Final Architectural Certification Review (2026-07-21)
* **Description:** The tool execution runner returns simulated sandbox string responses instead of executing real IO.
* **Status:** 🔴 **Open**
* **Evidence:** Mock code inside [ToolRuntime.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/ai-runtime/ToolRuntime.ts#L154-L165).
* **Resolution:** Open backlog item to implement actual disk and network execution loops in sandboxed folders.

#### F-05: Missing Model Context Protocol (MCP) transport SDK
* **ID:** F-05
* **Source:** Final Architectural Certification Review (2026-07-21)
* **Description:** No MCP SDK client library packages exist in dependencies, making static server configurations unusable.
* **Status:** 🔴 **Open**
* **Evidence:** Omission of `@modelcontextprotocol/sdk` inside [package.json](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/package.json).
* **Resolution:** Open backlog item to install SDK and implement stdio transports.
