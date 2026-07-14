# 06. Architectural Decision Records (ADRs)

This document records the design decisions and trade-offs made during the UAWOS Integration Phase.

---

## 1. Candidate Repository ADRs

### ADR-01: Expose CodeGraph via Model Context Protocol (MCP) Server
* **Status**: Approved
* **Context**: Developer agents need deep code graph dependencies to answer queries accurately without wasting context tokens on filesystem scans.
* **Decision**: We adopt CodeGraph strictly via **Interface Only** and register it as a local MCP server.
* **Consequences**:
  - CodeGraph's AST scanner indexes files locally.
  - The Developer Agent queries CodeGraph via AegisOS.
  - Avoids integrating tree-sitter code into the Next.js runtime.
* **Alternatives**: Absorb CodeGraph's database generation directly into Next.js console APIs (rejected due to excessive complexity).

### ADR-02: Expose Spec Kit as an On-Demand Planning Service
* **Status**: Approved
* **Context**: The platform lacks a structured planning and task decomposition framework, leading to ad-hoc, error-prone code generation.
* **Decision**: Adopt Spec Kit via **Interface Only** by exposing it as a command-line service wrapped by AegisOS's Planning Agent.
* **Consequences**:
  - The Planning Agent executes spec checks before task initiation.
  - All PRDs and ADRs are formatted according to Spec Kit standards.
  - No prompt registry duplication.
* **Alternatives**: Write manual planning templates inside Agent system instructions (rejected due to maintenance drift).

### ADR-03: Integrate Headroom inline before LiteLLM Routing Proxy
* **Status**: Approved
* **Context**: Context tokens grow dynamically during long sessions, causing high latency and occasional VRAM OOM faults.
* **Decision**: **Adopt** Headroom and deploy it as a local proxy filter directly before the LiteLLM gateway (`:4000`).
* **Consequences**:
  - Large prompts are filtered through Headroom at port `:4050`.
  - Tool output lists, JSON payloads, and source code are compressed.
  - Compresses context by 60–90% before routing to LiteLLM.
* **Alternatives**: Rely on model-native context pruning (rejected due to lack of local AST-aware compression).

### ADR-04: Deploy Ponytail in the Context Compression Pipeline
* **Status**: Approved
* **Context**: Long-running chat histories degrade model response consistency and exceed model context windows.
* **Decision**: **Adopt** Ponytail. Configure a context summarization pipeline: `Conversation Context` -> `Ponytail` -> `Headroom` -> `LiteLLM`.
* **Consequences**:
  - Chat history is summarized asynchronously when idle.
  - Enforces a "lazy senior developer" philosophy, prompting the agent to prefer native platform utilities.
* **Alternatives**: Native window-sliding history truncation (rejected due to memory loss).

### ADR-05: Expose LLM Council as an Asynchronous Review Service
* **Status**: Approved
* **Context**: Single-model reviews of critical architectural changes can result in hallucinations.
* **Decision**: Adopt LLM Council via **Interface Only** by exposing it as a Review Service.
* **Consequences**:
  - Excluded from the normal conversation path to keep chat latency low.
  - Invoked during pre-commit hooks or manual design review checks.
* **Alternatives**: Run LLM Council on every user prompt (rejected due to excessive latency overhead).

### ADR-06: Adopt AutoResearch as a Background Task runner
* **Status**: Approved
* **Context**: Automated research, architectural radar generation, and document aggregation are currently missing.
* **Decision**: Adopt AutoResearch via **Interface Only** as a background agent.
* **Consequences**:
  - AutoResearch loops run in a sandboxed, low-priority process.
  - Outputs are written directly to the `$PlatformRoot/knowledge` directory.
  - Avoids blocking active user chat threads.
* **Alternatives**: Direct chat integration (rejected due to thread blockage).

### ADR-07: Expose SkillOpt as an Optimization Service
* **Status**: Approved
* **Context**: Prompts drift over time without a systematic way to verify optimization effectiveness.
* **Decision**: Adopt SkillOpt via **Interface Only** by exposing it as a prompt training utility.
* **Consequences**:
  - Prompts are optimized offline.
  - Saves optimized variations back to the Git-versioned prompt catalog.
* **Alternatives**: Manual hand-tuning of prompts (rejected due to lack of regression safety).

### ADR-08: Defer Adoption of Google Knowledge Catalog (OKF)
* **Status**: Deferred
* **Context**: Enterprise metadata governance is complex and conflicts with the local flat-file storage schema of the workstation.
* **Decision**: Defer OKF adoption until multi-user catalog search or cloud storage integrations are required.
* **Consequences**:
  - Avoids adding complex cloud bindings and metadata catalog sync services to a local environment.
  - Prevents over-engineering the flat RAG database.
* **Alternatives**: Reject OKF entirely (rejected to keep option open for enterprise environments).

---

## 2. Missing Platform Services ADRs

### ADR-09: Deploy Event Bus using local EventListener Loop
* **Status**: Approved
* **Decision**: Implement a local Event Bus in the AegisOS service to support decoupled, async operations (e.g., auto-indexing files on creation).
* **Consequences**: Uses standard Node.js EventListeners to prevent circular dependencies.

### ADR-10: Establish Model Registry with static JSON Extensions
* **Status**: Approved
* **Decision**: Convert `ModelManifest.json` into a queryable Model Registry API.
* **Consequences**: Provides unified schema querying for available local models.

### ADR-11: Integrate Prompt Versioning via Git
* **Status**: Approved
* **Decision**: Store all system prompt files inside a git-tracked directory (`/configs/prompts`).
* **Consequences**: Enables tracking prompt revisions and rolling back changes using standard Git workflows.
