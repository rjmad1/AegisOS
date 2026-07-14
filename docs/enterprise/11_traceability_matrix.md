# Bidirectional Traceability Matrix

| Field | Value |
|---|---|
| **Document ID** | BTM-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Governance Standard |
| **Owners** | Technical Program Manager (TPM) / Compliance Architect |

---

## 1. Bidirectional Traceability Framework

Bidirectional traceability guarantees that:
1. **Forward Traceability**: Every business objective, user need, and PRD requirement is mapped to architectural decisions, code implementations, verification tests, and operational monitors. This prevents untested features.
2. **Backward Traceability**: Every line of code, configuration parameter, and test suite is traceable back to a product requirement and business justification. This prevents "scope creep" and unapproved modifications (compliance auditing).

---

## 2. Master Traceability Matrix

We map the primary platform capabilities across all product, architecture, verification, and operational lifecycle stages:

### 2.1 Traceability Table

| Lifecycle Stage | Capability 1: Authentication & Session | Capability 2: Workflow Engine | Capability 3: Self-Healing Diagnostics | Capability 4: Unified Command Palette | Capability 5: Secrets Encryption |
|---|---|---|---|---|---|
| **Product Vision** | Zero-Trust Local Security Boundary | Orchestrated Local-first Workflows | High Operational Platform Availability | Developer-Centric Usability | Secure Sovereign Workstation Storage |
| **Strategic Objective** | Private Tenant Enclaves | Automated Agent Actions | Mean Time to Repair (MTTR) < 5s | Low Cognitive Developer Load | Encrypted Local Credentials |
| **PRD Feature ID** | FR-003: OAuth & Session timeout | FR-002: Workflow execution | FR-004: Port self-healer | FR-001: Command palette search | FR-005: Secrets Vault CRUD |
| **Architecture Component**| `src/app/api/v1/auth/` | `src/platform/workflow/` | `src/services/self-healer.ts` | `src/components/command-palette/`| `src/repositories/secret.repository.ts` |
| **ADR ID** | [ADR-002](file:///d:/1_Projects/AegisOS/adr/ADR-002-Server-Side-Decoupled-Authentication.md) | [ADR-004](file:///d:/1_Projects/AegisOS/adr/ADR-004-Pipeline-Worker-Processing-Architecture.md) | [ADR-006](file:///d:/1_Projects/AegisOS/adr/ADR-006-Script-Engineering-Standards.md) | [ADR-003](file:///d:/1_Projects/AegisOS/adr/ADR-003-Unified-Event-Driven-Registry.md) | [ADR-007](file:///d:/1_Projects/AegisOS/adr/ADR-007-Portable-Configuration-Architecture.md) |
| **Implementation Symbol** | `getSession()` / `oauth4webapi` | `workflow.service.ts` | `self-healer.ts` | `CommandRegistry` | `aesGcmEncrypt()` |
| **Unit / Integration Test** | `src/app/api/v1/auth/auth.test.ts`| `src/platform/workflow/workflow.test.ts`| `src/services/self-healer.test.ts`| `src/components/command-palette/palette.test.ts`| `src/repositories/secret.test.ts` |
| **Deployment Automation**| `DeployProduction.ps1` | `ManageService.ps1` | `health.bat` | `npm run build` | `Bootstrap.ps1` (Key generation) |
| **Monitoring SLI / Alert** | Alert: `Session Lockout IP` | Metric: `workflow.step.failure` | Metric: `self-healer.remediations` | Metric: `console.latency` | Alert: `DPAPI Key Resolution Failed` |
| **Incident Runbook ID** | Runbook: `Compromised Credentials` | Runbook: `Saga Checkpoint Out of Sync` | Runbook: `Ollama Service Unreachable` | Runbook: `Console Render Crash` | Runbook: `Secret Decryption Error` |
| **Release Gate** | Code Coverage > 95% | Code Coverage > 85% | Clean Compilation Check | Accessibility a11y pass | Security SAST pass |
| **Associated Risk ID** | AIR-003: Data Leak | AIR-002: Hallucination | REF-FMEA-003: Service Down | USA-001: WCAG compliance | AIR-003: Secret Exposure |
| **Documentation Guide** | [SECURITY.md](file:///d:/1_Projects/AegisOS/docs/SECURITY.md) | [Operations Guide](file:///d:/1_Projects/AegisOS/docs/Operations_Guide.md) | [Troubleshooting Guide](file:///d:/1_Projects/AegisOS/docs/Troubleshooting_Guide.md) | [Developer Guide](file:///d:/1_Projects/AegisOS/docs/Developer_Guide.md) | [Administrator Guide](file:///d:/1_Projects/AegisOS/docs/Administrator_Guide.md) |
