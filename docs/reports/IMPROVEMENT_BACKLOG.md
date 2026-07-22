# Improvement Backlog
**Generated from Iteration 1 Stewardship Assessments**

This backlog categorizes the concrete, actionable engineering tasks required to reach Production Readiness, prioritize by business value and effort.

*Note: All improvements adhere to the Version 1 Architecture Baseline freeze and utilize existing extension models.*

## High Priority (Must Have for General Availability)

### 1. Production Readiness & DevEx
- **Task:** Implement `aegis verify-infra` pre-flight check for CPU, memory, and ports.
- **Value:** Prevents failed installations; drastically reduces Time-to-First-Success (TTFS).
- **Effort:** Medium
- **Target:** DevEx TTFS < 3 minutes.

- **Task:** Enforce strict Zod schema validation on `aegis.config.yaml` at boot.
- **Value:** Fails fast on misconfiguration instead of runtime errors.
- **Effort:** Low

### 2. Reliability & Telemetry
- **Task:** Wire `ReliabilityEngineeringFramework.ts` to concrete Prometheus/OTel endpoints for live SLI ingestion.
- **Value:** Replaces placeholder metrics (MTTR, MTBF) with observable reality.
- **Effort:** High

- **Task:** Integrate Error Budgets into the CI/CD Qualification pipeline (Fail deployment if budget < 5%).
- **Value:** Prevents performance/reliability regressions from reaching production.
- **Effort:** Medium

### 3. Security & Marketplace
- **Task:** Implement package signing verification for Marketplace extensions.
- **Value:** Prevents supply chain attacks via unverified Provider Packs.
- **Effort:** High

- **Task:** Seed the Marketplace with an official, certified "OpenAI Provider Pack" and "Hello World Mission".
- **Value:** Validates the extension architecture and provides reference implementations.
- **Effort:** Medium

## Medium Priority (Fast Follows)

### 4. Performance Optimization
- **Task:** Establish k6 baseline load tests against EMO and PIK workflow execution.
- **Value:** Validates P95 latency is under 500ms.
- **Effort:** Medium

- **Task:** Profile Next.js build times and implement compilation caching.
- **Value:** Speeds up CI cycles and developer feedback loops.
- **Effort:** Low

### 5. Documentation & Tooling
- **Task:** Automate TypeScript SDK generation from `openapi-spec.json` during the CI build.
- **Value:** Guarantees SDKs are perfectly aligned with platform contracts.
- **Effort:** Low

- **Task:** Write explicit `Rollback_Runbook.md` detailing Blue/Green recovery.
- **Value:** Reduces MTTR during failed upgrades.
- **Effort:** Low

## Backlog Grooming Rules
- Tasks that require architectural modification (e.g., new kernels, custom persistence layers) must be rejected or routed through the Constitutional Exception Register (CER).
- Every completed task must generate corresponding telemetry confirming its impact.
