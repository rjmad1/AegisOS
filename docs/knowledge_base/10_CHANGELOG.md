# AegisOS Knowledge Base: 10_CHANGELOG.md

## Version 1.2.4 (2026-07-23)
* **Autonomic Self-Healing**: Created `AutonomicSelfHealingDaemon.ts` for background sweeps across local loopbacks (`:11434`, `:4000`, `:18789`) with automatic fault recovery.
* **Autonomic Heal API**: Created `/api/v1/system/autonomic-heal` REST route handler.
* **Hardware Telemetry Bus**: Created `hardware-telemetry-bus.ts` streaming Layer 0 GPU CUDA metrics.
* **Predictive VRAM Bursting**: Updated `CloudSpilloverRouter.ts` with VRAM consumption velocity tracking ($\Delta VRAM / \Delta t$).
* **Zero-Touch SAML SSO**: Implemented `GroupClaimRoleMapper.ts` for automated Entra ID group claim DN/regex parsing.
* **Unit Verification**: Created and passed Vitest unit test suites (`8/8` tests passing).

## Version 1.2.3 (2026-07-22)
* Completed 12-phase engineering readiness review, quality gate verification, and thin-edge transcript webhook integration.
