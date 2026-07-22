# AegisOS Knowledge Base: 02_ENGINEERING_KNOWLEDGE.md

## Architectural Topology (7-Layer Stack)

```
[ Layer 6: Executive Plane ]      (Next.js Console / Fastify Gateway :18789)
            │
            ▼
[ Layer 5: Control Plane ]        (Executive Control Plane / Digital Twin / Convergence Engine)
            │
            ▼
[ Layer 4: Orchestration Plane ]  (Saga Workflow Engine / Event Bus / Job Queues)
            │
            ▼
[ Layer 3: Capability Plane ]     (MCP Host / Model Registries / Tool Context)
            │
            ▼
[ Layer 2: Runtime Layer ]        (LiteLLM Router :4000 / Ollama :11434 / Redis :6379)
            │
            ▼
[ Layer 1: Infrastructure Layer ] (Docker / PostgreSQL :5432 / OTel Collector :4317)
            │
            ▼
[ Layer 0: Hardware Layer ]       (Host OS / NVIDIA CUDA / HardwareTelemetryBus)
```

## Primary Technical Subsystems
* **Autonomic Self-Healing**: `AutonomicSelfHealingDaemon.ts` executes background checks on local loopback endpoints every 15s.
* **Predictive VRAM Bursting**: `CloudSpilloverRouter.ts` calculates $\Delta VRAM / \Delta t$ velocity across rolling 60s windows.
* **Zero-Trust Identity**: `SamlProvider.ts` + `GroupClaimRoleMapper.ts` parses raw Entra ID claims to fine-grained RBAC roles.
* **Event Fabric**: `HardenedEventBus` guarantees schema-validated event dispatch with Dead Letter Queue (DLQ) fallback.
* **Digital Twin Kernel**: `GraphKernel.ts` maintains canonical system state graph reconciled by `ConvergenceEngine.ts`.
