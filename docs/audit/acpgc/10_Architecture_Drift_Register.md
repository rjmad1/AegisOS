# Architecture Drift Register

**Date**: 2026-07-21
**Scope**: AegisOS Core Architecture Components

This register documents where the current implementation has drifted from or failed to implement the approved architectural baselines.

| Component | Expected Architecture | Current Implementation | Drift Description | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Semantic UI Composition Model** | Declarative UI primitives driven purely by metadata schemas from the Platform Kernel. | Hardcoded React views (`ConsoleShell.tsx`, `AICopilotPanel.tsx`). | The application is structurally bound to specific React layouts rather than interpreting metadata to dynamically compose the UI. | **High**: Violates the principle of metadata over hardcoding and limits extensibility without code changes. |
| **Adaptive Experience Engine** | An engine that adjusts the UI based on execution context and user intent. | Non-existent. UI adapts based on static routes (`[domain]/[entity]/page.tsx`). | True dynamic layout adaptation is missing. UI state is governed by Next.js routing rather than the ECP. | **High**: Loses contextual adaptability required by the Console Kernel baseline. |
| **Transaction Coordinator** | Centralized coordination for governed execution paths, managing rollbacks and SAGAs. | Not implemented. `ActionDispatcher` directly invokes the Durable Execution Platform (DEP). | The platform cannot guarantee atomicity across multiple commands or rollback complex side-effects natively. | **High**: Blocks enterprise-grade reliability and complex workflow execution. |
| **Durable Execution Platform** | Core execution runtime that persists state, supports pausing/resuming, and audits execution. | Interfaces exist (`ExecutionInstance`, `IExecutionStrategy`), but the underlying persistence layer is missing. | Current executions are mostly memory-bound or rely on basic React state/API responses rather than a durable backend runner. | **Critical**: Execution is not durable. Loss of process implies loss of execution state, violating NFR-R1. |
| **Evidence Framework / PQF Integration** | Every governed action produces cryptographically verifiable evidence passed to the PQF. | `evidence-provider.ts` exists and hashes content, but is not deeply integrated into the `ActionDispatcher` or Command flow. | Audit trails rely on standard logging rather than immutable evidence chains, breaking the "Evidence-Based Engineering" principle. | **High**: Fails to provide trust and transparency guarantees for executed actions. |
| **5-Layer Console Framework** | Strict separation of concerns across 5 layers (Domain, Intent, Capability, Experience, Presentation). | Blurred layers. React components (Presentation) interact directly with Kernel Services and the Action Dispatcher (Capability/Intent). | Tight coupling between UI and core logic. Changing a capability requires rebuilding UI components. | **Medium**: Increases maintenance overhead and technical debt. |
