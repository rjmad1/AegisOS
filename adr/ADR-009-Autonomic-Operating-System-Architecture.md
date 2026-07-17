# ADR-009: Autonomic Operating System Architecture

## Status
Approved

## Context
AegisOS is transitioning from a modular platform of loose AI integrations to a self-managing, self-governing Autonomic AI Operating System. This transition requires a rigid, hierarchical organizational layout to prevent dependency cycles and allow independent scaling of the control/strategic loops from execution services.

## Decision
We refactor the platform architecture into a strict 7-layered stack:
* **Layer 6 (Executive Plane)**: Manages objectives and user ingress.
* **Layer 5 (Control Plane)**: Enforces governance policies, evaluation metrics, and self-healing.
* **Layer 4 (Orchestration Plane)**: Handles workflows, scheduling, and multi-agent coordination.
* **Layer 3 (Capability Plane)**: Hosts model registries, MCP tool execution, and local knowledge.
* **Layer 2 (Runtime Layer)**: Hosts container/process environments (OpenClaw, LiteLLM, Ollama).
* **Layer 1 (Infrastructure Layer)**: Manages operating system processes, storage directories, and Tailscale VPN.
* **Layer 0 (Hardware Layer)**: Encompasses system hardware, physical GPU VRAM, and CUDA drivers.

No lower layer may contain references or dependencies belonging to any higher layer.

## Alternatives Considered
* **Flat Core Architecture**: Rejected. Flat networks of services lead to circular dependencies and are difficult to secure, audit, or make resilient to partial system failures.
* **SaaS Orchestration Layer**: Rejected. Moving the orchestration layers to cloud microservices violates the local-first, privacy-by-default architecture directive.

## Trade-offs
* *Pros*:
  - Clear architectural boundaries allow components to be developed, mocked, and tested in isolation.
  - Securing the capability plane becomes straightforward (Layer 3 tool access can be governed cleanly by Layer 5 policy enforcers).
* *Cons*:
  - Increases the number of defined subsystem layers, requiring structured API mappings and interfaces.

## Consequences
* Circular imports between backend services and view layers are systematically blocked.
* Lower layers remain operational even if higher-level control loops fail or crash.
