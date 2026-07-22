# AegisOS Knowledge Base: 04_TASKS_AND_ACTIONS.md

## Task Tracker Status

### Completed Tasks 🟢
* [x] **AutonomicSelfHealingDaemon**: Real-time diagnostic sweeps and self-recovery logic (`AutonomicSelfHealingDaemon.ts`).
* [x] **Hardware Telemetry Event Bus**: Layer 0 CUDA telemetry stream (`hardware-telemetry-bus.ts`).
* [x] **Predictive VRAM Velocity Routing**: Dynamic VRAM consumption velocity calculation in `CloudSpilloverRouter.ts`.
* [x] **Zero-Touch IdP Group Claim Mapping**: Entra ID SAML group claim role parser (`GroupClaimRoleMapper.ts`).
* [x] **Vitest Unit Test Suite Expansion**: Added 8 unit tests covering autonomic health, predictive spillover, and SAML group mapping.

### In Progress Tasks 🟡
* [ ] **Visual Canvas Node Editor**: Drag-and-drop ReactFlow canvas for MCP workflow graph creation.
* [ ] **M365 & Google Workspace MCP Pack**: Stdio connectors for SharePoint, OneDrive, and Google Drive.

### Technical Debt & Deferred Items 🔵
* [ ] **Legacy Vector Store Cleanup**: Purge custom vector store (Raja RAG) remnants in favor of standard PgVector / MCP endpoints.
