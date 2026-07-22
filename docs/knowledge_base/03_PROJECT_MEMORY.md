# AegisOS Knowledge Base: 03_PROJECT_MEMORY.md

## Architectural Lessons Learned
1. **Strict Layer Isolation**: Prohibiting reverse imports between architectural planes (e.g., L2 importing from L5) eliminated circular dependency deadlocks and enforced strict ESLint boundaries.
2. **Worker Thread VM Sandboxing**: Running untrusted extension code inside memory and CPU-capped Node `worker_threads` prevented Remote Code Execution (RCE) vulnerabilities.
3. **Predictive VRAM Bursting vs. Static Hard Limits**: Static VRAM limits caused sudden execution halts; calculating VRAM velocity ($\Delta VRAM / \Delta t$) enables pre-emptive bursting to cloud endpoints seamlessly.

## Developer Conventions
* **Contract-First API**: All REST routes adhere to versioned `/api/v1/` specifications defined in `open-api.json`.
* **Zero-Telemetry Constraint**: Never add external analytics or metrics pinging without explicit enterprise opt-in.
* **Vitest Mock Discipline**: Always use `class` factories or deterministic mock stubs instead of binding real OS sockets in unit tests.
