# AegisOS Engineering Knowledge Base (EKB)
## 01_ARCHITECTURE_BASELINE.md — Architecture Baseline

---

### Architecture Baseline Status
* **Status:** ❄️ **Frozen & Stable**
* **Effective Date:** July 21, 2026

---

### Core Architecture Layers
AegisOS is built on a strict, 7-layer contract architecture:

* **Layer 6: Console (User Interface & SRE Portal)**
  * Displays execution graphs, monitors logs, and manages approvals.
* **Layer 5: Workflow (Orchestration & Saga Rollback)**
  * Manages long-running state machines, transaction boundaries, and rollbacks.
* **Layer 4: Agent (Cognitive Routing & Collaboration)**
  * Handles supervisor-worker loops and schedules sub-tasks.
* **Layer 3: Skill (Domain-specific Executables)**
  * Resolves prompts and parameters for target business operations.
* **Layer 2: Tool (Subprocess & API Clients)**
  * Exposes command interfaces, web search, and filesystem access.
* **Layer 1: Sandbox (V8 Isolation & Resource Limits)**
  * Isolates dynamic extension code in separate threads.
* **Layer 0: Host (SCM Process Daemon Control)**
  * Manages active Ollama, LiteLLM, and Next.js services on the host machine.

---

### Core Abstractions
1. **`UniversalExecution`:** The standard database contract for tracing, serialized steps, and state checkpoints.
2. **`ResolvedParticipantDescriptor`:** The unified configuration schema representing any runtime asset (MCP, Skill, Model, Tool).

---

### Core Engineering Principles
* **Article I: Single Authoritative Runtime:** No duplicate planners or workflow runners.
* **Article III: Contracts Before Implementations:** API boundaries and database schemas must be locked before merging code.
* **Article VI: Local-First by Default:** Zero mandatory cloud or remote internet dependencies.
* **Article VIII: Secure by Default:** Code is un-sandboxed by default only under Tier 0 (Core Kernel).

---

### Architectural Decisions Records (ADRs)
* **ADR-001 [Active]:** SQLite as the primary database for local-first state storage.
* **ADR-002 [Active]:** Secure Enclave mobile pairing challenge for cryptographic approval authorization.
* **ADR-003 [Active]:** Core Platform Layer Freeze (Layers 0-6).
* **ADR-004 [Active]:** Dynamic Worker Threads VM Sandboxing to secure dynamic plugin loading.
