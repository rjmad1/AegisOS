# AegisOS Knowledge Base: 07_ARCHITECTURAL_DECISIONS.md

## ADR Register Summary

| ADR ID | Title | Decision & Impact | Status |
|---|---|---|---|
| **ADR-001** | Contract-First Versioned API | All REST endpoints enforced under `/api/v1/` with OpenAPI specification. | 🟢 Active |
| **ADR-009** | 7-Layered Autonomic Architecture | Strict hierarchical separation from Hardware (L0) to Executive Plane (L6). | 🟢 Frozen Core |
| **ADR-010** | Executive Control Plane (ECP) | Layer 5 stateless policy enforcers for prompt sanitization & grounding filters. | 🟢 Active |
| **ADR-013** | Command & Control Subsystem | Biometric ECDSA signed mobile approvals for remote administration. | 🟢 Active |
| **ADR-015** | Autonomic Self-Healing Daemon | Background diagnostic sweep monitoring runtime loopbacks every 15s. | 🟢 Active (v1.2.4) |
| **ADR-016** | Predictive VRAM Velocity Bursting | Telemetry velocity calculation ($\Delta VRAM / \Delta t$) preventing GPU OOM. | 🟢 Active (v1.2.4) |
