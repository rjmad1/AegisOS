# Governance Compliance Matrix (GCM) Scorecard

This scorecard tracks the compliance of the AegisOS Ecosystem release with the 10 Constitutional Articles.

| Constitutional Article | Status | Evidence Reference |
|---|---|---|
| Article I: Single Authoritative Runtime | COMPLIANT | Exclusively managed by core RuntimeManager and PIK. |
| Article II: Architecture Freeze | COMPLIANT | No new kernels or registries introduced in core. |
| Article III: Contracts Before Implementations | COMPLIANT | API routes defined under `/api/v1/` contract schemas. |
| Article IV: Extension First | COMPLIANT | All new capabilities implemented as dynamically loaded Provider Packs / Connectors. |
| Article V: Evidence-Based Engineering | COMPLIANT | Verified via signed Merkle Evidence Graph. |
| Article VI: Local-First by Default | COMPLIANT | Local loopback databases, offline blueprints, and offline model execution. |
| Article VII: One Architecture, Many Deployment Models | COMPLIANT | Declarative JSON profiles manage all platform editions. |
| Article VIII: Secure by Default | COMPLIANT | Packages cryptographically signed and vetted by static sandbox checks. |
| Article IX: Backward Compatibility | COMPLIANT | Strictly complies with SemVer rules; public API contracts unchanged. |
| Article X: Observability as a Cross-Cutting Capability | COMPLIANT | Standard OTel and EventBus routing for all connector and provider logs. |
