# Architecture Risk Register

**Date**: 2026-07-21
**Scope**: AegisOS Core Architecture

| Risk ID | Risk Area | Description | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AR-01` | Distributed State | Diverged command and capability registries cause runtime conflicts and execution failures. | High | High | Consolidate duplicate registries immediately. |
| `AR-02` | Governance Bypass | Synthetic command execution in `ActionDispatcher` allows untracked system modifications. | High | Critical | Force all actions through strict `CommandRegistry` validation. |
| `AR-03` | Extension Security | `CEREngine` executes external extension code directly in the host React context. | Medium | Critical | Introduce a secure membrane or iframe-based sandbox for extensions. |
| `AR-04` | Non-Durable Execution | `DurableExecutionPlatform` is scaffolded but relies on synchronous API calls for legacy actions. | High | High | Enforce asynchronous, durable handles for all command dispatches. |
| `AR-05` | UI Monolith | Console UI components hardcode rendering logic rather than interpreting metadata dynamically. | Certain | Medium | Refactor `ConsoleShell` to strictly interpret `DomainMetadataSchema`. |
