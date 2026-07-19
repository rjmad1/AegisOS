# Platform Fabric Architecture

## Executive Summary
To complement the Platform Kernel, AegisOS relies on a series of specialized **Platform Fabrics**. These fabrics replace isolated optimizers and localized configurations with global, platform-wide mechanisms for resources, policies, identities, knowledge, workflows, and observability. Subsystems negotiate with these fabrics rather than managing these domains themselves.

## 1. Platform Resource Fabric
An Adaptive Resource Governance Fabric that manages reservations, leasing, scheduling, and arbitration across all resources (CPU, GPU, RAM, VRAM, Disk, Network, Models, Workers).
- **Core Principle**: Resources are negotiated, not statically allocated.
- **Resource Intent**: Subsystems submit an intent (workload type, priority, SLA, hard/preferred limits, elasticity).
- **Elastic Allocation & Shared Pools**: Subsystems lease from shared pools (GPU Pool, Model Pool). Elastic resources scale up and down automatically based on demand.
- **Predictive Planning**: The fabric continuously forecasts demand and warms resources before they are needed.

## 2. Platform Policy Fabric
A comprehensive Policy Governance Fabric that handles the complete lifecycle of policies.
- **Core Principle**: All autonomous decisions are derived from the Policy Fabric. No subsystem embeds business rules directly.
- **Architecture**: Includes a Policy Registry, Compiler, Evaluator, PDP (Policy Decision Point), PEP, PAP, and PIP.
- **Hierarchy**: Policies inherit sequentially: Platform → Organization → Workspace → Project → Workflow → Capability → Agent → Session → Execution.
- **Simulation**: Allows dry-run evaluations (what-if scenarios) without altering production state.

## 3. Platform Execution Context (Identity) Fabric
Provides an immutable, end-to-end execution context across the platform.
- **Core Principle**: Every operation executes within an immutable Execution Context, propagated automatically across all boundaries.
- **Execution Context Model**: Includes Identity, Correlation ID, Causation ID, Tenant ID, Workflow ID, Security Classification, and Trust Level.
- **Propagation**: Uses `AsyncLocalStorage` (or equivalent) for local propagation, and serializes across HTTP/RPC boundaries. It is exposed via an abstract `IExecutionContextProvider`.
- **Security & Observability**: Context is cryptographically protected across trust boundaries, serving as the root for all tracing, metrics, and policy evaluation.

## 4. Platform Knowledge Fabric
Unifies all knowledge systems into one platform API.
- **Components**: Capability Registry, Memory, RAG, Embeddings, Policies, Telemetry, Documentation, and Ontology.
- **Core Principle**: A single surface area for storing, indexing, and retrieving structured and unstructured platform knowledge.

## 5. Platform Workflow Fabric
Replaces isolated execution engines with a unified Workflow Fabric.
- **Core Principle**: Every workflow becomes a directed execution graph capable of coordinating agents, models, MCPs, policies, and resources.

## 6. Platform Observability Fabric & Digital Twin
Unifies metrics, logs, traces, and generates a real-time digital twin.
- **Digital Twin**: Represents every subsystem, capability, agent, workflow, model, and resource. Exposes current state and predicted future state.
- **Health**: Generates platform-wide health scores.

## 7. Autonomous Optimization Engine & Intelligence Layer
The OS actively reasons about itself.
- **Optimization**: Continuously detects architectural drift, resource waste, and performance regressions.
- **Intelligence**: Determines if capabilities should be warmed, workloads migrated, or tenants granted dedicated resources.
- **Self-Evolution Governance**: Before any autonomous modification, the OS must simulate, validate, sandbox, and rollback test the proposed change. All evolution is reversible.
