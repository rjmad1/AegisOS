# Compliance Exceptions Register

**Date**: 2026-07-21
**Scope**: AegisOS Core Architecture

The following deviations from the Engineering Constitution are formally recorded as Technical Exceptions. These must be remediated or formally accepted via an ADR.

| Exception ID | Article Violated | Description | Risk | Target Resolution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `EX-2026-01` | Article I: Single Authoritative Runtime | Parallel `ResourceManager` implementations exist in `src/platform/kernel` and `src/platform/resources`. | High | Next Minor Release | Pending Remediation |
| `EX-2026-02` | Article I: Single Authoritative Runtime | Parallel `CommandRegistry` implementations exist in `src/platform/console` and `src/platform/commands`. | High | Next Minor Release | Pending Remediation |
| `EX-2026-03` | Article I: Single Authoritative Runtime | Parallel `CapabilityRegistry` implementations exist. | High | Next Minor Release | Pending Remediation |
| `EX-2026-04` | Article IV: Extension First | Core Console UI primitives are hardcoded rather than loaded dynamically via `CEREngine`. | Medium | Next Major Release | Acknowledged |
| `EX-2026-05` | Article V: Evidence-Based Engineering | `ActionDispatcher` bypasses the Durable Execution Platform (DEP) using synthetic API commands for legacy UI actions, generating no verifiable evidence. | Critical | Immediate | Pending Remediation |
