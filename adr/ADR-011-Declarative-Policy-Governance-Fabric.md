# ADR-011: Platform Policy Service

## Status
Accepted (Supersedes the previously proposed "Declarative Policy Governance Fabric")

## Context
Previously, we considered implementing a "Declarative Policy Governance Fabric" with a full declarative compiler, evaluator, and a 9-level inheritance hierarchy. However, an Architecture Readiness Review identified this as premature abstraction that would introduce unacceptable latency at every decision boundary. 

AegisOS still requires centralized, auditable policy enforcement, but it must be extremely low-latency and testable within a single process.

## Decision
We will implement a **Platform Policy Service (PPS)** as a core Kernel Service.
- The PPS provides synchronous, in-process policy evaluation.
- It exposes a simple `IPolicyService` interface to business code, hiding the underlying provider.
- It supports pluggable policy providers. The default provider will use strongly-typed TypeScript classes. A secondary JSON-based provider will support simple configuration-driven rules. More complex engines (e.g., OPA) can be plugged in later if required.
- Evaluation exclusively consumes the immutable Execution Context. Subsystems do not manually construct policy inputs.
- Inheritance is simplified to four levels: Platform -> Organization -> Workspace -> Project.
- The service incorporates caching for frequently evaluated rules (invalidated on configuration changes) and audits security-relevant decisions (denials, administrative actions).

## Consequences
### Positive
- Sub-millisecond policy evaluation latency.
- Extremely high developer productivity (writing TS policies is standard practice).
- Clear audit logs for security decisions without the overhead of a distributed PDP/PEP architecture.

### Negative
- Requires a code deployment to update TypeScript-based policies (mitigated by the JSON provider for basic dynamic rules).
