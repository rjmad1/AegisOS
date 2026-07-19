# Sequence Diagrams

## Workflow Initiation and Resource Admission

This sequence diagram illustrates a subsystem (e.g., an Agent) executing a workload via the Platform Workflow Engine, highlighting synchronous interactions with Kernel Services.

```mermaid
sequenceDiagram
    participant User
    participant WE as Workflow Engine
    participant PECS as Execution Context Service
    participant PPS as Policy Service
    participant PRM as Resource Manager
    participant Subsystem as Target Subsystem

    User->>WE: Submit Workflow Request
    
    %% Context Propagation
    WE->>PECS: Create/Propagate Execution Context
    activate PECS
    PECS-->>WE: ExecutionContext (ID, Tenant, Identity)
    deactivate PECS
    
    %% Synchronous Policy Evaluation
    WE->>PPS: Evaluate Policy (Workflow Execution, Context)
    activate PPS
    PPS-->>WE: Decision: Permit
    deactivate PPS
    
    %% Synchronous Resource Admission Control
    WE->>PRM: Acquire Resource (Priority, Requirements)
    activate PRM
    PRM->>PRM: Check local budgets & limits
    PRM-->>WE: Resource Token (Granted)
    deactivate PRM
    
    %% Execution
    WE->>Subsystem: Execute Workload (Context, Token)
    activate Subsystem
    Subsystem-->>WE: Workload Completed
    deactivate Subsystem
    
    %% Resource Release
    WE->>PRM: Release Resource Token
    
    WE-->>User: Workflow Completed
```

## Local Optimization Loop (Housekeeping)

This sequence diagram illustrates the Platform Advisor & Optimization Service (PAOS) actively observing local state and performing bounded, safe housekeeping without migrating workloads or acting as a cluster orchestrator.

```mermaid
sequenceDiagram
    participant Subsystem as Target Subsystem
    participant Kernel as Platform Kernel
    participant PAOS as Optimization Service
    participant PPS as Policy Service

    %% Metric Observation
    Subsystem->>Kernel: Emit Health & Metrics (Idle / High Memory)
    
    %% Detection
    Kernel->>PAOS: State Change Notification
    activate PAOS
    
    %% Reasoning
    PAOS->>PAOS: Analyze Metrics (Capability X is idle and consuming memory)
    PAOS->>PAOS: Generate Recommendation (Unload Capability X)
    
    %% Policy Check for Safe Action
    PAOS->>PPS: Evaluate Policy (Unload Capability, Context: PAOS)
    activate PPS
    PPS-->>PAOS: Decision: Permit
    deactivate PPS
    
    %% Execution (Bounded Local Optimization)
    PAOS->>Subsystem: Send Stop Signal (Lifecycle: Stopping)
    activate Subsystem
    Subsystem-->>PAOS: Stopped
    deactivate Subsystem
    
    PAOS->>Kernel: Record Optimization Action (Unloaded X)
    deactivate PAOS
```
