# ADR-010: Executive Control Plane

## Status
Approved

## Context
AegisOS requires system-wide governance, security enforcement, and validation of AI prompts, context, and responses. Adding these checks directly inside separate agent implementations introduces duplicate code, slows development, and fails to guarantee that all executions conform to global security/governance policies.

## Decision
We establish a dedicated architectural component called the **Executive Control Plane (ECP)** at Layer 5. The ECP is *not* an AI agent. It is a set of stateless software controllers, event listeners, and middleware policies.
All prompt ingress, tool execution requests, and model responses must flow through the ECP to be validated against active policy registries and evaluated for output quality (grounding, correctness) before delivery.

## Alternatives Considered
* **Agent-Level Guardrails**: Rejected. Placing verification checks inside individual agent code blocks leads to bypasses if an agent context is compromised or a developer omits a check in a new agent definition.
* **Database Trigger-Based Governance**: Rejected. SQLite/PostgreSQL triggers cannot validate real-time token streams or model hallucination rates, which are critical for cognitive observability.

## Trade-offs
* *Pros*:
  - Consolidates system security, RBAC checks, and grounding evaluation logic in a single, auditable location.
  - Ensures policy compliance even if downstream models or agents mutate or behave anomalously.
* *Cons*:
  - Adds a thin latency overhead (~100-200ms) for real-time prompt evaluation.

## Consequences
* Every system execution outputs a JSON validation scorecard.
* Strategic overrides are tracked in the central event audit log.
* Automated recovery and model swapping can be triggered on policy breaches without modifying agent implementations.
