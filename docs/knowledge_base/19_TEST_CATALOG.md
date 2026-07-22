# AegisOS Knowledge Base: 19_TEST_CATALOG.md

## Vitest Unit & Integration Test Catalog

### Core Test Suites
* `tests/unit/autonomic/autonomic-self-healing.test.ts` (2 tests): Verifies diagnostic sweeps and service recovery for `AutonomicSelfHealingDaemon`.
* `tests/unit/infrastructure/predictive-spillover.test.ts` (3 tests): Verifies VRAM consumption velocity calculation ($\Delta VRAM / \Delta t$) and predictive bursting.
* `tests/unit/auth/group-claim-role-mapper.test.ts` (3 tests): Verifies zero-touch Entra ID group claim regex and DN role mapping.
* `tests/unit/control/`: Tests for Executive Control Plane (ECP) safety firewalls.
* `tests/mission-control.test.ts`: Integration tests for administrative API endpoints.
* `tests/product-intelligence.test.ts`: PMI calculation and Platform Quality Index tests.

### Test Execution Command
```bash
npx vitest run tests/unit/autonomic/autonomic-self-healing.test.ts tests/unit/infrastructure/predictive-spillover.test.ts tests/unit/auth/group-claim-role-mapper.test.ts
```
* **Status**: 🟢 **Passed** (`8/8` tests passing).
