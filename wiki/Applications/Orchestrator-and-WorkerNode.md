# Distributed Orchestrator & Worker Node

> **Applications**: AegisOS Distributed Applications (`apps/`)  
> **Status**: ACTIVE · CANONICAL  
> **Location**: `apps/orchestrator`, `apps/worker-node`  
> **Owner**: AegisOS Distributed Platform Team  

---

## 1. Overview

In addition to the Next.js Console application in `src/`, AegisOS contains two standalone executable runtime applications in `apps/`: the **Distributed Orchestrator** and the **Edge Worker Node**.

---

## 2. Distributed Application Architecture

```mermaid
graph TD
    Client[Console / CLI / API] --> Orch[apps/orchestrator]
    Orch --> Queue[Task Queue / State Manager]
    Queue --> WN1[apps/worker-node (Node 1 - GPU)]
    Queue --> WN2[apps/worker-node (Node 2 - CPU)]
    Queue --> WN3[apps/worker-node (Node 3 - Edge)]
```

### Application Specifications

#### `apps/orchestrator`
* **Entry Point**: `src/index.ts`, `src/orchestrator.ts`
* **Role**: Central task scheduler and resource allocator. Accepts mission execution requests, partitions jobs into DAG steps, balances load across registered worker nodes, and tracks worker heartbeat health.

#### `apps/worker-node`
* **Entry Point**: `src/index.ts`, `src/worker.ts`
* **Role**: Lightweight agent execution binary designed to run on edge workstations, cloud VMs, or dedicated GPU compute nodes. Communicates with the orchestrator over WebSocket/gRPC to pull and execute tasks.

---

## 3. Deployment & Execution

```bash
# Launch Orchestrator service
npm run start:orchestrator --prefix apps/orchestrator

# Launch Worker Node service
npm run start:worker --prefix apps/worker-node -- --orchestrator=ws://localhost:8080
```
