# ADR-018: Immutable Execution Context Fabric

## Status
Accepted

## Context
Tracing an operation's origin, identity, and policy constraints across asynchronous boundaries and distributed microservices was challenging. Parameters were manually drilled through function signatures, leading to brittle APIs, or critical metadata was lost when execution moved to worker threads or external processes.

## Decision
We will introduce an **Immutable Execution Context Fabric**.
- Every operation will run within a globally unique, immutable Execution Context (comprising Identity, Tenant ID, Correlation ID, Policy Scope, etc.).
- The context is created once at workflow initiation and propagated automatically.
- Locally, propagation will utilize `AsyncLocalStorage` (or an equivalent execution-local mechanism) hidden behind an abstract `IExecutionContextProvider`.
- For distributed execution, the context will be serialized and propagated across RPC, HTTP, and Event Bus boundaries.

## Consequences
### Positive
- Removes parameter drilling from the business logic.
- Guarantees that every log, metric, resource lease, and policy evaluation is accurately attributed.
- Provides a unified foundation for multi-tenancy and zero-trust security.

### Negative
- Hidden state makes debugging asynchronous logic harder if the propagation mechanism fails.
- Developers must be cautious when bridging contexts (e.g., explicitly binding context in custom connection pools or event emitters) to avoid context leakage.
