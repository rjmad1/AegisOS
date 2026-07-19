# ADR-010: Platform Resource Manager

## Status
Accepted (Supersedes the previously proposed "Adaptive Resource Governance Fabric")

## Context
Previously, we considered implementing an "Adaptive Resource Governance Fabric" that would dynamically schedule, lease, and preempt resources using asynchronous negotiation. However, an Architecture Readiness Review identified this as a severe case of the Inner-Platform Effect, introducing unacceptable latency and duplicating capabilities better handled by external infrastructure orchestrators (e.g., Kubernetes, Docker).

AegisOS still requires local resource governance to ensure stability on single workstations (laptops, home labs) without relying on external orchestrators.

## Decision
We will implement a **Platform Resource Manager (PRM)** as a core Kernel Service.
- The PRM is responsible for local resource governance *only*. It acts as a synchronous admission controller, not a scheduler.
- Subsystems request resources synchronously via `Acquire(ResourceRequest)`. The request is either Approved (with a token), Rejected, or Queued locally. It does not use asynchronous lease negotiation.
- The PRM maintains configurable budgets (e.g., max concurrent workflows, max loaded models, VRAM limits) and monitors current utilization.
- Resource tokens are used for accounting and are automatically released when work completes.
- When an external orchestrator (Kubernetes, Docker, etc.) is detected, the PRM becomes advisory, deferring strict scheduling and limits to the infrastructure.

## Consequences
### Positive
- Extremely low latency for resource acquisition.
- Simple, deterministic accounting that developers can easily reason about.
- Prevents OOM and starvation on local deployments without reinventing Kubernetes.

### Negative
- Lacks advanced predictive scheduling and multi-tenant dynamic rebalancing (which is explicitly delegated to external orchestrators when needed).
