# AegisOS Platform Architecture Overview

## The OS Constitution

AegisOS is an enterprise-grade AI Work Operating System. This document summarizes the transition from a subsystem-centric architecture to a **Platform-Centric** model, governed by the OS Constitution.

### Key Architectural Shifts
1. **Platform Kernel Orchestration**: Subsystems no longer coordinate each other. The Platform Kernel holds absolute authority over the entire lifecycle (Bootstrapping, Lifecycle, Scaling, Shutdown).
2. **Fabric Negotiation**: Static allocations and local optimizers are replaced by specialized Fabrics. Subsystems must negotiate for resources and policy clearance.
3. **Execution Context**: An immutable execution identity travels with every operation, enabling perfect attribution for resources, telemetry, and policies.

## The Architectural Blueprint

### The Platform Kernel
The heart of the OS. It manages the **Platform Service Registry** and enforces the **Kernel State Machine**. All subsystems must register declarative manifests and prove their readiness before transitioning to a `Healthy` state.

### The Six Fabrics
1. **Adaptive Resource Governance Fabric**: Negotiates and pools CPU, GPU, VRAM, Models, and Network capacity based on priority and SLAs.
2. **Declarative Policy Governance Fabric**: The single source of truth for all business and security rules. Supports dry-run simulations for "what-if" architectural planning.
3. **Immutable Execution Context (Identity) Fabric**: Stitches operations together across asynchronous boundaries, tying them definitively to Tenants, Workflows, and Agents.
4. **Platform Knowledge Fabric**: A unified surface for memory, policies, RAG, and platform documentation.
5. **Platform Workflow Fabric**: Transforms agent execution into a predictable, observable Directed Acyclic Graph (DAG) of operations.
6. **Platform Observability Fabric & Digital Twin**: Generates a real-time digital twin of the OS, maintaining total awareness of all states, latencies, and resource usages.

### Autonomous Optimization Engine (AOE)
The pinnacle of the OS design. AegisOS continuously reasons about its own state via the **Platform Intelligence Layer**. It detects architectural drift, resource starvation, and latency spikes, and actively recommends (or autonomously executes) workload migrations and resource reclamations—subject to rigorous Policy Fabric simulation.

---

## Further Reading
- [Platform Kernel Architecture](./Platform_Kernel_Architecture.md)
- [Platform Fabric Architecture](./Platform_Fabric_Architecture.md)
- [Runtime Dependency Graph](./Runtime_Dependency_Graph.md)
- [Platform State Machine](./Platform_State_Machine.md)
- [Sequence Diagrams](./Sequence_Diagrams.md)
