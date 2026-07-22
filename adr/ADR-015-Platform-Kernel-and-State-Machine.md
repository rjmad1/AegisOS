# ADR-015: Platform Kernel and State Machine

## Status
Accepted

## Context
AegisOS historically managed subsystem initialization ad-hoc or tightly coupled within `CompositionRoot`. As the system scaled to include agents, MCPs, and LLM orchestration, subsystems began orchestrating each other, leading to a tangled, unpredictable lifecycle and making recovery and governance impossible.

## Decision
We will introduce a **Platform Kernel** responsible for platform-wide orchestration, independent from dependency injection (`CompositionRoot`).
- `CompositionRoot` remains solely responsible for resolving dependencies and constructor injection.
- The `PlatformKernel` assumes full control of startup/shutdown sequencing, health monitoring, resource governance, and failure recovery.
- We will implement a strict **Kernel State Machine** (Created → Bootstrapping → Composing → Initializing → Starting → Healthy → Degraded → Recovering → Draining → Stopping → Stopped → Disposed).
- Subsystems will no longer instantiate each other. They will register via a Platform Service Registry using declarative manifests.

## Consequences
### Positive
- Strict separation of concerns (IoC vs Platform Orchestration).
- Bootstrapping and shutdown sequences are deterministic and auditable.
- Failures during startup are caught early via Startup Dependency Validation.

### Negative
- Increases upfront complexity when creating a new module (requires writing a manifest rather than just instantiating a class).
- Requires a major refactoring of existing modules to separate their DI registration from their startup/runtime logic.
