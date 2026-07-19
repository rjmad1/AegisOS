# Platform Kernel Architecture

## Executive Summary
AegisOS is transitioning to a lean, platform-centric architecture. At the center of this architecture lies the **Platform Kernel**, which serves as the authoritative Operating System Coordinator. It is responsible for platform-wide orchestration, module lifecycle coordination, and housing the core Kernel Services. 

The Kernel governs the platform synchronously and deterministically, prioritizing local operational efficiency without introducing complex, distributed-system overheads unless an external orchestrator (e.g., Kubernetes) is present.

## Architectural Principles
1. **Separation of Concerns**: The Platform Kernel orchestrates startup and lifecycle but delegates concrete dependency injection to the `CompositionRoot`.
2. **Deterministic Governance**: Resource and Policy decisions are synchronous, deterministic, and in-process. 
3. **Orthogonal Health & Lifecycle**: A strict 6-state lifecycle dictates what a module is doing, while an orthogonal Health Model describes how well it is doing it.

## Platform Kernel Services
The Platform Kernel houses four core services to govern the platform:

1. **Platform Execution Context Service (PECS)**: Manages and propagates the immutable Execution Context (Identity, Tracing, Tenant, Security Labels). Identity is a field within this context, not a standalone subsystem.
2. **Platform Resource Manager (PRM)**: Provides synchronous admission control. It grants or denies requests for resources (e.g., CPU, VRAM, concurrent agents) using lightweight tokens based on local budgets. It does *not* schedule work or manage asynchronous leases.
3. **Platform Policy Service (PPS)**: Provides synchronous, in-process policy evaluation with pluggable providers (e.g., TypeScript, JSON) evaluating rules against the Execution Context.
4. **Platform Advisor & Optimization Service (PAOS)**: Observes runtime metrics and performs bounded, safe, application-level housekeeping (e.g., unloading idle capabilities, clearing caches) without migrating workloads or acting as a cluster orchestrator.

## Kernel Responsibilities
The Platform Kernel is strictly scoped to coordinate:
- Registration and Module Discovery
- Initialization and Startup Sequencing
- Dependency Validation (Fail Fast)
- Shutdown Sequencing
- Health Aggregation

It explicitly *does not* handle recovery workflows, workload scheduling, or distributed cluster state management.

## Module Lifecycle
Every module must transition through the following 6 states under PlatformKernel control:
`Registered` → `Initialized` → `Started` → `Ready` → `Stopping` → `Stopped`

## Service Registry and Module Discovery
Modules register with the **Platform Service Registry** using metadata manifests specifying:
- Module Name, Version, Lifecycle Phase
- Required Interfaces, Optional Interfaces
- Dependencies
- Health Checks

## Startup Dependency Validation
Before proceeding through the lifecycle, the Kernel performs strict validation:
- Detects circular dependencies
- Validates missing registrations and version incompatibilities
- Resolves startup ordering
- **Fail Fast**: Startup fails immediately if validation is unsuccessful.

## Evolvability
The PlatformKernel remains implementation-agnostic regarding Dependency Injection. The underlying `CompositionRoot` can be swapped or upgraded without affecting the Kernel's governance logic.
