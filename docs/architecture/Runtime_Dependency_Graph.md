# Runtime Dependency Graph

## Overview
AegisOS employs a heavily decoupled architecture where the **Platform Kernel** manages the lifecycle of **Platform Fabrics**, and subsystems interact with these fabrics rather than each other.

The following graph illustrates the runtime dependency flows. Note that dependencies point in the direction of *negotiation* and *telemetry* rather than static compilation dependencies.

## Macro Architecture Dependency Graph

```mermaid
graph TD
    %% Core Kernel
    PK[Platform Kernel]
    CR[CompositionRoot (DI)]
    
    %% Fabrics
    PF[Policy Fabric]
    RF[Resource Fabric]
    IF[Identity / Execution Context Fabric]
    KF[Knowledge Fabric]
    WF[Workflow Fabric]
    OF[Observability Fabric & Digital Twin]
    
    %% Intelligent Layer
    AOE[Autonomous Optimization Engine]
    PIL[Platform Intelligence Layer]
    
    %% Subsystems / Workers
    A[Agent Subsystems]
    M[Model / LLM Subsystems]
    E[Embedding Subsystems]
    
    %% Relationships
    PK -->|Orchestrates| PF
    PK -->|Orchestrates| RF
    PK -->|Orchestrates| IF
    PK -->|Orchestrates| KF
    PK -->|Orchestrates| WF
    PK -->|Orchestrates| OF
    
    PK -.->|Delegates Instantiation| CR
    
    %% Execution Context is foundational
    PF -.->|Reads Identity from| IF
    RF -.->|Attributes Usage to| IF
    OF -.->|Traces via| IF
    
    %% Subsystem Interaction
    A -->|Negotiates Resources| RF
    A -->|Evaluated by| PF
    A -->|Persists Memory| KF
    A -->|Executes inside| WF
    
    M -->|Negotiates Resources| RF
    M -->|Evaluated by| PF
    M -->|Persists Telemetry| OF
    
    E -->|Negotiates Resources| RF
    
    %% Autonomous Loops
    OF -->|Provides State to| AOE
    AOE -->|Optimizes| RF
    AOE -->|Recommends Policy| PF
    
    OF -->|Provides State to| PIL
    PIL -->|Reasons about| PK
```

## Explanation
- **Platform Kernel**: Acts as the central hub managing the initialization and health of the Fabrics.
- **Identity Fabric (Execution Context)**: Provides the foundational context (Tenant, Execution ID) that every other Fabric requires to perform its duties (e.g., attributing resource usage or evaluating policies).
- **Subsystems (Agents, Models)**: No longer interact with each other directly. An Agent does not directly instantiate an LLM. The Agent interacts with the Workflow Fabric, which requests policy clearance from the Policy Fabric, and leases inference capacity from the Resource Fabric.
- **Autonomous Optimization Engine (AOE) & Intelligence Layer (PIL)**: Operate in a continuous control loop, consuming the real-time Digital Twin from the Observability Fabric and injecting optimization commands back into the Resource and Policy fabrics.
